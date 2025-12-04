"""
Vistas del módulo MapGIS
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.cache import cache
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes

from .services.mapgis_service import mapgis_service
from .serializers import MapGISDataSerializer, RestriccionesSerializer
from .models import MapGISCache
from .services.mapgis_core import MapGISCore

import logging

logger = logging.getLogger(__name__)


class ConsultaCBMLView(APIView):
    """
    Vista para consulta completa de un lote por CBML
    
    GET /api/mapgis/consulta/cbml/<cbml>/
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(ratelimit(key='user', rate='5/m', method='GET'))
    def get(self, request, cbml: str):
        """Consultar información completa de un lote por CBML"""
        try:
            logger.info(f"[MapGIS] Consulta CBML: {cbml} por usuario {request.user.email}")
            
            # ✅ CRÍTICO: Llamar directamente al core (sin capas intermedias)
            core = MapGISCore()
            datos = core.consultar_datos_completos(cbml)
            
            # ✅ Verificar si hay error
            if datos.get('error'):
                error_msg = datos.get('mensaje', 'No se encontró información')
                logger.warning(f"[MapGIS] ❌ {error_msg} - CBML: {cbml}")
                
                return Response({
                    'error': True,
                    'mensaje': error_msg,
                    'cbml': cbml
                }, status=status.HTTP_404_NOT_FOUND)
            
            # ✅ CRÍTICO: Los datos YA están en el diccionario correcto
            # No hay 'data' wrapper, los datos están directamente en 'datos'
            logger.info(f"[MapGIS] Keys en datos: {list(datos.keys())}")
            logger.info(f"[MapGIS] Clasificación: {datos.get('clasificacion_suelo')}")
            logger.info(f"[MapGIS] Uso suelo: {bool(datos.get('usos_generales'))}")
            logger.info(f"[MapGIS] Aprovechamiento: {bool(datos.get('aprovechamientos_urbanos'))}")
            
            # ✅ SIMPLIFICADO: Si llegamos aquí, retornar los datos
            logger.info(f"[MapGIS] ✅ Retornando datos para CBML: {cbml}")
            
            # ✅ NUEVO: Procesar datos para frontend (estructura clara)
            response_data = {
                'cbml': datos.get('cbml', cbml),
                'clasificacion_suelo': datos.get('clasificacion_suelo'),
                'es_urbano': datos.get('clasificacion_suelo') == 'Urbano',
                'fuente': 'MapGIS Medellín',
                'fecha_consulta': datos.get('fecha_consulta', ''),
            }
            
            # Procesar uso de suelo
            if datos.get('usos_generales') and len(datos['usos_generales']) > 0:
                uso = datos['usos_generales'][0]
                response_data['uso_suelo'] = {
                    'categoria_uso': uso.get('categoria_uso'),
                    'subcategoria_uso': uso.get('subcategoria_uso'),
                    'codigo_subcategoria': uso.get('codigo_subcategoria'),
                    'porcentaje': uso.get('porcentaje')
                }
            
            # Procesar aprovechamiento urbano
            if datos.get('aprovechamientos_urbanos') and len(datos['aprovechamientos_urbanos']) > 0:
                aprov = datos['aprovechamientos_urbanos'][0]
                response_data['aprovechamiento_urbano'] = {
                    'tratamiento': aprov.get('tratamiento'),
                    'codigo_tratamiento': aprov.get('codigo_tratamiento'),
                    'densidad_habitacional_max': aprov.get('densidad_habitacional_max'),
                    'indice_construccion_max': aprov.get('indice_construccion_max'),
                    'altura_normativa': aprov.get('altura_normativa'),
                    'identificador': aprov.get('identificador')
                }
            
            # Procesar restricciones ambientales
            response_data['restricciones_ambientales'] = {
                'amenaza_riesgo': datos.get('restriccion_amenaza_riesgo'),
                'retiros_rios': datos.get('restriccion_retiros_rios') or 'Sin restricciones'
            }
            
            logger.info(f"[MapGIS] Estructura final: {list(response_data.keys())}")
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"[MapGIS] Error: {str(e)}", exc_info=True)
            return Response({
                'error': True,
                'mensaje': 'Error interno del servidor',
                'cbml': cbml
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RestriccionesView(APIView):
    """
    Vista para consulta de restricciones ambientales
    
    GET /api/mapgis/consulta/restricciones/<cbml>/
    """
    permission_classes = [IsAuthenticated]
    
    @method_decorator(ratelimit(key='user', rate='5/m', method='GET'))
    def get(self, request, cbml: str):
        """Consultar solo restricciones ambientales"""
        try:
            logger.info(f"[MapGIS] Consulta restricciones: {cbml}")
            
            # Validar CBML
            if not cbml or len(cbml) != 11 or not cbml.isdigit():
                return Response({
                    'error': True,
                    'mensaje': 'CBML inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Consultar restricciones
            resultado = mapgis_service.consultar_restricciones(cbml)
            
            if resultado.get('error'):
                return Response(resultado, status=status.HTTP_404_NOT_FOUND)
            
            # Serializar
            serializer = RestriccionesSerializer(data=resultado.get('datos', {}))
            if serializer.is_valid():
                return Response({
                    'success': True,
                    'data': serializer.validated_data
                }, status=status.HTTP_200_OK)
            
            return Response(resultado, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"[MapGIS] Error en restricciones: {str(e)}")
            return Response({
                'error': True,
                'mensaje': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MapGISHealthView(APIView):
    """
    Health check del servicio MapGIS
    Endpoint público para verificar conectividad
    
    GET /api/mapgis/health/
    """
    permission_classes = []  # Público
    
    def get(self, request):
        """Verificar estado del servicio MapGIS"""
        try:
            logger.info("🏥 Health check MapGIS solicitado")
            
            health_data = mapgis_service.core.health_check()
            
            http_status = status.HTTP_200_OK if health_data['status'] == 'ok' else status.HTTP_503_SERVICE_UNAVAILABLE
            
            return Response(health_data, status=http_status)
            
        except Exception as e:
            logger.error(f"❌ Error en health check: {str(e)}")
            return Response({
                'status': 'error',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ClearCacheView(APIView):
    """
    Limpiar cache de MapGIS (solo admin)
    
    POST /api/mapgis/cache/clear/
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """Limpiar cache de MapGIS"""
        try:
            cbml = request.data.get('cbml')
            
            if cbml:
                # Invalidar cache específico
                mapgis_service.invalidar_cache(cbml)
                return Response({
                    'success': True,
                    'mensaje': f'Cache invalidado para CBML: {cbml}'
                }, status=status.HTTP_200_OK)
            else:
                # Limpiar todo el cache
                count = MapGISCache.cleanup_expired()
                cache.clear()
                return Response({
                    'success': True,
                    'mensaje': f'Cache limpiado. {count} registros eliminados'
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Error limpiando cache: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def consulta_cbml(request, cbml):
    """
    Consulta MapGIS por CBML (11 dígitos según MapGIS Medellín)
    """
    try:
        # ✅ CORRECCIÓN: MapGIS Medellín requiere exactamente 11 dígitos
        if not cbml or len(cbml) != 11:
            logger.warning(f"[MapGIS] CBML inválido recibido: {cbml} (longitud: {len(cbml) if cbml else 0})")
            return Response({
                'error': 'CBML inválido. Debe tener exactamente 11 dígitos numéricos.',
                'mensaje': 'El CBML debe estar compuesto siempre por 11 dígitos, compruebe el número de caracteres y utilice solo dígitos!',
                'cbml_recibido': cbml,
                'longitud': len(cbml) if cbml else 0
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not cbml.isdigit():
            logger.warning(f"[MapGIS] CBML no numérico: {cbml}")
            return Response({
                'error': 'CBML inválido. Debe contener solo dígitos.',
                'mensaje': 'El CBML debe estar compuesto siempre por 11 dígitos, compruebe el número de caracteres y utilice solo dígitos!'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"[MapGIS] Consulta CBML: {cbml} por usuario {request.user.email}")
        
        # ✅ Intentar importar el servicio real
        try:
            from apps.mapgis.services.mapgis_service import MapGISService
        except ImportError:
            logger.warning("[MapGIS] Servicio MapGIS no implementado aún, devolviendo error")
            return Response({
                'error': 'Servicio MapGIS temporalmente no disponible',
                'mensaje': 'El sistema de consulta está en mantenimiento. Intenta más tarde.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # ✅ Consultar MapGIS
        mapgis_service = MapGISService()
        resultado = mapgis_service.consultar_lote_completo(cbml)
        
        # ✅ CORRECCIÓN: Verificar si MapGIS encontró datos
        if resultado.get('error'):
            mensaje_error = resultado.get('mensaje', 'No se encontró información')
            logger.warning(f"[MapGIS] CBML {cbml} no encontrado: {mensaje_error}")
            
            # ✅ Si MapGIS dice que no existe, devolver 404
            if 'no existe' in mensaje_error.lower() or 'no encontr' in mensaje_error.lower():
                return Response({
                    'error': 'Lote no encontrado en MapGIS',
                    'cbml': cbml,
                    'mensaje': 'No se pudieron obtener datos para este CBML. El lote no existe o no tiene información disponible en MapGIS de Medellín.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # ✅ Otros errores
            return Response({
                'error': True,
                'mensaje': mensaje_error,
                'cbml': cbml
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # ✅ Verificar que haya datos reales (no solo estructura vacía)
        datos = resultado.get('datos', {})
        if not datos or all(v is None or v == '' for v in datos.values()):
            logger.warning(f"[MapGIS] CBML {cbml} devuelve estructura vacía")
            return Response({
                'error': 'Sin información disponible',
                'cbml': cbml,
                'mensaje': 'No se pudieron obtener datos para este CBML. El lote no existe o no tiene información disponible en MapGIS de Medellín.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # ✅ Retornar datos REALES
        logger.info(f"[MapGIS] ✅ Consulta exitosa para CBML: {cbml}")
        return Response(datos, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"[MapGIS] Error en consulta: {str(e)}", exc_info=True)
        return Response({
            'error': 'Error al consultar MapGIS',
            'mensaje': 'Ocurrió un error interno al procesar la consulta',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def health_check(request):
    """Health check del servicio MapGIS"""
    try:
        from apps.mapgis.services.mapgis_service import MapGISService
        
        try:
            service = MapGISService()
            return Response({
                'status': 'online',
                'service': 'MapGIS Scraper',
                'version': '1.0.0',
                'message': 'Servicio disponible',
                'implementation': 'real',
                'cbml_format': '11 dígitos numéricos'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'status': 'degraded',
                'service': 'MapGIS Scraper',
                'message': f'Servicio con problemas: {str(e)}',
                'implementation': 'real'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
    except ImportError:
        return Response({
            'status': 'mock',
            'service': 'MapGIS Scraper',
            'version': '1.0.0-mock',
            'message': 'Usando datos MOCK (servicio real no implementado)',
            'implementation': 'mock',
            'cbml_format': '11 dígitos numéricos'
        }, status=status.HTTP_200_OK)
