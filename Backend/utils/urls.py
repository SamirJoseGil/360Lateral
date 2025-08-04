"""
URLs para utilidades del sistema
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.health_check, name='health_check'),
    path('simple/', views.simple_health, name='simple_health'),
]
