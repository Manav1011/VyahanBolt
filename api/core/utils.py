import time
import uuid
from django_bolt import JSON
from django_bolt.auth import JWTAuthentication, InMemoryRevocation, DjangoCacheRevocation
from django.contrib.auth.models import User
from django_bolt.exceptions import HTTPException

def generate_unique_hash():
    """
    Generates a more robust unique slug using a larger portion of UUID and timestamp.
    """
    # Use a larger part of UUID (32 characters) and append a timestamp for uniqueness
    random_hash = str(uuid.uuid4().hex)[:16]  # Using 16 characters from the UUID
    timestamp = str(int(time.time() * 1000))  # Millisecond precision timestamp
    
    # Combine UUID and timestamp for a more robust unique hash
    unique_hash = f"{random_hash}_{timestamp}"
    
    return unique_hash

def response(status: int, message: str, data=None, error: str | None = None, headers=None) -> dict:
    """
    Standardized response format for API responses.

    Args:
        status: HTTP status code
        message: Response message
        data: Response data (optional)
        error: Error message (optional)
    """
    return JSON(
        status_code=status,
        data={
            "message": message,
            "data": data,
            "error": error
        },
        headers=headers
    )
    
async def get_current_user(request):
    """Dependency that extracts the current user."""
    user_id = request.get("context", {}).get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")        
    return await User.objects.prefetch_related('branch','organization').aget(id=user_id)

    
# Revocation store for blacklisting tokens (use DjangoCacheRevocation or DjangoORMRevocation for production)
store=InMemoryRevocation()
jwt_auth = JWTAuthentication(revocation_store=store, require_jti=True)