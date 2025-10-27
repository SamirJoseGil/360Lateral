"""
Cliente HTTP para MapGIS Medellín - COMPLETAMENTE CORREGIDO PARA MATRÍCULA
"""
import requests
import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class MapGISClient:
    """Cliente para realizar peticiones al sistema MapGIS de Medellín"""
    
    def __init__(self):
        """Inicializar cliente con configuración base"""
        self.base_url = "https://www.medellin.gov.co"
        self.timeout = 30
        self.session = requests.Session()
        self.session_initialized = False
        
        # Configurar headers
        self._setup_session()
        
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
        })
        logger.info("✅ Session headers configured")
    
    def inicializar_sesion(self) -> bool:
        """Inicializar sesión con MapGIS"""
        try:
            if self.session_initialized:
                return True
                
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
        ✅ BÚSQUEDA POR MATRÍCULA COMPLETAMENTE CORREGIDA
        
        Args:
            matricula: Número de matrícula (ej: "174838")
        
        Returns:
            Dict con datos encontrados o None
        """
        try:
            # Normalizar matrícula
            matricula_limpia = str(matricula).strip().lstrip('0') or '0'
            logger.info(f"🔍 [MapGIS] Buscando por matrícula: {matricula_limpia}")
            
            # Asegurar sesión inicializada
            if not self.session_initialized:
                if not self.inicializar_sesion():
                    logger.error("❌ No se pudo inicializar sesión con MapGIS")
                    return None
            
            # ✅ ENDPOINT CORRECTO PARA MATRÍCULA
            url = f"{self.base_url}/site_consulta_pot/buscarFichaMat.hyg"
            logger.info(f"📡 Endpoint: {url}")
            
            # ✅ HEADERS ESPECÍFICOS PARA ESTA PETICIÓN
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': f'{self.base_url}/site_consulta_pot/ConsultaPot.hyg',
                'Origin': self.base_url,
                'X-Requested-With': 'XMLHttpRequest',
            }
            
            # ✅ DATOS EN FORMATO FORM (NO JSON)
            data = {
                'matricula': matricula_limpia
            }
            
            logger.info(f"📤 Enviando petición: matricula={matricula_limpia}")
            
            # Hacer petición
            response = self.session.post(
                url,
                data=data,  # ✅ Usar data= no json=
                headers=headers,
                timeout=self.timeout
            )
            
            logger.info(f"📡 Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                logger.error(f"❌ Error HTTP {response.status_code}")
                logger.debug(f"Response text: {response.text[:500]}")
                return None
            
            # ✅ PROCESAR RESPUESTA JSON
            try:
                # Log del contenido de respuesta para debugging
                response_text = response.text.strip()
                logger.debug(f"Response text (first 200 chars): {response_text[:200]}")
                
                if not response_text:
                    logger.warning("⚠️ Respuesta vacía del servidor")
                    return None
                
                # Parsear JSON
                resultado = response.json()
                logger.info(f"✅ JSON parseado exitosamente")
                logger.debug(f"Resultado completo: {resultado}")
                
                # ✅ VALIDAR CONTENIDO DE LA RESPUESTA
                if not isinstance(resultado, dict):
                    logger.warning(f"⚠️ Respuesta no es un diccionario: {type(resultado)}")
                    return None
                
                # Buscar CBML en diferentes campos posibles
                cbml = (
                    resultado.get('cbml') or 
                    resultado.get('CBML') or 
                    resultado.get('codigo') or
                    resultado.get('codigoPredial')
                )
                
                if cbml and str(cbml).strip() and str(cbml).strip().lower() not in ['null', 'none', '', '0']:
                    logger.info(f"✅ CBML encontrado: {cbml}")
                    
                    # Preparar resultado normalizado
                    resultado_normalizado = {
                        'cbml': str(cbml).strip(),
                        'matricula': matricula_limpia,
                        'direccion': resultado.get('direccion', ''),
                        'encontrado': True
                    }
                    
                    # Agregar coordenadas si existen
                    if resultado.get('x') and resultado.get('y'):
                        resultado_normalizado['coordenadas'] = {
                            'x': resultado.get('x'),
                            'y': resultado.get('y')
                        }
                    
                    # Agregar cualquier otro campo útil
                    for campo in ['barrio', 'comuna', 'estrato']:
                        if resultado.get(campo):
                            resultado_normalizado[campo] = resultado[campo]
                    
                    return resultado_normalizado
                else:
                    logger.warning(f"⚠️ No se encontró CBML válido. Campos disponibles: {list(resultado.keys())}")
                    logger.debug(f"Valor CBML encontrado: '{cbml}'")
                    return None
                
            except ValueError as e:
                logger.error(f"❌ Error parseando JSON: {str(e)}")
                logger.debug(f"Response text que falló al parsear: {response.text[:1000]}")
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
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    def buscar_por_cbml(self, cbml: str) -> Optional[Dict]:
        """✅ Buscar información completa por CBML"""
        try:
            logger.info(f"🔍 Buscando datos completos por CBML: {cbml}")
            
            # Asegurar sesión inicializada
            if not self.session_initialized:
                if not self.inicializar_sesion():
                    return None
            
            # URL para buscar por CBML
            url = f"{self.base_url}/site_consulta_pot/buscarFichaCBML.hyg"
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Referer': f'{self.base_url}/site_consulta_pot/ConsultaPot.hyg',
                'Origin': self.base_url,
                'X-Requested-With': 'XMLHttpRequest',
            }
            
            data = {
                'cbml': cbml
            }
            
            response = self.session.post(
                url,
                data=data,
                headers=headers,
                timeout=self.timeout
            )
            
            logger.info(f"📡 CBML Response status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"❌ Error HTTP en búsqueda CBML: {response.status_code}")
                return None
            
            try:
                response_text = response.text.strip()
                
                if not response_text:
                    logger.warning(f"⚠️ Respuesta vacía para CBML {cbml}")
                    return None
                
                resultado = response.json()
                
                if resultado:
                    logger.info(f"✅ Datos completos obtenidos para CBML {cbml}")
                    return resultado
                else:
                    logger.warning(f"⚠️ Datos vacíos para CBML {cbml}")
                    return None
                
            except ValueError as e:
                logger.error(f"❌ Error parseando JSON de CBML: {str(e)}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error buscando por CBML: {str(e)}")
            return None
    
    def health_check(self) -> Dict:
        """Health check del cliente"""
        try:
            response = self.session.get(
                f"{self.base_url}/site_consulta_pot/",
                timeout=10
            )
            
            return {
                'status': 'ok' if response.status_code == 200 else 'error',
                'mapgis_available': response.status_code == 200,
                'session_initialized': self.session_initialized,
                'base_url': self.base_url,
                'timestamp': None  # Podrías agregar timestamp si quieres
            }
        except Exception as e:
            return {
                'status': 'error',
                'mapgis_available': False,
                'error': str(e),
                'base_url': self.base_url,
                'session_initialized': self.session_initialized
            }