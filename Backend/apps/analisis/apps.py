"""
Configuración de la app de análisis urbanístico
"""
from django.apps import AppConfig


class AnalisisConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.analisis'
    verbose_name = "Análisis Urbanístico"
