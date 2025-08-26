"""
Serializadores para la aplicación de documentos
"""
from rest_framework import serializers
from .models import Documento
from apps.users.serializers import UserBasicSerializer

class DocumentoSerializer(serializers.ModelSerializer):
    """Serializador completo para el modelo Documento."""
    
    # Campos personalizados
    propietario_info = serializers.SerializerMethodField()
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Documento
        fields = [
            'id', 'nombre', 'tipo', 'tipo_display', 'descripcion', 
            'archivo', 'tamano', 'tipo_mime', 'lote', 'propietario', 
            'propietario_info', 'status', 'status_display', 'fecha_subida',
            'fecha_modificacion', 'fecha_aprobacion', 'notas'
        ]
        read_only_fields = [
            'tamano', 'tipo_mime', 'fecha_subida', 
            'fecha_modificacion', 'fecha_aprobacion',
            'propietario_info', 'tipo_display', 'status_display'
        ]
    
    def get_propietario_info(self, obj):
        """Obtiene información del propietario del documento"""
        return UserBasicSerializer(obj.propietario).data if obj.propietario else None
    
    def validate_archivo(self, value):
        """Validar el archivo subido."""
        # Validar tamaño máximo
        max_size = 10 * 1024 * 1024  # 10 MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"El archivo no puede tener más de 10 MB (tamaño actual: {value.size / (1024 * 1024):.2f} MB)"
            )
        
        # Validar extensiones permitidas
        allowed_extensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt', '.xlsx', '.xls']
        ext = value.name.split('.')[-1].lower()
        if f'.{ext}' not in allowed_extensions:
            raise serializers.ValidationError(
                f"Extensión de archivo no permitida. Extensiones válidas: {', '.join(allowed_extensions)}"
            )
        
        return value

class DocumentoCreateSerializer(DocumentoSerializer):
    """Serializador para crear documentos con validaciones adicionales."""
    
    class Meta(DocumentoSerializer.Meta):
        fields = [
            'nombre', 'tipo', 'descripcion', 'archivo', 
            'lote', 'propietario', 'notas'
        ]

class DocumentoBasicSerializer(serializers.ModelSerializer):
    """Serializador básico para listados de documentos."""
    
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Documento
        fields = [
            'id', 'nombre', 'tipo', 'tipo_display', 'archivo', 
            'status', 'status_display', 'fecha_subida'
        ]
