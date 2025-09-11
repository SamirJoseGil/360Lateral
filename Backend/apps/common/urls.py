"""
URLs comunes del sistema - Optimizado
"""
from django.urls import path
from . import views

app_name = 'common'

urlpatterns = [
    # Health checks
    path('health/', views.health_check, name='health_check'),
    path('health/simple/', views.simple_health_check, name='simple_health_check'),
    path('health/database/', views.database_health_check, name='database_health_check'),
    path('health/cache/', views.cache_health_check, name='cache_health_check'),
    
    # System info
    path('version/', views.version_info, name='version_info'),
    path('status/', views.system_status, name='system_status'),
    
    # Debug utilities
    path('cors-debug/', views.cors_debug, name='cors_debug'),
]