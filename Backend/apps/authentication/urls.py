"""
URLs para autenticación
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    login_view,
    register_view,
    logout_view,
    me_view,
    change_password_view,
    password_reset_request_view,
    password_reset_confirm_view,
)

app_name = 'authentication'

urlpatterns = [
    # Auth endpoints
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('logout/', logout_view, name='logout'),
    path('me/', me_view, name='me'),
    
    # Password management
    path('change-password/', change_password_view, name='change-password'),
    path('password-reset/', password_reset_request_view, name='password-reset'),
    path('password-reset/confirm/', password_reset_confirm_view, name='password-reset-confirm'),
    
    # JWT token management
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
]
