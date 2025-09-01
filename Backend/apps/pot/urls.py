"""
URLs para la aplicación POT
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
    path('importar/', views.importar_tratamientos_json, name='importar-tratamientos'),
    path('crear/', views.crear_tratamiento_pot, name='crear-tratamiento'),
    path('normativa/cbml/', views.consultar_normativa_por_cbml, name='normativa-cbml'),
]