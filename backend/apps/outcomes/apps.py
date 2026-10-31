import logging

from django.apps import AppConfig
from django.db.models.signals import post_migrate

logger = logging.getLogger(__name__)


def sync_library(sender, **kwargs):
    """After `migrate`, publish the library files so a fresh database is never left with an empty library."""
    from .services import load_library

    try:
        for name, outcome in load_library():
            if outcome.startswith('REJECTED'):
                logger.error('Outcome definition %s %s', name, outcome)
    except Exception:  # a sync problem must not make `migrate` fail
        logger.exception('Could not load the outcome-measure library')


class OutcomesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.outcomes'
    verbose_name = 'Outcome Measures'

    def ready(self):
        post_migrate.connect(sync_library, sender=self)
