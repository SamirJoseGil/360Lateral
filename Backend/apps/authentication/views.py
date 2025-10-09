"""
Vistas para autenticación - CORREGIDO
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
        try:
            logger.info(f"Registration attempt for email: {request.data.get('email')}")
            
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                logger.error(f"Registration validation errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'message': 'Datos de registro inválidos',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar duplicados explícitamente
            email = serializer.validated_data.get('email')
            if User.objects.filter(email=email).exists():
                logger.warning(f"Registration attempt with duplicate email: {email}")
                return Response({
                    'success': False,
                    'message': 'El correo electrónico ya está registrado',
                    'errors': {'email': ['Ya existe un usuario con este correo electrónico.']}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear usuario
            user = serializer.save()
            logger.info(f"User registered successfully: {user.email} (ID: {user.id})")
            
            # Log del registro
            try:
                audit_log(
                    action='USER_REGISTERED',
                    user=user,
                    details={'email': user.email, 'role': user.role},
                    ip_address=get_client_ip(request)
                )
            except Exception as audit_error:
                logger.warning(f"Audit log failed: {audit_error}")
            
            # Generar tokens
            tokens = TokenSerializer.get_token_for_user(user)
            
            # RESPUESTA CONSISTENTE CON LOGIN
            return Response({
                'success': True,
                'message': 'Usuario registrado exitosamente',
                'data': {
                    'refresh': tokens['refresh'],
                    'access': tokens['access'],
                    'user': tokens['user']
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': 'Error interno del servidor',
                'errors': {'general': 'Por favor, intenta de nuevo más tarde.'}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    """Vista para inicio de sesión - CORREGIDO"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            logger.info(f"Login attempt from IP: {get_client_ip(request)} for email: {request.data.get('email')}")
            
            serializer = LoginSerializer(data=request.data, context={'request': request})
            
            if not serializer.is_valid():
                logger.warning(f"Login validation failed: {serializer.errors}")
                
                # Extraer mensaje de error específico
                error_message = "Credenciales inválidas"
                
                if 'password' in serializer.errors:
                    error_message = serializer.errors['password'][0] if isinstance(serializer.errors['password'], list) else serializer.errors['password']
                elif 'email' in serializer.errors:
                    error_message = serializer.errors['email'][0] if isinstance(serializer.errors['email'], list) else serializer.errors['email']
                elif 'non_field_errors' in serializer.errors:
                    error_message = serializer.errors['non_field_errors'][0] if isinstance(serializer.errors['non_field_errors'], list) else serializer.errors['non_field_errors']
                
                return Response({
                    'success': False,
                    'message': error_message,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.validated_data['user']
            
            # Verificar usuario activo
            if not user.is_active:
                logger.warning(f"Login attempt for inactive user: {user.email}")
                return Response({
                    'success': False,
                    'message': 'Cuenta desactivada. Contacta al administrador.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            logger.info(f"Successful login for user: {user.email} (ID: {user.id})")
            
            # Log del login
            try:
                audit_log(
                    action='USER_LOGIN',
                    user=user,
                    details={'email': user.email},
                    ip_address=get_client_ip(request)
                )
            except Exception as audit_error:
                logger.warning(f"Audit log failed: {audit_error}")
            
            # Generar tokens
            tokens = TokenSerializer.get_token_for_user(user)
            
            # RESPUESTA CONSISTENTE
            return Response({
                'success': True,
                'message': 'Login exitoso',
                'data': {
                    'refresh': tokens['refresh'],
                    'access': tokens['access'],
                    'user': tokens['user']
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': 'Error interno del servidor',
                'errors': {'general': 'Por favor, intenta de nuevo más tarde.'}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
