"""
Serializadores para autenticación - CORREGIDO
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuarios"""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="Mínimo 8 caracteres"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Confirmar contraseña"
    )
    
    class Meta:
        model = User
        fields = (
            'email', 'username', 'first_name', 'last_name', 
            'phone', 'company', 'role', 'password', 'password_confirm'
        )
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True},
            'username': {'required': False}  # Username es opcional
        }
    
    def validate_email(self, value):
        """Validar email único"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario con este correo electrónico."
            )
        return value.lower()  # Normalizar a minúsculas
    
    def validate_username(self, value):
        """Validar username único si se proporciona"""
        if value and User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario con este nombre de usuario."
            )
        return value
    
    def validate_password(self, value):
        """Validar contraseña"""
        try:
            validate_password(value)
        except Exception as e:
            raise serializers.ValidationError(str(e))
        return value
    
    def validate(self, attrs):
        """Validación cruzada"""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        
        # Si no se proporciona username, usar el email
        if not attrs.get('username'):
            attrs['username'] = attrs['email'].split('@')[0]
        
        # Remover password_confirm antes de crear el usuario
        attrs.pop('password_confirm', None)
        return attrs
    
    def create(self, validated_data):
        """Crear usuario"""
        try:
            password = validated_data.pop('password')
            
            # Crear usuario con método create_user para hashear password
            user = User.objects.create_user(
                password=password,
                **validated_data
            )
            
            logger.info(f"User created successfully: {user.email} (ID: {user.id})")
            return user
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise serializers.ValidationError({
                'detail': 'Error al crear el usuario. Por favor, intenta de nuevo.'
            })


class LoginSerializer(serializers.Serializer):
    """Serializer para login - CORREGIDO"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        email = attrs.get('email', '').lower()  # Normalizar email
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError({
                'detail': 'Email y contraseña son requeridos.'
            })
        
        # Buscar usuario por email
        try:
            user = User.objects.get(email__iexact=email)
            logger.info(f"User found for email: {email} (ID: {user.id}, username: {user.username})")
        except User.DoesNotExist:
            logger.warning(f"Login attempt for non-existent email: {email}")
            raise serializers.ValidationError({
                'email': 'No existe un usuario con este correo electrónico.'
            })
        
        # CRÍTICO: Verificar la contraseña directamente
        if not user.check_password(password):
            logger.warning(f"Failed password check for user: {email}")
            raise serializers.ValidationError({
                'password': 'Contraseña incorrecta.'
            })
        
        # Verificar que el usuario está activo
        if not user.is_active:
            logger.warning(f"Login attempt for inactive user: {email}")
            raise serializers.ValidationError({
                'detail': 'Esta cuenta está desactivada.'
            })
        
        logger.info(f"Successful authentication for user: {user.email}")
        attrs['user'] = user
        return attrs


class TokenSerializer(serializers.Serializer):
    """Serializer para tokens JWT"""
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    
    def get_user(self, obj):
        """Obtener datos del usuario"""
        user = obj.get('user')
        if user:
            return {
                'id': str(user.id),
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name(),
                'role': user.role,
                'is_verified': getattr(user, 'is_verified', True),
                'phone': getattr(user, 'phone', ''),
                'company': getattr(user, 'company', ''),
            }
        return None
    
    @classmethod
    def get_token_for_user(cls, user):
        """Generar tokens para un usuario"""
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name(),
                'role': user.role,
                'is_verified': getattr(user, 'is_verified', True),
                'phone': getattr(user, 'phone', ''),
                'company': getattr(user, 'company', ''),
            }
        }


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, min_length=8, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate_old_password(self, value):
        """Validar contraseña actual"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Contraseña actual incorrecta.')
        return value
    
    def validate_new_password(self, value):
        """Validar nueva contraseña"""
        try:
            validate_password(value, self.context['request'].user)
        except serializers.ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Validación cruzada"""
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')
        
        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                'new_password_confirm': 'Las contraseñas no coinciden.'
            })
        
        return attrs
    
    def save(self):
        """Cambiar contraseña"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer para solicitud de reset de contraseña"""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer para confirmar reset de contraseña"""
    token = serializers.CharField(required=True)
    password = serializers.CharField(required=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate_password(self, value):
        """Validar nueva contraseña"""
        try:
            validate_password(value)
        except serializers.ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Validación cruzada"""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        
        return attrs