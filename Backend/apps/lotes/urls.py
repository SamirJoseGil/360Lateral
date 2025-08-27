"""
URLs para la aplicación de lotes
"""
from django.urls import path

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

urlpatterns = [
    # Rutas para lotes por usuario
    path('mis-lotes/', my_lotes, name='my-lotes'),
    path('usuario/<int:user_id>/', UserLotesView.as_view(), name='user-lotes'),
    path('usuario/<int:user_id>/stats/', user_lote_stats, name='user-lote-stats'),
    
    # Rutas para CRUD básico de lotes
    path('lotes/', lote_list, name='lote-list'),
    path('lotes/<int:pk>/', lote_detail, name='lote-detail'),
    path('lotes/create/', lote_create, name='lote-create'),
    path('lotes/<int:pk>/update/', lote_update, name='lote-update'),
    path('lotes/<int:pk>/delete/', lote_delete, name='lote-delete'),
    
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
]