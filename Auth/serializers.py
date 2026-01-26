from django_bolt.serializers import Serializer

class LoginRequest(Serializer):
    email: str
    password: str

class RefreshRequest(Serializer):
    access: str
    refresh: str