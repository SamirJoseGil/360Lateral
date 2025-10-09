"""
Serializers para la aplicación de lotes
"""
from rest_framework import serializers
from .models import Lote, Favorite
from django.contrib.auth import get_user_model

User = get_user_model()

class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer para favoritos"""
    lote_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorite
        fields = ['id', 'lote', 'lote_info', 'notas', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_lote_info(self, obj):
        """Información del lote favorito"""
        from .serializers import LoteSerializer
        return LoteSerializer(obj.lote).data


class LoteSerializer(serializers.ModelSerializer):
    """Serializer básico para listados de lotes"""
    owner = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = Lote
        fields = [
            'id', 'nombre', 'cbml', 'direccion', 'area', 'descripcion',
            'matricula', 'codigo_catastral', 'barrio', 'estrato',
            'latitud', 'longitud', 'tratamiento_pot', 'uso_suelo',
            'clasificacion_suelo', 'metadatos', 'estado',
            'is_verified', 'verified_at', 'rejection_reason',
            'fecha_creacion', 'fecha_actualizacion',
            'owner', 'is_favorite'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion', 'is_verified', 'verified_at']
    
    def get_owner(self, obj):
        """Obtener información básica del propietario"""
        if obj.usuario:
            return obj.usuario.id
        return None
    
    def get_is_favorite(self, obj):
        """Verificar si el lote es favorito del usuario actual"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favoritos.filter(usuario=request.user).exists()
        return False
    
    def to_representation(self, instance):
        """Personalizar la representación para incluir nombres de campos adicionales"""
        data = super().to_representation(instance)
        
        # ✅ Agregar alias de campos para compatibilidad con frontend
        data['created_at'] = data.get('fecha_creacion')
        data['updated_at'] = data.get('fecha_actualizacion')
        data['status'] = data.get('estado')
        
        return data

class LoteDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalles de lotes"""
    usuario_info = serializers.SerializerMethodField()
    verified_by_info = serializers.SerializerMethodField()
    favoritos_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = Lote
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion', 'verified_at', 'verified_by']
    
    def get_usuario_info(self, obj):
        """Información del usuario propietario"""
        if obj.usuario:
            return {
                'id': obj.usuario.id,
                'email': obj.usuario.email,
                'nombre': obj.usuario.get_full_name() or obj.usuario.username,
            }
        return None
    
    def get_verified_by_info(self, obj):
        """Información del admin que verificó"""
        if obj.verified_by:
            return {
                'id': obj.verified_by.id,
                'email': obj.verified_by.email,
                'nombre': obj.verified_by.get_full_name() or obj.verified_by.username,
            }
        return None
    
    def get_favoritos_count(self, obj):
        """Cantidad de veces que fue marcado como favorito"""
        return obj.favoritos.count()
    
    def get_is_favorite(self, obj):
        """Verificar si es favorito del usuario actual"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favoritos.filter(usuario=request.user).exists()
        return False
    
    def to_representation(self, instance):
        """Personalizar la representación"""
        data = super().to_representation(instance)
        
        # ✅ Agregar alias de campos
        data['created_at'] = data.get('fecha_creacion')
        data['updated_at'] = data.get('fecha_actualizacion')
        data['status'] = data.get('estado')
        data['owner'] = data.get('usuario')
        
        return data

class LoteCreateFromMapGISSerializer(serializers.Serializer):
    """Serializer para crear lote con datos de MapGIS"""
    
    # Identificador de búsqueda (uno obligatorio)
    cbml = serializers.CharField(required=False, allow_blank=True)
    matricula = serializers.CharField(required=False, allow_blank=True)
    
    # Campos obligatorios del usuario
    nombre = serializers.CharField(
        required=True,
        max_length=255,
        help_text='Nombre identificador del lote'
    )
    
    direccion = serializers.CharField(
        required=True,
        max_length=500,
        help_text='Dirección completa del lote'
    )
    
    descripcion = serializers.CharField(
        required=True,
        help_text='Descripción detallada del lote'
    )
    
    # Campos opcionales adicionales
    barrio = serializers.CharField(required=False, allow_blank=True)
    estrato = serializers.IntegerField(required=False, allow_null=True)
    
    def validate(self, attrs):
        """Validación cruzada"""
        cbml = attrs.get('cbml')
        matricula = attrs.get('matricula')
        
        # Al menos uno debe estar presente
        if not cbml and not matricula:
            raise serializers.ValidationError({
                'cbml': 'Debe proporcionar CBML o Matrícula',
                'matricula': 'Debe proporcionar CBML o Matrícula'
            })
        
        return attrs
    
    def create(self, validated_data):
        """Crear lote con datos de MapGIS"""
        from .services.mapgis_service import MapGISService
        from django.utils import timezone
        
        mapgis_service = MapGISService()
        
        # Determinar tipo de búsqueda
        cbml = validated_data.get('cbml')
        matricula = validated_data.get('matricula')
        
        # Consultar MapGIS
        if cbml:
            resultado = mapgis_service.buscar_por_cbml(cbml)
        else:
            resultado = mapgis_service.buscar_por_matricula(matricula)
            # Si encontramos por matrícula, obtenemos el CBML
            if resultado.get('success') and resultado.get('data', {}).get('cbml'):
                cbml = resultado['data']['cbml']
                # Ahora consultamos por CBML para datos completos
                resultado = mapgis_service.buscar_por_cbml(cbml)
        
        # Verificar que se encontraron datos
        if not resultado.get('success'):
            raise serializers.ValidationError({
                'general': 'No se encontraron datos en MapGIS para el identificador proporcionado'
            })
        
        datos_mapgis = resultado.get('data', {})
        
        # Validar datos obligatorios de MapGIS
        area = datos_mapgis.get('area_lote_m2')
        clasificacion_suelo = datos_mapgis.get('clasificacion_suelo')
        
        if not area or not clasificacion_suelo:
            raise serializers.ValidationError({
                'general': 'Datos incompletos de MapGIS. Faltan área o clasificación de suelo.'
            })
        
        # Preparar datos del lote
        lote_data = {
            'usuario': self.context['request'].user,
            'nombre': validated_data['nombre'],
            'direccion': validated_data['direccion'],
            'descripcion': validated_data['descripcion'],
            'cbml': cbml or None,
            'matricula': matricula or None,
            'area': area,
            'clasificacion_suelo': clasificacion_suelo,
            'estado': 'pending',  # Siempre pending hasta verificación admin
        }
        
        # Agregar campos opcionales del usuario
        if validated_data.get('barrio'):
            lote_data['barrio'] = validated_data['barrio']
        if validated_data.get('estrato'):
            lote_data['estrato'] = validated_data['estrato']
        
        # Mapear datos opcionales de MapGIS
        if datos_mapgis.get('uso_suelo'):
            uso_suelo_data = datos_mapgis['uso_suelo']
            if isinstance(uso_suelo_data, dict):
                categoria = uso_suelo_data.get('categoria_uso', '')
                subcategoria = uso_suelo_data.get('subcategoria_uso', '')
                lote_data['uso_suelo'] = f"{categoria} - {subcategoria}" if subcategoria else categoria
        
        if datos_mapgis.get('aprovechamiento_urbano', {}).get('tratamiento'):
            lote_data['tratamiento_pot'] = datos_mapgis['aprovechamiento_urbano']['tratamiento']
        
        # Guardar todos los datos de MapGIS en metadatos
        lote_data['metadatos'] = {
            'mapgis_data': datos_mapgis,
            'import_date': timezone.now().isoformat(),
            'import_source': 'mapgis_search',
            'search_type': 'cbml' if cbml else 'matricula',
            'original_search_value': cbml or matricula
        }
        
        # Crear el lote
        lote = Lote.objects.create(**lote_data)
        
        return lote