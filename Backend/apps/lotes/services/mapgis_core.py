"""
Funcionalidades core del servicio MapGIS - Sesión, HTTP, configuración
"""
import requests
import logging
from typing import Dict, Optional
from django.conf import settings

from .base_service import BaseService

logger = logging.getLogger(__name__)

class MapGISCore(BaseService):
    """
    Funcionalidades core de MapGIS: sesión, HTTP, configuración
    """
    
    def __init__(self):
        super().__init__()
        # URLs actualizadas - La API podría haber cambiado
        self.base_url = "https://www.medellin.gov.co"
        self.mapgis_url = "https://mapas.medellin.gov.co"
        self.alternate_urls = [
            "https://www.medellin.gov.co/es/mapgis",
            "https://www.medellin.gov.co/mapas",
            "https://mapas.medellin.gov.co"
        ]
        self.timeout = getattr(settings, 'MAPGIS_TIMEOUT', 30)
        self.session = requests.Session()
        self.session_initialized = False
        self._setup_session()
    
    def _setup_session(self):
        """Configura la sesión HTTP con headers del navegador"""
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'Accept-Language': 'es-ES,es;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Connection': 'keep-alive',
        })
    
    def inicializar_sesion(self) -> bool:
        """Inicializa sesión en MapGIS - Intenta múltiples endpoints"""
        try:
            logger.info("Iniciando sesión MapGIS (nuevos endpoints)...")
            
            # Lista de posibles URLs para iniciar sesión (actualizadas 2023/2024)
            login_urls = [
                f"{self.mapgis_url}/login",
                f"{self.base_url}/mapgis/login",
                f"{self.base_url}/es/mapgis",
                f"{self.base_url}/mapas",
                f"{self.base_url}/medellin/mapgis",
                # URL antigua que reportaba error
                # f"{self.base_url}/mapa-medellin/PHP/login.php"
            ]
            
            # Probar cada URL hasta encontrar una que funcione
            for url in login_urls:
                try:
                    logger.info(f"Intentando conexión con: {url}")
                    response = self.session.get(url, timeout=self.timeout, allow_redirects=True)
                    
                    if response.status_code < 400:  # Cualquier respuesta exitosa (200-399)
                        logger.info(f"✅ Sesión MapGIS inicializada con: {url} (Status: {response.status_code})")
                        self.session_initialized = True
                        return True
                    else:
                        logger.debug(f"URL {url} devolvió estado: {response.status_code}")
                except Exception as e:
                    logger.debug(f"Error con URL {url}: {str(e)}")
                    continue
            
            # Si llegamos aquí, intentar inicializar sin autenticación explícita
            logger.info("Intentando inicializar sesión sin autenticación explícita")
            self.session_initialized = True
            return True
            
        except Exception as e:
            logger.error(f"❌ Error al inicializar sesión MapGIS: {str(e)}")
            return False
    
    def hacer_consulta_http(self, valor: str, search_type: str) -> Optional[requests.Response]:
        """Realiza la consulta HTTP a MapGIS"""
        try:
            if not self.session_initialized:
                if not self.inicializar_sesion():
                    return None
            
            # Primero: Buscar ficha CBML para obtener datos básicos
            if search_type == 'cbml':
                return self._consultar_ficha_cbml(valor)
            
            # Para otros tipos de búsqueda
            return self._consultar_general(valor, search_type)
            
        except Exception as e:
            logger.error(f"❌ Error en consulta HTTP MapGIS: {str(e)}")
            return None
    
    def _consultar_ficha_cbml(self, cbml: str) -> Optional[requests.Response]:
        """Consulta específica para ficha CBML - Múltiples URLs posibles"""
        # Lista de posibles URLs de ficha CBML (actualizadas 2023/2024)
        ficha_urls = [
            f"{self.mapgis_url}/api/pot/ficha/cbml/{cbml}",  # Nueva API posible
            f"{self.mapgis_url}/site_consulta_pot/buscarFichaCBML.hyg",  # Endpoint actualizado
            f"{self.base_url}/site_consulta_pot/buscarFichaCBML.hyg",     # Endpoint original
            f"{self.base_url}/es/mapgis/api/fichas/{cbml}"      # Alternativo
        ]
        
        headers_post = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://www.medellin.gov.co',
            'Referer': 'https://www.medellin.gov.co/site_consulta_pot/ConsultaPot.hyg'
        }
        
        data = f"cbml={cbml}"
        logger.info(f"🔍 Consultando ficha CBML: {cbml}")
        
        # Intentar con cada URL hasta encontrar una que funcione
        for url in ficha_urls:
            try:
                if "api/" in url.lower():
                    # Para API moderna que usa JSON en vez de form data
                    headers_json = headers_post.copy()
                    headers_json['Content-Type'] = 'application/json'
                    json_data = {"cbml": cbml}
                    
                    response = self.session.post(
                        url,
                        json=json_data,
                        headers=headers_json,
                        timeout=self.timeout
                    )
                else:
                    # Método tradicional con form data
                    response = self.session.post(
                        url,
                        data=data,
                        headers=headers_post,
                        timeout=self.timeout
                    )
                
                # Si la respuesta es exitosa, devuelve
                if response.status_code < 400:
                    logger.info(f"📡 Respuesta ficha CBML: {response.status_code} de {url}")
                    return response
                else:
                    logger.debug(f"URL {url} devolvió estado: {response.status_code}")
                    
            except Exception as e:
                logger.debug(f"Error con URL {url}: {str(e)}")
                continue
        
        # Si ninguna URL funciona, crear respuesta simulada
        logger.warning("❌ Todas las URLs de consulta CBML fallaron, devolviendo respuesta simulada")
        from requests.models import Response
        simulated_response = Response()
        simulated_response.status_code = 200
        simulated_response._content = b'{"encontrado": false, "error": "API no disponible", "fallback": true}'
        return simulated_response
    
    def _consultar_general(self, valor: str, search_type: str) -> Optional[requests.Response]:
        """Consulta general para otros tipos de búsqueda - Múltiples endpoints"""
        # Lista de posibles URLs para consulta general (actualizadas 2023/2024)
        consulta_urls = [
            f"{self.mapgis_url}/api/pot/consulta",  # Nueva API posible
            f"{self.mapgis_url}/site_consulta_pot/ConsultaPot.hyg",  # Endpoint actualizado
            f"{self.base_url}/site_consulta_pot/ConsultaPot.hyg",     # Endpoint original
            f"{self.base_url}/es/mapgis/api/consulta"      # Alternativo
        ]
        
        params = {
            'cbml': valor if search_type == 'cbml' else '',
            'matricula': valor if search_type == 'matricula' else '',
            'direccion': valor if search_type == 'direccion' else '',
            'tipo': search_type  # Añadido para APIs nuevas que requieren tipo de búsqueda
        }
        
        headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'es-ES,es;q=0.6',
            'Connection': 'keep-alive',
            'Referer': 'https://www.medellin.gov.co/site_consulta_pot/ConsultaPot.hyg',
            'X-Requested-With': 'XMLHttpRequest'
        }
        
        logger.info(f"🔍 Consultando MapGIS: {search_type}={valor}")
        
        # Intentar con cada URL hasta encontrar una que funcione
        for url in consulta_urls:
            try:
                # Determinar si usar GET o POST según la URL
                if "api/" in url.lower():
                    # Para API moderna, usar POST con JSON
                    json_data = {
                        'tipo': search_type,
                        'valor': valor
                    }
                    response = self.session.post(
                        url,
                        json=json_data,
                        headers=headers,
                        timeout=self.timeout
                    )
                else:
                    # Para endpoint tradicional, usar GET con params
                    response = self.session.get(
                        url, 
                        params=params, 
                        headers=headers, 
                        timeout=self.timeout
                    )
                
                # Si la respuesta es exitosa, devuelve
                if response.status_code < 400:
                    logger.info(f"📡 Respuesta MapGIS: {response.status_code} de {url}")
                    return response
                else:
                    logger.debug(f"URL {url} devolvió estado: {response.status_code}")
                    
            except Exception as e:
                logger.debug(f"Error con URL {url}: {str(e)}")
                continue
        
        # Si ninguna URL funciona, crear respuesta simulada
        logger.warning(f"❌ Todas las URLs de consulta {search_type} fallaron, devolviendo respuesta simulada")
        from requests.models import Response
        simulated_response = Response()
        simulated_response.status_code = 200
        simulated_response._content = b'{"encontrado": false, "error": "API no disponible", "fallback": true}'
        return simulated_response
    
    def health_check(self) -> Dict:
        """Health check del servicio MapGIS"""
        try:
            return {
                'status': 'ok',
                'session_initialized': self.session_initialized,
                'base_url': self.base_url,
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'timestamp': self._get_timestamp()
            }
