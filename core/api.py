from django_bolt import BoltAPI
from core.utils import response

api = BoltAPI(django_middleware=False)

@api.get("/health")
async def health_check():
    return response(
        status=200,
        message="API is healthy",
        data={"status": "ok"}
    )