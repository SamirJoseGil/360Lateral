"""
Serializadores para el módulo de lotes
"""
from rest_framework import serializers
from .models import Lote, LoteDocument, LoteHistory, Favorite
from apps.users.serializers import UserSimpleSerializer


class LoteSimpleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas y referencias"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    
    class Meta:
        model = Lote
        fields = [
            'id', 'cbml', 'direccion', 'area', 'status',
            'owner', 'owner_name', 'barrio', 'comuna'
        ]
        read_only_fields = ['id', 'owner']


class LoteSerializer(serializers.ModelSerializer):
    """Serializer completo para lotes"""
    owner_info = UserSimpleSerializer(source='owner', read_only=True)
    potencial_constructivo = serializers.SerializerMethodField()
    documentos_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Lote
        fields = [
            'id', 'cbml', 'matricula', 'owner', 'owner_info',
            'direccion', 'barrio', 'comuna', 'estrato',
            'latitud', 'longitud',
            'area', 'area_construida', 'frente', 'fondo',
            'tratamiento_urbanistico', 'uso_suelo',
            'altura_maxima', 'indice_ocupacion', 'indice_construccion',
            'avaluo_catastral', 'valor_comercial', 'valor_m2',
            'status', 'notas', 'datos_mapgis',
            'is_verified', 'verified_at', 'verified_by',
            'potencial_constructivo', 'documentos_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'owner', 'is_verified', 'verified_at', 'verified_by',
            'created_at', 'updated_at'
        ]
    
    def get_potencial_constructivo(self, obj):
        """Calcula potencial constructivo"""
        return obj.calcular_potencial_constructivo()
    
    def get_documentos_count(self, obj):
        """Cuenta documentos asociados"""
        return obj.documentos.count()
    
    def validate_cbml(self, value):
        """Validar formato de CBML"""
        if len(value) != 14:
            raise serializers.ValidationError("El CBML debe tener 14 dígitos")
        if not value.isdigit():
            raise serializers.ValidationError("El CBML debe ser numérico")
        return value
    
    def validate(self, attrs):
        """Validaciones cruzadas"""
        # Validar área construida vs área del lote
        if 'area_construida' in attrs and 'area' in attrs:
            if attrs['area_construida'] > attrs['area'] * 10:
                raise serializers.ValidationError({
                    'area_construida': 'El área construida es demasiado grande'
                })
        
        return attrs


class LoteCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear lotes"""
    class Meta:
        model = Lote
        fields = [
            'cbml', 'matricula', 'direccion', 'barrio', 'comuna', 'estrato',
            'latitud', 'longitud', 'area', 'area_construida', 'frente', 'fondo',
            'tratamiento_urbanistico', 'uso_suelo', 'altura_maxima',
            'indice_ocupacion', 'indice_construccion',
            'avaluo_catastral', 'valor_comercial', 'notas'
        ]
    
    def create(self, validated_data):
        """Asignar owner del contexto"""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class LoteDocumentSerializer(serializers.ModelSerializer):
    """Serializer para documentos de lote"""
    uploaded_by_info = UserSimpleSerializer(source='uploaded_by', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = LoteDocument
        fields = [
            'id', 'lote', 'tipo', 'tipo_display', 'titulo', 'descripcion',
            'archivo', 'uploaded_by', 'uploaded_by_info', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']


class LoteHistorySerializer(serializers.ModelSerializer):
    """Serializer para historial de cambios"""
    modificado_por_info = UserSimpleSerializer(source='modificado_por', read_only=True)
    
    class Meta:
        model = LoteHistory
        fields = [
            'id', 'lote', 'campo_modificado', 'valor_anterior', 'valor_nuevo',
            'modificado_por', 'modificado_por_info', 'fecha_modificacion', 'motivo'
        ]
        read_only_fields = fields


class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer para favoritos"""
    lote_info = LoteSimpleSerializer(source='lote', read_only=True)
    user_info = UserSimpleSerializer(source='user', read_only=True)
    
    class Meta:
        model = Favorite
        fields = [
            'id', 'user', 'user_info', 'lote', 'lote_info',
            'notas', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
    
    def create(self, validated_data):
        """Asignar user del contexto"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class MapGISResponseSerializer(serializers.Serializer):
    """Serializer para respuestas de MapGIS"""
    success = serializers.BooleanField()
    encontrado = serializers.BooleanField()
    mensaje = serializers.CharField(required=False)
    data = serializers.DictField(required=False)
    error = serializers.CharField(required=False)