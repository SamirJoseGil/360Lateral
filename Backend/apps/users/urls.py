"""
URLs para la app de usuarios
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views  # ✅ Agregar esta importación que faltaba
from .views import (
    UserViewSet, 
    LoginView, 
    LogoutView, 
    RegisterView,
    UserProfileViewSet,
    CurrentUserView,
    ChangePasswordView,
    UserListCreateView,
    UserDetailView,
    CSRFTokenView,  # ✅ Importar CSRFTokenView explícitamente
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'profiles', UserProfileViewSet, basename='profiles')

urlpatterns = [
    # ✅ Endpoint para CSRF token
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),

    # ViewSets con router
    path('', include(router.urls)),
    
    # Vistas de autenticación
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),

    # Autenticación JWT
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Usuario actual
    path('users/me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Gestión de usuarios (Admin)
    path('users/', UserListCreateView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]
