from django_bolt.serializers import Serializer

class GlobalResponseSerializer(Serializer):
    status: int
    message: str
    data: dict | list | None = None
    error: str | None = None
    
class UserSerializer(Serializer):
    username: str
    email: str | None
    first_name: str | None
    last_name: str | None
    is_active: bool
    is_staff: bool
    date_joined: str

    class Config:
        field_sets = {
            "public": ["username"],
            "private": ["username", "email", "first_name", "last_name", "is_active", "is_staff", "date_joined"],
        }