"""
Vistas para operaciones CRUD básicas de lotes
"""
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# Importar el modelo Lote y otros modelos necesarios
from ..models import Lote
from django.utils import timezone

def serialize_lote(lote):
    """
    Convierte un objeto Lote en un diccionario con sus datos.
    Útil para mantener consistencia en la serialización en diferentes vistas.
    
    Args:
        lote: Instancia del modelo Lote
        
    Returns:
        dict: Diccionario con los datos del lote
    """
    return {
        'id': lote.id,
        'nombre': lote.nombre,
        'cbml': getattr(lote, 'cbml', 'N/A'),
        'direccion': getattr(lote, 'direccion', 'N/A'),
        'area': getattr(lote, 'area', 0),
        'descripcion': getattr(lote, 'descripcion', ''),
        'fecha_creacion': getattr(lote, 'fecha_creacion', timezone.now()).strftime('%Y-%m-%d'),
        'fecha_actualizacion': getattr(lote, 'fecha_actualizacion', timezone.now()).strftime('%Y-%m-%d'),
        'estado': getattr(lote, 'estado', 'activo'),
        'matricula': getattr(lote, 'matricula', 'N/A'),
        'barrio': getattr(lote, 'barrio', 'N/A'),
        'estrato': getattr(lote, 'estrato', 0),
        'usuario_id': getattr(lote.usuario, 'id', None),
        'usuario_nombre': f"{getattr(lote.usuario, 'first_name', '')} {getattr(lote.usuario, 'last_name', '')}".strip() or getattr(lote.usuario, 'username', 'Usuario')
    }

# Vista para listar lotes
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_list(request):
    """Lista todos los lotes del usuario actual"""
    try:
        lotes = Lote.objects.filter(usuario=request.user)
        data = [serialize_lote(lote) for lote in lotes]
        
        return Response({
            'count': len(data),
            'results': data
        })
    except Exception as e:
        return Response(
            {"error": f"Error listando lotes: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para ver detalle de un lote
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lote_detail(request, pk):
    """Muestra el detalle de un lote específico"""
    try:
        lote = Lote.objects.get(id=pk, usuario=request.user)
        return Response(serialize_lote(lote))
    except Lote.DoesNotExist:
        return Response(
            {"error": "Lote no encontrado"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error obteniendo detalle del lote: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para crear un lote
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lote_create(request):
    """Crea un nuevo lote"""
    try:
        # Validar datos mínimos
        if not request.data.get('nombre'):
            return Response(
                {"error": "El nombre del lote es obligatorio"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Procesar datos del request
        data = request.data
        
        # Crear el lote
        lote = Lote.objects.create(
            usuario=request.user,
            nombre=data.get('nombre', 'Nuevo lote'),
            cbml=data.get('cbml', ''),
            direccion=data.get('direccion', ''),
            area=float(data.get('area', 0)),
            descripcion=data.get('descripcion', ''),
            matricula=data.get('matricula', ''),
            barrio=data.get('barrio', ''),
            estrato=int(data.get('estrato', 0)),
            fecha_creacion=timezone.now(),
            fecha_actualizacion=timezone.now(),
            estado='activo'
        )
        
        return Response({
            'id': lote.id,
            'mensaje': 'Lote creado exitosamente'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {"error": f"Error creando lote: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

# Vista para actualizar un lote
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def lote_update(request, pk):
    """Actualiza un lote existente"""
    try:
        lote = Lote.objects.get(id=pk, usuario=request.user)
        
        # Actualizar campos
        if 'nombre' in request.data:
            lote.nombre = request.data['nombre']
        if 'cbml' in request.data:
            lote.cbml = request.data['cbml']
        if 'direccion' in request.data:
            lote.direccion = request.data['direccion']
        if 'area' in request.data:
            lote.area = float(request.data['area'])
        if 'descripcion' in request.data:
            lote.descripcion = request.data['descripcion']
        if 'matricula' in request.data:
            lote.matricula = request.data['matricula']
        if 'barrio' in request.data:
            lote.barrio = request.data['barrio']
        if 'estrato' in request.data:
            lote.estrato = int(request.data['estrato'])
        if 'estado' in request.data:
            lote.estado = request.data['estado']
            
        # Actualizar fecha de modificación
        lote.fecha_actualizacion = timezone.now()
        
        lote.save()
        
        return Response({
            'id': lote.id,
            'mensaje': 'Lote actualizado exitosamente'
        })
        
    except Lote.DoesNotExist:
        return Response(
            {"error": "Lote no encontrado"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error actualizando lote: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

# Vista para eliminar un lote
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def lote_delete(request, pk):
    """Elimina un lote"""
    try:
        lote = Lote.objects.get(id=pk, usuario=request.user)
        nombre_lote = lote.nombre
        lote.delete()
        
        return Response({
            'mensaje': f'Lote "{nombre_lote}" eliminado exitosamente'
        })
        
    except Lote.DoesNotExist:
        return Response(
            {"error": "Lote no encontrado"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error eliminando lote: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )