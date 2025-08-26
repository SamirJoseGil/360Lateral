"""
Vistas para la consulta de información a través de MapGIS
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

from ..services import lotes_service

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def scrap_cbml(request):
    """Scrap información de CBML desde MapGIS"""
    try:
        cbml = request.data.get('cbml')
        if not cbml:
            return Response({
                'success': False,
                'error': 'CBML requerido'
            }, status=400)
        
        logger.info(f"Consulta CBML: {cbml}")
        
        # Usar el servicio
        result = lotes_service.consultar_predio_completo(cbml, 'cbml')
        
        return Response({
            'success': True,
            'data': result,
            'mensaje': 'Consulta procesada'
        })
        
    except Exception as e:
        logger.error(f"Error en scrap_cbml: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def scrap_matricula(request):
    """Scrap información de matrícula desde MapGIS"""
    try:
        matricula = request.data.get('matricula')
        if not matricula:
            return Response({
                'success': False,
                'error': 'Matrícula requerida'
            }, status=400)
        
        logger.info(f"Consulta matrícula: {matricula}")
        
        # Usar el servicio
        result = lotes_service.consultar_predio_completo(matricula, 'matricula')
        
        return Response({
            'success': True,
            'data': result,
            'mensaje': 'Consulta procesada'
        })
        
    except Exception as e:
        logger.error(f"Error en scrap_matricula: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def scrap_direccion(request):
    """Scrap información de dirección desde MapGIS"""
    try:
        direccion = request.data.get('direccion')
        if not direccion:
            return Response({
                'success': False,
                'error': 'Dirección requerida'
            }, status=400)
        
        logger.info(f"Consulta dirección: {direccion}")
        
        # Usar el servicio
        result = lotes_service.consultar_predio_completo(direccion, 'direccion')
        
        return Response({
            'success': True,
            'data': result,
            'mensaje': 'Consulta procesada'
        })
        
    except Exception as e:
        logger.error(f"Error en scrap_direccion: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def consultar_restricciones_completas(request):
    """Consulta completa de restricciones ambientales"""
    try:
        cbml = request.data.get('cbml')
        if not cbml:
            return Response({
                'success': False,
                'error': 'CBML requerido'
            }, status=400)
        
        logger.info(f"Consulta restricciones completas: {cbml}")
        
        # Usar el servicio especializado de restricciones
        from ..services import mapgis_service
        result = mapgis_service.consultar_restricciones_completas(cbml)
        
        return Response({
            'success': True,
            'data': result,
            'mensaje': 'Consulta de restricciones procesada'
        })
        
    except Exception as e:
        logger.error(f"Error en consultar_restricciones_completas: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_mapgis(request):
    """Health check para MapGIS"""
    try:
        # Usar el health check del servicio MapGIS
        from ..services import mapgis_service
        health_result = mapgis_service.health_check()
        
        return Response({
            'mapgis_service': 'operational',
            'status': 'ok',
            'health_check': health_result,
            'timestamp': lotes_service._get_timestamp()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en health_mapgis: {str(e)}")
        return Response({
            'mapgis_service': 'error',
            'status': 'error',
            'error': str(e),
            'timestamp': lotes_service._get_timestamp()
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)