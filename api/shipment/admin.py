from django.contrib import admin
from .models import Shipment, ShipmentHistory
# Register your models here.

admin.site.register(Shipment)
admin.site.register(ShipmentHistory)
