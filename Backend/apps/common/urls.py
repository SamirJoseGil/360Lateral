"""
URLs comunes del sistema
"""
from django.urls import path, include

urlpatterns = [
    # Health check básico
    path('', include('apps.health_check.urls')),
]

"""
URLs para la app common
"""
from django.urls import path
from . import views

app_name = 'common'

urlpatterns += [
    path('cors-debug/', views.cors_debug, name='cors_debug'),
]