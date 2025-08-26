"""
Serializers para la aplicación de lotes
"""
from rest_framework import serializers
from .models import Lote
from apps.users.serializers import UserSimpleSerializer

class LoteSerializer(serializers.ModelSerializer):
    """
    Serializer para listar lotes con información básica
    """
    owner_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Lote
        fields = ['id', 'nombre', 'direccion', 'area', 'codigo_catastral',
                  'matricula', 'cbml', 'estrato', 'owner', 'owner_name',
                  'status', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.username
        return "Sin propietario"


class LoteDetailSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar detalles completos de un lote
    """
    owner = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = Lote
        fields = ['id', 'nombre', 'descripcion', 'direccion', 'area', 
                  'codigo_catastral', 'matricula', 'cbml', 'latitud', 'longitud',
                  'estrato', 'owner', 'tratamiento_pot', 'uso_suelo',
                  'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']