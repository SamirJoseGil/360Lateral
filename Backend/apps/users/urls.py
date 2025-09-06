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
    
    # Vista para obtener detalles de un usuario específico
    path('<int:pk>/', views.user_detail, name='user-detail'),
    
    # Vista para obtener el usuario actualmente autenticado
    path('me/', views.me, name='user-me'),

    # User request URLs
    path('', include(router.urls)),
]