from organization.models import Organization
from django.http import JsonResponse
from django_bolt.middleware import BaseMiddleware
from django_bolt.middleware_response import MiddlewareResponse
from django_bolt.request import Request
from django_bolt.responses import Response

# class OrganizationMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):        
#         host = request.get_host().split(':')[0]
#         # Extract the leftmost subdomain (before the first dot)        
#         subdomain = host.split('.')[0] if host.count('.') >= 2 else None        
#         organization = None
#         try:
#             organization = Organization.objects.get(subdomain=subdomain)
#             request.organization = organization
#         except Organization.DoesNotExist:
#             # Allow admin routes to proceed even if organization is not found
#             if request.path.startswith("/admin"):
#                 return self.get_response(request)
#             request.organization = None
#             return JsonResponse(
#                 status=404,
#                 data = {"status": "error", "message": "Organization not found"}
#             )
#         response = self.get_response(request)        
#         if organization:
#             response.set_cookie('organization_slug', organization.slug)                
#         return response
    
    
class OrganizationMiddleware(BaseMiddleware):
    async def process_request(self, request: Request) -> Response:
        host = request.headers.get("host", "")        
        # Remove port if present
        host = host.split(':')[0]
        # Extract the leftmost subdomain (before the first dot)
        subdomain = host.split('.')[0] if host.count('.') >= 2 else None                        
        organization = None
        try:
            organization = await Organization.objects.select_related("owner").prefetch_related('branches__owner').aget(subdomain=subdomain)
            request.state['organization'] = organization
        except Organization.DoesNotExist:            
            # Allow admin routes to proceed even if organization is not found
            if request.path.startswith("/admin"):
                return await self.get_response(request)
            request.state['organization'] = None
            response = MiddlewareResponse(status_code=404, headers={"Content-Type": "application/json"}, body=b'{"status": "error", "message": "Organization not found"}')
            return response        
        response = await self.get_response(request)                                
        if organization:            
            response.set_cookies = [f"organization_slug={organization.slug}"]                    
        return response