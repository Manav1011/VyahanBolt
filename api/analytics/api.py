from django_bolt import BoltAPI, Depends
from core.utils import response, get_current_user, jwt_auth
from organization.middleware import OrganizationMiddleware
from .serializers import (
    AnalyticsFilterSerializer, 
    AnalyticsSummarySerializer, 
    AnalyticsDataSerializer,
    AnalyticsResponseSerializer,
    StatusCountSerializer,
    PaymentModeCountSerializer,
    BranchCountSerializer
)
from shipment.models import Shipment, ShipmentStatus, PaymentMode
from organization.models import Branch, Bus
from django.db.models import Q, Count, Sum, Avg
from django_bolt.auth import IsAuthenticated, HasPermission
from datetime import datetime
from decimal import Decimal

# Protected Routes - uses OrganizationMiddleware to get organization from subdomain
api = BoltAPI(django_middleware=False, middleware=[OrganizationMiddleware], prefix="/api")

def build_shipment_query(organization, filters: AnalyticsFilterSerializer, user_branch=None):
    """
    Build a query for filtering shipments based on filters.
    Returns a queryset that can be further filtered.
    """
    # Base query - filter by organization
    query = Shipment.objects.select_related(
        'source_branch__owner',
        'destination_branch__owner',
        'organization',
        'bus'
    ).filter(organization=organization)
    
    # If branch admin, only show shipments related to their branch
    if user_branch:
        query = query.filter(
            Q(source_branch=user_branch) | Q(destination_branch=user_branch)
        )
    
    # Date range filter (using day field instead of created_at)
    if filters.start_date:
        try:
            # Parse ISO date string (YYYY-MM-DD) or datetime string
            start_date_str = filters.start_date.replace('Z', '+00:00').split('T')[0]
            from datetime import date as date_class
            start_date = date_class.fromisoformat(start_date_str)
            query = query.filter(day__gte=start_date)
        except (ValueError, AttributeError):
            pass
    
    if filters.end_date:
        try:
            # Parse ISO date string (YYYY-MM-DD) or datetime string
            end_date_str = filters.end_date.replace('Z', '+00:00').split('T')[0]
            from datetime import date as date_class
            end_date = date_class.fromisoformat(end_date_str)
            query = query.filter(day__lte=end_date)
        except (ValueError, AttributeError):
            pass
    
    # Status filter
    if filters.status and len(filters.status) > 0:
        query = query.filter(current_status__in=filters.status)
    
    # Branch filter (for org admin) - handle async lookup
    # Note: This will be handled in the endpoint before calling this function
    # For now, we'll filter by branch_slug directly
    if filters.branch_slug and not user_branch:
        query = query.filter(
            Q(source_branch__slug=filters.branch_slug) | Q(destination_branch__slug=filters.branch_slug)
        )
    
    # Source branch filter (shipments going out from a branch)
    if filters.source_branch_slug:
        query = query.filter(source_branch__slug=filters.source_branch_slug)
    
    # Destination branch filter (shipments coming into a branch)
    if filters.destination_branch_slug:
        query = query.filter(destination_branch__slug=filters.destination_branch_slug)
    
    # Bus filter
    if filters.bus_slug:
        query = query.filter(bus__slug=filters.bus_slug)
    
    # Payment mode filter
    if filters.payment_mode:
        query = query.filter(payment_mode=filters.payment_mode)
    
    # Price range filter
    if filters.min_price is not None:
        query = query.filter(price__gte=Decimal(str(filters.min_price)))
    if filters.max_price is not None:
        query = query.filter(price__lte=Decimal(str(filters.max_price)))
    
    # Search filter (tracking_id, sender_name, receiver_name)
    if filters.search:
        search_term = filters.search.strip()
        query = query.filter(
            Q(tracking_id__icontains=search_term) |
            Q(sender_name__icontains=search_term) |
            Q(receiver_name__icontains=search_term)
        )
    
    return query

async def calculate_summary(query, organization, user_branch=None):
    """
    Calculate summary statistics from a shipment query.
    """
    # Total shipments
    total_shipments = await query.acount()
    
    # Total revenue
    revenue_result = await query.aaggregate(total_revenue=Sum('price'))
    total_revenue = revenue_result.get('total_revenue') or Decimal('0')
    
    # Average price
    avg_result = await query.aaggregate(avg_price=Avg('price'))
    average_price = avg_result.get('avg_price') or Decimal('0')
    
    # Count by status
    status_counts = []
    for status_code, status_label in ShipmentStatus.choices:
        count = await query.filter(current_status=status_code).acount()
        if count > 0:
            status_counts.append({
                'status': status_code,
                'count': count
            })
    
    # Count by payment mode
    payment_counts = []
    for pm_code, pm_label in PaymentMode.choices:
        count = await query.filter(payment_mode=pm_code).acount()
        if count > 0:
            payment_counts.append({
                'payment_mode': pm_code,
                'count': count
            })
    
    # Count by branch (only for org admin)
    by_branch = None
    if not user_branch:
        branch_counts = []
        async for branch in Branch.objects.filter(organization=organization):
            branch_query = query.filter(
                Q(source_branch=branch) | Q(destination_branch=branch)
            )
            count = await branch_query.acount()
            if count > 0:
                branch_revenue = await branch_query.aaggregate(total=Sum('price'))
                total = branch_revenue.get('total') or Decimal('0')
                branch_counts.append({
                    'branch': {'slug': branch.slug, 'title': branch.title},
                    'count': count,
                    'total_revenue': str(total)
                })
        by_branch = branch_counts if branch_counts else []
    
    return {
        'total_shipments': total_shipments,
        'total_revenue': str(total_revenue),
        'average_price': str(average_price),
        'by_status': status_counts,
        'by_payment_mode': payment_counts,
        'by_branch': by_branch
    }

@api.post("/analytics/organization/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
async def get_organization_analytics(request, filters: AnalyticsFilterSerializer):
    """
    Get analytics for organization admin - all shipments in the organization.
    """    
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    # Build query (no branch restriction for org admin)
    query = build_shipment_query(organization, filters, user_branch=None)
    
    # Calculate summary
    summary = await calculate_summary(query, organization, user_branch=None)
    
    # Get paginated data
    page = filters.page or 1
    page_size = filters.page_size or 50
    total = await query.acount()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    shipments = []
    async for shipment in query.order_by('-created_at')[offset:offset + page_size]:
        shipments.append({
            'slug': shipment.slug,
            'tracking_id': shipment.tracking_id,
            'sender_name': shipment.sender_name,
            'receiver_name': shipment.receiver_name,
            'source_branch': {'slug': shipment.source_branch.slug, 'title': shipment.source_branch.title},
            'destination_branch': {'slug': shipment.destination_branch.slug, 'title': shipment.destination_branch.title},
            'bus': {'slug': shipment.bus.slug, 'bus_number': shipment.bus.bus_number, 'preferred_days': shipment.bus.preferred_days} if shipment.bus else None,
            'price': str(shipment.price),
            'payment_mode': shipment.payment_mode,
            'current_status': shipment.current_status,
            'created_at': shipment.created_at.isoformat()
        })
    
    response_data = {
        'summary': summary,
        'data': shipments,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'total_pages': total_pages
        }
    }
    
    return response(
        status=200,
        message="Analytics data retrieved successfully",
        data=response_data
    )
@api.post("/analytics/branch/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_branch_admin")])
async def get_branch_analytics(request, filters: AnalyticsFilterSerializer, user=Depends(get_current_user)):
    """
    Get analytics for branch admin - only shipments related to their branch.
    """
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    # Get branch from authenticated user
    branch = await user.branch.afirst()
    if not branch:
        return response(
            status=403,
            message="Branch access denied",
            error="User does not have an associated branch"
        )
    
    # Verify branch belongs to the organization
    if branch.organization_id != organization.id:
        return response(
            status=403,
            message="Branch access denied",
            error="Branch does not belong to this organization"
        )
    
    # Build query (restricted to user's branch)
    query = build_shipment_query(organization, filters, user_branch=branch)
    
    # Calculate summary
    summary = await calculate_summary(query, organization, user_branch=branch)
    
    # Get paginated data
    page = filters.page or 1
    page_size = filters.page_size or 50
    total = await query.acount()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    shipments = []
    async for shipment in query.order_by('-created_at')[offset:offset + page_size]:
        shipments.append({
            'slug': shipment.slug,
            'tracking_id': shipment.tracking_id,
            'sender_name': shipment.sender_name,
            'receiver_name': shipment.receiver_name,
            'source_branch': {'slug': shipment.source_branch.slug, 'title': shipment.source_branch.title},
            'destination_branch': {'slug': shipment.destination_branch.slug, 'title': shipment.destination_branch.title},
            'bus': {'slug': shipment.bus.slug, 'bus_number': shipment.bus.bus_number, 'preferred_days': shipment.bus.preferred_days} if shipment.bus else None,
            'price': str(shipment.price),
            'payment_mode': shipment.payment_mode,
            'current_status': shipment.current_status,
            'created_at': shipment.created_at.isoformat()
        })
    
    response_data = {
        'summary': summary,
        'data': shipments,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'total_pages': total_pages
        }
    }
    
    return response(
        status=200,
        message="Branch analytics data retrieved successfully",
        data=response_data
    )
