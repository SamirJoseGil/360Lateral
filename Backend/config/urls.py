"""
Configuración de URLs para el proyecto Lateral 360°
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Vista simple para la raíz de la API
def api_root(request):
    return JsonResponse({
        'message': 'Bienvenido a la API de Lateral 360°',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'health': '/api/health/',
            'documentation': '/swagger/',
            'admin': '/admin/',
        }
    })

# Configuración de Swagger
schema_view = get_schema_view(
   openapi.Info(
      title="Lateral 360° API",
      default_version='v1',
      description="API REST para la plataforma de gestión de lotes inmobiliarios",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@lateral360.local"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API raíz
    path('', api_root, name='api_root'),
    path('api/', api_root, name='api_root_api'),
    
    # Health checks
    path('api/health/', include('utils.urls')),
    
    # Autenticación y usuarios
    path('api/auth/', include('apps.users.urls')),
    
    # Documentación API
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Servir archivos estáticos y media en desarrollo
if settings.DEBUG:
    # Configurar títulos del admin
    admin.site.site_header = "Lateral 360° - Panel de Administración"
    admin.site.site_title = "Lateral 360°"
    admin.site.index_title = "Panel de Control"
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
