"""
Vistas para consultas a MapGIS
"""
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

from ..services import lotes_service
from ..services.mapgis_service import MapGISService

logger = logging.getLogger(__name__)

# Buscando la vista de scrap_cbml
@api_view(['POST'])
@permission_classes([AllowAny])  # Cambiado a AllowAny para hacer este endpoint público
def scrap_cbml(request):
    """Busca información de predio por CBML en MapGIS (Endpoint público)"""
    cbml = request.data.get('cbml', '').strip()
    if not cbml:
        return Response({'error': 'CBML es requerido'}, status=status.HTTP_400_BAD_REQUEST)
    
    logger.info(f"Consulta CBML pública: {cbml}")
    
    try:
        # Importamos aquí para evitar dependencia circular
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

# Añadiendo endpoints públicos para consultas MapGIS
# Estos endpoints no requieren autenticación

@api_view(['POST'])
@permission_classes([AllowAny])
def public_scrap_matricula(request):
    """Versión pública: Busca información de predio por matrícula inmobiliaria en MapGIS"""
    matricula = request.data.get('matricula', '').strip()
    if not matricula:
        return Response({'error': 'Matrícula inmobiliaria es requerida'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Importamos aquí para evitar dependencia circular
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        
        # Llamar al servicio de MapGIS
        resultado = mapgis_service.buscar_por_matricula(matricula)
        return Response(resultado)
    
    except Exception as e:
        logger.error(f"Error en scrap matrícula público: {str(e)}")
        return Response({
            'error': 'Error en consulta',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def public_scrap_direccion(request):
    """Versión pública: Busca información de predio por dirección en MapGIS"""
    direccion = request.data.get('direccion', '').strip()
    if not direccion:
        return Response({'error': 'Dirección es requerida'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Importamos aquí para evitar dependencia circular
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        
        # Llamar al servicio de MapGIS
        resultado = mapgis_service.buscar_por_direccion(direccion)
        return Response(resultado)
    
    except Exception as e:
        logger.error(f"Error en scrap dirección público: {str(e)}")
        return Response({
            'error': 'Error en consulta',
            'detalle': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.views import APIView

# Clase pública para consultas MapGIS
class PublicMapGISView(APIView):
    """Vista pública para consultas de MapGIS - No requiere autenticación"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        """Maneja consultas de CBML públicas"""
        cbml = request.data.get('cbml', '').strip()
        if not cbml:
            return Response({'error': 'CBML es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Consulta CBML pública: {cbml}")
        
        try:
            # Importamos aquí para evitar dependencia circular
            from ..services.mapgis_service import MapGISService
            mapgis_service = MapGISService()
            
            # Llamar al servicio de MapGIS
            resultado = mapgis_service.buscar_por_cbml(cbml)
            return Response(resultado)
        
        except Exception as e:
            logger.error(f"Error en consulta pública de CBML: {str(e)}")
            return Response({
                'error': 'Error en consulta',
                'detalle': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Vista para consultar CBML
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scrap_cbml(request):
    """Consulta información de un predio por CBML"""
    try:
        cbml = request.data.get('cbml')
        
        if not cbml:
            return Response(
                {"error": "CBML requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        mapgis_service = MapGISService()
        resultado = mapgis_service.buscar_por_cbml(cbml)
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Error consultando información: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para consultar por matrícula inmobiliaria
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scrap_matricula(request):
    """Consulta información de un predio por matrícula inmobiliaria"""
    try:
        matricula = request.data.get('matricula')
        
        if not matricula:
            return Response(
                {"error": "Matrícula inmobiliaria requerida"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        mapgis_service = MapGISService()
        resultado = mapgis_service.buscar_por_matricula(matricula)
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Error consultando información: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para consultar por dirección
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scrap_direccion(request):
    """Consulta información de un predio por dirección"""
    try:
        direccion = request.data.get('direccion')
        
        if not direccion:
            return Response(
                {"error": "Dirección requerida"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        mapgis_service = MapGISService()
        resultado = mapgis_service.buscar_por_direccion(direccion)
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Error consultando información: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para consultar restricciones completas
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def consultar_restricciones_completas(request):
    """Consulta restricciones completas para un predio"""
    try:
        cbml = request.data.get('cbml')
        
        if not cbml:
            return Response(
                {"error": "CBML requerido"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        mapgis_service = MapGISService()
        # Este método debería existir en el servicio
        # Si no existe, devolvemos un mensaje informativo
        if hasattr(mapgis_service, 'consultar_restricciones_completas'):
            resultado = mapgis_service.consultar_restricciones_completas(cbml)
        else:
            resultado = {
                "success": False,
                "error": "Funcionalidad no implementada",
                "codigo_error": "NOT_IMPLEMENTED"
            }
        
        return Response(resultado, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Error consultando restricciones: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vista para verificar salud del servicio MapGIS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_mapgis(request):
    """Verifica el estado del servicio MapGIS"""
    try:
        mapgis_service = MapGISService()
        health_status = mapgis_service.health_check()
        
        return Response(health_status, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {"error": f"Error verificando estado del servicio: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Vistas para testing (versiones simplificadas)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_mapgis_session(request):
    """Prueba la inicialización de sesión en MapGIS"""
    return Response({"status": "Esta funcionalidad es solo para pruebas"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_mapgis_real_connection(request):
    """Prueba la conexión real a MapGIS"""
    return Response({"status": "Esta funcionalidad es solo para pruebas"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_mapgis_complete_data(request):
    """Prueba la obtención de datos completos en MapGIS"""
    return Response({"status": "Esta funcionalidad es solo para pruebas"})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def investigate_mapgis_endpoints(request):
    """Investiga endpoints disponibles en MapGIS"""
    return Response({"status": "Esta funcionalidad es solo para pruebas"})