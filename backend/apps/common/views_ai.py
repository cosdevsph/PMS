import logging
import time
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from apps.common.services.gemini_service import gemini_service
from apps.common.recaptcha import verify_recaptcha

logger = logging.getLogger(__name__)

class PublicAIChatView(APIView):
    """
    Public AI chat endpoint for the Malasakit landing page.
    No authentication required.
    Throttled by client IP to prevent abuse.
    Enforces 5-minute lockout after 2 attempts with unrelated questions.
    
    POST /api/public/ai/chat/
    Payload:
    {
        "message": "What is Malasakit?",
        "conversation": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ],
        "device_info": {
            "os": "macOS",
            "browser": "Google Chrome",
            "device_type": "Desktop",
            "screen_resolution": "1920x1080"
        },
        "device_id": "unique-device-fingerprint",
        "captcha_token": "optional-recaptcha-token"
    }
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = 'public_ai_chat'

    MAX_MESSAGE_LENGTH = 2000
    MAX_CONVERSATION_TURNS = 10

    def post(self, request):
        data = request.data
        if not isinstance(data, dict):
            return Response(
                {"error": "Invalid payload format. Expected JSON object."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 0. Client identification & 5-minute lockout check
        remote_ip = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR', '')
        )
        device_id = data.get("device_id") or ""
        client_key = f"{remote_ip}_{device_id}" if device_id else remote_ip
        lockout_key = f"ai_lockout_{client_key}"
        strikes_key = f"ai_strikes_{client_key}"

        lockout_until = cache.get(lockout_key)
        if lockout_until:
            now = time.time()
            remaining_seconds = int(lockout_until - now)
            if remaining_seconds > 0:
                return Response(
                    {
                        "error": "This is unrelated to malasakit. just wasting your time. You have exceeded 2 attempts. Chat is locked for 5 minutes.",
                        "is_locked": True,
                        "lockout_seconds": remaining_seconds,
                        "lockout_until": lockout_until,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )
            else:
                cache.delete(lockout_key)
                cache.delete(strikes_key)

        # 1. Validate 'message'
        message = data.get("message")
        if not message or not isinstance(message, str) or not message.strip():
            return Response(
                {"error": "A non-empty 'message' string is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        message = message.strip()
        if len(message) > self.MAX_MESSAGE_LENGTH:
            return Response(
                {"error": f"Message exceeds maximum allowed length of {self.MAX_MESSAGE_LENGTH} characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Validate 'conversation' history (optional)
        conversation = data.get("conversation", [])
        if not isinstance(conversation, list):
            return Response(
                {"error": "'conversation' must be a list of message objects."},
                status=status.HTTP_400_BAD_REQUEST
            )

        validated_conversation = []
        # Enforce max history length
        trimmed_conversation = conversation[-self.MAX_CONVERSATION_TURNS:]
        for item in trimmed_conversation:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = item.get("content")
            if role not in ("user", "assistant"):
                continue
            if not isinstance(content, str):
                continue
            content = content.strip()
            if not content:
                continue
            if len(content) > self.MAX_MESSAGE_LENGTH:
                content = content[:self.MAX_MESSAGE_LENGTH]
            
            validated_conversation.append({
                "role": role,
                "content": content
            })

        # 3. Optional reCAPTCHA token verification if provided
        captcha_token = data.get("captcha_token")
        if captcha_token:
            captcha_ok, captcha_err = verify_recaptcha(captcha_token, remote_ip)
            if not captcha_ok:
                return Response(
                    {"error": captcha_err or "reCAPTCHA verification failed."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 4. Extract client device diagnostics (optional)
        device_info = data.get("device_info")
        if not isinstance(device_info, dict):
            device_info = None

        # 5. Call Gemini Service
        try:
            ai_response, is_unrelated = gemini_service.generate_chat_response(
                message=message,
                conversation=validated_conversation,
                device_info=device_info
            )

            # 6. Check for unrelated question and enforce strike / lockout limit
            if is_unrelated:
                current_strikes = cache.get(strikes_key, 0) + 1
                cache.set(strikes_key, current_strikes, timeout=600)

                if current_strikes >= 2:
                    # Trigger 5-minute lockout (300 seconds)
                    lockout_duration = 300
                    lockout_expiry = time.time() + lockout_duration
                    cache.set(lockout_key, lockout_expiry, timeout=lockout_duration)
                    cache.delete(strikes_key)

                    return Response(
                        {
                            "response": ai_response,
                            "is_unrelated": True,
                            "strikes": current_strikes,
                            "is_locked": True,
                            "lockout_seconds": lockout_duration,
                            "lockout_until": lockout_expiry,
                        },
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {
                            "response": ai_response,
                            "is_unrelated": True,
                            "strikes": current_strikes,
                            "is_locked": False,
                        },
                        status=status.HTTP_200_OK
                    )

            return Response(
                {
                    "response": ai_response,
                    "is_unrelated": False,
                    "is_locked": False,
                },
                status=status.HTTP_200_OK
            )
        except RuntimeError as e:
            logger.error(f"Gemini service runtime error: {e}")
            # Do not expose internal keys or errors to visitor
            return Response(
                {"error": "Sorry, I'm having trouble responding right now. Please try again in a moment."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.exception(f"Unexpected error in PublicAIChatView: {e}")
            return Response(
                {"error": "Sorry, I'm having trouble responding right now. Please try again in a moment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
