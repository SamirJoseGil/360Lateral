"""
URLs para la gestión de usuarios
"""
from django.urls import path
from . import views

urlpatterns = [
    # Vista para listar todos los usuarios o crear uno nuevo
    path('', views.user_list_create, name='user-list-create'),
    
    # Vista para obtener detalles de un usuario específico
    path('<int:pk>/', views.user_detail, name='user-detail'),
    
    # Vista para obtener el usuario actualmente autenticado
    path('me/', views.me, name='user-me'),
]