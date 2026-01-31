from django.db import models

# Create your models here.

from django.db import models
from django.utils import timezone
from core.models import BaseModel
from organization.models import Organization, Branch, Bus
import random
import string

def generate_tracking_id(prefix="TRK"):
    return f"{prefix}-{''.join(random.choices(string.digits, k=6))}"

class ShipmentStatus(models.TextChoices):
    BOOKED = 'BOOKED', 'Booked'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    ARRIVED = 'ARRIVED', 'Arrived at Destination'

class PaymentMode(models.TextChoices):
    SENDER_PAYS = 'SENDER_PAYS', 'Prepaid (Sender)'
    RECEIVER_PAYS = 'RECEIVER_PAYS', 'COD (Receiver)'

class Shipment(BaseModel):
    tracking_id = models.CharField(max_length=20, unique=True, default=generate_tracking_id)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='shipments')
    source_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='outgoing_shipments')
    destination_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='incoming_shipments')
    bus = models.ForeignKey(Bus, on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')
    
    sender_name = models.CharField(max_length=100)
    sender_phone = models.CharField(max_length=20)
    receiver_name = models.CharField(max_length=100)
    receiver_phone = models.CharField(max_length=20)
    
    description = models.TextField(null=True, blank=True)
    
    price = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PaymentMode.choices, default=PaymentMode.SENDER_PAYS)
    
    current_status = models.CharField(max_length=20, choices=ShipmentStatus.choices, default=ShipmentStatus.BOOKED)
    day = models.DateField(default=timezone.now)
    
    def __str__(self):
        return f"{self.tracking_id} ({self.sender_name} -> {self.receiver_name})"

class ShipmentHistory(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='history')
    status = models.CharField(max_length=20, choices=ShipmentStatus.choices)
    location = models.CharField(max_length=255)
    remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Shipment Histories"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.shipment.tracking_id} - {self.status} at {self.location}"