"""
URLs para las estadísticas de la aplicación
"""
from django.urls import path
from .views import (
    get_general_stats,
    get_user_stats,
    get_document_stats,
    get_lotes_stats
)

app_name = 'stats'

urlpatterns = [
    path('general/', get_general_stats, name='general_stats'),
    path('users/', get_user_stats, name='user_stats'),
    path('documents/', get_document_stats, name='document_stats'),
    path('lotes/', get_lotes_stats, name='lote_stats'),
]
