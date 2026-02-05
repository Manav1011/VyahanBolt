from django_bolt.serializers import Serializer

class MessageSerializer(Serializer):
    id: int
    content: str
    is_read: bool
    created_at: str
