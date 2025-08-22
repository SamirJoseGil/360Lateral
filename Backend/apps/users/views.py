"""
Views para la gestión de usuarios
"""
from rest_framework import generics, status, viewsets, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
import logging

from .models import User, UserProfile
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, 
    ChangePasswordSerializer, TokenSerializer, UserProfileSerializer
)

# Importar utilidades si existen
try:
    from apps.common.utils import audit_log, get_client_ip
except ImportError:
    # Si no existe el módulo, crear funciones básicas
    def audit_log(action, user, details=None, ip_address=None):
        pass
    
    def get_client_ip(request):
        return request.META.get('REMOTE_ADDR', 'unknown')

User = get_user_model()
logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """Vista para registro de usuarios"""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Log del registro
        audit_log(
            action='USER_REGISTERED',
            user=user,
            details={'email': user.email},
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'data': {
                'id': str(user.id),
                'email': user.email,
                'name': user.get_full_name()
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Vista personalizada para login"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Log del login
        audit_log(
            action='USER_LOGIN',
            user=user,
            details={'email': user.email},
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'success': True,
            'message': 'Login exitoso',
            'data': {
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'name': user.get_full_name(),
                    'role': user.role
                }
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Vista para logout"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Log del logout
            audit_log(
                action='USER_LOGOUT',
                user=request.user,
                ip_address=get_client_ip(request)
            )
            
            return Response({
                'success': True,
                'message': 'Logout exitoso'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Vista para el usuario actual"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Vista para cambio de contraseña"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Log del cambio de contraseña
        audit_log(
            action='PASSWORD_CHANGED',
            user=request.user,
            ip_address=get_client_ip(request)
        )
        
        return Response({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión completa de usuarios"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar usuarios según rol"""
        user = self.request.user
        if user.is_admin:
            return User.objects.all()
        elif user.is_owner:
            # Los propietarios solo ven su propio perfil
            return User.objects.filter(id=user.id)
        else:
            # Desarrolladores ven usuarios básicos
            return User.objects.filter(role__in=['owner', 'developer'])
    
    def perform_destroy(self, instance):
        """Solo admins pueden eliminar usuarios"""
        if not self.request.user.is_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permisos para eliminar usuarios")
        
        # Log de eliminación
        audit_log(
            action='USER_DELETED',
            user=self.request.user,
            details={'deleted_user': instance.email},
            ip_address=get_client_ip(self.request)
        )
        
        super().perform_destroy(instance)
    
    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """Obtener perfil extendido de usuario"""
        user = self.get_object()
        profile, created = UserProfile.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_profile(self, request, pk=None):
        """Actualizar perfil extendido"""
        user = self.get_object()
        profile, created = UserProfile.objects.get_or_create(user=user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado',
            'data': serializer.data
        })


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """Vista para obtener token CSRF"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        token = get_token(request)
        return JsonResponse({'csrfToken': token})


# Health check específico para usuarios
@api_view(['GET'])
@permission_classes([AllowAny])
def users_health_check(request):
    """Health check para el módulo de usuarios"""
    try:
        users_count = User.objects.count()
        return Response({
            'status': 'ok',
            'module': 'users',
            'users_count': users_count,
            'active_users': User.objects.filter(is_active=True).count()
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'module': 'users',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ✅ Vistas para gestión de usuarios (Admin)
class UserListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear usuarios (Solo Admin)"""
    
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo admins pueden ver todos los usuarios
        if self.request.user.role == 'admin':
            return User.objects.all().order_by('-created_at')
        else:
            # Otros usuarios solo pueden ver su propio perfil
            return User.objects.filter(id=self.request.user.id)

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para detalle, actualización y eliminación de usuario"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Solo admins pueden gestionar otros usuarios
        if self.request.user.role == 'admin':
            return User.objects.all()
        else:
            # Otros usuarios solo pueden gestionar su propio perfil
            return User.objects.filter(id=self.request.user.id)