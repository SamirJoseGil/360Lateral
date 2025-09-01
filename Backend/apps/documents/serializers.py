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
