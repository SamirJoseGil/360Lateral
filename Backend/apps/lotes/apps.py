"""
Configuración de la aplicación de lotes
"""
from django.apps import AppConfig


class LotesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.lotes'
    verbose_name = 'Gestión de Lotes'

    def ready(self):
        """✅ Importar signals cuando la app esté lista"""
        import apps.lotes.signals  # noqa