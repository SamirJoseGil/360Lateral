"""
URLs para la aplicación de lotes - Optimizado y sin duplicaciones
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.favorites_views import FavoriteViewSet

# Importamos todas las vistas desde el módulo principal
from .views import (
    # Vistas de lotes
    lote_list, 
    lote_detail,
    lote_create,
    lote_update,
    lote_delete,
    
    # Vistas de MapGIS
    scrap_cbml,
    scrap_matricula,
    consultar_restricciones_completas,
    health_mapgis,
    
    # Vistas de tratamientos
    listar_tratamientos,
    
    # Vistas públicas de MapGIS - CORREGIDO
    PublicCBMLView,
    PublicMatriculaView,
    
    # Vistas de usuarios
    UserLotesView,
    my_lotes,
    user_lote_stats
)

# Importar vistas específicas que no están en __init__.py
from .views.lotes_views import lote_create_from_mapgis, lote_search
from .views.tratamientos_views import (
    calcular_aprovechamiento,
    obtener_tratamiento_por_cbml
)

# Importar vistas de verificación
from .views.verification_views import (
    verify_lote,
    reject_lote,
    archive_lote,
    reactivate_lote,
    lotes_pending_verification
)

# Importar vista de lotes disponibles
from .views.public_lotes import available_lotes

app_name = 'lotes'

# Router para favoritos
favorites_router = DefaultRouter()
favorites_router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    # ✅ CORREGIDO: Cambiar de 'lotes/' a 'my-lotes/'
    path('my-lotes/', my_lotes, name='my-lotes'),
    path('usuario/<int:user_id>/', UserLotesView.as_view(), name='user-lotes'),
    path('usuario/<int:user_id>/stats/', user_lote_stats, name='user-lote-stats'),

    # Rutas para CRUD básico de lotes
    path('', lote_list, name='lote-list'),
    path('<int:pk>/', lote_detail, name='lote-detail'),
    path('create/', lote_create, name='lote-create'),
    path('create-from-mapgis/', lote_create_from_mapgis, name='lote-create-from-mapgis'),
    path('search/', lote_search, name='lote-search'),
    path('<int:pk>/update/', lote_update, name='lote-update'),
    path('<int:pk>/delete/', lote_delete, name='lote-delete'),
    
    # ✅ NUEVO: Agregar endpoint de stats
    path('stats/', user_lote_stats, name='lotes-stats'),
    
    # Rutas para MapGIS
    path('scrap/cbml/', scrap_cbml, name='scrap-cbml'),
    path('scrap/matricula/', scrap_matricula, name='scrap-matricula'),
    
    # Rutas para tratamientos urbanísticos
    path('tratamientos/', listar_tratamientos, name='listar-tratamientos'),
    path('tratamientos/por-cbml/', obtener_tratamiento_por_cbml, name='tratamiento-por-cbml'),
    path('tratamientos/calcular/', calcular_aprovechamiento, name='calcular-aprovechamiento'),

    # Endpoints públicos para MapGIS - CORREGIDO (sin dirección)
    path('public/cbml/', PublicCBMLView.as_view(), name='public-cbml'),
    path('public/matricula/', PublicMatriculaView.as_view(), name='public-matricula'),

    # Rutas de verificación administrativa
    path('<int:pk>/verify/', verify_lote, name='verify-lote'),
    path('<int:pk>/reject/', reject_lote, name='reject-lote'),
    path('<int:pk>/archive/', archive_lote, name='archive-lote'),
    path('<int:pk>/reactivate/', reactivate_lote, name='reactivate-lote'),
    path('pending-verification/', lotes_pending_verification, name='pending-verification'),

    # Endpoint para lotes disponibles (developers)
    path('available/', available_lotes, name='available-lotes'),

    # Include favorites endpoints
    path('', include(favorites_router.urls)),
]