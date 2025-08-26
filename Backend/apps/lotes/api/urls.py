"""
URLs para las APIs de lotes.
"""
from django.urls import path
from .user_lotes import UserLotesView, my_lotes, user_lote_stats

urlpatterns = [
    # Nuevos endpoints para lotes por usuario
    path('mis-lotes/', my_lotes, name='my-lotes'),
    path('usuario/<int:user_id>/', UserLotesView.as_view(), name='user-lotes'),
    path('usuario/<int:user_id>/stats/', user_lote_stats, name='user-lote-stats'),
]