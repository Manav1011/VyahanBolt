from django.db import models
from django.contrib.auth.models import User
from core.models import BaseModel
from organization.models import Organization

class Message(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Message to {self.user.username if self.user else self.phone_number}"
