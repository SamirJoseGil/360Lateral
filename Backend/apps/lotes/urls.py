"""
URLs para el módulo de lotes
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.lotes_views import (
    LoteListCreateView,
    LoteDetailView,
    LoteMapGISSearchView,
    LoteAnalysisView,
    AvailableLotesView  # ✅ Agregar import
)
from .views.favorites_views import FavoriteViewSet
from .views.public_mapgis_views import (
    PublicMapGISCBMLView,
    PublicMapGISMatriculaView,
    PublicMapGISDireccionView
)
from .views.verification_views import (
    LoteVerificationView,
    LotePendingVerificationListView
)

app_name = 'lotes'

# Router para ViewSets
router = DefaultRouter()
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    # ✅ CRÍTICO: Verificación de lotes - CORREGIR ORDEN DE RUTAS
    # Las rutas específicas DEBEN ir ANTES de las rutas con parámetros genéricos
    path('pending-verification/', LotePendingVerificationListView.as_view(), name='lote-pending'),
    
    # Rutas principales de lotes (autenticadas)
    path('', LoteListCreateView.as_view(), name='lote-list-create'),
    path('<uuid:pk>/', LoteDetailView.as_view(), name='lote-detail'),
    path('<uuid:pk>/analysis/', LoteAnalysisView.as_view(), name='lote-analysis'),
    path('<uuid:pk>/verify/', LoteVerificationView.as_view(), name='lote-verify'),  # ✅ Ruta específica
    
    # ✅ CRÍTICO: Agregar endpoint para lotes disponibles (developers)
    path('available/', AvailableLotesView.as_view(), name='available-lotes'),
    
    # Búsqueda MapGIS (autenticada)
    path('mapgis/search/', LoteMapGISSearchView.as_view(), name='lote-mapgis-search'),
    
    # Endpoints públicos de MapGIS (sin autenticación)
    path('public/cbml/', PublicMapGISCBMLView.as_view(), name='public-mapgis-cbml'),
    path('public/matricula/', PublicMapGISMatriculaView.as_view(), name='public-mapgis-matricula'),
    path('public/direccion/', PublicMapGISDireccionView.as_view(), name='public-mapgis-direccion'),
    
    # Include router URLs
    path('', include(router.urls)),
]