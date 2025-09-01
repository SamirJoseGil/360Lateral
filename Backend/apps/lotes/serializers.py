"""
Serializers para la aplicación de lotes
"""
from rest_framework import serializers
from .models import Lote
from django.contrib.auth import get_user_model

User = get_user_model()

class LoteSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='usuario',
        required=False,
        allow_null=True,
        default=None
    )
    
    class Meta:
        model = Lote
        fields = [
            'id', 'nombre', 'cbml', 'direccion', 'area', 'descripcion',
            'matricula', 'barrio', 'estrato', 'codigo_catastral',
            'latitud', 'longitud', 'tratamiento_pot', 'uso_suelo',
            'clasificacion_suelo', 'estado', 'metadatos', 'owner',
            'fecha_creacion', 'fecha_actualizacion'
            # Ensure no 'proyecto' field is present here if not in the model
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
    
    def to_internal_value(self, data):
        """
        Pre-procesa los datos para manejar el campo 'owner' correctamente.
        """
        if 'owner' in data:
            # Ya tenemos un source='usuario' configurado, pero asegurémonos
            # de que no haya también un campo 'usuario' directo
            if 'usuario' in data:
                data.pop('usuario')  # Evitar conflicto
        
        return super().to_internal_value(data)
    
    def create(self, validated_data):
        """
        Sobrescribiendo el método create para manejar correctamente el campo 'usuario'
        """
        # Eliminar 'owner' si está presente en validated_data
        validated_data.pop('owner', None)

        request = self.context.get('request')
        
        # Si no se proporciona un usuario, usar el usuario de la solicitud
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if 'usuario' not in validated_data or validated_data.get('usuario') is None:
                validated_data['usuario'] = request.user
        
        # Crear el lote con los datos validados
        return Lote.objects.create(**validated_data)

class LoteDetailSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='usuario',
        required=False,
        allow_null=True,
        default=None
    )

    class Meta:
        model = Lote
        fields = [
            'id', 'nombre', 'cbml', 'direccion', 'area', 'descripcion',
            'matricula', 'barrio', 'estrato', 'codigo_catastral',
            'latitud', 'longitud', 'tratamiento_pot', 'uso_suelo',
            'clasificacion_suelo', 'estado', 'metadatos', 'owner',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']