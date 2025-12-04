"""
Serializers para el módulo MapGIS
"""
from rest_framework import serializers


class MapGISDataSerializer(serializers.Serializer):
    """Serializer para datos completos de MapGIS"""
    
    cbml = serializers.CharField(max_length=11)  # ✅ CORREGIDO: 11 dígitos
    area_lote = serializers.CharField(required=False, allow_null=True)
    area_lote_m2 = serializers.FloatField(required=False, allow_null=True)
    clasificacion_suelo = serializers.CharField(required=False, allow_null=True)
    es_urbano = serializers.BooleanField(required=False)
    uso_suelo = serializers.DictField(required=False, allow_null=True)
    aprovechamiento_urbano = serializers.DictField(required=False, allow_null=True)
    restricciones_ambientales = serializers.DictField(required=False, allow_null=True)
    casos_pot = serializers.JSONField(required=False, allow_null=True)
    casos_pot_text = serializers.CharField(required=False, allow_null=True)
    geometria = serializers.JSONField(required=False, allow_null=True)
    fuente = serializers.CharField(default='MapGIS Medellín')
    fecha_consulta = serializers.CharField()


class RestriccionesSerializer(serializers.Serializer):
    """Serializer para restricciones ambientales"""
    
    cbml = serializers.CharField(max_length=11)  # ✅ CORREGIDO: 11 dígitos
    amenaza_riesgo = serializers.CharField(required=False, allow_null=True)
    retiros_rios = serializers.CharField(required=False, allow_null=True)
    fecha_consulta = serializers.CharField()


class MapGISCacheSerializer(serializers.Serializer):
    """Serializer para consulta de cache"""
    
    cbml = serializers.CharField(max_length=11)  # ✅ CORREGIDO: 11 dígitos
    data = serializers.JSONField()
    consulted_at = serializers.DateTimeField()
    expiry_date = serializers.DateTimeField()
    is_valid = serializers.BooleanField()
    hit_count = serializers.IntegerField()
