"""
Vistas para consultas a MapGIS - Optimizado y sin duplicaciones
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])  # Endpoint público
def scrap_cbml(request):
    """Busca información de predio por CBML en MapGIS (Endpoint público)"""
    cbml = request.data.get('cbml', '').strip()
    if not cbml:
        return Response({'error': 'CBML es requerido'}, status=status.HTTP_400_BAD_REQUEST)
    
    logger.info(f"Consulta CBML pública: {cbml}")
    
    try:
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        
        # Llamar al servicio de MapGIS
        resultado = mapgis_service.buscar_por_cbml(cbml)
        return Response(resultado)
    
    except Exception as e:
        logger.error(f"Error en scrap CBML: {str(e)}")
        return Response({
            'error': 'Error en consulta',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def scrap_matricula(request):
    """Scrap información de matrícula desde MapGIS"""
    try:
        matricula = request.data.get('matricula')
        if not matricula:
            return Response({'error': 'Matrícula es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Consulta matrícula: {matricula}")
        
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        result = mapgis_service.buscar_por_matricula(matricula)
        
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
            return Response({'error': 'Dirección es requerida'}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Consulta dirección: {direccion}")
        
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        result = mapgis_service.buscar_por_direccion(direccion)
        
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
            return Response({'error': 'CBML es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Consulta restricciones completas: {cbml}")
        
        # Usar el servicio especializado de restricciones
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        result = mapgis_service.buscar_por_cbml(cbml)  # Incluye restricciones
        
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
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        health_result = mapgis_service.health_check()
        
        return Response({
            'mapgis_service': 'operational',
            'status': 'ok',
            'health_check': health_result,
            'timestamp': health_result.get('timestamp', 'N/A')
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en health_mapgis: {str(e)}")
        return Response({
            'mapgis_service': 'error',
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)