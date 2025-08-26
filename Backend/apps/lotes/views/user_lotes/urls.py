"""
URLs para gestionar lotes por usuario.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserLotesView.as_view(), name='user-lotes'),
    path('stats/', views.UserLoteStatsView.as_view(), name='user-lote-stats'),
]