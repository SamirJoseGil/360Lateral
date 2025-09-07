"""
Health Check App Configuration

This module contains the configuration for the health_check Django app.
"""

from django.apps import AppConfig


class HealthCheckConfig(AppConfig):
    """
    Configuration class for the health_check application.
    
    This app provides endpoints for monitoring the health and status of the application
    and its dependencies, useful for load balancers and monitoring systems.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.health_check'
    verbose_name = 'Health Check'