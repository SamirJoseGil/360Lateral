from django.apps import AppConfig

class StatsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.stats'
    verbose_name = 'Estadísticas'
    
    def ready(self):
        # Import any signals here if needed
        pass