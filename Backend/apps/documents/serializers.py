"""
Serializadores para documentos
"""
from rest_framework import serializers
from django.conf import settings
from .models import Document
import logging
import os

logger = logging.getLogger(__name__)


class DocumentSerializer(serializers.ModelSerializer):
    """Serializador completo para Document"""
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    lote_info = serializers.SerializerMethodField()
    size_display = serializers.SerializerMethodField()
    validation_status = serializers.SerializerMethodField()
    validation_status_display = serializers.SerializerMethodField()  # ✅ NUEVO
    is_validated = serializers.BooleanField(read_only=True)
    is_rejected = serializers.BooleanField(read_only=True)
    is_pending = serializers.BooleanField(read_only=True)
    rejection_reason = serializers.SerializerMethodField()  # ✅ NUEVO
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'document_type', 
            'file', 'file_url', 'file_name', 'download_url',
            'user', 'user_name', 'lote', 'lote_info',
            'created_at', 'updated_at', 
            'file_size', 'size_display', 'mime_type',
            'tags', 'metadata', 'is_active', 
            'validation_status', 'validation_status_display',  # ✅ NUEVO
            'is_validated', 'is_rejected', 'is_pending',
            'rejection_reason',  # ✅ NUEVO
            'validated_at', 'validated_by'
        ]
        read_only_fields = [
            'file_size', 'mime_type', 'created_at', 'updated_at',
            'file_url', 'file_name', 'download_url', 'user_name',
            'lote_info', 'size_display', 'validation_status',
            'validation_status_display', 'rejection_reason',
            'is_validated', 'is_rejected', 'is_pending',
            'validated_at', 'validated_by'
        ]
    
    def get_file_url(self, obj):
        """URL completa del archivo"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None
    
    def get_download_url(self, obj):
        """URL de descarga directa"""
        return self.get_file_url(obj)
    
    def get_file_name(self, obj):
        """Nombre del archivo"""
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None
    
    def get_user_name(self, obj):
        """Nombre del usuario"""
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return None
    
    def get_lote_info(self, obj):
        """Información básica del lote"""
        if obj.lote:
            return {
                'id': str(obj.lote.id),
                'nombre': obj.lote.nombre,
                'direccion': obj.lote.direccion
            }
        return None
    
    def get_size_display(self, obj):
        """Tamaño en formato legible"""
        return obj.get_size_display()
    
    def get_validation_status(self, obj):
        """Estado de validación"""
        return obj.validation_status
    
    def get_validation_status_display(self, obj):
        """✅ NUEVO: Texto legible del estado"""
        status_map = {
            'pendiente': 'Pendiente de Validación',
            'validado': 'Validado',
            'rechazado': 'Rechazado'
        }
        return status_map.get(obj.validation_status, 'Desconocido')
    
    def get_rejection_reason(self, obj):
        """✅ NUEVO: Razón de rechazo si existe"""
        if obj.validation_status == 'rechazado' and obj.metadata:
            return obj.metadata.get('rejection_reason')
        return None


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer para subir documentos
    ✅ CORREGIDO:
    - Título opcional (se genera automáticamente)
    - Validaciones de tamaño y tipo
    - Mejor manejo de errores
    """
    # ✅ Título ahora es opcional
    title = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Document
        fields = ['title', 'description', 'file', 'document_type', 'lote', 'tags']
    
    def validate_file(self, value):
        """
        ✅ VALIDACIONES MEJORADAS de archivo
        """
        if not value:
            raise serializers.ValidationError("Debe proporcionar un archivo")
        
        # ✅ Validar tamaño
        max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024)
        if value.size > max_size:
            max_mb = max_size / (1024 * 1024)
            raise serializers.ValidationError(
                f"Archivo demasiado grande. Máximo: {max_mb:.0f}MB"
            )
        
        # ✅ Validar extensión
        ext = os.path.splitext(value.name)[1].lower()
        allowed = getattr(settings, 'ALLOWED_DOCUMENT_EXTENSIONS', ['.pdf'])
        if ext not in allowed:
            raise serializers.ValidationError(
                f"Extensión no permitida. Permitidas: {', '.join(allowed)}"
            )
        
        # ✅ Validar MIME type si está disponible
        if hasattr(value, 'content_type'):
            allowed_types = getattr(settings, 'ALLOWED_DOCUMENT_TYPES', [])
            if allowed_types and value.content_type not in allowed_types:
                logger.warning(f"MIME type no permitido: {value.content_type}")
        
        logger.info(f"Archivo validado: {value.name} ({value.size} bytes)")
        return value
    
    def validate(self, data):
        """Validaciones cruzadas"""
        # ✅ Validar que el lote existe (si se proporciona)
        lote = data.get('lote')
        if lote:
            try:
                from apps.lotes.models import Lote
                if not Lote.objects.filter(pk=lote.pk).exists():
                    raise serializers.ValidationError({
                        "lote": "El lote especificado no existe"
                    })
            except Exception as e:
                logger.error(f"Error validando lote: {e}")
        
        return data
    
    def create(self, validated_data):
        """
        ✅ CREAR documento con valores automáticos
        """
        # Agregar usuario desde el contexto
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        
        # ✅ Asegurar metadata y tags
        if 'metadata' not in validated_data:
            validated_data['metadata'] = {}
        if 'tags' not in validated_data:
            validated_data['tags'] = []
        
        # Crear documento (save() generará título si no existe)
        document = Document.objects.create(**validated_data)
        
        logger.info(
            f"✅ Documento creado: {document.id} - "
            f"{document.title} ({document.get_size_display()})"
        )
        
        return document


class DocumentListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listas
    ✅ CORREGIDO: URLs correctas para cliente
    """
    user_name = serializers.SerializerMethodField()
    lote_nombre = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'document_type', 'file_url', 'file_name',
            'file_size', 'size_display', 'mime_type',
            'user', 'user_name', 'lote', 'lote_nombre',
            'created_at', 'metadata'
        ]
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return "Desconocido"
    
    def get_lote_nombre(self, obj):
        if obj.lote:
            return obj.lote.nombre or str(obj.lote.id)
        return None
    
    def get_file_url(self, obj):
        """✅ URL correcta para el cliente"""
        if not obj.file:
            return None
        
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url
    
    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None
    
    def get_size_display(self, obj):
        return obj.get_size_display()


class DocumentValidationSerializer(serializers.ModelSerializer):
    """
    ✅ NUEVO: Serializer para validación de documentos
    Incluye información completa para la vista de validación
    """
    user_name = serializers.SerializerMethodField()
    lote_info = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    size_display = serializers.SerializerMethodField()
    validation_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'document_type',
            'file', 'file_url', 'file_name',
            'user', 'user_name', 'lote', 'lote_info',
            'file_size', 'size_display', 'mime_type',
            'metadata', 'created_at', 'updated_at',
            'validation_status', 'validated_at', 'validated_by'
        ]
        read_only_fields = [
            'id', 'user', 'file_size', 'mime_type', 
            'created_at', 'updated_at', 'validated_at', 'validated_by'
        ]
    
    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.email
        return "Desconocido"
    
    def get_lote_info(self, obj):
        if obj.lote:
            return {
                'id': str(obj.lote.id),
                'nombre': obj.lote.nombre,
                'direccion': obj.lote.direccion
            }
        return None
    
    def get_file_url(self, obj):
        if not obj.file:
            return None
        
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url
    
    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None
    
    def get_size_display(self, obj):
        return obj.get_size_display()
    
    def get_validation_status(self, obj):
        return obj.validation_status


class DocumentValidateActionSerializer(serializers.Serializer):
    """
    ✅ NUEVO: Serializer para acciones de validación/rechazo
    """
    ACTION_CHOICES = [
        ('validar', 'Validar'),
        ('rechazar', 'Rechazar')
    ]
    
    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        required=True,
        help_text="Acción a realizar: validar o rechazar"
    )
    comments = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text="Comentarios sobre la validación o razón del rechazo"
    )
    
    def validate(self, attrs):
        """Validar que si es rechazo, tenga comentarios"""
        action = attrs.get('action')
        comments = attrs.get('comments', '').strip()
        
        if action == 'rechazar' and not comments:
            raise serializers.ValidationError({
                'comments': 'Debe proporcionar una razón para el rechazo'
            })
        
        return attrs
