"""
URLs para la gestión de usuarios
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import UserRequestViewSet

router = DefaultRouter()
router.register(r'requests', UserRequestViewSet)

urlpatterns = [
    # Vista para listar todos los usuarios o crear uno nuevo
    path('', views.user_list_create, name='user-list-create'),
    
    # Debug endpoint para verificar si usuario existe
    path('check/<uuid:user_id>/', views.check_user_exists, name='check-user-exists'),
    
    # Health check para usuarios
    path('health/', views.users_health_check, name='users-health-check'),
    
    # Vista para obtener el usuario actualmente autenticado
    path('me/', views.me, name='user-me'),
    
    # Vista para actualizar perfil del usuario actual
    path('me/update/', views.update_profile, name='user-update-profile'),
    
    # Vista para obtener detalles de un usuario específico - soporta UUID
    path('<uuid:pk>/', views.user_detail, name='user-detail'),

    # User request URLs
    path('', include(router.urls)),
]