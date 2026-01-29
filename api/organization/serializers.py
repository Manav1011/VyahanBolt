from typing import Annotated
from django_bolt.serializers import Serializer, computed_field, Nested
from core.serializers import UserSerializer
from msgspec import Meta

from typing import Annotated, Any
from django_bolt.serializers import Serializer, computed_field, Nested
from core.serializers import UserSerializer
from msgspec import Meta

class BranchSerializerForOrganization(Serializer):
    slug: str
    title: str
    description: str = None
    metadata: dict = None    
    owner: Annotated[UserSerializer, Nested(UserSerializer.fields('public'))]

class OrganizationSerializer(Serializer):
    slug: str
    title: str
    subdomain: str
    description: str | None
    metadata: dict | None
    created_at: str
    updated_at: str
    owner: Annotated[UserSerializer, Nested(UserSerializer.fields('public'))]    
    branches: Annotated[BranchSerializerForOrganization, Nested(BranchSerializerForOrganization, many=True)]
    
    # @computed_field(alias='branches')
    # def branch_list(self):
    #     print(self)
    #     return BranchSerializerForOrganization.from_model(self.branches)

    class Config:
        field_sets = {
            "list": ["slug", "title", "subdomain", "owner"],
            "detail": [
                "slug", "title", "subdomain", "description",
                "metadata", "created_at", "updated_at", "owner", "branches"
            ],
            "minimal": [
                "slug", "title", "subdomain", "description",
                "metadata", "owner", "branches"
            ],
            "self": ["slug", "title"],
        }

        
class OrganizationCreateSerializer(Serializer):
    title: Annotated[str, Meta(min_length=3, max_length=100)]
    subdomain: Annotated[str, Meta(min_length=3, max_length=100, pattern="^[a-z0-9-]+$")]
    description: str = None
    metadata: dict = None
    password: Annotated[str, Meta(min_length=8)]
    
class BranchSerializer(Serializer):
    organization: Annotated[OrganizationSerializer, Nested(OrganizationSerializer.fields('self'))]    
    title: str
    description: str = None
    metadata: dict = None    
    owner: Annotated[UserSerializer, Nested(UserSerializer.fields('public'))]
    
    class Config:
        field_sets = {
            "list": ["slug", "title", "organization", "owner"],
            "detail": ["slug", "title", "description", "organization", "owner"],
        }
        
class BranchCreateSerializer(Serializer):    
    title: Annotated[str, Meta(min_length=3, max_length=100)]
    description: str = None
    metadata: dict = None
    password: Annotated[str, Meta(min_length=8)]