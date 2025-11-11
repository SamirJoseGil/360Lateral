"""
Serializadores para autenticación
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from apps.users.models import User
import logging

logger = logging.getLogger(__name__)


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuarios"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate_email(self, value):
        """Normalizar email a minúsculas"""
        return value.lower().strip()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone', 'company'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True},
            'company': {'required': False},  # Hacer que la empresa sea opcional
        }
    
    def validate_email(self, value):
        """Validar email único"""
        email = value.lower().strip()
        
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                f"Ya existe un usuario registrado con el email: {email}"
            )
        
        return email
    
    def validate_username(self, value):
        """Validar username único"""
        username = value.strip()
        
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError(
                f"El nombre de usuario '{username}' ya está en uso"
            )
        
        return username
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Crear usuario con contraseña encriptada"""
        # Remover password_confirm
        validated_data.pop('password_confirm')
        
        # Extraer password
        password = validated_data.pop('password')
        
        # Handle company field - map to company_name if that's what the model expects
        company_value = validated_data.pop('company', '') or ''
        
        # Create user without triggering full_clean initially
        user = User(
            **validated_data
        )
        
        # Set the company_name field if it exists in the model
        if hasattr(user, 'company_name'):
            user.company_name = company_value
        elif hasattr(user, 'company'):
            user.company = company_value
        
        # Set password
        user.set_password(password)
        
        # Add flag to skip company validation
        user._skip_company_validation = True
        
        # Save without full_clean to avoid validation
        user.save(update_fields=None)
        
        logger.info(f"New user registered: {user.email} (role: {user.role})")
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    
    def validate_current_password(self, value):
        """Validar que la contraseña actual sea correcta"""
        user = self.context['request'].user
        
        if not user.check_password(value):
            raise serializers.ValidationError('Contraseña actual incorrecta')
        
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer para solicitud de reset de contraseña"""
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Normalizar email"""
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer para confirmar reset de contraseña"""
    token = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(
        required=True,
        write_only=True
    )
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        return attrs