"""
URLs para el módulo común (health checks)
"""
from django.urls import path
from . import views

app_name = 'common'

urlpatterns = [
    path('', views.system_health_check, name='system'),
    path('database/', views.database_health_check, name='database'),
    path('redis/', views.redis_health_check, name='redis'),
]