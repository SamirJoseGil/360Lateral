from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
import re

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuarios con validaciones de seguridad"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'company'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'username': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        """Validar email único y formato"""
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value
    
    def validate_username(self, value):
        """Validar username único y caracteres seguros"""
        value = value.lower().strip()
        
        # Solo permitir letras, números y guiones
        if not re.match(r'^[a-zA-Z0-9_-]+$', value):
            raise serializers.ValidationError(
                "El username solo puede contener letras, números, guiones y guiones bajos"
            )
        
        if len(value) < 3:
            raise serializers.ValidationError("El username debe tener al menos 3 caracteres")
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este username ya está en uso")
        
        return value
    
    def validate_phone(self, value):
        """Validar formato de teléfono si se proporciona"""
        if value:
            # Permitir formatos comunes de teléfono
            phone_pattern = r'^[\+]?[1-9][\d\s\-\(\)]{7,15}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError("Formato de teléfono inválido")
        return value
    
    def validate(self, data):
        """Validaciones cruzadas"""
        # Verificar que las contraseñas coincidan
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        return data
    
    def create(self, validated_data):
        """Crear usuario de forma segura"""
        validated_data.pop('password_confirm')
        
        # Normalizar datos
        validated_data['email'] = validated_data['email'].lower().strip()
        validated_data['username'] = validated_data['username'].lower().strip()
        
        # Crear usuario
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer para datos de usuario con campos filtrados"""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'phone', 'company', 'role', 'date_joined', 
            'is_active'
        )
        read_only_fields = ('id', 'email', 'username', 'date_joined', 'role')
    
    def get_full_name(self, obj):
        """Obtener nombre completo"""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def to_representation(self, instance):
        """Filtrar campos según permisos"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            # Si no es admin y no es el mismo usuario, limitar campos
            if not (hasattr(request.user, 'role') and request.user.role == 'admin') and \
               instance != request.user:
                # Solo mostrar campos básicos
                limited_fields = ['id', 'first_name', 'last_name', 'full_name', 'company']
                data = {key: data[key] for key in limited_fields if key in data}
        
        return data


class LoginSerializer(serializers.Serializer):
    """Serializer para login con validaciones de seguridad"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)
    
    def validate_email(self, value):
        """Normalizar email"""
        return value.lower().strip()
    
    def validate(self, data):
        """Validar credenciales"""
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            # Intentar autenticar
            user = authenticate(username=email, password=password)
            
            if user:
                if user.is_active:
                    data['user'] = user
                    return data
                else:
                    raise serializers.ValidationError(
                        "Esta cuenta está desactivada. Contacte al administrador."
                    )
            else:
                raise serializers.ValidationError(
                    "Email o contraseña incorrectos"
                )
        else:
            raise serializers.ValidationError(
                "Email y contraseña son requeridos"
            )
        
        return data


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña seguro"""
    
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate_current_password(self, value):
        """Validar contraseña actual"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta")
        return value
    
    def validate(self, data):
        """Validaciones cruzadas"""
        # Verificar que las nuevas contraseñas coincidan
        if data.get('new_password') != data.get('new_password_confirm'):
            raise serializers.ValidationError({
                'new_password_confirm': 'Las nuevas contraseñas no coinciden'
            })
        
        # Verificar que la nueva contraseña sea diferente
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if current_password == new_password:
            raise serializers.ValidationError({
                'new_password': 'La nueva contraseña debe ser diferente a la actual'
            })
        
        return data
    
    def save(self):
        """Cambiar contraseña de forma segura"""
        user = self.context['request'].user
        new_password = self.validated_data['new_password']
        
        user.set_password(new_password)
        user.save()
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualización de perfil de usuario"""
    
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone', 'company')
    
    def validate_phone(self, value):
        """Validar formato de teléfono si se proporciona"""
        if value:
            phone_pattern = r'^[\+]?[1-9][\d\s\-\(\)]{7,15}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError("Formato de teléfono inválido")
        return value
    
    def update(self, instance, validated_data):
        """Actualizar usuario con validaciones"""
        # Solo permitir actualizar ciertos campos para usuarios no admin
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            # Si no es admin y no es el mismo usuario, denegar
            if not (hasattr(request.user, 'role') and request.user.role == 'admin') and \
               instance != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("No tienes permisos para modificar este usuario")
        
        return super().update(instance, validated_data)


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer completo para administradores"""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'phone', 'company', 'role', 'is_active',
            'is_staff', 'is_superuser', 'date_joined', 'last_login'
        )
        read_only_fields = ('id', 'date_joined', 'last_login')
    
    def get_full_name(self, obj):
        """Obtener nombre completo"""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def validate_role(self, value):
        """Validar cambios de rol"""
        request = self.context.get('request')
        
        # Solo admin puede cambiar roles
        if request and request.user.is_authenticated:
            if not (hasattr(request.user, 'role') and request.user.role == 'admin'):
                raise serializers.ValidationError(
                    "Solo los administradores pueden cambiar roles de usuario"
                )
        
        return value