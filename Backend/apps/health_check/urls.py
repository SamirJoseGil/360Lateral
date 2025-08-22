"""
URLs para health check
"""
from django.urls import path
from . import views

app_name = 'health_check'

urlpatterns = [
    path('', views.simple_health_check, name='simple_health_check_root'),
    path('detailed/', views.health_check, name='health_check'),
]