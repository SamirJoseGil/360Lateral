"""
URLs para análisis urbanístico
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'analisis'

router = DefaultRouter()
router.register(r'', views.AnalisisUrbanisticoViewSet, basename='analisis')

urlpatterns = [
    path('', include(router.urls)),
    # ✅ NUEVO: Gestión de parámetros
    path('parametros/', views.parametros_urbanisticos_view, name='parametros-urbanisticos'),
]
