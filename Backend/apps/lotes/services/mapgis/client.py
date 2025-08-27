"""
Cliente para interactuar con la API de MapGIS de Medellín.
Este módulo maneja la comunicación de bajo nivel con la API.
"""

import requests
import logging
import time
import json
from typing import Dict, Any, Optional
from django.conf import settings

# Configuración del logger
logger = logging.getLogger(__name__)

class MapGISClient:
    """
    Cliente para interactuar con la API de MapGIS de Medellín.
    Gestiona la sesión, autenticación y comunicación con los endpoints.
    """
    
    # URLs y endpoints actualizados según la estructura real de MapGIS
    BASE_URL = "https://www.medellin.gov.co"
    MAPGIS_URL = f"{BASE_URL}/mapgis9/mapa.jsp?aplicacion=41"
    SESSION_VALIDATION_URL = f"{BASE_URL}/mapgis_seg/ValidarSessionMapgis.do"
    LOAD_PARAMS_URL = f"{BASE_URL}/site_consulta_pot/cargarParametrosVistaPot.hyg"
    CONSULTA_URL = f"{BASE_URL}/site_consulta_pot/consultas.hyg"
    
    def __init__(self):
        """Inicializa el cliente con una sesión nueva."""
        # Timeout y reintentos
        self.TIMEOUT = getattr(settings, 'MAPGIS_TIMEOUT', 30)
        self.RETRY_ATTEMPTS = getattr(settings, 'MAPGIS_RETRY_ATTEMPTS', 3)
        
        self.session = requests.Session()
        self.session_initialized = False
        self.authenticated = False
        
        # Headers específicos basados en la investigación
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'es-ES,es;q=0.9,pt;q=0.8',
            'Connection': 'keep-alive',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://www.medellin.gov.co',
            'Referer': 'https://www.medellin.gov.co/site_consulta_pot/ConsultaPot.hyg',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        }
        
        logger.debug("Cliente MapGIS inicializado")
    
    def initialize_session(self) -> bool:
        """
        Inicializa la sesión con MapGIS - Proceso completo de autenticación.
        Returns:
            bool: True si la sesión se inicializó correctamente, False en caso contrario
        """
        try:
            if self.session_initialized:
                return True
                
            logger.info("🔧 Inicializando sesión con MapGIS Medellín")
            
            # Paso 1: Acceder a la página principal de MapGIS
            logger.debug("Paso 1: Accediendo a la página principal de MapGIS")
            resp = self.session.get(
                self.MAPGIS_URL, 
                headers=self.headers, 
                timeout=self.TIMEOUT
            )
            
            if resp.status_code != 200:
                logger.error(f"❌ Error accediendo a MapGIS: {resp.status_code}")
                return False
                
            logger.debug(f"Cookies iniciales: {len(self.session.cookies)}")
            
            # Paso 2: Cargar parámetros de vista POT
            logger.debug("Paso 2: Cargando parámetros de vista POT")
            resp = self.session.post(
                self.LOAD_PARAMS_URL,
                headers=self.headers,
                timeout=self.TIMEOUT
            )
            
            if resp.status_code != 200:
                logger.error(f"❌ Error cargando parámetros POT: {resp.status_code}")
                return False
                
            # Extraer datos de configuración
            try:
                config_data = resp.json()
                logger.debug(f"Configuración recibida: {len(config_data)} parámetros")
            except Exception as e:
                logger.warning(f"No se pudo procesar la configuración: {str(e)}")
            
            # Paso 3: Validar sesión en MapGIS
            logger.debug("Paso 3: Validando sesión en MapGIS")
            validation_headers = self.headers.copy()
            validation_headers['Content-Type'] = 'application/x-www-form-urlencoded'
            
            resp = self.session.post(
                self.SESSION_VALIDATION_URL,
                headers=validation_headers,
                data="",  # El endpoint no requiere datos específicos
                timeout=self.TIMEOUT
            )
            
            if resp.status_code != 200:
                logger.error(f"❌ Error validando sesión: {resp.status_code}")
                return False
                
            logger.info(f"✅ Sesión inicializada correctamente - Cookies: {len(self.session.cookies)}")
            self.session_initialized = True
            self.authenticated = True
            return True
                
        except Exception as e:
            logger.error(f"❌ Error inicializando sesión: {str(e)}")
            return False

    def query(self, cbml: str, query_type: str, fields: str) -> Dict[str, Any]:
        """
        Realiza una consulta a la API de MapGIS.
        
        Args:
            cbml: Código CBML del lote
            query_type: Tipo de consulta (Ej: SQL_CONSULTA_CLASIFICACIONSUELO)
            fields: Campos a consultar (Ej: CLASE_SUELO)
        
        Returns:
            Dict: Respuesta de la API
        
        Raises:
            ConnectionError: Si hay problemas con la conexión
            ValueError: Si la respuesta no tiene el formato esperado
        """
        if not self.session_initialized and not self.initialize_session():
            logger.error("🚫 No se pudo inicializar la sesión con MapGIS")
            raise ConnectionError("No se pudo inicializar la sesión con MapGIS")
            
        try:
            # Preparar URL con parámetros
            params = {
                'cbml': cbml,
                'consulta': query_type,
                'campos': fields
            }
            
            # Realizar la petición
            logger.info(f"🌐 Enviando consulta {query_type} para CBML {cbml} a {self.CONSULTA_URL}")
            logger.debug(f"📦 Parámetros: {params}")
            logger.debug(f"📝 Headers: {self.headers}")
            
            start_time = time.time()
            resp = self.session.post(
                self.CONSULTA_URL,
                params=params,
                headers=self.headers,
                timeout=self.TIMEOUT
            )
            duration = time.time() - start_time
            
            # Log detallado de la respuesta
            logger.info(f"📡 Respuesta recibida en {duration:.2f}s - Status: {resp.status_code}")
            
            # Validar respuesta
            if resp.status_code != 200:
                logger.error(f"🚫 Error en consulta HTTP: {resp.status_code}")
                logger.debug(f"🚫 Cuerpo de error: {resp.text[:500]}")
                raise ConnectionError(f"Error en consulta: {resp.status_code}")
                
            # Procesar respuesta como JSON
            try:
                # Log del contenido de la respuesta para depuración
                content_preview = resp.text[:1000] + ("..." if len(resp.text) > 1000 else "")
                logger.debug(f"📄 Contenido de la respuesta: {content_preview}")
                
                data = resp.json()
                
                # Log de estructura de datos recibida
                if 'resultados' in data:
                    num_resultados = len(data['resultados'])
                    logger.info(f"✅ Datos JSON recibidos: {num_resultados} conjuntos de resultados")
                    
                    # Verificar si hay resultados
                    if num_resultados > 0 and data['resultados'][0]:
                        primer_conjunto = data['resultados'][0]
                        if isinstance(primer_conjunto, list):
                            logger.info(f"✅ Primer conjunto tiene {len(primer_conjunto)} elementos")
                            # Mostrar una muestra de los datos
                            if len(primer_conjunto) > 0:
                                logger.info(f"📊 Muestra de datos: {primer_conjunto[0]}")
                        else:
                            logger.warning(f"⚠️ Formato inesperado del primer conjunto de resultados: {type(primer_conjunto)}")
                else:
                    logger.warning(f"⚠️ No se encontró la clave 'resultados' en la respuesta")
                
                return data
            except json.JSONDecodeError as e:
                logger.error(f"🚫 Error decodificando JSON: {str(e)}")
                logger.error(f"🚫 Contenido que causó el error: {resp.text[:500]}")
                raise ValueError(f"Formato de respuesta inválido: {resp.text[:100]}...")
                
        except (requests.RequestException, ConnectionError) as e:
            logger.error(f"🚫 Error en consulta MapGIS: {str(e)}")
            raise ConnectionError(f"Error en comunicación con MapGIS: {str(e)}")
        except Exception as e:
            logger.error(f"🚫 Error inesperado: {str(e)}")
            logger.exception("Excepción detallada:")
            raise
    
    def health_check(self) -> Dict[str, Any]:
        """
        Verifica el estado de la conexión con MapGIS.
        
        Returns:
            Dict: Estado de la conexión
        """
        start_time = time.time()
        
        try:
            # Intentar inicializar sesión
            session_ok = self.initialize_session()
            
            if session_ok:
                # Verificar si podemos hacer una consulta simple
                test_cbml = "14220250006"  # CBML de prueba
                try:
                    self.query(
                        test_cbml, 
                        'SQL_CONSULTA_CLASIFICACIONSUELO',
                        'Clasificación del suelo'
                    )
                    consulta_ok = True
                except Exception:
                    consulta_ok = False
                
                return {
                    'service': 'MapGIS',
                    'status': 'healthy' if consulta_ok else 'partial',
                    'response_time': round(time.time() - start_time, 2),
                    'authenticated': self.authenticated,
                    'session_active': self.session_initialized
                }
            else:
                return {
                    'service': 'MapGIS',
                    'status': 'unhealthy',
                    'response_time': round(time.time() - start_time, 2),
                    'authenticated': False,
                    'session_active': False,
                    'error': 'No se pudo inicializar sesión'
                }
        
        except Exception as e:
            logger.error(f"Error en health check: {str(e)}")
            return {
                'service': 'MapGIS',
                'status': 'error',
                'response_time': round(time.time() - start_time, 2),
                'error': str(e)
            }