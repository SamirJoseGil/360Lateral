"""
URL configuration for Lateral 360° project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Configuración de Swagger/OpenAPI
schema_view = get_schema_view(
    openapi.Info(
        title="Lateral 360° API",
        default_version='v1',
        description="""
        API REST para la gestión de lotes inmobiliarios, usuarios y documentos.
        
        ## Funcionalidades principales:
        - 🔐 **Autenticación JWT** con roles (admin, owner, developer)
        - 👥 **Gestión de usuarios** con perfiles extendidos
        - 🏗️ **Gestión de lotes** inmobiliarios
        - 📄 **Gestión de documentos** (contratos, planos, escrituras)
        - 🗺️ **Integración MapGIS** Medellín para consultas de predios
        - 📊 **Tratamientos POT** y cálculos urbanísticos
        - 🏠 **VIS** (Vivienda de Interés Social)
        
        ## Autenticación:
        Para usar la API, primero obtén un token JWT:
        1. Registrate en `/api/auth/register/`
        2. Inicia sesión en `/api/auth/login/`
        3. Usa el token en el header: `Authorization: Bearer <token>`
        """,
        terms_of_service="https://lateral360.com/terms/",
        contact=openapi.Contact(email="api@lateral360.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
    authentication_classes=[],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation - Swagger/OpenAPI
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'), # type: ignore
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'), # type: ignore
    path('api/schema/', schema_view.without_ui(cache_timeout=0), name='schema-json'), # type: ignore
    
    # API routes - Rutas corregidas
    path('api/auth/', include('apps.authentication.urls')),  # Usar apps.authentication.urls para rutas de auth
    path('api/users/', include('apps.users.urls')),
    path('api/lotes/', include('apps.lotes.urls')),
    path('api/documentos/', include('apps.documents.urls')),
    path('api/stats/', include('apps.stats.urls')),
    
    # Health check
    path('health/', include('apps.health_check.urls')),
]

# Static and media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)