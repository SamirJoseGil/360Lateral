"""
Vistas para integración con MapGIS Medellín - CON ENDPOINTS PÚBLICOS
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny  # ✅ CAMBIADO: Ahora es público
from rest_framework.response import Response
from rest_framework import status
import logging

from ..services.mapgis_service import MapGISService

logger = logging.getLogger(__name__)

# ✅ CRÍTICO: Endpoints públicos para MapGIS
@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ SIN AUTENTICACIÓN
def scrap_cbml(request):
    """
    Consultar información de un lote por CBML en MapGIS - PÚBLICO
    
    Request body:
    {
        "cbml": "12070080003"
    }
    """
    try:
        cbml = request.data.get('cbml')
        
        if not cbml:
            return Response({
                'success': False,
                'message': 'El CBML es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"[MapGIS] Consulta pública por CBML: {cbml}")
        
        # Obtener servicio
        mapgis_service = MapGISService()
        
        # Realizar consulta
        resultado = mapgis_service.buscar_por_cbml(cbml)
        
        if not resultado.get('success'):
            return Response({
                'success': False,
                'encontrado': False,
                'message': resultado.get('message', 'No se encontró información para el CBML proporcionado')
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'encontrado': True,
            'data': resultado.get('data', {}),
            'message': 'Información obtenida exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[MapGIS] Error en scrap_cbml: {str(e)}")
        return Response({
            'success': False,
            'encontrado': False,
            'message': f'Error al consultar MapGIS: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ SIN AUTENTICACIÓN
def scrap_matricula(request):
    """
    Consultar información de un lote por matrícula en MapGIS - PÚBLICO
    
    Request body:
    {
        "matricula": "00174838"
    }
    """
    try:
        matricula = request.data.get('matricula')
        
        if not matricula:
            return Response({
                'success': False,
                'message': 'La matrícula es requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"[MapGIS] Consulta pública por matrícula: {matricula}")
        
        # Obtener servicio
        mapgis_service = MapGISService()
        
        # Realizar consulta
        resultado = mapgis_service.buscar_por_matricula(matricula)
        
        if not resultado.get('success'):
            return Response({
                'success': False,
                'encontrado': False,
                'message': resultado.get('message', 'No se encontró información para la matrícula proporcionada'),
                'cbml_obtenido': resultado.get('cbml_obtenido', False)
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'encontrado': True,
            'data': resultado.get('data', {}),
            'cbml_obtenido': resultado.get('cbml_obtenido', False),
            'busqueda_origen': 'matricula',
            'message': 'Información obtenida exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[MapGIS] Error en scrap_matricula: {str(e)}")
        return Response({
            'success': False,
            'encontrado': False,
            'message': f'Error al consultar MapGIS: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ SIN AUTENTICACIÓN (opcional, menos usado)
def consultar_restricciones_completas(request):
    """
    Consultar restricciones completas de un predio - PÚBLICO
    """
    try:
        cbml = request.data.get('cbml')
        matricula = request.data.get('matricula')
        
        if not cbml and not matricula:
            return Response({
                'success': False,
                'message': 'Debe proporcionar CBML o matrícula'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"[MapGIS] Consulta de restricciones - CBML: {cbml}, Matrícula: {matricula}")
        
        mapgis_service = MapGISService()
        
        # Si tenemos matrícula, primero obtener CBML
        if matricula and not cbml:
            resultado_matricula = mapgis_service.buscar_por_matricula(matricula)
            if resultado_matricula.get('success'):
                cbml = resultado_matricula.get('data', {}).get('cbml')
        
        if not cbml:
            return Response({
                'success': False,
                'message': 'No se pudo obtener CBML para consultar restricciones'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Consultar restricciones
        resultado = mapgis_service.buscar_por_cbml(cbml)
        
        return Response({
            'success': resultado.get('success', False),
            'data': resultado.get('data', {}),
            'message': resultado.get('message', 'Restricciones obtenidas')
        }, status=status.HTTP_200_OK if resultado.get('success') else status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"[MapGIS] Error en consultar_restricciones_completas: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al consultar restricciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # ✅ Health check público
def health_mapgis(request):
    """
    Health check de la conexión con MapGIS - PÚBLICO
    """
    try:
        mapgis_service = MapGISService()
        
        # Intentar inicializar sesión
        session_ok = mapgis_service.inicializar_sesion()
        
        return Response({
            'success': True,
            'mapgis_available': session_ok,
            'message': 'MapGIS disponible' if session_ok else 'MapGIS no disponible',
            'timestamp': mapgis_service._get_timestamp()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[MapGIS] Error en health check: {str(e)}")
        return Response({
            'success': False,
            'mapgis_available': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)