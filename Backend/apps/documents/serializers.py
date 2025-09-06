"""
Serializadores para la aplicación de documentos.
"""
from rest_framework import serializers
from .models import Document
from django.contrib.auth import get_user_model
from apps.lotes.models import Lote

User = get_user_model()

class DocumentSerializer(serializers.ModelSerializer):
    """Serializador básico para el modelo Document"""
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'document_type', 'file', 'file_url', 'file_name',
            'user', 'user_name', 'lote', 'created_at', 'updated_at', 
            'file_size', 'mime_type', 'tags', 'metadata', 'is_active'
        ]
        read_only_fields = ['file_size', 'mime_type', 'created_at', 'updated_at', 'file_url', 'file_name', 'user_name']
    
    def get_file_url(self, obj):
        """Retorna la URL del archivo"""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_file_name(self, obj):
        """Retorna el nombre original del archivo"""
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None
    
    def get_user_name(self, obj):
        """Retorna el nombre del usuario"""
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return None

class DocumentUploadSerializer(serializers.ModelSerializer):
    """Serializador para subir documentos"""
    class Meta:
        model = Document
        fields = ['title', 'description', 'file', 'document_type', 'lote', 'tags', 'metadata']
    
    def validate(self, data):
        """Validaciones adicionales para la subida de documentos"""
        # Verificar que se proporcione un archivo
        if 'file' not in data:
            raise serializers.ValidationError({"file": "Debe proporcionar un archivo para subir."})
        
        # Verificar que se asocie con un lote
        lote = data.get('lote')
        
        # Si se proporciona un lote, verificar que exista
        if lote:
            try:
                Lote.objects.get(pk=lote.pk)
            except Lote.DoesNotExist:
                raise serializers.ValidationError({"lote": "El lote especificado no existe."})
        
        return data
    
    def create(self, validated_data):
        """Crear un nuevo documento"""
        # Agregar el usuario actual como propietario del documento
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        
        # Crear el documento
        return Document.objects.create(**validated_data)

class DocumentValidationSerializer(serializers.ModelSerializer):
    """
    Serializer for document validation operations.
    """
    lote_nombre = serializers.SerializerMethodField()
    solicitante_nombre = serializers.SerializerMethodField()
    tipo_documento = serializers.CharField(source='document_type', read_only=True)
    estado_validacion = serializers.SerializerMethodField()
    validacion_fecha = serializers.SerializerMethodField()
    validacion_comentarios = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'document_type', 'tipo_documento', 
            'created_at', 'estado_validacion', 'validacion_fecha',
            'validacion_comentarios', 'lote', 'lote_nombre', 
            'user', 'solicitante_nombre', 'metadata'
        ]
        read_only_fields = [
            'id', 'title', 'file', 'document_type', 'created_at',
            'lote', 'user', 'metadata'
        ]
        
    def get_estado_validacion(self, obj):
        if obj.metadata and 'validation_status' in obj.metadata:
            return obj.metadata['validation_status']
        return 'pendiente'
        
    def get_validacion_fecha(self, obj):
        if obj.metadata and 'validation_date' in obj.metadata:
            return obj.metadata['validation_date']
        return None
        
    def get_validacion_comentarios(self, obj):
        if obj.metadata and 'validation_comments' in obj.metadata:
            return obj.metadata['validation_comments']
        return None
    
    def get_lote_nombre(self, obj):
        if hasattr(obj, 'lote') and obj.lote:
            return f"Lote {obj.lote.id}"
        return None
    
    def get_solicitante_nombre(self, obj):
        if hasattr(obj, 'user') and obj.user:
            if hasattr(obj.user, 'get_full_name'):
                full_name = obj.user.get_full_name()
                if full_name:
                    return full_name
            return obj.user.username or f"Usuario {obj.user.id}"
        return "Usuario Desconocido"


class DocumentValidateActionSerializer(serializers.Serializer):
    """
    Serializer for document validation action.
    """
    action = serializers.ChoiceField(choices=['validar', 'rechazar'])
    comments = serializers.CharField(required=False, allow_blank=True)
    
    def validate_action(self, value):
        if value not in ['validar', 'rechazar']:
            raise serializers.ValidationError("Acción no válida. Debe ser 'validar' o 'rechazar'.")
        return value


class DocumentListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for document listings.
    """
    tipo = serializers.CharField(source='document_type')
    estado = serializers.SerializerMethodField()
    fecha_subida = serializers.DateTimeField(source='created_at')
    solicitante = serializers.SerializerMethodField()
    nombre = serializers.CharField(source='title')
    
    class Meta:
        model = Document
        fields = ['id', 'nombre', 'tipo', 'estado', 'fecha_subida', 'solicitante']
        
    def get_estado(self, obj):
        if obj.metadata and 'validation_status' in obj.metadata:
            return obj.metadata['validation_status']
        return 'pendiente'
    
    def get_solicitante(self, obj):
        if hasattr(obj, 'user') and obj.user:
            if hasattr(obj.user, 'get_full_name'):
                full_name = obj.user.get_full_name()
                if full_name:
                    return full_name
            return obj.user.username or f"Usuario {obj.user.id}"
        return "Usuario Desconocido"
