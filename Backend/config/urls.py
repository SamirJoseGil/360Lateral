"""
Configuración de URLs para el proyecto Lateral 360°
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

# Vista simple para la raíz de la API
def api_root(request):
    return JsonResponse({
        'message': 'Bienvenido a la API de Lateral 360°',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'lotes': '/api/lotes/',
            'health': '/api/health/',
            'documentation': '/swagger/',
            'admin': '/admin/',
        }
    })

def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'ok',
        'message': 'Backend Lateral 360° funcionando correctamente',
        'version': '1.0.0'
    })

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API raíz
    path('', api_root, name='api_root'),
    path('api/', api_root, name='api_root_api'),
    
    # Health checks
    path('api/health/', health_check, name='api_health_check'),
    
    # ✅ Documentación API con Spectacular
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Apps URLs
    path('api/auth/', include('apps.users.urls')),
    path('api/lotes/', include('apps.lotes.urls')),
]

# Servir archivos estáticos y media en desarrollo
if settings.DEBUG:
    # Configurar títulos del admin
    admin.site.site_header = "Lateral 360° - Panel de Administración"
    admin.site.site_title = "Lateral 360°"
    admin.site.index_title = "Panel de Control"
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
