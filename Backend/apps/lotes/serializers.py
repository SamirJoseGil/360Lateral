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
    owner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Lote
        fields = [
            'id',
            'owner',
            'owner_name',
            'nombre',
            'cbml',
            'direccion',
            'ciudad',
            'barrio',
            'estrato',
            'area',
            'matricula',
            'codigo_catastral',
            'latitud',
            'longitud',
            'tratamiento_pot',
            'uso_suelo',
            'clasificacion_suelo',
            'descripcion',
            'valor',
            'forma_pago',
            'es_comisionista',
            'status',
            'is_verified',
            'created_at',
            'updated_at',
        ]
    
    def get_owner_name(self, obj):
        """Obtener nombre del propietario"""
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.email
        return None
    
    def get_owner_email(self, obj):
        """Obtener email del propietario"""
        if obj.owner:
            return obj.owner.email
        return None
    
    def validate_cbml(self, value):
        """Validar formato de CBML - MapGIS Medellín usa 11 dígitos"""
        if value and len(value) != 11:  # ✅ CORREGIDO: 11 dígitos (antes era 14)
            raise serializers.ValidationError(
                "El CBML debe tener exactamente 11 dígitos para MapGIS Medellín"
            )
        if value and not value.isdigit():
            raise serializers.ValidationError(
                "El CBML debe contener solo números"
            )
        return value
    
    def validate_area(self, value):
        """Validar que el área sea positiva"""
        if value is not None and value <= 0:
            raise serializers.ValidationError(
                "El área debe ser un número positivo"
            )
        return value
    
    def validate_estrato(self, value):
        """Validar que el estrato esté en el rango correcto"""
        if value is not None and (value < 1 or value > 6):
            raise serializers.ValidationError(
                "El estrato debe estar entre 1 y 6"
            )
        return value
    
    # ✅ NUEVA VALIDACIÓN: Carta de autorización obligatoria para comisionistas
    def validate(self, data):
        """Validaciones cruzadas"""
        es_comisionista = data.get('es_comisionista', False)
        carta_autorizacion = data.get('carta_autorizacion')
        
        # Si es comisionista, la carta es obligatoria
        if es_comisionista and not carta_autorizacion:
            raise serializers.ValidationError({
                'carta_autorizacion': 'La carta de autorización es obligatoria para comisionistas'
            })
        
        return data


class LoteCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear lotes (formulario de creación)
    """
    class Meta:
        model = Lote
        fields = [
            'nombre',
            'cbml',
            'direccion',
            'ciudad',  # ✅ NUEVO
            'barrio',
            'estrato',
            'area',
            'matricula',
            'codigo_catastral',
            'latitud',
            'longitud',
            'tratamiento_pot',
            'uso_suelo',
            'clasificacion_suelo',
            'descripcion',
            'valor',  # ✅ NUEVO
            'forma_pago',  # ✅ NUEVO
            'es_comisionista',  # ✅ NUEVO
            'carta_autorizacion',  # ✅ NUEVO
            'metadatos',
        ]
    
    def validate(self, data):
        """Validaciones para creación"""
        # ✅ VALIDACIÓN: Carta obligatoria para comisionistas
        if data.get('es_comisionista') and not data.get('carta_autorizacion'):
            raise serializers.ValidationError({
                'carta_autorizacion': 'La carta de autorización es obligatoria para comisionistas'
            })
        
        return data
    
    def create(self, validated_data):
        """
        Crear lote asignando automáticamente el usuario autenticado
        """
        # ✅ CORREGIDO: Usar 'owner' en lugar de 'usuario'
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['owner'] = request.user
        
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