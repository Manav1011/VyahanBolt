from core.models import BaseModel
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User

# Create your models here.

class Organization(BaseModel):
    title = models.CharField(max_length=100)
    subdomain = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)    
    slug = models.CharField(max_length=32)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='organization')
    
    class Meta:
        permissions = [
            ("is_organization_admin", "Is Organization Admin"),
        ]
        
    def __str__(self):
        return self.title

class Branch(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='branches')
    title = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='branch')
    
    class Meta:
        permissions = [
            ("is_branch_admin", "Is Branch Admin"),
        ]
        
    def __str__(self):
        return f"{self.title} - {self.organization.title}"