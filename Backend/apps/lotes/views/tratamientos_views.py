"""
Vistas para la gestión de tratamientos urbanísticos y POT - Optimizado
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def listar_tratamientos(request):
    """Listar tratamientos del POT disponibles"""
    try:
        # Usar servicio de tratamientos
        from ..services.tratamientos_service import tratamientos_service
        resultado = tratamientos_service.listar_tratamientos()
        
        if resultado.get('error'):
            return Response({
                'success': False,
                'error': resultado['error']
            }, status=500)
        
        return Response({
            'success': True,
            'tratamientos': resultado.get('tratamientos', {}),
            'count': resultado.get('total', 0),
            'timestamp': tratamientos_service._get_timestamp() if hasattr(tratamientos_service, '_get_timestamp') else None
        })
        
    except Exception as e:
        logger.error(f"Error en listar_tratamientos: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def obtener_tratamiento_por_cbml(request):
    """Obtener tratamiento aplicable a un predio por CBML"""
    try:
        cbml = request.data.get('cbml')
        if not cbml:
            return Response({
                'success': False,
                'error': 'CBML es requerido'
            }, status=400)
        
        from ..services.mapgis_service import MapGISService
        mapgis_service = MapGISService()
        
        # Buscar en MapGIS
        resultado = mapgis_service.buscar_por_cbml(cbml)
        
        if resultado.get('encontrado') and resultado.get('datos'):
            datos = resultado.get('datos', {})
            aprovechamiento = datos.get('aprovechamiento_urbano', {})
            
            if aprovechamiento.get('tratamiento'):
                return Response({
                    'success': True,
                    'cbml': cbml,
                    'tratamiento': aprovechamiento.get('tratamiento'),
                    'densidad_habitacional_max': aprovechamiento.get('densidad_habitacional_max'),
                    'altura_normativa': aprovechamiento.get('altura_normativa')
                })
        
        return Response({
            'success': False,
            'error': f'No se encontró tratamiento para el CBML {cbml}'
        }, status=404)
        
    except Exception as e:
        logger.error(f"Error en obtener_tratamiento_por_cbml: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def calcular_aprovechamiento(request):
    """Calcular aprovechamiento urbanístico para un lote"""
    try:
        # Obtener parámetros
        tratamiento_nombre = request.data.get('tratamiento')
        area_lote = request.data.get('area_lote')
        tipologia = request.data.get('tipologia', 'multifamiliar')
        
        if not tratamiento_nombre or not area_lote:
            return Response({
                'success': False,
                'error': 'Tratamiento y área del lote son requeridos'
            }, status=400)
        
        from ..services.tratamientos_service import tratamientos_service
        resultado = tratamientos_service.calcular_aprovechamiento(
            tratamiento_nombre, 
            float(area_lote), 
            tipologia
        )
        
        return Response({
            'success': not resultado.get('error', False),
            'data': resultado
        })
        
    except Exception as e:
        logger.error(f"Error en calcular_aprovechamiento: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)