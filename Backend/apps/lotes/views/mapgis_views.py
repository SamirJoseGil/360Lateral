"""
Vistas para consultas MapGIS
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
    Consultar información de un lote por CBML
    """
    try:
        cbml = request.data.get('cbml')
        
        if not cbml:
            return Response({
                'success': False,
                'message': 'CBML es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"🔍 Consulta MapGIS por CBML: {cbml}")
        
        mapgis_service = MapGISService()
        resultado = mapgis_service.buscar_por_cbml(cbml)
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en scrap_cbml: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error en consulta MapGIS',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scrap_matricula(request):
    """Busca información de predio por matrícula inmobiliaria en MapGIS"""
    matricula = request.data.get('matricula', '')
    if not isinstance(matricula, str):
        matricula = str(matricula)
    matricula = matricula.strip()
    if not matricula:
        return Response({
            'success': False,
            'encontrado': False,
            'message': 'Matrícula es requerida'
        }, status=400)
    
    logger.info(f"🔍 Consulta matrícula: {matricula}")
    
    try:
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        
        # Llamar al servicio de MapGIS REAL
        resultado = mapgis_service.buscar_por_matricula(matricula)
        
        logger.info(f"📊 Resultado matrícula {matricula}: encontrado={resultado.get('encontrado', False)}, cbml={resultado.get('cbml_obtenido')}")
        
        return Response(resultado)
    
    except Exception as e:
        logger.error(f"❌ Error en scrap_matricula: {str(e)}")
        return Response({
            'encontrado': False,
            'error': True,
            'mensaje': 'Error en consulta',
            'detalle': str(e),
            'codigo_error': 'SERVER_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def consultar_restricciones_completas(request):
    """
    Consultar restricciones ambientales de un lote
    """
    try:
        cbml = request.data.get('cbml')
        
        if not cbml:
            return Response({
                'success': False,
                'message': 'CBML es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"🌿 Consultando restricciones para CBML: {cbml}")
        
        mapgis_service = MapGISService()
        resultado = mapgis_service.buscar_por_cbml(cbml)
        
        if resultado.get('success'):
            # Extraer solo restricciones ambientales
            restricciones = resultado.get('data', {}).get('restricciones_ambientales', {})
            
            return Response({
                'success': True,
                'data': restricciones,
                'cbml': cbml
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': resultado.get('message', 'No se encontró información')
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"Error consultando restricciones: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error consultando restricciones',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_mapgis(request):
    """
    Health check del servicio MapGIS
    """
    try:
        mapgis_service = MapGISService()
        
        # Hacer una consulta de prueba
        test_cbml = "01050100100010"
        resultado = mapgis_service.buscar_por_cbml(test_cbml)
        
        if resultado.get('success'):
            return Response({
                'status': 'healthy',
                'service': 'MapGIS',
                'message': 'Servicio MapGIS operacional'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': 'degraded',
                'service': 'MapGIS',
                'message': 'Servicio MapGIS con problemas'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
    except Exception as e:
        logger.error(f"Error en health check MapGIS: {str(e)}")
        return Response({
            'status': 'unhealthy',
            'service': 'MapGIS',
            'message': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)