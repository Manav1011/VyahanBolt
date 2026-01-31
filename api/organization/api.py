from django_bolt import BoltAPI, Depends
from core.utils import response, get_current_user
from organization.middleware import OrganizationMiddleware
from organization.serializers import OrganizationSerializer, OrganizationCreateSerializer, BranchSerializer, BranchCreateSerializer, BranchSerializerForOrganization, BusSerializer, BusCreateSerializer
from django.conf import settings
from django_bolt.auth import APIKeyAuthentication, IsAuthenticated, HasPermission
from django_bolt.middleware import skip_middleware
from django.contrib.auth.models import User
from organization.models import Organization, Branch, Bus
from django.contrib.auth.models import Permission
from core.utils import jwt_auth, store
from asgiref.sync import sync_to_async


open_api = BoltAPI(django_middleware=False)

@open_api.post(
    "/organization/create/",
    auth=[APIKeyAuthentication(api_keys=[settings.SECRET_KEY])],        
    guards=[IsAuthenticated()]
    )
@skip_middleware(OrganizationMiddleware)
async def create_organization(request, credentials: OrganizationCreateSerializer):
    title = credentials.title
    subdomain = credentials.subdomain
    description = credentials.description
    metadata = credentials.metadata
    password = credentials.password

    # create the organization
    organization = await Organization.objects.acreate(
        title=title,
        subdomain=subdomain,
        description=description,
        metadata=metadata
    )
    organization_owner = await User.objects.acreate_user(username=organization.slug, password=password)

    # Fetch all permissions in one go and add them at once
    permission = await Permission.objects.aget(codename='is_organization_admin')
    await organization_owner.user_permissions.aadd(permission)

    organization.owner = organization_owner
    await organization.asave()
    organization_selected = await Organization.objects.select_related("owner").prefetch_related('branches__owner').aget(pk=organization.pk)

    organization_serialized = OrganizationSerializer.fields("detail").from_model(organization_selected)    

    return response(    
        status=200,
        message="Organization created successfully",
        data=organization_serialized
    )
    
# Protected Routes 
api = BoltAPI(django_middleware=False, middleware=[OrganizationMiddleware], prefix="/api")
api.mount("/api/open", open_api)

@api.get("/organization/info/")
async def get_organization_info(request):        
    organization = request.state.get("organization")
    organization_serialized = OrganizationSerializer.fields("minimal").from_model(organization)
    return response(    
        status=200,
        message="API is healthy",
        data=organization_serialized
    )
    
# Organizatin Admin

@api.post("/branch/add/",  auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
async def add_branch(request, credentials: BranchCreateSerializer):
    organization = request.state.get("organization")
    title = credentials.title
    description = credentials.description
    metadata = credentials.metadata
    password = credentials.password
    
    # Create the branch
    branch = await Branch.objects.acreate(
        organization=organization,
        title=title,
        description=description,
        metadata=metadata        
    )
    
    # Create the owner user for the branch
    branch_owner =await  User.objects.acreate_user(username=f"{branch.slug}", password = password)
    # Fetch all permissions in one go and add them at once
    permission = await Permission.objects.aget(codename='is_branch_admin')
    await branch_owner.user_permissions.aadd(permission)
    
    branch.owner = branch_owner
    await branch.asave()
    # branch_with_related = await Branch.objects.select_related("owner", "organization").aget(pk=branch.pk)
    branch_serialized = BranchSerializerForOrganization.from_model(branch)
    
    return response(    
        status=200,
        message="Branch created successfully",
        data=branch_serialized
    )
    
@api.get("/branch/list/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
async def list_branches(request):        
    organization = request.state.get("organization")            
    branches = []
    async for branch in Branch.objects.select_related('owner').filter(organization=organization):        
        branch_serialized = BranchSerializerForOrganization.from_model(branch)
        branches.append(branch_serialized)
    return response(    
        status=200,
        message="Branches retrieved successfully",
        data=branches
    )
    
@api.delete("/branch/{branch_slug}/delete/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
async def delete_branch(request, branch_slug: str):
    organization = request.state.get("organization")            
    try:
        branch = await Branch.objects.aget(organization=organization, slug=branch_slug)
        await branch.adelete()
        return response(    
            status=200,
            message="Branch deleted successfully",
            data=None
        )
    except Branch.DoesNotExist:
        return response(    
            status=404,
            message="Branch not found",
            data=None
        )

# Branch Admin


@api.get('/branch/get_other_braches/', auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_branch_admin")])
async def get_other_branches(request, user=Depends(get_current_user)):
    organization = request.state.get("organization")    
    branches = []
    async for branch in Branch.objects.select_related('owner').filter(organization=organization).exclude(owner=user):
        branch_serialized = BranchSerializerForOrganization.from_model(branch)
        branches.append(branch_serialized)
    return response(    
        status=200,
        message="Branches retrieved successfully",
        data=branches
    )

@api.get("/branch/me/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_branch_admin")])
async def get_my_branch(request, user=Depends(get_current_user)):
    branch = await Branch.objects.select_related('owner').filter(owner=user).afirst()
    if not branch:
        return response(status=404, message="Branch not found")
    branch_serialized = BranchSerializerForOrganization.from_model(branch)
    return response(
        status=200,
        message="Branch info retrieved",
        data=branch_serialized
    )

@api.post("/branch/day_end/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_branch_admin")])
async def branch_day_end(request, user=Depends(get_current_user)):
    from django.utils import timezone
    from datetime import timedelta
    
    # Get the branch of the current user
    branch = await Branch.objects.select_related('owner','organization').filter(owner=user).afirst()
    if not branch:
        return response(status=404, message="Branch not found for this user")
    
    # Check if day end was already done today (calendar day)
    now = timezone.now()
    if branch.last_day_end_at and branch.last_day_end_at.date() == now.date():
        return response(
            status=400, 
            message="Day End already processed for today",
            error="You can only process Day End once per calendar day."
        )
    
    # Increment operational date
    branch.current_operational_date += timedelta(days=1)
    branch.last_day_end_at = now
    await branch.asave()
    
    branch_serialized = BranchSerializerForOrganization.from_model(branch)
    
    return response(
        status=200,
        message=f"Day End processed. Next operational day is {branch.current_operational_date}",
        data=branch_serialized
    )

# Bus Management (Organization Admin)

@api.post("/bus/add/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
async def add_bus(request, credentials: BusCreateSerializer):
    organization = request.state.get("organization")
    bus_number = credentials.bus_number
    preferred_days = credentials.preferred_days
    description = credentials.description
    metadata = credentials.metadata
    
    # Validate preferred_days (should be 1-7)
    if not all(1 <= day <= 7 for day in preferred_days):
        return response(
            status=400,
            message="Invalid preferred days",
            error="Preferred days must be between 1 (Monday) and 7 (Sunday)"
        )
    
    # Check if bus number already exists for this organization
    existing_bus = await Bus.objects.filter(organization=organization, bus_number=bus_number).afirst()
    if existing_bus:
        return response(
            status=400,
            message="Bus number already exists",
            error=f"Bus {bus_number} already exists for this organization"
        )
    
    # Create the bus
    bus = await Bus.objects.acreate(
        organization=organization,
        bus_number=bus_number,
        preferred_days=preferred_days,
        description=description,
        metadata=metadata
    )
    
    bus_serialized = BusSerializer.fields("detail").from_model(bus)
    
    return response(
        status=200,
        message="Bus created successfully",
        data=bus_serialized
    )

@api.get("/bus/list/", auth=[jwt_auth], guards=[IsAuthenticated()])
async def list_buses(request):
    """
    List all buses in the organization.
    Available to both organization admins and branch admins.
    """
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    buses = []
    async for bus in Bus.objects.filter(organization=organization):
        bus_serialized = BusSerializer.fields("list").from_model(bus)
        buses.append(bus_serialized)
    return response(
        status=200,
        message="Buses retrieved successfully",
        data=buses
    )

# Get available buses based on current day (for branch admin)
@api.delete("/bus/{bus_slug}/delete/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
async def delete_bus(request, bus_slug: str):
    organization = request.state.get("organization")
    try:
        bus = await Bus.objects.aget(organization=organization, slug=bus_slug)
        await bus.adelete()
        return response(
            status=200,
            message="Bus deleted successfully",
            data=None
        )
    except Bus.DoesNotExist:
        return response(
            status=404,
            message="Bus not found",
            data=None
        )

@api.get("/bus/available/", auth=[jwt_auth], guards=[IsAuthenticated()])
async def get_available_buses(request):
    """
    Returns buses available today based on their preferred days.
    Day 1 = Monday, Day 7 = Sunday
    """
    from datetime import datetime
    
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    # Get current day of week (Monday=0, Sunday=6 in Python, so we add 1 to match our 1-7 system)
    current_day = datetime.now().weekday() + 1  # Monday=1, Sunday=7
    
    # Get buses that have today in their preferred_days
    available_buses = []
    async for bus in Bus.objects.filter(organization=organization):
        if current_day in bus.preferred_days:
            bus_serialized = BusSerializer.fields("list").from_model(bus)
            available_buses.append(bus_serialized)
    
    return response(
        status=200,
        message="Available buses retrieved successfully",
        data=available_buses
    )