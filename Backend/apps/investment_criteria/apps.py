"""
Configuración de la app de criterios de inversión
"""
from django.apps import AppConfig


class InvestmentCriteriaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.investment_criteria'
    verbose_name = 'Criterios de Inversión'
