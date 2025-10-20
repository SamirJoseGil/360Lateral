"""
Vistas para autenticación JWT
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
import logging

User = get_user_model()

from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

from apps.users.serializers import UserSerializer  # Importar UserSerializer

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login de usuario con JWT
    
    Request body:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    logger.info("=" * 60)
    logger.info("🔐 LOGIN REQUEST RECEIVED")
    logger.info(f"   Remote Address: {request.META.get('REMOTE_ADDR')}")
    logger.info(f"   Origin: {request.META.get('HTTP_ORIGIN', 'No origin')}")
    logger.info(f"   User-Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')}")
    logger.info(f"   Content-Type: {request.META.get('CONTENT_TYPE')}")
    logger.info("=" * 60)
    
    try:
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"❌ Invalid login data: {serializer.errors}")
            return Response({
                'success': False,
                'message': 'Datos de login inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower().strip()
        password = serializer.validated_data['password']
        
        logger.info(f"🔍 Attempting login for: {email}")
        
        # Buscar usuario por email
        try:
            user = User.objects.get(email=email)
            logger.info(f"✅ User found: {email} (role: {user.role}, active: {user.is_active})")
        except User.DoesNotExist:
            logger.warning(f"❌ Failed login: User not found - {email}")
            return Response({
                'success': False,
                'message': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verificar contraseña
        if not user.check_password(password):
            logger.warning(f"❌ Failed login: Invalid password for {email}")
            return Response({
                'success': False,
                'message': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verificar que el usuario esté activo
        if not user.is_active:
            logger.warning(f"❌ Login attempt for inactive user: {email}")
            return Response({
                'success': False,
                'message': 'Usuario inactivo'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"✅ Successful login: {user.email} (role: {user.role})")
        logger.info("   Tokens generated successfully")
        
        # Preparar datos del usuario
        user_data = {
            'id': str(user.id),
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_verified': getattr(user, 'is_verified', True),
            'is_active': user.is_active,
        }
        
        logger.info(f"📦 Response data prepared for user: {email}")
        logger.info("=" * 60)
        
        return Response({
            'success': True,
            'message': 'Login exitoso',
            'data': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_data
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"💥 Login error: {str(e)}", exc_info=True)
        logger.error("=" * 60)
        return Response({
            'success': False,
            'message': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Registro de nuevo usuario
    
    Request body:
    {
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "SecurePassword123!",
        "password_confirm": "SecurePassword123!",
        "first_name": "John",
        "last_name": "Doe",
        "role": "owner",
        "phone": "+57 300 123 4567",
        "company": "Example Corp"
    }
    """
    try:
        serializer = RegisterSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Datos de registro inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear usuario
        user = serializer.save()
        
        # Generar tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"New user registered: {user.email}")
        
        return Response({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'data': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error interno del servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout de usuario
    Invalida el refresh token
    
    Request body:
    {
        "refresh": "refresh_token_here"
    }
    """
    try:
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'success': False,
                'message': 'Refresh token requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Blacklist the refresh token
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        logger.info(f"User logged out: {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error al cerrar sesión'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Obtener información del usuario actual
    """
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Cambiar contraseña del usuario actual
    
    Request body:
    {
        "current_password": "OldPassword123!",
        "new_password": "NewPassword123!"
    }
    """
    try:
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Datos inválidos',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cambiar contraseña
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        logger.info(f"Password changed for user: {user.email}")
        
        return Response({
            'success': True,
            'message': 'Contraseña actualizada exitosamente'
        })
        
    except Exception as e:
        logger.error(f"Password change error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error al cambiar contraseña'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    """
    Solicitar reset de contraseña
    
    Request body:
    {
        "email": "user@example.com"
    }
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Email inválido',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    # TODO: Implementar envío de email con token de reset
    logger.info(f"Password reset requested for: {email}")
    
    return Response({
        'success': True,
        'message': 'Si el email existe, recibirás instrucciones para resetear tu contraseña'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_view(request):
    """
    Confirmar reset de contraseña con token
    
    Request body:
    {
        "token": "reset_token_here",
        "password": "NewPassword123!",
        "password_confirm": "NewPassword123!"
    }
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Datos inválidos',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # TODO: Implementar verificación de token y reset de contraseña
    
    return Response({
        'success': True,
        'message': 'Contraseña reseteada exitosamente'
    })
