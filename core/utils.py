import time
import uuid
from django_bolt import JSON


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