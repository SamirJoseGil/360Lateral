"""
Servicio principal para integración con MapGIS Medellín - VERSIÓN CORREGIDA
"""

import logging
from typing import Dict, Optional
from django.core.cache import cache

logger = logging.getLogger(__name__)

class MapGISService:
    """Servicio principal para interactuar con MapGIS"""
    
    def __init__(self):
        # ✅ CRÍTICO: Inicializar el cliente DESPUÉS de importar
        # Importación tardía para evitar problemas circulares
        from .mapgis.client import MapGISClient
        
        try:
            self.client = MapGISClient()
            self.cache_timeout = 3600  # 1 hora
            
            # ✅ Verificar que el cliente se inicializó correctamente
            if not hasattr(self.client, 'base_url'):
                logger.error("❌ MapGISClient no tiene base_url después de inicialización")
                raise AttributeError("MapGISClient no se inicializó correctamente")
            
            logger.info(f"✅ MapGISService initialized successfully with base_url: {self.client.base_url}")
            
        except Exception as e:
            logger.error(f"❌ Error inicializando MapGISService: {str(e)}")
            raise
    
    def inicializar_sesion(self) -> bool:
        """Inicializar sesión con MapGIS"""
        try:
            return self.client.inicializar_sesion()
        except Exception as e:
            logger.error(f"Error inicializando sesión MapGIS: {str(e)}")
            return False
    
    def buscar_por_matricula(self, matricula: str) -> Dict:
        """
        Buscar predio por matrícula - CORREGIDO
        """
        try:
            # Normalizar matrícula
            matricula_limpia = matricula.strip().lstrip('0') or '0'
            logger.info(f"🔍 Buscando datos para matrícula: {matricula_limpia}")
            
            # Verificar caché
            cache_key = f"mapgis_matricula_{matricula_limpia}"
            cached_result = cache.get(cache_key)
            
            if cached_result:
                logger.info(f"📋 Resultado desde caché para matrícula: {matricula_limpia}")
                return cached_result
            
            # Verificar que el cliente tiene base_url
            if not hasattr(self.client, 'base_url'):
                logger.error("❌ CRÍTICO: MapGISClient no tiene base_url")
                return {
                    'success': False,
                    'encontrado': False,
                    'message': 'Error de configuración del servicio MapGIS',
                    'cbml_obtenido': False
                }
            
            # Buscar en MapGIS usando el cliente
            resultado = self.client.buscar_por_matricula(matricula_limpia)
            
            if not resultado:
                return {
                    'success': False,
                    'encontrado': False,
                    'message': f'No se encontró información para la matrícula {matricula}',
                    'cbml_obtenido': False
                }
            
            # Si encontramos CBML, obtener datos completos
            cbml = resultado.get('cbml')
            if cbml:
                logger.info(f"✅ CBML encontrado: {cbml}, obteniendo datos completos...")
                
                # Buscar datos completos por CBML
                datos_cbml = self.client.buscar_por_cbml(cbml)
                
                if datos_cbml:
                    # Combinar resultados
                    datos_completos = {
                        **resultado,  # Datos de matrícula (cbml, direccion, coordenadas)
                        **datos_cbml  # Datos completos de CBML
                    }
                    
                    response = {
                        'success': True,
                        'encontrado': True,
                        'cbml_obtenido': True,
                        'busqueda_origen': 'matricula',
                        'data': datos_completos,
                        'message': 'Información obtenida exitosamente'
                    }
                    
                    # Guardar en caché
                    cache.set(cache_key, response, self.cache_timeout)
                    return response
            
            # Si solo tenemos datos básicos sin CBML completo
            response = {
                'success': True,
                'encontrado': True,
                'cbml_obtenido': bool(cbml),
                'busqueda_origen': 'matricula',
                'data': resultado,
                'message': 'Información básica obtenida'
            }
            
            # Guardar en caché
            cache.set(cache_key, response, self.cache_timeout)
            return response
            
        except AttributeError as e:
            logger.error(f"❌ Error de atributo en buscar_por_matricula: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'success': False,
                'encontrado': False,
                'message': f'Error de configuración: {str(e)}',
                'cbml_obtenido': False
            }
        except Exception as e:
            logger.error(f"❌ Error en buscar_por_matricula: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'success': False,
                'encontrado': False,
                'message': f'Error al buscar matrícula: {str(e)}',
                'cbml_obtenido': False
            }
    
    def buscar_por_cbml(self, cbml: str) -> Dict:
        """
        Buscar información por CBML - CORREGIDO
        """
        try:
            logger.info(f"🔍 Buscando datos para CBML: {cbml}")
            
            # Verificar caché
            cache_key = f"mapgis_cbml_{cbml}"
            cached_result = cache.get(cache_key)
            
            if cached_result:
                logger.info(f"📋 Resultado desde caché para CBML: {cbml}")
                return cached_result
            
            # Buscar en MapGIS
            resultado = self.client.buscar_por_cbml(cbml)
            
            if not resultado:
                return {
                    'success': False,
                    'encontrado': False,
                    'message': f'No se encontró información para el CBML {cbml}'
                }
            
            response = {
                'success': True,
                'encontrado': True,
                'data': resultado,
                'message': 'Información obtenida exitosamente'
            }
            
            # Guardar en caché
            cache.set(cache_key, response, self.cache_timeout)
            return response
            
        except Exception as e:
            logger.error(f"❌ Error en buscar_por_cbml: {str(e)}")
            return {
                'success': False,
                'encontrado': False,
                'message': f'Error al buscar CBML: {str(e)}'
            }
    
    def buscar_por_direccion(self, direccion: str) -> Dict:
        """Buscar predios por dirección (retorna lista)"""
        try:
            logger.info(f"🔍 Buscando por dirección: {direccion}")
            
            # TODO: Implementar búsqueda por dirección en MapGIS
            # Por ahora retornar no implementado
            
            return {
                'success': False,
                'encontrado': False,
                'message': 'Búsqueda por dirección no implementada aún'
            }
            
        except Exception as e:
            logger.error(f"❌ Error en buscar_por_direccion: {str(e)}")
            return {
                'success': False,
                'encontrado': False,
                'message': f'Error al buscar dirección: {str(e)}'
            }