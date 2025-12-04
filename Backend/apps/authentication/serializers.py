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
    
    # ✅ CRÍTICO: allow_null=True y allow_blank=True
    developer_type = serializers.ChoiceField(
        choices=User.DEVELOPER_TYPE_CHOICES,
        required=False,
        allow_null=True,
        allow_blank=True
    )
    
    person_type = serializers.ChoiceField(
        choices=User.PERSON_TYPE_CHOICES,
        required=False,
        allow_null=True,
        allow_blank=True
    )
    
    legal_name = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,  # ✅ Permitir None
        max_length=255
    )
    
    # ✅ CRÍTICO: Los mismos parámetros para document_type y document_number
    document_type = serializers.ChoiceField(
        choices=User.DOCUMENT_TYPE_CHOICES,
        required=False,
        allow_null=True,
        allow_blank=True
    )
    
    document_number = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=20
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone',
            'developer_type', 'person_type', 'legal_name',
            'document_type', 'document_number'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True},
            # ✅ NUEVO: Username opcional
            'username': {
                'required': False,
                'allow_blank': True,
                'help_text': 'Opcional - Se genera automáticamente si no se proporciona'
            },
        }
    
    def validate_username(self, value):
        """
        ✅ NUEVO: Validar username único solo si se proporciona
        """
        if value:
            # Limpiar username
            value = value.strip()
            
            # Verificar si ya existe (case-insensitive)
            if User.objects.filter(username__iexact=value).exists():
                raise serializers.ValidationError('Ya existe un usuario con este nombre.')
        
        return value
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan y campos según rol"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden'
            })
        
        # ✅ CRÍTICO: Validaciones SOLO para developers
        role = attrs.get('role')
        if role == 'developer':
            # ✅ NUEVO: Log de depuración
            logger.info(f"🔍 Validating developer fields:")
            logger.info(f"  - developer_type: {attrs.get('developer_type')}")
            logger.info(f"  - person_type: {attrs.get('person_type')}")
            logger.info(f"  - document_type: {attrs.get('document_type')}")
            logger.info(f"  - document_number: {attrs.get('document_number')}")
            
            # Validar campos obligatorios
            if not attrs.get('developer_type'):
                raise serializers.ValidationError({
                    'developer_type': 'El tipo de desarrollador es obligatorio'
                })
            
            if not attrs.get('person_type'):
                raise serializers.ValidationError({
                    'person_type': 'El tipo de persona es obligatorio'
                })
            
            person_type = attrs.get('person_type')
            document_type = attrs.get('document_type')
            
            # legal_name solo obligatorio para jurídica
            if person_type == 'juridica':
                if document_type != 'NIT':
                    raise serializers.ValidationError({
                        'document_type': 'Personas jurídicas deben usar NIT'
                    })
                
                if not attrs.get('legal_name'):
                    raise serializers.ValidationError({
                        'legal_name': 'El nombre de la empresa es obligatorio'
                    })
            
            if person_type == 'natural' and document_type == 'NIT':
                raise serializers.ValidationError({
                    'document_type': 'Personas naturales no pueden usar NIT'
                })
            
            if not attrs.get('document_number'):
                raise serializers.ValidationError({
                    'document_number': 'El número de documento es obligatorio'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Crear usuario con contraseña encriptada"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # ✅ NUEVO: Si es persona natural, usar first_name + last_name como legal_name
        if validated_data.get('role') == 'developer' and validated_data.get('person_type') == 'natural':
            if not validated_data.get('legal_name'):
                validated_data['legal_name'] = f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip()
        
        # ✅ NUEVO: Generar username automáticamente si no se proporciona
        if not validated_data.get('username'):
            base_username = validated_data.get('email').split('@')[0]
            username = base_username
            counter = 1
            
            # Buscar username único
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            validated_data['username'] = username
            logger.info(f"✅ Generated username: {username}")
        
        # ✅ CRÍTICO: Log de datos finales antes de crear
        logger.info(f"✅ Creating user with data:")
        logger.info(f"  - email: {validated_data.get('email')}")
        logger.info(f"  - username: {validated_data.get('username')}")
        logger.info(f"  - role: {validated_data.get('role')}")
        logger.info(f"  - developer_type: {validated_data.get('developer_type')}")
        logger.info(f"  - person_type: {validated_data.get('person_type')}")
        
        user = User(**validated_data)
        user.set_password(password)
        user._skip_company_validation = True
        user.save(update_fields=None)
        
        logger.info(f"✅ New user registered: {user.email} (role: {user.role})")
        
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