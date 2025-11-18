"""
URL configuration for Lateral 360° project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import JsonResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

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

# Configuración de Swagger/OpenAPI
schema_view = get_schema_view(
    openapi.Info(
        title="Lateral 360° API",
        default_version='v1',
        description="""
        API RESTful para la plataforma Lateral 360°
        
        Gestión de lotes urbanos, análisis urbanístico y documentación para proyectos inmobiliarios en Medellín.
        
        ## Autenticación
        Usa JWT tokens en el header: `Authorization: Bearer <token>`
        
        ## Módulos
        - **Auth**: Autenticación y registro
        - **Users**: Gestión de usuarios
        - **Lotes**: Gestión de lotes urbanos
        - **POT**: Plan de Ordenamiento Territorial
        - **Documents**: Gestión de documentos
        - **Stats**: Estadísticas y analytics
        """,
        terms_of_service="https://www.lateral360.com/terms/",
        contact=openapi.Contact(email="contact@lateral360.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Ruta raíz para health checks de Docker
    path('', root_health_check, name='root_health_check'),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation - Swagger/ReDoc
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    
    # API routes
    path('api/auth/', include('apps.authentication.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/lotes/', include('apps.lotes.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/solicitudes/', include('apps.solicitudes.urls')),
    path('api/investment-criteria/', include('apps.investment_criteria.urls')),
    
    # Notificaciones
    path('api/notifications/', include('apps.notifications.urls')),
    
    # Health check
    path('health/', include(('apps.common.urls', 'common'), namespace='health')),
    
    # Media files
    re_path(r'^media/(?P<path>.*)$', serve, {
        'document_root': settings.MEDIA_ROOT,
    }),
    
    # Debug endpoint
    path('api/debug/', debug_api_info, name='api_debug'),
]

# Static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Logging para verificar
    logger.info(f"📁 Serving media files from: {settings.MEDIA_ROOT}")
    logger.info(f"🔗 Media URL pattern: {settings.MEDIA_URL}")

# Logging URLs for debugging
logger.info("DEBUG - URLs loaded successfully")