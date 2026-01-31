from typing import Annotated
from django_bolt.serializers import Serializer, Nested
from msgspec import Meta
from .models import ShipmentStatus, PaymentMode

class BranchMinimalSerializer(Serializer):
    slug: str
    title: str

class BusMinimalSerializer(Serializer):
    slug: str
    bus_number: str
    preferred_days: list[int]

class ShipmentHistorySerializer(Serializer):
    status: str
    location: str
    remarks: str | None
    created_at: str

class ShipmentSerializer(Serializer):
    slug: str
    tracking_id: str
    sender_name: str
    sender_phone: str
    receiver_name: str
    receiver_phone: str
    description: str | None
    price: str  # DecimalField serializes as string
    payment_mode: str
    current_status: str
    source_branch: Annotated[BranchMinimalSerializer, Nested(BranchMinimalSerializer)]
    destination_branch: Annotated[BranchMinimalSerializer, Nested(BranchMinimalSerializer)]
    bus: Annotated[BusMinimalSerializer | None, Nested(BusMinimalSerializer)] = None
    history: Annotated[list[ShipmentHistorySerializer], Nested(ShipmentHistorySerializer, many=True)]
    created_at: str
    day: str  # DateField serializes as ISO date string (YYYY-MM-DD)
    
    class Config:
        field_sets = {
            "list": [
                "slug", "tracking_id", "sender_name", "sender_phone",
                "receiver_name", "receiver_phone", "description",
                "price", "payment_mode", "current_status",
                "source_branch", "destination_branch", "bus", "history", "created_at", "day"
            ],
            "detail": [
                "slug", "tracking_id", "sender_name", "sender_phone", 
                "receiver_name", "receiver_phone", "description", 
                "price", "payment_mode", "current_status", 
                "source_branch", "destination_branch", "bus", "history", "created_at", "day"
            ],
        }

class ShipmentCreateSerializer(Serializer):
    sender_name: Annotated[str, Meta(min_length=1, max_length=100)]
    sender_phone: Annotated[str, Meta(min_length=10, max_length=20)]
    receiver_name: Annotated[str, Meta(min_length=1, max_length=100)]
    receiver_phone: Annotated[str, Meta(min_length=10, max_length=20)]
    description: str | None = None
    price: Annotated[float, Meta(gt=0)]
    payment_mode: str = PaymentMode.SENDER_PAYS
    destination_branch_slug: Annotated[str, Meta(min_length=1)]
    bus_slug: str | None = None
    day: str | None = None  # ISO date string (YYYY-MM-DD), defaults to today if not provided
    # Note: source_branch is automatically determined from authenticated user's branch

class ShipmentStatusUpdateSerializer(Serializer):
    status: str
    remarks: str | None = None
