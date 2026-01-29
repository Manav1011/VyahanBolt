# Generated manually for Bus model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organization', '0006_alter_branch_owner_alter_organization_owner'),
    ]

    operations = [
        migrations.CreateModel(
            name='Bus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('slug', models.CharField(max_length=32)),
                ('bus_number', models.CharField(max_length=50)),
                ('preferred_days', models.JSONField(default=list, help_text='List of preferred days (1=Monday, 7=Sunday)')),
                ('description', models.TextField(blank=True, null=True)),
                ('metadata', models.JSONField(blank=True, null=True)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='buses', to='organization.organization')),
            ],
            options={
                'verbose_name_plural': 'Buses',
            },
        ),
        migrations.AlterUniqueTogether(
            name='bus',
            unique_together={('organization', 'bus_number')},
        ),
    ]
