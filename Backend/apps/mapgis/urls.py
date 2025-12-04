"""
URLs del módulo MapGIS
"""
from django.urls import path
from . import views

app_name = 'mapgis'

urlpatterns = [
    # Consulta completa por CBML
    path('consulta/cbml/<str:cbml>/', views.consulta_cbml, name='consulta_cbml'),
    
    # Health check (público)
    path('health/', views.health_check, name='health'),
]
