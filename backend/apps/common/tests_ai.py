from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.common.services.gemini_service import GeminiService


from django.core.cache import cache


class PublicAIChatAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.url = '/api/public/ai/chat/'

    def test_empty_message_returns_400(self):
        response = self.client.post(self.url, {"message": ""}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_missing_message_returns_400(self):
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oversized_message_returns_400(self):
        long_message = "A" * 2001
        response = self.client.post(self.url, {"message": long_message}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_conversation_type_returns_400(self):
        response = self.client.post(
            self.url,
            {"message": "Hello", "conversation": "not-a-list"},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('apps.common.views_ai.gemini_service.generate_chat_response')
    def test_successful_chat_response(self, mock_generate):
        mock_generate.return_value = ("Malasakit is an all-in-one clinic management platform.", False)
        payload = {
            "message": "What is Malasakit?",
            "conversation": [
                {"role": "user", "content": "Hi"},
                {"role": "assistant", "content": "Hello! How can I help you learn more about Malasakit?"}
            ]
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["response"], "Malasakit is an all-in-one clinic management platform.")
        self.assertFalse(response.data["is_unrelated"])
        self.assertFalse(response.data["is_locked"])
        mock_generate.assert_called_once()

    @patch('apps.common.views_ai.gemini_service.generate_chat_response')
    def test_unrelated_question_and_5_minute_lockout(self, mock_generate):
        mock_generate.return_value = (
            "This is unrelated to malasakit. just wasting your time. ask me anything related to malasakit...",
            True
        )
        # Attempt 1: First unrelated question
        resp1 = self.client.post(
            self.url,
            {"message": "Write a python script for bitcoin mining", "device_id": "test-dev-1"},
            format='json'
        )
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)
        self.assertTrue(resp1.data["is_unrelated"])
        self.assertFalse(resp1.data["is_locked"])
        self.assertEqual(resp1.data["strikes"], 1)

        # Attempt 2: Second unrelated question -> triggers 5-minute lockout
        resp2 = self.client.post(
            self.url,
            {"message": "What is the capital of France?", "device_id": "test-dev-1"},
            format='json'
        )
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertTrue(resp2.data["is_unrelated"])
        self.assertTrue(resp2.data["is_locked"])
        self.assertEqual(resp2.data["lockout_seconds"], 300)

        # Attempt 3: During lockout -> immediately rejected with 429 Too Many Requests
        resp3 = self.client.post(
            self.url,
            {"message": "What is Malasakit?", "device_id": "test-dev-1"},
            format='json'
        )
        self.assertEqual(resp3.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertTrue(resp3.data["is_locked"])

    @patch('apps.common.views_ai.gemini_service.generate_chat_response')
    def test_gemini_error_returns_503(self, mock_generate):
        mock_generate.side_effect = RuntimeError("Gemini API key is not configured on the server.")
        response = self.client.post(self.url, {"message": "Hello"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(
            response.data["error"],
            "Sorry, I'm having trouble responding right now. Please try again in a moment."
        )


class GeminiServiceUnitTests(TestCase):
    def test_service_unconfigured(self):
        with patch.dict('os.environ', {'GEMINI_API_KEY': ''}):
            service = GeminiService()
            self.assertFalse(service.is_configured())
            with self.assertRaises(RuntimeError):
                service.generate_chat_response("Hello")

    @patch('requests.post')
    def test_service_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "Malasakit PMS helps clinics manage appointments and billing."}]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-fake-key'}):
            service = GeminiService()
            self.assertTrue(service.is_configured())
            reply, is_unrelated = service.generate_chat_response(
                message="What does Malasakit do?",
                conversation=[{"role": "user", "content": "Hello"}]
            )
            self.assertEqual(reply, "Malasakit PMS helps clinics manage appointments and billing.")
            self.assertFalse(is_unrelated)

    @patch('requests.post')
    def test_service_unrelated_flag(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [
                {
                    "content": {
                        "parts": [{"text": "This is unrelated to malasakit. just wasting your time. ask me anything related to malasakit..."}]
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        with patch.dict('os.environ', {'GEMINI_API_KEY': 'test-fake-key'}):
            service = GeminiService()
            reply, is_unrelated = service.generate_chat_response(
                message="Tell me a joke"
            )
            self.assertTrue(is_unrelated)
            self.assertIn("unrelated to malasakit", reply)
