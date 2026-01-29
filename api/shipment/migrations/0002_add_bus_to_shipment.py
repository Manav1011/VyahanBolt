# Generated manually for adding bus field to Shipment model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shipment', '0001_initial'),
        ('organization', '0007_create_bus'),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='bus',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shipments', to='organization.bus'),
        ),
    ]
