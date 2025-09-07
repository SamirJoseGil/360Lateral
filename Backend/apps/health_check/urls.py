"""
Health Check URLs

This module contains URL patterns for health checking of the application and its components.
"""

from django.urls import path
from . import views

app_name = 'health_check'

urlpatterns = [
    # Basic health check endpoint
    path('', views.health_check, name='basic'),
    
    # Database connection health check endpoint
    path('database/', views.database_health_check, name='database'),
    
    # External dependencies health check endpoint
    path('dependencies/', views.dependencies_health_check, name='dependencies'),
]