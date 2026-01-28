from django.contrib import admin
from .models import Organization, Branch
# Register your models here.


class OrganizationAdmin(admin.ModelAdmin):
	readonly_fields = ('slug',)

class BranchAdmin(admin.ModelAdmin):
	readonly_fields = ('slug',)

admin.site.register(Organization, OrganizationAdmin)
admin.site.register(Branch, BranchAdmin)
