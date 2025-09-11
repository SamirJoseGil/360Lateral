"""
URLs para la aplicación POT - Optimizado
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

# Configurar router para ViewSets
router = DefaultRouter()
router.register(r'tratamientos', views.TratamientoPOTViewSet)

urlpatterns = [
    # Rutas generadas por el router
    path('', include(router.urls)),
    
    # Rutas personalizadas
    path('lista/', views.listar_tratamientos_pot, name='listar-tratamientos'),
    path('detalle/<str:codigo>/', views.detalle_tratamiento_pot, name='detalle-tratamiento'),
    path('crear/', views.crear_tratamiento_pot, name='crear-tratamiento'),
    path('importar/', views.importar_tratamientos_json, name='importar-tratamientos'),
    
    # Rutas de consulta
    path('normativa/cbml/', views.consultar_normativa_por_cbml, name='normativa-cbml'),
    path('aprovechamiento/calcular/', views.calcular_aprovechamiento_pot, name='calcular-aprovechamiento'),
    
    # Rutas utilitarias
    path('tipos-vivienda/', views.obtener_tipos_vivienda, name='tipos-vivienda'),
    path('health/', views.health_check_pot, name='health-check'),
]