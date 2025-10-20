"""
Vistas para tratamientos urbanísticos
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

from ..models import Tratamiento
from ..services.tratamientos_service import TratamientosService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def listar_tratamientos(request):
    """
    Lista todos los tratamientos urbanísticos disponibles
    """
    try:
        tratamientos = Tratamiento.objects.filter(activo=True).order_by('codigo')
        
        data = [{
            'codigo': t.codigo,
            'nombre': t.nombre,
            'descripcion': t.descripcion,
            'indice_ocupacion': float(t.indice_ocupacion) if t.indice_ocupacion else None,
            'indice_construccion': float(t.indice_construccion) if t.indice_construccion else None,
            'altura_maxima': t.altura_maxima,
            'retiro_frontal': float(t.retiro_frontal) if t.retiro_frontal else None,
            'retiro_lateral': float(t.retiro_lateral) if t.retiro_lateral else None,
            'retiro_posterior': float(t.retiro_posterior) if t.retiro_posterior else None,
        } for t in tratamientos]
        
        return Response({
            'success': True,
            'count': len(data),
            'tratamientos': data
        })
        
    except Exception as e:
        logger.error(f"Error listing tratamientos: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error al listar tratamientos'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_tratamiento_por_cbml(request):
    """
    Obtiene el tratamiento urbanístico de un lote por CBML
    
    Query params:
    - cbml: Código CBML del lote
    """
    cbml = request.query_params.get('cbml')
    
    if not cbml:
        return Response({
            'success': False,
            'error': 'CBML es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = TratamientosService()
        tratamiento = service.obtener_tratamiento_por_cbml(cbml)
        
        return Response({
            'success': True,
            'cbml': cbml,
            'tratamiento': tratamiento
        })
        
    except Exception as e:
        logger.error(f"Error getting tratamiento: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error al obtener tratamiento'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calcular_aprovechamiento(request):
    """
    Calcula el aprovechamiento urbanístico de un lote
    
    Body:
    {
        "area_lote": 500,
        "tratamiento_codigo": "CN1"
    }
    """
    area_lote = request.data.get('area_lote')
    tratamiento_codigo = request.data.get('tratamiento_codigo')
    
    if not area_lote or not tratamiento_codigo:
        return Response({
            'success': False,
            'error': 'area_lote y tratamiento_codigo son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = TratamientosService()
        calculo = service.calcular_aprovechamiento(
            area_lote=float(area_lote),
            tratamiento_codigo=tratamiento_codigo
        )
        
        return Response({
            'success': True,
            'calculo': calculo
        })
        
    except Exception as e:
        logger.error(f"Error calculating aprovechamiento: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error al calcular aprovechamiento'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)