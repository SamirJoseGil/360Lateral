"""
Servicios para autenticación
"""
import logging
from typing import Optional, Tuple
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User

logger = logging.getLogger(__name__)

class AuthService:
    """Servicio para operaciones de autenticación"""
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[User]:
        """
        Autentica un usuario por email y contraseña
        
        Args:
            email: Email del usuario
            password: Contraseña del usuario
            
        Returns:
            User o None si la autenticación falla
        """
        try:
            user = authenticate(username=email, password=password)
            
            if user and user.is_active:
                logger.info(f"User authenticated: {email}")
                return user
            
            logger.warning(f"Authentication failed for: {email}")
            return None
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return None
    
    @staticmethod
    def generate_tokens(user: User) -> Tuple[str, str]:
        """
        Genera tokens JWT para un usuario
        
        Args:
            user: Usuario para generar tokens
            
        Returns:
            Tuple con (access_token, refresh_token)
        """
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token), str(refresh)
    
    @staticmethod
    def create_user(email: str, password: str, **kwargs) -> User:
        """
        Crea un nuevo usuario
        
        Args:
            email: Email del usuario
            password: Contraseña del usuario
            **kwargs: Campos adicionales del usuario
            
        Returns:
            Usuario creado
        """
        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                **kwargs
            )
            
            logger.info(f"User created: {email}")
            return user
            
        except Exception as e:
            logger.error(f"User creation error: {str(e)}")
            raise
