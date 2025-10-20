"""
Vistas para MapGIS (autenticadas)
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

from ..services.mapgis_service import MapGISService

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scrap_cbml(request):
    """
    Consulta MapGIS por CBML (autenticado)
    
    Body:
    {
        "cbml": "01010010010010"
    }
    """
    cbml = request.data.get('cbml')
    
    if not cbml:
        return Response({
            'success': False,
            'error': 'CBML es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = MapGISService()
        resultado = service.buscar_por_cbml(cbml)
        
        logger.info(f"CBML query by {request.user.email}: {cbml}")
        
        return Response(resultado)
        
    except Exception as e:
        logger.error(f"Error in scrap_cbml: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error consultando MapGIS'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scrap_matricula(request):
    """
    Consulta MapGIS por matrícula (autenticado)
    
    Body:
    {
        "matricula": "001-123456"
    }
    """
    matricula = request.data.get('matricula')
    
    if not matricula:
        return Response({
            'success': False,
            'error': 'Matrícula es requerida'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = MapGISService()
        resultado = service.buscar_por_matricula(matricula)
        
        logger.info(f"Matricula query by {request.user.email}: {matricula}")
        
        return Response(resultado)
        
    except Exception as e:
        logger.error(f"Error in scrap_matricula: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error consultando MapGIS'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def consultar_restricciones_completas(request):
    """
    Consulta restricciones completas de un lote
    
    Body:
    {
        "cbml": "01010010010010"
    }
    """
    cbml = request.data.get('cbml')
    
    if not cbml:
        return Response({
            'success': False,
            'error': 'CBML es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        service = MapGISService()
        resultado = service.buscar_por_cbml(cbml)
        
        # Extraer solo restricciones
        restricciones = resultado.get('data', {}).get('restricciones_ambientales', {})
        
        return Response({
            'success': True,
            'cbml': cbml,
            'restricciones': restricciones
        })
        
    except Exception as e:
        logger.error(f"Error in consultar_restricciones: {str(e)}")
        return Response({
            'success': False,
            'error': 'Error consultando restricciones'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_mapgis(request):
    """
    Health check del servicio MapGIS
    """
    try:
        service = MapGISService()
        health = service.health_check()
        
        return Response(health)
        
    except Exception as e:
        logger.error(f"Error in health_mapgis: {str(e)}")
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)