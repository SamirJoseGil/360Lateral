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