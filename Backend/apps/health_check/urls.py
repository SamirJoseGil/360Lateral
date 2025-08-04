"""
URLs para health check
"""
from django.urls import path
from . import views

app_name = 'health_check'

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('health/simple/', views.simple_health_check, name='simple_health_check'),
    path('', views.simple_health_check, name='simple_health_check_root'),
]