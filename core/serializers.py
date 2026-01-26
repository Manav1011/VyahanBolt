from django_bolt.serializers import Serializer

class GlobalResponseSerializer(Serializer):
    status: int
    message: str
    data: dict | list | None = None
    error: str | None = None