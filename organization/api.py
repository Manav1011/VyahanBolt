from django_bolt import BoltAPI, Depends
from core.utils import response, get_current_user
from .middleware import OrganizationMiddleware
from .serializers import OrganizationSerializer, OrganizationCreateSerializer, BranchSerializer, BranchCreateSerializer, BranchSerializerForOrganization
from django.conf import settings
from django_bolt.auth import APIKeyAuthentication, IsAuthenticated, HasPermission
from django_bolt.middleware import skip_middleware
from django.contrib.auth.models import User
from .models import Organization, Branch
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
api = BoltAPI(django_middleware=False, middleware=[OrganizationMiddleware])
api.mount("/open", open_api)

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
    
@api.get("/branch/{branch_slug}/delete/", auth=[jwt_auth], guards=[IsAuthenticated(), HasPermission("organization.is_organization_admin")])
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