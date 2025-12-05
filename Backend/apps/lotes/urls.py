"""
URLs consolidadas para el módulo de lotes
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LoteListCreateView,
    LoteDetailView,
    LoteAnalysisView,
    AvailableLotesView,
    FavoriteViewSet,
    LoteVerificationView,
    LotePendingVerificationListView,
    listar_tratamientos,
    user_lote_stats,
    manage_lote_developers,
    list_lote_developers,
    list_available_developers,
)

app_name = 'lotes'

router = DefaultRouter()
router.register(r'favorites', FavoriteViewSet, basename='favorite')

urlpatterns = [
    # CRUD de lotes
    path('', LoteListCreateView.as_view(), name='lote-list-create'),
    path('<uuid:pk>/', LoteDetailView.as_view(), name='lote-detail'),
    path('<uuid:pk>/analysis/', LoteAnalysisView.as_view(), name='lote-analysis'),
    path('available/', AvailableLotesView.as_view(), name='available-lotes'),
    
    # Verificación (admin)
    path('pending-verification/', LotePendingVerificationListView.as_view(), name='lote-pending'),
    path('<uuid:pk>/verify/', LoteVerificationView.as_view(), name='lote-verify'),
    
    # Tratamientos
    path('tratamientos/', listar_tratamientos, name='tratamientos-list'),
    
    # Estadísticas
    path('stats/user/<uuid:user_id>/', user_lote_stats, name='user-stats'),
    
    # Router (favoritos)
    path('', include(router.urls)),
    
    # ✅ NUEVO: Gestión de desarrolladores
    path('<uuid:lote_id>/developers/', list_lote_developers, name='lote-developers-list'),
    path('<uuid:lote_id>/developers/manage/', manage_lote_developers, name='lote-developers-manage'),
    path('available-developers/', list_available_developers, name='available-developers'),
]