"""
Funcionalidades core del servicio MapGIS - Sesión, HTTP, configuración
"""
import requests
import logging
from typing import Dict, Optional
from django.conf import settings

from ..base_service import BaseService

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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
            'Accept-Language': 'es-ES,es;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Connection': 'keep-alive',
        })
    
    def inicializar_sesion(self) -> bool:
        """Inicializa sesión en MapGIS aceptando términos"""
        try:
            if self.session_initialized:
                return True
                
            logger.info("🔄 Inicializando sesión con MapGIS...")
            
            # Aceptar términos
            validate_url = f"{self.base_url}/mapgis_seg/ValidarSessionMapgis.do"
            
            response = self.session.post(
                validate_url,
                data={'accion': 'aceptarterminos'},
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Origin': self.base_url,
                    'Referer': f'{self.base_url}/mapgis9/mapa.jsp?aplicacion=1&css=css'
                },
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                self.session_initialized = True
                logger.info("✅ Sesión MapGIS inicializada")
                return True
            
            logger.error(f"❌ Error al inicializar sesión: {response.status_code}")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error inicializando sesión MapGIS: {str(e)}")
            return False
    
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
