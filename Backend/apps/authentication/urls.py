"""
URLs de autenticación
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ChangePasswordView,
    CSRFTokenView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)

app_name = 'authentication'

urlpatterns = [
    # Autenticación básica
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Gestión de contraseñas
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # CSRF token
    path('csrf-token/', CSRFTokenView.as_view(), name='csrf-token'),
]
