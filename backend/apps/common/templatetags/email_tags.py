from django import template
from django.conf import settings
import os

register = template.Library()

@register.simple_tag
def get_backend_url():
    """Returns the base URL of the backend, useful for generating absolute URLs in emails."""
    return getattr(settings, 'BACKEND_URL', os.environ.get('BACKEND_URL', 'http://localhost:8000')).rstrip('/')
