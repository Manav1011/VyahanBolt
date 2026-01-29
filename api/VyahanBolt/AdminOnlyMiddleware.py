from django.utils.deprecation import MiddlewareMixin
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.auth.middleware import AuthenticationMiddleware
from django.contrib.messages.middleware import MessageMiddleware

class AdminOnlyMiddleware(MiddlewareMixin):
    ADMIN_PATH = "/admin"

    def __init__(self, get_response):
        super().__init__(get_response)
        self.get_response = get_response
        self.session_middleware = SessionMiddleware(get_response)
        self.auth_middleware = AuthenticationMiddleware(get_response)
        self.message_middleware = MessageMiddleware(get_response)

    def process_request(self, request):
        """Apply middlewares only for admin routes."""
        if request.path.startswith(self.ADMIN_PATH):
            self.session_middleware.process_request(request)
            self.auth_middleware.process_request(request)  # Only modifies request.user
            self.message_middleware.process_request(request)
        else:
            request.session = None  # Disable session handling for non-admin users
            request.user = None  # Disable authentication
            request._messages = None  # Disable messages

    def process_response(self, request, response):
        """Only process session and message responses for admin requests."""
        if request.path.startswith(self.ADMIN_PATH):
            response = self.session_middleware.process_response(request, response)
            response = self.message_middleware.process_response(request, response)  # AuthenticationMiddleware has no process_response
        
        return response