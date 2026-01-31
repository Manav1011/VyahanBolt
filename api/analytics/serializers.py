from typing import Annotated
from django_bolt.serializers import Serializer, Nested
from msgspec import Meta
from shipment.models import ShipmentStatus, PaymentMode
from shipment.serializers import ShipmentSerializer, BranchMinimalSerializer, BusMinimalSerializer

class AnalyticsFilterSerializer(Serializer):
    """Serializer for analytics filter parameters"""
    start_date: str | None = None  # ISO date string
    end_date: str | None = None  # ISO date string
    status: list[str] | None = None  # List of statuses: ['BOOKED', 'IN_TRANSIT', 'ARRIVED']
    branch_slug: str | None = None  # Filter by branch (for org admin) - either source or destination
    source_branch_slug: str | None = None  # Filter by source branch (shipments going out)
    destination_branch_slug: str | None = None  # Filter by destination branch (shipments coming in)
    bus_slug: str | None = None  # Filter by bus
    payment_mode: str | None = None  # 'SENDER_PAYS' or 'RECEIVER_PAYS'
    min_price: float | None = None
    max_price: float | None = None
    search: str | None = None  # Search in tracking_id, sender_name, receiver_name
    page: int = 1  # Page number for pagination
    page_size: int = 50  # Items per page

class StatusCountSerializer(Serializer):
    """Count of shipments by status"""
    status: str
    count: int

class PaymentModeCountSerializer(Serializer):
    """Count of shipments by payment mode"""
    payment_mode: str
    count: int

class BranchCountSerializer(Serializer):
    """Count of shipments by branch (for org admin)"""
    branch: Annotated[BranchMinimalSerializer, Nested(BranchMinimalSerializer)]
    count: int
    total_revenue: str  # Decimal as string

class AnalyticsSummarySerializer(Serializer):
    """Summary statistics for analytics"""
    total_shipments: int
    total_revenue: str  # Decimal as string
    average_price: str  # Decimal as string
    by_status: list[StatusCountSerializer]
    by_payment_mode: list[PaymentModeCountSerializer]
    by_branch: list[BranchCountSerializer] | None = None  # Only for org admin

class AnalyticsDataSerializer(Serializer):
    """Individual shipment data for analytics table"""
    slug: str
    tracking_id: str
    sender_name: str
    receiver_name: str
    source_branch: Annotated[BranchMinimalSerializer, Nested(BranchMinimalSerializer)]
    destination_branch: Annotated[BranchMinimalSerializer, Nested(BranchMinimalSerializer)]
    bus: Annotated[BusMinimalSerializer | None, Nested(BusMinimalSerializer)] = None
    price: str  # Decimal as string
    payment_mode: str
    current_status: str
    created_at: str

class AnalyticsResponseSerializer(Serializer):
    """Complete analytics response with summary and data"""
    summary: Annotated[AnalyticsSummarySerializer, Nested(AnalyticsSummarySerializer)]
    data: list[AnalyticsDataSerializer]
    pagination: dict  # { page: int, page_size: int, total: int, total_pages: int }
