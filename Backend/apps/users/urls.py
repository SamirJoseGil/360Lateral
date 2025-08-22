"""
URLs para la gestión de usuarios
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='users')

urlpatterns = [
    # Endpoints de autenticación
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/users/me/', views.CurrentUserView.as_view(), name='current_user'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # Token CSRF
    path('csrf/', views.CSRFTokenView.as_view(), name='csrf_token'),
    
    # CRUD de usuarios a través del router
    path('', include(router.urls)),
]