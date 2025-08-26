"""
Vistas CRUD para la gestión de lotes
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

from ..models import Lote
from ..serializers import LoteSerializer, LoteDetailSerializer

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def lote_list(request):
    """
    GET: Listar todos los lotes
    POST: Crear un nuevo lote
    """
    if request.method == 'GET':
        try:
            # Filtrar lotes según permisos
            user = request.user
            if user.is_superuser or user.role == 'admin':
                lotes = Lote.objects.all()
            elif user.role == 'developer':
                # Simplificado sin proyectos por ahora
                lotes = Lote.objects.filter(owner=user)
            else:
                lotes = Lote.objects.filter(owner=user)
                
            serializer = LoteSerializer(lotes, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Capturar errores de base de datos y proporcionar mensaje útil
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al acceder a lotes: {str(e)}")
            
            if "no existe la relación" in str(e).lower():
                return Response({
                    "error": "La tabla de lotes no existe en la base de datos.",
                    "detail": "Este error ocurre cuando las migraciones no se han aplicado. Ejecuta 'python manage.py migrate' para crear las tablas necesarias.",
                    "code": "table_not_exists"
                }, status=500)
            
            return Response({
                "error": "Error al recuperar lotes",
                "detail": str(e)
            }, status=500)
    
    elif request.method == 'POST':
        serializer = LoteSerializer(data=request.data)
        if serializer.is_valid():
            # Asignar el propietario si no se proporcionó
            if 'owner' not in serializer.validated_data:
                serializer.validated_data['owner'] = request.user
                
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def lote_detail(request, pk):
    """
    GET: Obtener detalles de un lote
    PUT: Actualizar un lote
    DELETE: Eliminar un lote
    """
    try:
        lote = Lote.objects.get(pk=pk)
    except Lote.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error al acceder a lote {pk}: {str(e)}")
        
        if "no existe la relación" in str(e).lower():
            return Response({
                "error": "La tabla de lotes no existe en la base de datos.",
                "detail": "Este error ocurre cuando las migraciones no se han aplicado. Ejecuta 'python manage.py migrate' para crear las tablas necesarias.",
                "code": "table_not_exists"
            }, status=500)
        
        return Response({
            "error": "Error al recuperar lote",
            "detail": str(e)
        }, status=500)
    
    # Verificar permisos
    user = request.user
    if not (user.is_superuser or user.role == 'admin' or lote.owner == user):
        return Response({'detail': 'No tienes permiso para acceder a este lote'}, 
                      status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = LoteDetailSerializer(lote)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = LoteDetailSerializer(lote, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if not (user.is_superuser or user.role == 'admin'):
            return Response({'detail': 'Solo los administradores pueden eliminar lotes'},
                          status=status.HTTP_403_FORBIDDEN)
        lote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)