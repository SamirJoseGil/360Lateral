"""
Vistas públicas para MapGIS (sin autenticación requerida)
COMPLETO con todas las vistas necesarias
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
import logging
import json
from django.conf import settings

# Importar el cliente MapGIS corregido
from ..services.mapgis.client import MapGISClient

logger = logging.getLogger(__name__)

class PublicMapGISCBMLView(APIView):
    """
    Vista pública para búsqueda por CBML
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Búsqueda por CBML
        
        Body:
        {
            "cbml": "01010010010010"
        }
        """
        try:
            cbml = request.data.get('cbml')
            
            if not cbml:
                logger.warning("Búsqueda por CBML sin parámetro cbml")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'error': 'El parámetro cbml es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Limpiar CBML
            cbml_limpio = str(cbml).strip()
            
            logger.info(f"🔍 [MapGIS] Búsqueda por CBML: {cbml_limpio}")
            
            # Crear cliente y buscar
            client = MapGISClient()
            resultado = client.buscar_por_cbml(cbml_limpio)
            
            if resultado is None:
                logger.warning(f"⚠️ [MapGIS] No se encontraron datos para CBML: {cbml_limpio}")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'error': f'No se encontraron datos para el CBML {cbml_limpio}',
                    'cbml_buscado': cbml_limpio
                })
            
            logger.info(f"✅ [MapGIS] Datos encontrados para CBML: {cbml_limpio}")
            
            return Response({
                'success': True,
                'encontrado': True,
                'data': {
                    **resultado,
                    'cbml': cbml_limpio,
                    'origen_busqueda': 'cbml'
                },
                'message': f'Datos encontrados para CBML {cbml_limpio}',
                'cbml_buscado': cbml_limpio
            })
            
        except Exception as e:
            logger.error(f"❌ [MapGIS] Error en búsqueda por CBML: {str(e)}")
            return Response({
                'success': False,
                'encontrado': False,
                'error': 'Error interno del servidor al consultar MapGIS',
                'details': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicMapGISMatriculaView(APIView):
    """
    Vista pública para búsqueda por matrícula
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Búsqueda por matrícula - CORREGIDO
        
        Body:
        {
            "matricula": "174838" o "00174838"
        }
        """
        try:
            # Validar datos de entrada
            matricula = request.data.get('matricula')
            
            if not matricula:
                logger.warning("Búsqueda por matrícula sin parámetro matricula")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'error': 'El parámetro matricula es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Limpiar matrícula (remover espacios y caracteres especiales)
            matricula_limpia = str(matricula).strip().replace('-', '').replace(' ', '')
            
            if not matricula_limpia.isdigit():
                logger.warning(f"Matrícula inválida (no numérica): {matricula}")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'error': 'La matrícula debe contener solo números'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"🔍 [MapGIS] Búsqueda por matrícula: {matricula_limpia}")
            
            # Crear cliente y buscar
            client = MapGISClient()
            resultado = client.buscar_por_matricula(matricula_limpia)
            
            if resultado is None:
                logger.warning(f"⚠️ [MapGIS] No se encontraron datos para matrícula: {matricula_limpia}")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'error': f'No se encontraron datos para la matrícula {matricula_limpia}',
                    'matricula_buscada': matricula_limpia
                })
            
            # Si encontramos CBML, ahora buscar información completa por CBML
            cbml = resultado.get('cbml')
            if cbml:
                logger.info(f"✅ [MapGIS] CBML encontrado: {cbml} para matrícula: {matricula_limpia}")
                
                # Buscar información completa por CBML
                try:
                    datos_cbml = client.buscar_por_cbml(cbml)
                    
                    if datos_cbml:
                        logger.info(f"✅ [MapGIS] Datos completos obtenidos para CBML: {cbml}")
                        
                        # Combinar datos de matrícula y CBML
                        datos_completos = {
                            **resultado,  # Datos básicos de matrícula
                            **datos_cbml,  # Datos completos de CBML
                            'matricula': matricula_limpia,
                            'cbml': cbml,
                            'origen_busqueda': 'matricula'
                        }
                        
                        return Response({
                            'success': True,
                            'encontrado': True,
                            'cbml_obtenido': True,
                            'data': datos_completos,
                            'message': f'Datos encontrados para matrícula {matricula_limpia}',
                            'matricula_buscada': matricula_limpia
                        })
                    else:
                        logger.warning(f"⚠️ [MapGIS] No se pudieron obtener datos completos para CBML: {cbml}")
                        
                        # Devolver solo los datos básicos de matrícula
                        return Response({
                            'success': True,
                            'encontrado': True,
                            'cbml_obtenido': True,
                            'data': {
                                **resultado,
                                'matricula': matricula_limpia,
                                'origen_busqueda': 'matricula'
                            },
                            'message': f'CBML encontrado para matrícula {matricula_limpia}, pero sin datos detallados',
                            'matricula_buscada': matricula_limpia
                        })
                        
                except Exception as e:
                    logger.error(f"❌ [MapGIS] Error obteniendo datos por CBML {cbml}: {str(e)}")
                    
                    # Devolver los datos básicos que sí tenemos
                    return Response({
                        'success': True,
                        'encontrado': True,
                        'cbml_obtenido': True,
                        'data': {
                            **resultado,
                            'matricula': matricula_limpia,
                            'origen_busqueda': 'matricula'
                        },
                        'message': f'CBML encontrado para matrícula {matricula_limpia}',
                        'matricula_buscada': matricula_limpia,
                        'warning': 'No se pudieron obtener datos detallados'
                    })
            else:
                logger.warning(f"⚠️ [MapGIS] No se encontró CBML para matrícula: {matricula_limpia}")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'cbml_obtenido': False,
                    'error': f'No se encontró CBML para la matrícula {matricula_limpia}',
                    'matricula_buscada': matricula_limpia
                })
                
        except Exception as e:
            logger.error(f"❌ [MapGIS] Error en búsqueda por matrícula: {str(e)}")
            return Response({
                'success': False,
                'encontrado': False,
                'error': 'Error interno del servidor al consultar MapGIS',
                'details': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PublicMapGISDireccionView(APIView):
    """
    Vista pública para búsqueda por dirección
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Búsqueda por dirección
        
        Body:
        {
            "direccion": "Carrera 43A #16-25"
        }
        """
        try:
            direccion = request.data.get('direccion')
            
            if not direccion:
                logger.warning("Búsqueda por dirección sin parámetro direccion")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'error': 'El parámetro direccion es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Limpiar dirección
            direccion_limpia = str(direccion).strip()
            
            if len(direccion_limpia) < 5:
                logger.warning(f"Dirección muy corta: {direccion}")
                return Response({
                    'success': False,
                    'encontrado': False,
                    'error': 'La dirección debe tener al menos 5 caracteres'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"🔍 [MapGIS] Búsqueda por dirección: {direccion_limpia}")
            
            # Crear cliente y buscar
            client = MapGISClient()
            
            # Nota: Para dirección necesitarías implementar el método en el cliente
            # Por ahora devolvemos un mensaje de que no está implementado
            logger.warning("⚠️ [MapGIS] Búsqueda por dirección no implementada en el cliente")
            
            return Response({
                'success': False,
                'encontrado': False,
                'error': 'Búsqueda por dirección no implementada actualmente',
                'direccion_buscada': direccion_limpia
            }, status=status.HTTP_501_NOT_IMPLEMENTED)
            
        except Exception as e:
            logger.error(f"❌ [MapGIS] Error en búsqueda por dirección: {str(e)}")
            return Response({
                'success': False,
                'encontrado': False,
                'error': 'Error interno del servidor al consultar MapGIS',
                'details': str(e) if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== FUNCIONES PARA COMPATIBILIDAD CON IMPORTS EXISTENTES =====

@api_view(['POST'])
@permission_classes([AllowAny])
def public_mapgis_matricula_view(request):
    """Función wrapper para compatibilidad"""
    view = PublicMapGISMatriculaView()
    return view.post(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def public_mapgis_cbml_view(request):
    """Función wrapper para compatibilidad"""
    view = PublicMapGISCBMLView()
    return view.post(request)


@api_view(['POST'])
@permission_classes([AllowAny])
def public_mapgis_direccion_view(request):
    """Función wrapper para compatibilidad"""
    view = PublicMapGISDireccionView()
    return view.post(request)


# ===== HEALTH CHECK PARA MAPGIS =====

@api_view(['GET'])
@permission_classes([AllowAny])
def mapgis_health_check(request):
    """
    Health check del servicio MapGIS
    """
    try:
        client = MapGISClient()
        health = client.health_check()
        
        return Response({
            'service': 'mapgis',
            'status': health.get('status', 'unknown'),
            'available': health.get('mapgis_available', False),
            'session_initialized': health.get('session_initialized', False),
            'base_url': health.get('base_url', ''),
            'timestamp': health.get('timestamp')
        })
        
    except Exception as e:
        logger.error(f"Error in mapgis health check: {str(e)}")
        return Response({
            'service': 'mapgis',
            'status': 'error',
            'available': False,
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)