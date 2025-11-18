"""
URLs para la aplicación de usuarios
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UserListCreateView,
    UserDetailView,
    UserRequestViewSet,
    me,
    update_profile,
    users_health_check,
    check_user_exists,
    request_password_reset,
    verify_reset_token,
    confirm_password_reset,
    check_email_exists,
    check_phone_exists,
)

app_name = 'users'

# Router para UserRequest ViewSet
router = DefaultRouter()
router.register(r'requests', UserRequestViewSet, basename='userrequest')

urlpatterns = [
    # Rutas de usuarios
    path('', UserListCreateView.as_view(), name='user-list-create'),
    path('<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
    
    # Ruta para usuario actual
    path('me/', me, name='user-me'),
    path('me/update/', update_profile, name='user-update-profile'),
    
    # Health check
    path('health/', users_health_check, name='users-health-check'),
    
    # Debug endpoint
    path('check/<uuid:user_id>/', check_user_exists, name='check-user-exists'),
    
    # ✅ NUEVO: Recuperación de contraseña
    path('password-reset/request/', request_password_reset, name='password-reset-request'),
    path('password-reset/verify-token/', verify_reset_token, name='password-reset-verify'),
    path('password-reset/confirm/', confirm_password_reset, name='password-reset-confirm'),
    
    # ✅ NUEVO: Validación de duplicados
    path('check-email/', check_email_exists, name='check-email-exists'),
    path('check-phone/', check_phone_exists, name='check-phone-exists'),
    
    # Include UserRequest routes from router
    path('', include(router.urls)),
]