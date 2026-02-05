from django_bolt import BoltAPI, Depends
from core.utils import response, get_current_user, jwt_auth
from organization.middleware import OrganizationMiddleware
from .models import Message
from .serializers import MessageSerializer
from django_bolt.auth import IsAuthenticated

api = BoltAPI(django_middleware=False, middleware=[OrganizationMiddleware], prefix="/api")

@api.get("/messages/", auth=[jwt_auth], guards=[IsAuthenticated()])
async def list_messages(request, user=Depends(get_current_user)):
    organization = request.state.get("organization")
    if not organization:
        return response(
            status=404,
            message="Organization not found",
            error="Organization context missing"
        )
    
    messages = []
    async for msg in Message.objects.filter(
        organization=organization,
        user=user
    ).order_by('-created_at'):
        # Manual serialization for now as we want to format date
        messages.append({
            "id": msg.id,
            "content": msg.content,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat()
        })
    
    return response(
        status=200,
        message="Messages fetched successfully",
        data=messages
    )

@api.patch("/messages/{message_id}/read/", auth=[jwt_auth], guards=[IsAuthenticated()])
async def mark_as_read(request, message_id: int, user=Depends(get_current_user)):
    try:
        message = await Message.objects.aget(id=message_id, user=user)
        message.is_read = True
        await message.asave()
        return response(status=200, message="Message marked as read")
    except Message.DoesNotExist:
        return response(status=404, message="Message not found")
