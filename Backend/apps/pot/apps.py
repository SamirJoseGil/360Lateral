"""
Módulo POT - Punto de Operación de Trabajo
"""


from django.apps import AppConfig

class PotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pot'
    verbose_name = 'Plan de Ordenamiento Territorial'
    
    def ready(self):
        """Código a ejecutar cuando la aplicación esté lista"""
        pass