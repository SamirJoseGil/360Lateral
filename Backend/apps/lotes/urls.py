"""
URLs para la aplicación de lotes
"""
from django.urls import path
from . import views

app_name = 'lotes'

urlpatterns = [
    # Scraping MapGIS endpoints
    path('scrap/matricula/', views.scrap_matricula, name='scrap_matricula'),
    path('scrap/direccion/', views.scrap_direccion, name='scrap_direccion'),
    path('scrap/cbml/', views.scrap_cbml, name='scrap_cbml'),
    
    # Nuevo endpoint de restricciones
    path('consultar/restricciones/', views.consultar_restricciones_completas, name='consultar_restricciones'),
    
    # Testing endpoints
    path('test/session/', views.test_mapgis_session, name='test_session'),
    path('test/real-connection/', views.test_mapgis_real_connection, name='test_real_connection'),
    path('test/complete-data/', views.test_mapgis_complete_data, name='test_complete_data'),
    
    # Investigation endpoints
    path('investigate/endpoints/', views.investigate_mapgis_endpoints, name='investigate_endpoints'),
    
    # Health check
    path('health/mapgis/', views.health_mapgis, name='health_mapgis'),
]