from django_bolt.serializers import Serializer
from typing import Literal


class LoginRequest(Serializer):
    login_type: Literal["organization", "branch"]
    username: str
    password: str

class RefreshRequest(Serializer):
    access: str
    refresh: str