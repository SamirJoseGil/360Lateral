"""
Configuración de la aplicación MapGIS
"""
from django.apps import AppConfig


class MapgisConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.mapgis'
    verbose_name = 'MapGIS Scraper'
    
    def ready(self):
        """Inicialización cuando la app está lista"""
        import logging
        logger = logging.getLogger(__name__)
        logger.info("🗺️ MapGIS module loaded successfully")
