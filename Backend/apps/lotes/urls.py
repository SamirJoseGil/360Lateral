"""
URLs para la aplicación de lotes
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.lotes.views.lote_views import lote_create_from_mapgis, lote_search
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
    scrap_direccion,
    consultar_restricciones_completas,
    health_mapgis,
    
    # Vistas de tratamientos
    listar_tratamientos,
    
    # Vistas públicas de MapGIS
    PublicCBMLView,
    PublicMatriculaView,
    PublicDireccionView
)

from .views.tratamiento_views import ( 
    obtener_tratamiento_por_cbml,
    actualizar_tratamientos
)

# Importar vistas de lotes por usuario
from .api.user_lotes import UserLotesView, my_lotes, user_lote_stats

app_name = 'lotes'

# Create a router for the favorite viewset
favorites_router = DefaultRouter()
favorites_router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    # Rutas para lotes por usuario
    path('mis-lotes/', my_lotes, name='my-lotes'),
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
    
    # Rutas para MapGIS
    path('scrap/cbml/', scrap_cbml, name='scrap-cbml'),
    path('scrap/matricula/', scrap_matricula, name='scrap-matricula'),
    path('scrap/direccion/', scrap_direccion, name='scrap-direccion'),
    path('consultar/restricciones/', consultar_restricciones_completas, name='consultar-restricciones'),
    path('health/mapgis/', health_mapgis, name='health-mapgis'),
    
    # Rutas para tratamientos urbanísticos
    path('tratamientos/', listar_tratamientos, name='listar-tratamientos'),
    path('tratamientos/por-cbml/', obtener_tratamiento_por_cbml, name='tratamiento-por-cbml'),
    path('tratamientos/actualizar/', actualizar_tratamientos, name='actualizar-tratamientos'),

    # Endpoints públicos para MapGIS - No requieren autenticación
    path('public/cbml/', PublicCBMLView.as_view(), name='public-cbml'),
    path('public/matricula/', PublicMatriculaView.as_view(), name='public-matricula'),
    path('public/direccion/', PublicDireccionView.as_view(), name='public-direccion'),

    # Rutas directas (sin anidamiento adicional) para compatibilidad con el frontend
    path('create/', lote_create, name='lote-create-direct'),
    path('search/', lote_search, name='lote-search-direct'),
    path('<int:pk>/', lote_detail, name='lote-detail-direct'),
    path('<int:pk>/update/', lote_update, name='lote-update-direct'),
    path('<int:pk>/delete/', lote_delete, name='lote-delete-direct'),
    path('create-from-mapgis/', lote_create_from_mapgis, name='lote-create-from-mapgis-direct'),

    # Include favorites endpoints
    path('', include(favorites_router.urls)),
]