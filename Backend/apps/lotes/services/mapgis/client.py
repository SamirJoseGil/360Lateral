"""
Cliente HTTP para MapGIS Medellín - VERSIÓN COMPLETAMENTE CORREGIDA
"""
import requests
from bs4 import BeautifulSoup
import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class MapGISClient:
    """Cliente para realizar peticiones al sistema MapGIS de Medellín"""
    
    def __init__(self):
        """Inicializar cliente con configuración base"""
        # ✅ CRÍTICO: Estas líneas DEBEN estar aquí
        self.base_url = "https://www.medellin.gov.co"
        self.timeout = 30
        self.session = requests.Session()
        self.session_initialized = False
        
        # Configurar headers
        self._setup_session()
        
        # Log de inicialización
        logger.info(f"✅ MapGISClient initialized with base_url: {self.base_url}")
    
    def _setup_session(self):
        """Configura la sesión HTTP con headers del navegador"""
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'es-ES,es;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Connection': 'keep-alive',
            'X-Requested-With': 'XMLHttpRequest',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-GPC': '1',
        })
        logger.info("✅ Session headers configured")
    
    def inicializar_sesion(self) -> bool:
        """Inicializar sesión con MapGIS"""
        try:
            logger.info("🔄 Inicializando sesión con MapGIS...")
            
            # Hacer petición a la página principal para obtener cookies
            url = f"{self.base_url}/site_consulta_pot/ConsultaPot.hyg"
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                logger.info("✅ Sesión MapGIS inicializada correctamente")
                self.session_initialized = True
                return True
            
            logger.warning(f"⚠️ Error inicializando sesión: {response.status_code}")
            return False
            
        except Exception as e:
            logger.error(f"❌ Error inicializando sesión MapGIS: {str(e)}")
            return False
    
    def buscar_por_matricula(self, matricula: str) -> Optional[Dict]:
        """
        Buscar información por matrícula usando endpoint correcto
        
        Args:
            matricula: Número de matrícula (ej: "00174838" o "174838")
        
        Returns:
            Dict con datos encontrados o None
        """
        try:
            # Normalizar matrícula (quitar ceros a la izquierda)
            matricula_limpia = matricula.lstrip('0') or '0'
            logger.info(f"🔍 Buscando por matrícula: {matricula_limpia}")
            
            # Asegurar sesión inicializada
            if not self.session_initialized:
                logger.info("Sesión no inicializada, inicializando...")
                if not self.inicializar_sesion():
                    logger.error("❌ No se pudo inicializar sesión con MapGIS")
                    return None
            
            # ✅ ENDPOINT CORRECTO
            url = f"{self.base_url}/site_consulta_pot/buscarFichaMat.hyg"
            logger.info(f"📡 Endpoint: {url}")
            
            # ✅ PAYLOAD CORRECTO (form-urlencoded)
            data = {
                'matricula': matricula_limpia
            }
            
            # ✅ HEADERS CORRECTOS
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': f'{self.base_url}/site_consulta_pot/ConsultaPot.hyg',
                'Origin': self.base_url,
            }
            
            # Hacer petición
            logger.info(f"📤 Enviando petición con matrícula: {matricula_limpia}")
            response = self.session.post(
                url,
                data=data,
                headers=headers,
                timeout=self.timeout
            )
            
            logger.info(f"📡 Response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"❌ Error en respuesta: {response.status_code}")
                logger.debug(f"Response text: {response.text[:500]}")
                return None
            
            # ✅ PARSEAR JSON DIRECTAMENTE
            try:
                resultado = response.json()
                logger.info(f"✅ Respuesta JSON recibida: {resultado}")
                
                # Validar que tenga los campos esperados
                if not resultado or not isinstance(resultado, dict):
                    logger.warning("⚠️ Respuesta no es un dict válido")
                    return None
                
                # Verificar que tenga CBML
                cbml = resultado.get('cbml')
                if not cbml or cbml == 'null' or cbml == '':
                    logger.warning(f"⚠️ No se encontró CBML válido para matrícula {matricula_limpia}")
                    return None
                
                logger.info(f"✅ CBML encontrado: {cbml}")
                
                # Retornar datos normalizados
                return {
                    'cbml': cbml,
                    'matricula': resultado.get('matricula', matricula_limpia),
                    'direccion': resultado.get('direccion', ''),
                    'coordenadas': {
                        'x': resultado.get('x', ''),
                        'y': resultado.get('y', '')
                    }
                }
                
            except ValueError as e:
                logger.error(f"❌ Error parseando JSON: {str(e)}")
                logger.debug(f"Response text: {response.text[:500]}")
                return None
            
        except requests.Timeout:
            logger.error("❌ Timeout en petición a MapGIS")
            return None
        except requests.RequestException as e:
            logger.error(f"❌ Error de red: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Error inesperado en buscar_por_matricula: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def buscar_por_cbml(self, cbml: str) -> Optional[Dict]:
        """Buscar información por CBML"""
        try:
            logger.info(f"🔍 Buscando por CBML: {cbml}")
            
            # Asegurar sesión inicializada
            if not self.session_initialized:
                if not self.inicializar_sesion():
                    return None
            
            # URL para buscar por CBML
            url = f"{self.base_url}/site_consulta_pot/buscarFichaPred.hyg"
            
            data = {
                'cbml': cbml
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': f'{self.base_url}/site_consulta_pot/ConsultaPot.hyg',
                'Origin': self.base_url,
            }
            
            response = self.session.post(
                url,
                data=data,
                headers=headers,
                timeout=self.timeout
            )
            
            logger.info(f"📡 Response status: {response.status_code}")
            
            if response.status_code != 200:
                return None
            
            try:
                resultado = response.json()
                logger.info(f"✅ Datos CBML obtenidos")
                return resultado
            except ValueError:
                logger.error("❌ Respuesta no es JSON válido")
                return None
            
        except Exception as e:
            logger.error(f"❌ Error buscando por CBML: {str(e)}")
            return None