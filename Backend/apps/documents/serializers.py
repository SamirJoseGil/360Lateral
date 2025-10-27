"""
Serializadores para la aplicación de documentos.
"""
from rest_framework import serializers
from .models import Document
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class DocumentSerializer(serializers.ModelSerializer):
    """Serializador básico para el modelo Document"""
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    # ✅ NUEVO: Agregar campo de descarga directa
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'document_type', 
            'file', 'file_url', 'file_name', 'download_url',  # ✅ Agregar download_url
            'user', 'user_name', 'lote', 'created_at', 'updated_at', 
            'file_size', 'mime_type', 'tags', 'metadata', 'is_active'
        ]
        read_only_fields = ['file_size', 'mime_type', 'created_at', 'updated_at', 'file_url', 'file_name', 'user_name', 'download_url']
    
    def get_file_url(self, obj):
        """Retorna la URL del archivo"""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
    
    # ✅ NUEVO: Método para URL de descarga directa
    def get_download_url(self, obj):
        """Retorna la URL de descarga directa del archivo"""
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
    """
    Serializer para subir documentos
    ✅ CORREGIDO: Maneja correctamente archivos desde FormData
    """
    class Meta:
        model = Document
        fields = ['title', 'description', 'file', 'document_type', 'lote', 'tags', 'metadata']
    
    def validate_file(self, value):
        """Validaciones del archivo"""
        # Verificar que se proporcione un archivo
        if not value:
            raise serializers.ValidationError("Debe proporcionar un archivo para subir.")
        
        # Verificar tamaño (máximo 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"El archivo es demasiado grande. Tamaño máximo: 10MB"
            )
        
        # Verificar extensiones permitidas
        allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.dwg', '.zip']
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Extensión de archivo no permitida. Permitidas: {', '.join(allowed_extensions)}"
            )
        
        logger.info(f"File validated: {value.name} ({value.size} bytes)")
        return value
    
    def validate(self, data):
        """Validaciones adicionales para la subida de documentos"""
        # Verificar que se asocie con un lote (opcional según tus reglas de negocio)
        lote = data.get('lote')
        if lote:
            try:
                from apps.lotes.models import Lote
                Lote.objects.get(pk=lote.pk)
            except Lote.DoesNotExist:
                raise serializers.ValidationError({"lote": "El lote especificado no existe."})
        
        logger.info(f"Document data validated: {data.get('title')}")
        return data
    
    def create(self, validated_data):
        """
        Crear un nuevo documento
        ✅ CORREGIDO: Maneja correctamente el usuario y metadatos
        """
        # Agregar el usuario actual como propietario del documento
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
            logger.info(f"Creating document for user: {request.user.email}")
        
        # Asegurar que metadata sea un dict
        if 'metadata' not in validated_data:
            validated_data['metadata'] = {}
        
        # Asegurar que tags sea una lista
        if 'tags' not in validated_data:
            validated_data['tags'] = []
        
        # Crear el documento
        document = Document.objects.create(**validated_data)
        
        logger.info(f"✅ Document created successfully: {document.id} - {document.title}")
        
        return document


class DocumentValidationSerializer(serializers.ModelSerializer):
    """Serializador para operaciones de validación de documentos."""
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
    """Serializador para acciones de validación de documentos."""
    action = serializers.ChoiceField(choices=['validar', 'rechazar'])
    comments = serializers.CharField(required=False, allow_blank=True)
    
    def validate_action(self, value):
        if value not in ['validar', 'rechazar']:
            raise serializers.ValidationError("Acción no válida. Debe ser 'validar' o 'rechazar'.")
        return value


class DocumentListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listar documentos en validación
    ✅ CORREGIDO: URL correcta para el cliente
    """
    user_name = serializers.SerializerMethodField()
    lote_nombre = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'document_type', 'file', 'file_url', 'file_name',
            'file_size', 'mime_type', 'user', 'user_name', 
            'lote', 'lote_nombre', 'created_at', 'metadata'
        ]
    
    def get_user_name(self, obj):
        """Obtener nombre del usuario"""
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
        return "Usuario desconocido"
    
    def get_lote_nombre(self, obj):
        """Obtener nombre del lote"""
        if obj.lote:
            return getattr(obj.lote, 'nombre', None) or str(obj.lote.id)
        return None
    
    def get_file_url(self, obj):
        """
        ✅ CRÍTICO: Construir URL accesible para el CLIENTE (navegador)
        NO usar URLs internas de Docker
        """
        if not obj.file:
            return None
            
        try:
            request = self.context.get('request')
            
            if request:
                # ✅ CORREGIDO: Construir URL correcta
                # Obtener el path relativo del archivo
                file_path = obj.file.name  # ejemplo: 'documents/2025/10/27/archivo.pdf'
                
                # Construir URL base del request (desde el cliente)
                # Esto obtiene el esquema y host desde donde vino el request
                scheme = request.scheme  # 'http' o 'https'
                host = request.get_host()  # 'localhost:8000' desde el cliente
                
                # ✅ CRÍTICO: Reemplazar 'backend:8000' con el host correcto
                if 'backend:' in host or 'lateral360_backend' in host:
                    # Estamos dentro de Docker, usar localhost para el cliente
                    host = 'localhost:8000'
                
                # Construir URL completa
                url = f"{scheme}://{host}/media/{file_path}"
                
                logger.debug(f"[Serializer] File URL for doc {obj.id}: {url}")
                return url
            else:
                # Fallback sin request - usar URL relativa
                logger.warning(f"[Serializer] No request in context for doc {obj.id}")
                return f"/media/{obj.file.name}"
                
        except Exception as e:
            logger.error(f"[Serializer] Error building file URL for doc {obj.id}: {e}")
            # Fallback en caso de error
            try:
                return f"/media/{obj.file.name}"
            except:
                return None
    
    def get_file_name(self, obj):
        """Obtener nombre del archivo"""
        if obj.file:
            try:
                return obj.file.name.split('/')[-1]
            except:
                return None
        return None
