from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .simple_auth import simple_login, simple_register

# Router para ViewSets
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')

# Nombres de app para evitar conflictos
app_name = 'app'

urlpatterns = [
    # AUTH SIMPLE para debugging (SIN DRF)
    path('simple/login/', simple_login, name='simple-login'),
    path('simple/register/', simple_register, name='simple-register'),
    
    # Autenticación con DRF
    path('auth/register/', views.AuthViewSet.as_view({'post': 'register'}), name='auth-register'),
    path('auth/login/', views.AuthViewSet.as_view({'post': 'login'}), name='auth-login'),
    path('auth/logout/', views.AuthViewSet.as_view({'post': 'logout'}), name='auth-logout'),
    path('auth/users/me/', views.AuthViewSet.as_view({'get': 'me'}), name='auth-me'),
    path('auth/change-password/', views.AuthViewSet.as_view({'post': 'change_password'}), name='auth-change-password'),
    
    # JWT token refresh (solo una vez)
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Usuarios y otros endpoints
    path('', include(router.urls)),
]