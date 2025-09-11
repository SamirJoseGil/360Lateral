"""
URL configuration for Lateral 360° project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import HttpResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

import logging
logger = logging.getLogger(__name__)

# Función de depuración básica
def debug_api_info(request):
    """Vista para información de depuración API."""
    logger.info("DEBUG - API info endpoint accessed")
    return HttpResponse("API Debug Info - Check logs for details")

urlpatterns = [
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
    path('api/common/', include('apps.common.urls')),  # Common consolidado con health checks
    
    # Media files
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    
    # Debug endpoint
    path('api/debug/', debug_api_info),
]

# Static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Logging URLs for debugging
logger.info("DEBUG - URLs loaded successfully")