# Generated manually for adding day field to Shipment model

import django.utils.timezone
from django.db import migrations, models


def populate_day_from_created_at(apps, schema_editor):
    """Populate day field with date from created_at for existing records"""
    Shipment = apps.get_model('shipment', 'Shipment')
    for shipment in Shipment.objects.all():
        if shipment.created_at:
            shipment.day = shipment.created_at.date()
            shipment.save(update_fields=['day'])


class Migration(migrations.Migration):

    dependencies = [
        ('shipment', '0002_add_bus_to_shipment'),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='day',
            field=models.DateField(default=django.utils.timezone.now),
        ),
        migrations.RunPython(populate_day_from_created_at, migrations.RunPython.noop),
    ]
