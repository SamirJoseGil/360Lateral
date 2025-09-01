"""
Serializers para la API REST de tratamientos POT.
"""
from rest_framework import serializers
from .models import TratamientoPOT, FrenteMinimoPOT, AreaMinimaLotePOT, AreaMinimaViviendaPOT


class FrenteMinimoPOTSerializer(serializers.ModelSerializer):
    tipo_vivienda_display = serializers.SerializerMethodField()
    
    class Meta:
        model = FrenteMinimoPOT
        fields = ['id', 'tipo_vivienda', 'tipo_vivienda_display', 'frente_minimo']
    
    def get_tipo_vivienda_display(self, obj):
        return obj.get_tipo_vivienda_display()


class AreaMinimaLotePOTSerializer(serializers.ModelSerializer):
    tipo_vivienda_display = serializers.SerializerMethodField()
    
    class Meta:
        model = AreaMinimaLotePOT
        fields = ['id', 'tipo_vivienda', 'tipo_vivienda_display', 'area_minima']
    
    def get_tipo_vivienda_display(self, obj):
        return obj.get_tipo_vivienda_display()


class AreaMinimaViviendaPOTSerializer(serializers.ModelSerializer):
    tipo_vivienda_display = serializers.SerializerMethodField()
    
    class Meta:
        model = AreaMinimaViviendaPOT
        fields = ['id', 'tipo_vivienda', 'tipo_vivienda_display', 'area_minima']
    
    def get_tipo_vivienda_display(self, obj):
        return obj.get_tipo_vivienda_display()


class TratamientoPOTDetailSerializer(serializers.ModelSerializer):
    frentes_minimos = FrenteMinimoPOTSerializer(many=True, read_only=True)
    areas_minimas_lote = AreaMinimaLotePOTSerializer(many=True, read_only=True)
    areas_minimas_vivienda = AreaMinimaViviendaPOTSerializer(many=True, read_only=True)
    
    class Meta:
        model = TratamientoPOT
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'indice_ocupacion', 'indice_construccion', 'altura_maxima',
            'retiro_frontal', 'retiro_lateral', 'retiro_posterior',
            'frentes_minimos', 'areas_minimas_lote', 'areas_minimas_vivienda',
            'metadatos', 'fecha_creacion', 'fecha_actualizacion', 'activo'
        ]


class TratamientoPOTListSerializer(serializers.ModelSerializer):
    class Meta:
        model = TratamientoPOT
        fields = [
            'id', 'codigo', 'nombre', 'descripcion', 
            'indice_ocupacion', 'indice_construccion', 'altura_maxima', 
            'activo'
        ]


class TratamientoPOTCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TratamientoPOT
        fields = [
            'codigo', 'nombre', 'descripcion',
            'indice_ocupacion', 'indice_construccion', 'altura_maxima',
            'retiro_frontal', 'retiro_lateral', 'retiro_posterior',
            'metadatos', 'activo'
        ]
        

class FrenteMinimoPOTCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrenteMinimoPOT
        fields = ['tratamiento', 'tipo_vivienda', 'frente_minimo']


class AreaMinimaLotePOTCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaMinimaLotePOT
        fields = ['tratamiento', 'tipo_vivienda', 'area_minima']


class AreaMinimaViviendaPOTCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaMinimaViviendaPOT
        fields = ['tratamiento', 'tipo_vivienda', 'area_minima']