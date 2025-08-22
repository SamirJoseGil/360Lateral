"""
URLs para la gestión de usuarios
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.UserViewSet, basename='users')

urlpatterns = [
    # Perfil de usuario
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    
    # CRUD de usuarios a través del router
    path('', include(router.urls)),
]