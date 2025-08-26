"""
URLs para la aplicación de lotes
"""
from django.urls import path

# Importar todas las vistas desde el paquete de vistas
from apps.lotes.views import (
    # CRUD básico de lotes
    lote_list, 
    lote_detail,
    
    # Vistas de MapGIS
    scrap_cbml,
    scrap_matricula,
    scrap_direccion,
    consultar_restricciones_completas,
    health_mapgis,
    
    # Vistas de testing MapGIS
    test_mapgis_session,
    test_mapgis_real_connection,
    test_mapgis_complete_data,
    investigate_mapgis_endpoints,
    
    # Vistas de tratamientos
    listar_tratamientos,
)

# Importar vistas de lotes por usuario
from apps.lotes.api.user_lotes import UserLotesView, my_lotes, user_lote_stats

app_name = 'lotes'

urlpatterns = [
    # Rutas para lotes por usuario
    path('mis-lotes/', my_lotes, name='my-lotes'),
    path('usuario/<int:user_id>/', UserLotesView.as_view(), name='user-lotes'),
    path('usuario/<int:user_id>/stats/', user_lote_stats, name='user-lote-stats'),
    
    # Rutas para CRUD básico de lotes
    path('', lote_list, name='lote-list'),
    path('<int:pk>/', lote_detail, name='lote-detail'),
    
    # Rutas para MapGIS
    path('scrap/cbml/', scrap_cbml, name='scrap-cbml'),
    path('scrap/matricula/', scrap_matricula, name='scrap-matricula'),
    path('scrap/direccion/', scrap_direccion, name='scrap-direccion'),
    path('consultar/restricciones/', consultar_restricciones_completas, name='consultar-restricciones'),
    path('health/mapgis/', health_mapgis, name='health-mapgis'),
    
    # Rutas para pruebas de MapGIS
    path('test/session/', test_mapgis_session, name='test-session'),
    path('test/real-connection/', test_mapgis_real_connection, name='test-real-connection'),
    path('test/complete-data/', test_mapgis_complete_data, name='test-complete-data'),
    path('investigate/endpoints/', investigate_mapgis_endpoints, name='investigate-endpoints'),
    
    # Rutas para tratamientos urbanísticos
    path('tratamientos/', listar_tratamientos, name='listar-tratamientos'),
]