"""
URL configuration for Lateral 360° project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

import logging
logger = logging.getLogger(__name__)

# Vista raíz para health checks de Docker
def root_health_check(request):
    """Vista simple para la ruta raíz - health check de Docker."""
    logger.info("Root health check accessed")
    return JsonResponse({
        'status': 'healthy',
        'service': 'lateral360-backend',
        'message': 'Lateral 360° Backend API is running',
        'version': '1.0.0',
        'docs': '/api/docs/'
    })

# Función de depuración básica
def debug_api_info(request):
    """Vista para información de depuración API."""
    logger.info("DEBUG - API info endpoint accessed")
    return JsonResponse({
        'message': 'API Debug Info',
        'available_endpoints': [
            '/',
            '/api/auth/',
            '/api/users/',
            '/api/lotes/',
            '/api/stats/',
            '/api/pot/',
            '/api/documents/',
            '/api/common/',
            '/api/docs/',
            '/admin/'
        ]
    })

urlpatterns = [
    # Ruta raíz para health checks de Docker
    path('', root_health_check, name='root_health_check'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation - Spectacular
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API routes
    path('api/auth/', include('apps.authentication.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/lotes/', include('apps.lotes.urls')),
    path('api/stats/', include('apps.stats.urls')),
    path('api/pot/', include('apps.pot.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/common/', include('apps.common.urls')),
    
    # Health check alternativo
    path('health/', include('apps.common.urls')),
    
    # Media files
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    
    # Debug endpoint
    path('api/debug/', debug_api_info, name='api_debug'),
]

# Static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Logging URLs for debugging
logger.info("DEBUG - URLs loaded successfully")