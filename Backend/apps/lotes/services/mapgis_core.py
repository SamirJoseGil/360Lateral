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
        self.base_url = "https://www.medellin.gov.co"
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
        """Inicializa sesión en MapGIS"""
        try:
            logger.info("Iniciando sesión MapGIS...")
            main_url = f"{self.base_url}/mapgis9/mapa.jsp?aplicacion=1&css=css"
            response = self.session.get(main_url, timeout=self.timeout)
            response.raise_for_status()
            self.session_initialized = True
            logger.info("✅ Sesión MapGIS inicializada")
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
        """Consulta específica para ficha CBML"""
        ficha_url = f"{self.base_url}/site_consulta_pot/buscarFichaCBML.hyg"
        headers_post = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://www.medellin.gov.co',
            'Referer': 'https://www.medellin.gov.co/site_consulta_pot/ConsultaPot.hyg'
        }
        
        data = f"cbml={cbml}"
        logger.info(f"🔍 Consultando ficha CBML: {cbml}")
        
        response = self.session.post(
            ficha_url,
            data=data,
            headers=headers_post,
            timeout=self.timeout
        )
        
        logger.info(f"📡 Respuesta ficha CBML: {response.status_code}")
        return response
    
    def _consultar_general(self, valor: str, search_type: str) -> Optional[requests.Response]:
        """Consulta general para otros tipos de búsqueda"""
        consulta_url = f"{self.base_url}/site_consulta_pot/ConsultaPot.hyg"
        
        params = {
            'cbml': valor if search_type == 'cbml' else '',
            'matricula': valor if search_type == 'matricula' else '',
            'direccion': valor if search_type == 'direccion' else ''
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
        
        response = self.session.get(
            consulta_url, 
            params=params, 
            headers=headers, 
            timeout=self.timeout
        )
        
        logger.info(f"📡 Respuesta MapGIS: {response.status_code}")
        return response
    
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
