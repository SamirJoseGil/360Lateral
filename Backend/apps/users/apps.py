"""
Configuración de la aplicación de usuarios
"""
from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Users'
    
    def ready(self):
        """
        Importar signals cuando la aplicación está lista.
        Esto asegura que los signals se registren correctamente.
        """
        try:
            import apps.users.signals  # noqa: F401
        except ImportError:
            pass
