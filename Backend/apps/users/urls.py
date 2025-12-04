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
    request_verification_code,
    verify_code,
    resend_verification_code,
    promote_to_admin,
    mark_first_login_completed,
    perfil_inversion,
    ciudades_colombia,
    soft_delete_user,
    admin_statistics,
    listar_perfiles_inversion,
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
    
    # ✅ NUEVO: Verificación
    path('verification/request/', request_verification_code, name='verification-request'),
    path('verification/verify/', verify_code, name='verification-verify'),
    path('verification/resend/', resend_verification_code, name='verification-resend'),
    
    # ✅ NUEVO: Ascender a admin
    path('promote-to-admin/', promote_to_admin, name='promote-to-admin'),
    
    # ✅ NUEVO: Marcar primera sesión completada
    path('first-login-completed/', mark_first_login_completed, name='first-login-completed'),
    
    # ✅ NUEVO: Perfil de inversión
    path('perfil-inversion/', perfil_inversion, name='perfil-inversion'),
    
    # ✅ NUEVO: Endpoint para admin - listar todos los perfiles
    path('perfiles-inversion/', listar_perfiles_inversion, name='listar-perfiles-inversion'),
    
    # ❌ FALTA ESTA RUTA
    # path('ciudades/', views.ciudades_colombia, name='ciudades-colombia'),
    
    # ✅ NUEVO: Soft delete de usuarios
    path('<uuid:user_id>/delete/', soft_delete_user, name='soft-delete-user'),
    
    # ✅ NUEVO: Estadísticas para admin
    path('admin/statistics/', admin_statistics, name='admin-statistics'),
    
    # Include UserRequest routes from router
    path('', include(router.urls)),
]