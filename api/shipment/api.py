from django_bolt import BoltAPI, Depends
from core.utils import response, get_current_user, jwt_auth
from organization.middleware import OrganizationMiddleware
from .serializers import ShipmentSerializer, ShipmentCreateSerializer, ShipmentStatusUpdateSerializer
from .models import Shipment, ShipmentHistory, ShipmentStatus
from organization.models import Branch
from core.sms_service import async_send_sms
from django.db.models import Q
from django_bolt.auth import IsAuthenticated, HasPermission

# Protected Routes - uses OrganizationMiddleware to get organization from subdomain
api = BoltAPI(django_middleware=False, middleware=[OrganizationMiddleware], prefix="/api")

@api.post("/shipment/create/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_branch_admin")])
async def create_shipment(request, credentials: ShipmentCreateSerializer, user=Depends(get_current_user)):
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    # Get source branch from authenticated user (branch admin's branch)
    source_branch = await user.branch.afirst()
    if not source_branch:
        return response(
            status=403,
            message="Branch access denied",
            error="User does not have an associated branch"
        )
    
    # Verify source branch belongs to the organization
    if source_branch.organization_id != organization.id:
        return response(
            status=403,
            message="Branch access denied",
            error="Branch does not belong to this organization"
        )
    
    # Get destination branch
    try:
        destination_branch = await Branch.objects.select_related('organization').aget(
            slug=credentials.destination_branch_slug,
            organization=organization
        )
    except Branch.DoesNotExist:
        return response(
            status=404,
            message="Destination branch not found",
            error="Invalid destination branch slug"
        )
    
    # Create the shipment
    shipment = await Shipment.objects.acreate(
        organization=organization,
        source_branch=source_branch,
        destination_branch=destination_branch,
        sender_name=credentials.sender_name,
        sender_phone=credentials.sender_phone,
        receiver_name=credentials.receiver_name,
        receiver_phone=credentials.receiver_phone,
        description=credentials.description,
        price=credentials.price,
        payment_mode=credentials.payment_mode,
        current_status=ShipmentStatus.BOOKED
    )
    
    # Create initial history entry
    await ShipmentHistory.objects.acreate(
        shipment=shipment,
        status=ShipmentStatus.BOOKED,
        location=shipment.source_branch.title,
        remarks="Shipment booked successfully."
    )
    
    # Fetch shipment with related data
    shipment_with_related = await Shipment.objects.select_related(
        'source_branch__owner',
        'destination_branch__owner',
        'organization'
    ).prefetch_related('history').aget(pk=shipment.pk)
    
    shipment_serialized = ShipmentSerializer.fields("detail").from_model(shipment_with_related)
    
    # Send SMS Notifications
    try:
        tracking_link = f"http://localhost:3000/track/{shipment.tracking_id}"
        
        # Notify Sender
        sender_msg = (
            f"Shipment Confirmed!\n"
            f"Tracking ID: {shipment.tracking_id}\n"
            f"To: {shipment.receiver_name}\n"
            f"Route: {shipment.source_branch.title} -> {shipment.destination_branch.title}\n"
            f"- Vyhan Logistics"
        )
        await async_send_sms(shipment.sender_phone, sender_msg)
        
        # Notify Receiver
        receiver_msg = (
            f"Incoming Shipment!\n"
            f"From: {shipment.sender_name}\n"
            f"Tracking ID: {shipment.tracking_id}\n"
            f"Route: {shipment.source_branch.title} -> {shipment.destination_branch.title}\n"
            f"- Vyhan Logistics"
        )
        await async_send_sms(shipment.receiver_phone, receiver_msg)
        
    except Exception as e:
        # Don't fail the request if SMS fails
        print(f"SMS Sending failed: {e}")
    
    return response(
        status=201,
        message="Shipment booked successfully",
        data=shipment_serialized
    )

@api.get("/shipment/list/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
async def list_shipments_organization(request):
    """
    List all shipments for the organization.
    For organization admins - returns all shipments in the organization.
    """
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    # Get all shipments for the organization
    shipments = []
    async for shipment in Shipment.objects.select_related(
        'source_branch__owner',
        'destination_branch__owner',
        'organization'
    ).prefetch_related('history').filter(organization=organization):
        shipment_serialized = ShipmentSerializer.fields("list").from_model(shipment)
        shipments.append(shipment_serialized)
    
    return response(
        status=200,
        message="Shipments fetched successfully",
        data=shipments
    )

@api.get("/shipment/branch/list/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_branch_admin")])
async def list_shipments_branch(request, user=Depends(get_current_user)):
    """
    List shipments for a specific branch.
    For branch admins - returns shipments where branch is source or destination.
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
    
    # Filter shipments where branch is source or destination
    shipments = []
    async for shipment in Shipment.objects.select_related(
        'source_branch__owner',
        'destination_branch__owner',
        'organization'
    ).prefetch_related('history').filter(
        Q(source_branch=branch) | Q(destination_branch=branch),
        organization=organization
    ):
        shipment_serialized = ShipmentSerializer.fields("list").from_model(shipment)
        shipments.append(shipment_serialized)
    
    return response(
        status=200,
        message="Branch shipments fetched successfully",
        data=shipments
    )

@api.get("/shipment/{tracking_id}/", auth=[jwt_auth], guards=[IsAuthenticated()])
async def retrieve_shipment(request, tracking_id: str, user=Depends(get_current_user)):
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    try:
        shipment = await Shipment.objects.select_related(
            'source_branch__owner',
            'destination_branch__owner',
            'organization'
        ).prefetch_related('history').aget(
            tracking_id=tracking_id,
            organization=organization
        )
    except Shipment.DoesNotExist:
        return response(
            status=404,
            message="Shipment not found",
            error="Invalid tracking ID"
        )
    
    # Check branch permissions if user is branch admin
    branch = await user.branch.afirst()
    if branch:
        # Branch admin can only see shipments related to their branch
        if shipment.source_branch_id != branch.id and shipment.destination_branch_id != branch.id:
            return response(
                status=403,
                message="Access denied",
                error="You do not have access to this shipment"
            )
    
    shipment_serialized = ShipmentSerializer.fields("detail").from_model(shipment)
    
    return response(
        status=200,
        message="Shipment fetched successfully",
        data=shipment_serialized
    )

@api.patch("/shipment/{tracking_id}/update-status/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_branch_admin")])
async def update_shipment_status(request, tracking_id: str, credentials: ShipmentStatusUpdateSerializer, user=Depends(get_current_user)):
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
    
    try:
        shipment = await Shipment.objects.select_related(
            'source_branch',
            'destination_branch',
            'organization'
        ).aget(
            tracking_id=tracking_id,
            organization=organization
        )
    except Shipment.DoesNotExist:
        return response(
            status=404,
            message="Shipment not found",
            error="Invalid tracking ID"
        )
    
    # Validate status
    valid_statuses = [choice[0] for choice in ShipmentStatus.choices]
    if credentials.status not in valid_statuses:
        return response(
            status=400,
            message="Invalid status",
            error=f"Status must be one of: {', '.join(valid_statuses)}"
        )
    
    # Update status
    shipment.current_status = credentials.status
    await shipment.asave()
    
    # Create history entry with branch location
    await ShipmentHistory.objects.acreate(
        shipment=shipment,
        status=credentials.status,
        location=branch.title,
        remarks=credentials.remarks
    )
    
    # Fetch updated shipment with related data
    shipment_with_related = await Shipment.objects.select_related(
        'source_branch__owner',
        'destination_branch__owner',
        'organization'
    ).prefetch_related('history').aget(pk=shipment.pk)
    
    shipment_serialized = ShipmentSerializer.fields("detail").from_model(shipment_with_related)
    
    return response(
        status=200,
        message=f"Status updated to {credentials.status}",
        data=shipment_serialized
    )

@api.get("/shipment/track/{tracking_id}/")
async def track_shipment(request, tracking_id: str):
    organization = request.state.get("organization")
    
    # Allow public tracking - organization is optional (from subdomain)
    query = Shipment.objects.select_related(
        'source_branch__owner',
        'destination_branch__owner',
        'organization'
    ).prefetch_related('history').filter(tracking_id=tracking_id)
    
    if organization:
        query = query.filter(organization=organization)
    
    try:
        shipment = await query.aget()
    except Shipment.DoesNotExist:
        return response(
            status=404,
            message="Shipment not found",
            error="Invalid tracking ID"
        )
    
    shipment_serialized = ShipmentSerializer.fields("detail").from_model(shipment)
    
    return response(
        status=200,
        message="Tracking info fetched",
        data=shipment_serialized
    )
