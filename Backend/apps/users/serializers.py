"""
Serializadores para usuarios
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from drf_yasg.utils import swagger_serializer_method
from .models import User, UserProfile, UserRequest


class UserSimpleSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para incluir información básica de usuario
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class UserSerializer(serializers.ModelSerializer):
    """Serializador para el modelo User"""
    
    full_name = serializers.SerializerMethodField()
    role_fields = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone', 'company', 'role', 'is_verified', 'is_active',
            'created_at', 'updated_at', 'role_fields'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified']
        
    @swagger_serializer_method(serializer_or_field=serializers.CharField)
    def get_full_name(self, instance):
        """Retorna el nombre completo del usuario"""
        return instance.get_full_name()
    
    def get_role_fields(self, instance):
        """Retorna campos específicos según el rol del usuario"""
        if instance.role == 'owner':
            return {
                'document_type': instance.document_type,
                'document_number': instance.document_number,
                'address': instance.address,
                'id_verification_file': instance.id_verification_file.url if instance.id_verification_file else None,
                'lots_count': instance.lots_count
            }
        elif instance.role == 'developer':
            return {
                'company_name': instance.company_name,
                'company_nit': instance.company_nit,
                'position': instance.position,
                'experience_years': instance.experience_years,
                'portfolio_url': instance.portfolio_url,
                'focus_area': instance.focus_area
            }
        elif instance.role == 'admin':
            return {
                'department': instance.department,
                'permissions_scope': instance.permissions_scope
            }
        return {}


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Serializador para actualizar perfil del usuario según su rol"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'company',
            # Campos para owner
            'document_type', 'document_number', 'address', 'id_verification_file',
            # Campos para developer
            'company_name', 'company_nit', 'position', 'experience_years', 
            'portfolio_url', 'focus_area',
            # Campos para admin
            'department', 'permissions_scope'
        ]
    
    def validate(self, attrs):
        """Validar campos según el rol del usuario"""
        user = self.context['request'].user
        
        # Filtrar campos permitidos según el rol
        allowed_fields = ['first_name', 'last_name', 'phone', 'company']
        
        if user.role == 'owner':
            allowed_fields.extend([
                'document_type', 'document_number', 'address', 'id_verification_file'
            ])
        elif user.role == 'developer':
            allowed_fields.extend([
                'company_name', 'company_nit', 'position', 'experience_years',
                'portfolio_url', 'focus_area'
            ])
        elif user.role == 'admin':
            allowed_fields.extend(['department', 'permissions_scope'])
        
        # Remover campos no permitidos
        validated_attrs = {k: v for k, v in attrs.items() if k in allowed_fields}
        
        return validated_attrs
    
    def update(self, instance, validated_data):
        """Actualizar solo los campos permitidos"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializador para el perfil de usuario"""
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'location', 'website', 'linkedin',
            'email_notifications', 'sms_notifications',
            'language', 'timezone'
        ]


class UserRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for UserRequest model with basic information.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_name', 'request_type', 'request_type_display', 
            'title', 'status', 'status_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.username
        return None


class UserRequestDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for UserRequest with all information.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    user_name = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRequest
        fields = [
            'id', 'user', 'user_name', 'request_type', 'request_type_display', 
            'title', 'description', 'status', 'status_display', 'reference_id',
            'metadata', 'reviewer', 'reviewer_name', 'review_notes', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.username
        return None
        
    def get_reviewer_name(self, obj):
        if obj.reviewer:
            return obj.reviewer.username
        return None


class UserRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new user requests.
    """
    class Meta:
        model = UserRequest
        fields = [
            'request_type', 'title', 'description', 'reference_id', 'metadata'
        ]
        
    def create(self, validated_data):
        # Get the current user from the context
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Create the request
        return UserRequest.objects.create(**validated_data)


class UserRequestUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing user requests.
    """
    class Meta:
        model = UserRequest
        fields = ['description', 'metadata']


class RequestStatusSummarySerializer(serializers.Serializer):
    """
    Serializer for request status summary data.
    """
    total = serializers.IntegerField()
    pending = serializers.IntegerField()
    approved = serializers.IntegerField()
    rejected = serializers.IntegerField()
    by_type = serializers.DictField(child=serializers.IntegerField())