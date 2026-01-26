from django_bolt import BoltAPI
from core.utils import response
from Auth.serializers import LoginRequest, RefreshRequest
from django.contrib.auth import aauthenticate
from django_bolt.auth import create_jwt_for_user, create_jwt_pair_for_user, JWTAuthentication, IsAuthenticated, InMemoryRevocation
from django.conf import settings
import jwt
from django.contrib.auth import get_user_model
import uuid

api = BoltAPI()

# Revocation store for blacklisting tokens (use DjangoCacheRevocation or DjangoORMRevocation for production)
store = InMemoryRevocation()
jwt_auth = JWTAuthentication(revocation_store=store, require_jti=True)

@api.post("/auth/token")
async def login(credentials: LoginRequest):
    user = await aauthenticate(
        email=credentials.email,
        password=credentials.password
    )

    if user is None:
        return response(
            status=401,
            message="Unauthorized",
            error="Invalid username or password"
        )


    tokens = create_jwt_pair_for_user(user)
    return response(
        status=200,
        message="Login successful",
        data={
            "access": tokens["access_token"],
            "refresh": tokens["refresh_token"]            
        }
    )
    

@api.get("/profile", auth=[jwt_auth], guards=[IsAuthenticated()])
async def profile(request):
    return response(
        status=200,
        message="Profile fetched",
        data={"user_id": request.user.id}
    )

@api.post("/logout", auth=[jwt_auth], guards=[IsAuthenticated()])
async def logout(request):    
    token_jti = request.context.get("auth_claims", {}).get("jti")
    if token_jti:
        await store.revoke(token_jti)
    return response(
        status=200,
        message="Logged out",
        data={"status": "logged out"}
    )

@api.post("/refresh")
async def refresh_token(credentials: RefreshRequest):
    access_token = getattr(credentials, "access", None)
    refresh_token = getattr(credentials, "refresh", None)
    try:
        payload_access = jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
        payload_refresh = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=["HS256"])
        # Check if either token is already revoked
        if await store.is_revoked(payload_access["jti"]):
            return response(
                status=401,
                message="Access token revoked",
                error="Access token has already been revoked"
            )
        if await store.is_revoked(payload_refresh["jti"]):
            return response(
                status=401,
                message="Refresh token revoked",
                error="Refresh token has already been revoked"
            )
        # Revoke both tokens by jti
        await store.revoke(payload_access["jti"])
        await store.revoke(payload_refresh["jti"])
        User = get_user_model()
        user = await User.objects.aget(pk=payload_refresh["sub"])
        tokens = create_jwt_pair_for_user(user)
        return response(
            status=200,
            message="Token refreshed",
            data={
                "access": tokens["access_token"],
                "refresh": tokens["refresh_token"]
            }
        )
    except jwt.DecodeError:
        return response(
            status=400,
            message="Invalid token",
            error="Malformed or invalid JWT provided"
        )
    except Exception as e:
        return response(
            status=500,
            message="Token error",
            error=str(e)
        )