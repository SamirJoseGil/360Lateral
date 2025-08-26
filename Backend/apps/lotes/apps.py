from django.apps import AppConfig


class LotesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.lotes'
    verbose_name = 'Lotes'
    
    def ready(self):
        """
        Inicialización de la app cuando Django está listo.
        """
        # Importar señales aquí para evitar errores de importación circular
        try:
            # import apps.lotes.signals
            pass
        except ImportError:
            pass
