"""
Serializadores para usuarios
Define la estructura de datos de entrada/salida para la API
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_yasg.utils import swagger_serializer_method

from .models import User, UserProfile, UserRequest
import logging

logger = logging.getLogger(__name__)


class UserSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para referencias"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'role']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class UserSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo User"""
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'role_display', 'is_active', 'is_verified',
            'created_at', 'updated_at', 'last_login',
            # ✅ CAMPOS DE DESARROLLADOR
            'developer_type', 'person_type', 'legal_name',
            'document_type', 'document_number',
            # ✅ NUEVO: Campo de primera sesión
            'first_login_completed',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_full_name(self, obj):
        """Retorna el nombre completo del usuario"""
        return obj.get_full_name()


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializer para actualización de perfil"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone',
            # ✅ ELIMINADO: 'company'
            # Campos específicos según rol
            'developer_type', 'person_type', 'legal_name',
            'document_type', 'document_number',
        ]
    
    def validate(self, attrs):
        """Validar según el rol del usuario"""
        user = self.instance
        
        # Validar campos de desarrollador si el rol es developer
        if user.role == 'developer':
            if 'person_type' in attrs:
                person_type = attrs['person_type']
                
                # legal_name obligatorio para jurídica
                if person_type == 'juridica' and not attrs.get('legal_name'):
                    raise serializers.ValidationError({
                        'legal_name': 'El nombre de la empresa es obligatorio para persona jurídica'
                    })
                
                # Validar documento según tipo de persona
                document_type = attrs.get('document_type', user.document_type)
                if person_type == 'juridica' and document_type != 'NIT':
                    raise serializers.ValidationError({
                        'document_type': 'Personas jurídicas deben usar NIT'
                    })
                if person_type == 'natural' and document_type == 'NIT':
                    raise serializers.ValidationError({
                        'document_type': 'Personas naturales no pueden usar NIT'
                    })
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer para el perfil de usuario"""
    user = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'


class UserRequestSerializer(serializers.ModelSerializer):
    """Serializer básico para UserRequest"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_name', 'request_type', 'request_type_display',
            'title', 'description', 'status', 'status_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class UserRequestDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para UserRequest con información completa"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_name', 'request_type', 'request_type_display',
            'title', 'description', 'status', 'status_display',
            'reference_id', 'metadata',
            'reviewer', 'reviewer_name', 'review_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']


class UserRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear UserRequest"""
    
    class Meta:
        model = UserRequest
        fields = [
            'request_type', 'title', 'description',
            'reference_id', 'metadata'
        ]
    
    def create(self, validated_data):
        """Crear solicitud con usuario del contexto"""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)


class UserRequestUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar UserRequest (admin)"""
    
    class Meta:
        model = UserRequest
        fields = ['status', 'reviewer', 'review_notes']
    
    def validate(self, attrs):
        """Validar que el reviewer sea admin"""
        if 'reviewer' in attrs:
            reviewer = attrs['reviewer']
            if reviewer.role not in ['admin']:
                raise serializers.ValidationError({
                    'reviewer': 'Solo administradores pueden revisar solicitudes'
                })
        return attrs


class RequestStatusSummarySerializer(serializers.Serializer):
    """Serializer para resumen de estados de solicitudes"""
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    by_type = serializers.DictField()


# ✅ NUEVO: Serializers para recuperación de contraseña
class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer para solicitud de reset de contraseña"""
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Normalizar email"""
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer para confirmar reset de contraseña"""
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True
    )
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })
        return attrs


# ✅ NUEVO: Serializer para registro de usuarios
class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios por admin"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'first_name', 'last_name',
            'phone', 'role',
            # ✅ ELIMINADO: 'company'
            # Campos de desarrollador
            'developer_type', 'person_type', 'legal_name',
            'document_type', 'document_number',
        ]
    
    def create(self, validated_data):
        """Crear usuario con contraseña encriptada"""
        password = validated_data.pop('password')
        
        # ✅ Si es persona natural, usar first_name + last_name como legal_name
        if validated_data.get('role') == 'developer' and validated_data.get('person_type') == 'natural':
            if not validated_data.get('legal_name'):
                validated_data['legal_name'] = f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip()
        
        user = User(**validated_data)
        user.set_password(password)
        user._skip_company_validation = True
        user.save(update_fields=None)
        
        return user


# ✅ NUEVO: Serializers para verificación
class VerificationCodeSerializer(serializers.Serializer):
    """Serializer para solicitar código de verificación"""
    code_type = serializers.ChoiceField(
        choices=['email', 'whatsapp', 'sms'],
        default='email'
    )


class VerifyCodeSerializer(serializers.Serializer):
    """Serializer para verificar código"""
    code = serializers.CharField(required=True, min_length=6, max_length=6)
    code_type = serializers.ChoiceField(
        choices=['email', 'whatsapp', 'sms'],
        default='email'
    )


# ✅ NUEVO: Serializer para promoción a admin
class PromoteToAdminSerializer(serializers.Serializer):
    """Serializer para ascender usuario a administrador"""
    user_id = serializers.UUIDField(required=True)
    department = serializers.CharField(required=True, max_length=100)
    permissions_scope = serializers.ChoiceField(
        choices=['limited', 'full'],
        default='limited'
    )


class PerfilInversionSerializer(serializers.Serializer):
    """
    Serializer para el perfil de inversión del desarrollador
    """
    ciudades_interes = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=True,
        allow_empty=False,
        help_text="Lista de ciudades de interés"
    )
    
    usos_preferidos = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=True,
        allow_empty=False,
        help_text="Tipos de uso de suelo preferidos"
    )
    
    modelos_pago = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=True,
        allow_empty=False,
        help_text="Modelos de pago aceptados"
    )
    
    volumen_ventas_min = serializers.ChoiceField(
        choices=[
            ('menos_150', 'Menos de $150.000 millones'),
            ('entre_150_350', 'Entre $150.000 y $350.000 millones'),
            ('mas_350', 'Más de $350.000 millones'),
        ],
        required=True,
        help_text="Volumen mínimo de ventas esperado"
    )
    
    ticket_inversion_min = serializers.ChoiceField(
        choices=[
            ('menos_150', 'Menos de $150.000 millones'),
            ('entre_150_350', 'Entre $150.000 y $350.000 millones'),
            ('mas_350', 'Más de $350.000 millones'),
        ],
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Ticket mínimo de inversión (opcional)"
    )
    
    def validate_ciudades_interes(self, value):
        """Validar que las ciudades sean válidas"""
        ciudades_validas = [
            'medellin', 'bogota', 'cali', 'barranquilla', 'cartagena',
            'cucuta', 'bucaramanga', 'pereira', 'santa_marta', 'ibague',
            'pasto', 'manizales', 'neiva', 'villavicencio', 'armenia',
            'valledupar', 'monteria', 'sincelejo', 'popayan', 'tunja'
        ]
        
        for ciudad in value:
            if ciudad not in ciudades_validas:
                raise serializers.ValidationError(f"Ciudad no válida: {ciudad}")
        
        return value
    
    def validate_usos_preferidos(self, value):
        """Validar que los usos sean válidos"""
        usos_validos = ['residencial', 'comercial', 'industrial', 'logistico']
        
        for uso in value:
            if uso not in usos_validos:
                raise serializers.ValidationError(f"Uso de suelo no válido: {uso}")
        
        return value
    
    def validate_modelos_pago(self, value):
        """Validar que los modelos de pago sean válidos"""
        modelos_validos = ['contado', 'aporte', 'hitos']
        
        for modelo in value:
            if modelo not in modelos_validos:
                raise serializers.ValidationError(f"Modelo de pago no válido: {modelo}")
        
        return value
    
    # ✅ NUEVO: Implementar método update
    def update(self, instance, validated_data):
        """
        Actualizar perfil de inversión del usuario.
        """
        # Actualizar campos del usuario
        instance.ciudades_interes = validated_data.get('ciudades_interes', instance.ciudades_interes)
        instance.usos_preferidos = validated_data.get('usos_preferidos', instance.usos_preferidos)
        instance.modelos_pago = validated_data.get('modelos_pago', instance.modelos_pago)
        instance.volumen_ventas_min = validated_data.get('volumen_ventas_min', instance.volumen_ventas_min)
        
        # Ticket de inversión es opcional
        if 'ticket_inversion_min' in validated_data:
            ticket = validated_data.get('ticket_inversion_min')
            instance.ticket_inversion_min = ticket if ticket else None
        
        # ✅ CORREGIDO: Calcular si el perfil está completo
        campos_obligatorios = [
            bool(instance.ciudades_interes and len(instance.ciudades_interes) > 0),
            bool(instance.usos_preferidos and len(instance.usos_preferidos) > 0),
            bool(instance.modelos_pago and len(instance.modelos_pago) > 0),
            bool(instance.volumen_ventas_min and instance.volumen_ventas_min.strip())
        ]
        
        # Solo para fondos e inversionistas requiere ticket
        if instance.developer_type in ['fondo_inversion', 'inversionista']:
            campos_obligatorios.append(
                bool(instance.ticket_inversion_min and instance.ticket_inversion_min.strip())
            )
        
        instance.perfil_completo = all(campos_obligatorios)
        
        # Guardar cambios
        instance.save()
        
        return instance