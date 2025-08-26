"""
Servicio para interactuar con MapGIS de Medellín.

Este servicio proporciona funciones para:
1. Consultar información de lotes por CBML, matrícula o dirección
2. Obtener restricciones urbanísticas y ambientales
3. Manejar sesiones y autenticación con el sistema MapGIS
"""

import requests
import logging
import time
import re
import json
from typing import Dict, Any, Optional, Tuple, List, Union
from urllib.parse import quote
from django.conf import settings
from django.core.cache import cache

# Configuración del logger
logger = logging.getLogger(__name__)

class MapGISService:
    """Servicio para interactuar con MapGIS de Medellín."""
    
    # URLs y endpoints
    BASE_URL = settings.MAPGIS_BASE_URL
    LOGIN_URL = f"{BASE_URL}/mapa-medellin/PHP/login.php"
    SEARCH_URL = f"{BASE_URL}/mapa-medellin/site/busqueda.php"
    CBML_URL = f"{BASE_URL}/mapa-medellin/site/fichas/ficha_catastral.php"
    MATRICULA_URL = f"{BASE_URL}/mapa-medellin/site/fichas/ficha_registro.php"
    
    # Timeout y reintentos
    TIMEOUT = settings.MAPGIS_TIMEOUT
    RETRY_ATTEMPTS = settings.MAPGIS_RETRY_ATTEMPTS
    
    def __init__(self):
        """Inicializa el servicio con una sesión nueva."""
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
        }
        self.authenticated = False
        
    def _get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Obtiene respuesta cacheada si existe."""
        if not settings.MAPGIS_FORCE_REAL:
            cached_data = cache.get(cache_key)
            if cached_data:
                logger.debug(f"Usando datos cacheados para {cache_key}")
                return cached_data
        return None
        
    def _set_cached_response(self, cache_key: str, data: Dict[str, Any], timeout: int = 3600*24) -> None:
        """Guarda respuesta en cache."""
        cache.set(cache_key, data, timeout)
        
    def authenticate(self) -> bool:
        """
        Autentica la sesión con MapGIS. Devuelve True si tiene éxito.
        """
        if self.authenticated:
            return True
            
        try:
            # Primero hacemos un GET para obtener cookies y tokens
            response = self.session.get(
                self.LOGIN_URL, 
                headers=self.headers,
                timeout=self.TIMEOUT
            )
            response.raise_for_status()
            
            # No necesita credenciales específicas, solo establecer sesión
            self.authenticated = True
            logger.info("Autenticación con MapGIS exitosa")
            return True
            
        except requests.RequestException as e:
            logger.error(f"Error de autenticación con MapGIS: {str(e)}")
            self.authenticated = False
            return False
    
    def search_by_cbml(self, cbml: str) -> Dict[str, Any]:
        """
        Busca información de un lote por CBML.
        
        Args:
            cbml: Código CBML en formato '04050010105' o similar
        
        Returns:
            Diccionario con información detallada del lote.
        """
        # Limpiar y validar CBML
        cbml = re.sub(r'[^0-9]', '', cbml)
        if not cbml or len(cbml) < 8:
            return {'success': False, 'error': 'CBML inválido', 'code': 'INVALID_CBML'}
        
        # Verificar cache
        cache_key = f'mapgis_cbml_{cbml}'
        cached_data = self._get_cached_response(cache_key)
        if cached_data:
            return cached_data
        
        # Autenticar si es necesario
        if not self.authenticated and not self.authenticate():
            return {'success': False, 'error': 'Error de autenticación con MapGIS', 'code': 'AUTH_ERROR'}
        
        try:
            # Consulta a MapGIS
            params = {'cbml': cbml}
            response = self.session.get(
                self.CBML_URL,
                params=params,
                headers=self.headers,
                timeout=self.TIMEOUT
            )
            response.raise_for_status()
            
            # Procesar HTML y extraer datos
            data = self._extract_lote_data_from_html(response.text)
            
            # Si no hay datos o error
            if not data.get('cbml'):
                return {'success': False, 'error': 'No se encontró información para el CBML indicado', 'code': 'NOT_FOUND'}
            
            # Complementar con datos de restricciones
            restricciones = self.get_restricciones(cbml)
            if restricciones.get('success'):
                data['restricciones'] = restricciones.get('restricciones', [])
            
            # Preparar respuesta
            result = {
                'success': True,
                'data': data,
                'source': 'mapgis'
            }
            
            # Guardar en cache
            self._set_cached_response(cache_key, result)
            return result
            
        except requests.RequestException as e:
            logger.error(f"Error consultando MapGIS por CBML: {str(e)}")
            return {'success': False, 'error': f'Error de conexión con MapGIS: {str(e)}', 'code': 'CONNECTION_ERROR'}
        except Exception as e:
            logger.error(f"Error procesando datos de MapGIS: {str(e)}")
            return {'success': False, 'error': f'Error procesando información: {str(e)}', 'code': 'PROCESSING_ERROR'}
            
    def search_by_matricula(self, matricula: str) -> Dict[str, Any]:
        """
        Busca información de un lote por número de matrícula inmobiliaria.
        
        Args:
            matricula: Número de matrícula inmobiliaria
        
        Returns:
            Diccionario con información detallada del lote.
        """
        # Limpiar y validar matrícula
        matricula = re.sub(r'[^0-9]', '', matricula)
        if not matricula:
            return {'success': False, 'error': 'Matrícula inválida', 'code': 'INVALID_MATRICULA'}
        
        # Verificar cache
        cache_key = f'mapgis_matricula_{matricula}'
        cached_data = self._get_cached_response(cache_key)
        if cached_data:
            return cached_data
        
        # Autenticar si es necesario
        if not self.authenticated and not self.authenticate():
            return {'success': False, 'error': 'Error de autenticación con MapGIS', 'code': 'AUTH_ERROR'}
        
        try:
            # Consulta a MapGIS
            params = {'matricula': matricula}
            response = self.session.get(
                self.MATRICULA_URL,
                params=params,
                headers=self.headers,
                timeout=self.TIMEOUT
            )
            response.raise_for_status()
            
            # Procesar HTML y extraer datos
            data = self._extract_lote_data_from_html(response.text)
            
            # Si no hay datos o error
            if not data.get('matricula'):
                return {'success': False, 'error': 'No se encontró información para la matrícula indicada', 'code': 'NOT_FOUND'}
            
            # Complementar con datos de restricciones usando el CBML obtenido
            if data.get('cbml'):
                restricciones = self.get_restricciones(data['cbml'])
                if restricciones.get('success'):
                    data['restricciones'] = restricciones.get('restricciones', [])
            
            # Preparar respuesta
            result = {
                'success': True,
                'data': data,
                'source': 'mapgis'
            }
            
            # Guardar en cache
            self._set_cached_response(cache_key, result)
            return result
            
        except requests.RequestException as e:
            logger.error(f"Error consultando MapGIS por matrícula: {str(e)}")
            return {'success': False, 'error': f'Error de conexión con MapGIS: {str(e)}', 'code': 'CONNECTION_ERROR'}
        except Exception as e:
            logger.error(f"Error procesando datos de MapGIS: {str(e)}")
            return {'success': False, 'error': f'Error procesando información: {str(e)}', 'code': 'PROCESSING_ERROR'}
    
    def search_by_direccion(self, direccion: str) -> Dict[str, Any]:
        """
        Busca información de un lote por dirección.
        
        Args:
            direccion: Dirección del predio (ej: "Calle 50 #45-67")
        
        Returns:
            Diccionario con resultados de búsqueda, posiblemente múltiples lotes.
        """
        # Validar dirección
        if not direccion or len(direccion) < 5:
            return {'success': False, 'error': 'Dirección inválida', 'code': 'INVALID_ADDRESS'}
        
        # Verificar cache
        cache_key = f'mapgis_direccion_{direccion.lower().replace(" ", "_")}'
        cached_data = self._get_cached_response(cache_key)
        if cached_data:
            return cached_data
        
        # Autenticar si es necesario
        if not self.authenticated and not self.authenticate():
            return {'success': False, 'error': 'Error de autenticación con MapGIS', 'code': 'AUTH_ERROR'}
        
        try:
            # Consulta a MapGIS - Búsqueda por dirección
            params = {'direccion': direccion}
            response = self.session.get(
                self.SEARCH_URL,
                params=params,
                headers=self.headers,
                timeout=self.TIMEOUT
            )
            response.raise_for_status()
            
            # Extraer resultados de búsqueda
            resultados = self._extract_search_results(response.text)
            
            # Si no hay resultados
            if not resultados:
                return {'success': False, 'error': 'No se encontraron predios con la dirección indicada', 'code': 'NOT_FOUND'}
            
            # Preparar respuesta
            result = {
                'success': True,
                'count': len(resultados),
                'results': resultados,
                'source': 'mapgis'
            }
            
            # Guardar en cache
            self._set_cached_response(cache_key, result)
            return result
            
        except requests.RequestException as e:
            logger.error(f"Error consultando MapGIS por dirección: {str(e)}")
            return {'success': False, 'error': f'Error de conexión con MapGIS: {str(e)}', 'code': 'CONNECTION_ERROR'}
        except Exception as e:
            logger.error(f"Error procesando datos de MapGIS: {str(e)}")
            return {'success': False, 'error': f'Error procesando información: {str(e)}', 'code': 'PROCESSING_ERROR'}
    
    def get_restricciones(self, cbml: str) -> Dict[str, Any]:
        """
        Obtiene las restricciones urbanísticas y ambientales para un predio.
        
        Args:
            cbml: Código CBML del predio
        
        Returns:
            Diccionario con información de restricciones
        """
        # Limpiar y validar CBML
        cbml = re.sub(r'[^0-9]', '', cbml)
        if not cbml or len(cbml) < 8:
            return {'success': False, 'error': 'CBML inválido', 'code': 'INVALID_CBML'}
        
        # Verificar cache
        cache_key = f'mapgis_restricciones_{cbml}'
        cached_data = self._get_cached_response(cache_key)
        if cached_data:
            return cached_data
            
        # Aquí llamaríamos a un endpoint específico de restricciones o usaríamos
        # información de otros endpoints para construir las restricciones
        
        # Ejemplo simplificado con datos de prueba
        # En una implementación real, se consultarían APIs adicionales
        restricciones = [
            {
                'tipo': 'Ambiental',
                'descripcion': 'Zona de protección ambiental',
                'normativa': 'POT 2014, Art. 35',
                'severidad': 'Alta'
            },
            {
                'tipo': 'Urbanística',
                'descripcion': 'Retiro frontal obligatorio',
                'normativa': 'Decreto 409 de 2007',
                'severidad': 'Media'
            }
        ]
        
        result = {
            'success': True,
            'cbml': cbml,
            'restricciones': restricciones,
            'source': 'mapgis'
        }
        
        # Guardar en cache
        self._set_cached_response(cache_key, result)
        return result
    
    def health_check(self) -> Dict[str, Any]:
        """
        Verifica que el servicio MapGIS esté funcionando correctamente.
        
        Returns:
            Diccionario con estado del servicio
        """
        start_time = time.time()
        authenticated = self.authenticate()
        
        result = {
            'service': 'MapGIS',
            'status': 'healthy' if authenticated else 'unhealthy',
            'response_time': round(time.time() - start_time, 2),
            'authenticated': authenticated
        }
        
        return result
        
    def _extract_lote_data_from_html(self, html: str) -> Dict[str, Any]:
        """
        Extrae datos del lote a partir del HTML retornado por MapGIS.
        En un caso real, se usaría BeautifulSoup o lxml para parsear el HTML.
        
        Args:
            html: Contenido HTML de la página
            
        Returns:
            Datos estructurados del lote
        """
        # Este es un ejemplo simplificado, en una implementación real
        # se analizaría el HTML para extraer la información
        
        # Patrones para extraer información (muy simplificados)
        cbml_pattern = re.compile(r'CBML[:\s]*([0-9]+)', re.IGNORECASE)
        matricula_pattern = re.compile(r'Matr[ií]cula[:\s]*([0-9]+)', re.IGNORECASE)
        direccion_pattern = re.compile(r'Direcci[oó]n[:\s]*([^<\n]+)', re.IGNORECASE)
        area_pattern = re.compile(r'[áÁ]rea[:\s]*([0-9.,]+)', re.IGNORECASE)
        
        # Extraer datos con expresiones regulares
        cbml_match = cbml_pattern.search(html)
        matricula_match = matricula_pattern.search(html)
        direccion_match = direccion_pattern.search(html)
        area_match = area_pattern.search(html)
        
        # Construir diccionario de datos
        data = {}
        
        if cbml_match:
            data['cbml'] = cbml_match.group(1)
            
        if matricula_match:
            data['matricula'] = matricula_match.group(1)
            
        if direccion_match:
            data['direccion'] = direccion_match.group(1).strip()
            
        if area_match:
            try:
                area_str = area_match.group(1).replace('.', '').replace(',', '.')
                data['area'] = float(area_str)
            except ValueError:
                data['area'] = None
        
        # Ejemplo de datos adicionales que se podrían extraer
        data['latitud'] = 6.244203  # Estos serían datos extraídos del HTML
        data['longitud'] = -75.573553
        data['estrato'] = 4
        data['barrio'] = 'El Poblado'
        data['comuna'] = 'Comuna 14'
        data['uso_suelo'] = 'Residencial'
        data['tratamiento_pot'] = 'Consolidación'
        
        return data
    
    def _extract_search_results(self, html: str) -> List[Dict[str, Any]]:
        """
        Extrae resultados de búsqueda a partir del HTML.
        
        Args:
            html: Contenido HTML de la página de resultados
            
        Returns:
            Lista de resultados con datos básicos
        """
        # Ejemplo simplificado de extracción de resultados
        # En una implementación real, se analizaría el HTML para extraer los resultados
        
        # Este es un placeholder. Normalmente extraerías múltiples resultados
        resultados = [
            {
                'cbml': '04050010105',
                'matricula': '12345678',
                'direccion': 'Calle 50 #45-67',
                'area': 320.5,
            },
            {
                'cbml': '04050010106',
                'matricula': '87654321',
                'direccion': 'Calle 50 #45-69',
                'area': 280.0,
            }
        ]
        
        return resultados

# Función de ayuda para obtener una instancia del servicio
def get_mapgis_service() -> MapGISService:
    """
    Devuelve una instancia del servicio MapGIS.
    """
    return MapGISService()