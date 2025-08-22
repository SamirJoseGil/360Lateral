"""
Vistas para autenticación
"""
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
import logging

from .serializers import (
    RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
    TokenSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from .services import PasswordResetService

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
        
        # Generar tokens
        tokens = TokenSerializer.get_token_for_user(user)
        
        return Response({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'data': tokens
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Vista para inicio de sesión"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Log del login
        audit_log(
            action='USER_LOGIN',
            user=user,
            details={'email': user.email},
            ip_address=get_client_ip(request)
        )
        
        # Generar tokens
        tokens = TokenSerializer.get_token_for_user(user)
        
        # Agregar log temporal para ver qué se envía realmente
        logger.info(f"FRONTEND RESPONSE: {tokens}")
        
        return Response({
            'success': True,
            'message': 'Login exitoso',
            'data': tokens
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Vista para cierre de sesión"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
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


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    """Vista para obtener token CSRF"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        token = get_token(request)
        return JsonResponse({'csrfToken': token})


class PasswordResetRequestView(APIView):
    """Vista para solicitar restablecimiento de contraseña"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        reset_service = PasswordResetService()
        success = reset_service.send_password_reset_email(email)
        
        # No revelamos si el email existe o no
        return Response({
            'success': True,
            'message': 'Si el correo electrónico existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Vista para confirmar restablecimiento de contraseña"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        
        reset_service = PasswordResetService()
        success = reset_service.reset_password_with_token(token, password)
        
        if not success:
            return Response({
                'success': False,
                'message': 'Token inválido o expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': 'Contraseña restablecida exitosamente'
        }, status=status.HTTP_200_OK)
