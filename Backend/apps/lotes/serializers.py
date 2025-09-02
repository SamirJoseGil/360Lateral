"""
Serializers para la aplicación de lotes
"""
from rest_framework import serializers
from .models import Lote, Favorite
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
    is_favorite = serializers.SerializerMethodField()
    
    class Meta:
        model = Lote
        fields = [
            'id', 'nombre', 'cbml', 'direccion', 'area', 'descripcion',
            'matricula', 'barrio', 'estrato', 'codigo_catastral',
            'latitud', 'longitud', 'tratamiento_pot', 'uso_suelo',
            'clasificacion_suelo', 'estado', 'metadatos', 'owner',
            'fecha_creacion', 'fecha_actualizacion', 'is_favorite'
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

    def get_is_favorite(self, obj):
        """
        Check if the current user has added this lot to favorites.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False

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

class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for the Favorite model.
    """
    lote_id = serializers.PrimaryKeyRelatedField(
        source='lote',
        queryset=Lote.objects.all()
    )
    lote_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorite
        fields = ['id', 'lote_id', 'lote_detail', 'created_at', 'notes']
        read_only_fields = ['created_at']
    
    def get_lote_detail(self, obj):
        """
        Provides a simplified representation of the associated lot.
        """
        from .serializers import LoteListSerializer
        return LoteListSerializer(obj.lote).data
    
    def create(self, validated_data):
        """
        Create a new favorite, setting the user from the request.
        """
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)