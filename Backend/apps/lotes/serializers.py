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
    """
    ✅ MEJORADO: Incluir campos calculados de estado
    """
    owner_info = UserSimpleSerializer(source='owner', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # ✅ Campos calculados
    can_be_shown = serializers.BooleanField(read_only=True)
    can_be_edited = serializers.BooleanField(read_only=True)
    is_rejected = serializers.BooleanField(read_only=True)
    is_archived = serializers.BooleanField(read_only=True)
    is_pending = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Lote
        fields = [
            'id', 'nombre', 'cbml', 'matricula', 'codigo_catastral',
            'direccion', 'area', 'descripcion', 'barrio', 'estrato',
            'latitud', 'longitud', 'clasificacion_suelo', 'uso_suelo', 
            'tratamiento_pot', 
            'owner', 'owner_info', 
            'status', 'status_display',
            'is_verified', 'verified_at', 'verified_by',
            'rejection_reason', 'rejected_at', 'rejected_by',
            'created_at', 'updated_at', 'metadatos',
            # ✅ Campos calculados
            'can_be_shown', 'can_be_edited', 'is_rejected', 'is_archived', 
            'is_pending', 'is_active'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'owner',
            'verified_at', 'verified_by', 'rejected_at', 'rejected_by',
            'status_display', 'can_be_shown', 'can_be_edited', 
            'is_rejected', 'is_archived', 'is_pending', 'is_active'
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
    """
    Serializer SIMPLIFICADO para crear lotes - Solo campos esenciales
    """
    class Meta:
        model = Lote
        fields = [
            # ✅ CAMPOS ESENCIALES (requeridos)
            'nombre',
            'direccion',
            'area',
            
            # ✅ CAMPOS IMPORTANTES (opcionales pero útiles)
            'cbml',
            'matricula', 
            'codigo_catastral',
            'descripcion',
            'barrio',
            'estrato',
            # ✅ ELIMINADO: 'comuna' - campo que no existe
            
            # ✅ CAMPOS AUTOMÁTICOS (se pueden llenar después)
            'latitud',
            'longitud',
            'clasificacion_suelo',
            'uso_suelo',
            'tratamiento_pot',
        ]
        
    def validate_nombre(self, value):
        """Validar que el nombre no esté vacío"""
        if not value or not value.strip():
            raise serializers.ValidationError("El nombre del lote es requerido")
        return value.strip()
    
    def validate_direccion(self, value):
        """Validar que la dirección no esté vacía"""
        if not value or not value.strip():
            raise serializers.ValidationError("La dirección es requerida")
        return value.strip()
    
    def validate_area(self, value):
        """Validar que el área sea positiva"""
        if value is not None and value <= 0:
            raise serializers.ValidationError("El área debe ser mayor a 0")
        return value
    
    def validate_cbml(self, value):
        """Validar formato CBML si se proporciona"""
        if value and len(value.strip()) > 0:
            # Remover espacios y validar que solo contenga números
            cbml_clean = value.strip().replace(' ', '')
            if not cbml_clean.isdigit():
                raise serializers.ValidationError("El CBML debe contener solo números")
            if len(cbml_clean) < 10:
                raise serializers.ValidationError("El CBML debe tener al menos 10 dígitos")
            return cbml_clean
        return value
    
    def create(self, validated_data):
        """Crear lote con valores por defecto para campos opcionales"""
        # Establecer owner automáticamente
        if 'owner' not in validated_data:
            validated_data['owner'] = self.context['request'].user
            
        # Valores por defecto
        validated_data.setdefault('status', 'pending')
        validated_data.setdefault('is_verified', False)
        
        # Si no hay descripción, generar una básica
        if not validated_data.get('descripcion'):
            validated_data['descripcion'] = f"Lote en {validated_data.get('direccion', 'dirección no especificada')}"
            if validated_data.get('area'):
                validated_data['descripcion'] += f" con área de {validated_data['area']} m²"
        
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
    """
    Serializer para favoritos de lotes
    """
    lote_details = LoteSerializer(source='lote', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'lote', 'lote_details', 'user_email', 'notas', 'created_at']
        read_only_fields = ['id', 'user', 'created_at', 'lote_details', 'user_email']
    
    def validate_lote(self, value):
        """
        ✅ CORREGIDO: Validar que el lote existe y está disponible
        El modelo Lote NO tiene campo 'is_active', usa 'status'
        """
        if not value:
            raise serializers.ValidationError("Lote es requerido")
        
        # ✅ CORREGIDO: Usar 'status' en lugar de 'is_active'
        # El modelo Lote tiene status: 'pending', 'active', 'archived'
        if value.status not in ['active', 'pending']:
            raise serializers.ValidationError("El lote no está disponible")
        
        # Si es para developers, verificar que esté verificado
        request = self.context.get('request')
        if request and hasattr(request.user, 'role') and request.user.role == 'developer':
            if not value.is_verified or value.status != 'active':
                raise serializers.ValidationError("El lote no está disponible para desarrolladores")
        
        return value
    
    def create(self, validated_data):
        """✅ Crear favorito asignando usuario desde request"""
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context is required")
        
        validated_data['user'] = request.user
        return super().create(validated_data)


class MapGISResponseSerializer(serializers.Serializer):
    """Serializer para respuestas de MapGIS"""
    success = serializers.BooleanField()
    encontrado = serializers.BooleanField()
    mensaje = serializers.CharField(required=False)
    data = serializers.DictField(required=False)
    error = serializers.CharField(required=False)