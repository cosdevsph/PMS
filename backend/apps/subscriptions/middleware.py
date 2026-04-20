from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

EXEMPT_PATHS = [
    '/api/auth/',
    '/api/subscription/',
]


class SubscriptionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authenticator = JWTAuthentication()

    def _resolve_user(self, request):
        if getattr(request, 'user', None) and request.user.is_authenticated:
            return request.user

        try:
            auth_result = self.jwt_authenticator.authenticate(request)
        except (AuthenticationFailed, InvalidToken, TokenError):
            return None
        except Exception:
            return None

        if auth_result is None:
            return None

        user, _ = auth_result
        return user

    def __call__(self, request):
        if not request.path.startswith('/api/'):
            return self.get_response(request)

        if any(request.path.startswith(path) for path in EXEMPT_PATHS):
            return self.get_response(request)

        user = self._resolve_user(request)
        if user:
            subscription = getattr(user, 'subscription', None)
            if not subscription or not subscription.is_active():
                return JsonResponse(
                    {
                        'error': 'Subscription expired',
                        'message': 'Please subscribe to continue using the system.',
                    },
                    status=403,
                )

        return self.get_response(request)
