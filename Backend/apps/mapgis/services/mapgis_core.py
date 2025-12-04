"""
Servicio core de MapGIS - Gestión de sesión y configuración
"""
import requests
from typing import Dict, Optional, List
import logging
import json
from urllib.parse import quote
import time

logger = logging.getLogger(__name__)

class MapGISCore:
    """Gestor de sesión y configuración de MapGIS"""
    
    BASE_URL = "https://www.medellin.gov.co"
    
    # ✅ ENDPOINTS CORRECTOS según los logs
    ENDPOINTS = {
        'validar_sesion': f'{BASE_URL}/mapgis_seg/ValidarSessionMapgis.do',
        'buscar_cbml': f'{BASE_URL}/site_consulta_pot/buscarFichaCBML.hyg',
        'buscar_matricula': f'{BASE_URL}/site_consulta_pot/buscarFichaMat.hyg',
        'consultas': f'{BASE_URL}/site_consulta_pot/consultas.hyg',
    }
    
    # ✅ CONSULTAS DISPONIBLES
    CONSULTAS = {
        'clasificacion_suelo': 'SQL_CONSULTA_CLASIFICACIONSUELO',
        'usos_generales': 'SQL_CONSULTA_USOSGENERALES',
        'aprovechamientos': 'SQL_CONSULTA_APROVECHAMIENTOSURBANOS',
        'restriccion_amenaza': 'SQL_CONSULTA_RESTRICCIONAMENAZARIESGO',
        'restriccion_rios': 'SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS',
    }
    
    def __init__(self):
        """Inicializar sesión HTTP"""
        self.session = requests.Session()
        self._configurar_headers()
        self._sesion_inicializada = False
        self._ultimo_cbml = None
    
    def _configurar_headers(self):
        """Configurar headers según el navegador real"""
        self.session.headers.update({
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'es-ES,es;q=0.9,pt;q=0.8',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': self.BASE_URL,
            'Referer': f'{self.BASE_URL}/site_consulta_pot/ConsultaPot.hyg',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            'sec-ch-ua': '"Chromium";v="142", "Brave";v="142", "Not_A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'sec-gpc': '1'
        })
    
    def inicializar_sesion(self) -> bool:
        """
        Inicializar sesión con MapGIS (aceptar términos)
        Returns:
            bool: True si se inicializó correctamente
        """
        try:
            logger.info("[MapGIS] Inicializando sesión...")
            
            # ✅ PASO 1: Aceptar términos (POST con body)
            response = self.session.post(
                self.ENDPOINTS['validar_sesion'],
                data='acepta_terminos=true',
                timeout=10
            )
            
            logger.info(f"[MapGIS] Status Code: {response.status_code}")
            logger.info(f"[MapGIS] Response Text: {response.text[:200]}")  # Primeros 200 chars
            
            if response.status_code == 200:
                response_text = response.text.strip()
                
                # ✅ CORREGIDO: Aceptar tanto "0" como "1" como respuesta exitosa
                # MapGIS puede retornar "1" cuando ya hay sesión activa
                if response_text in ['"0"', '"1"', '0', '1']:
                    logger.info(f"[MapGIS] ✅ Sesión inicializada correctamente (respuesta: {response_text})")
                    self._sesion_inicializada = True
                    
                    # ✅ NUEVO: Log de cookies recibidas
                    cookies = self.session.cookies.get_dict()
                    logger.info(f"[MapGIS] Cookies activas: {list(cookies.keys())}")
                    
                    return True
                else:
                    logger.warning(f"[MapGIS] Respuesta inesperada (pero continuando): {response_text}")
                    # ✅ NUEVO: Intentar continuar de todos modos
                    self._sesion_inicializada = True
                    return True
            
            logger.error(f"[MapGIS] Error al inicializar: {response.status_code}")
            return False
            
        except Exception as e:
            logger.error(f"[MapGIS] Error inicializando sesión: {str(e)}", exc_info=True)
            return False
    
    def _buscar_cbml_primero(self, cbml: str) -> bool:
        """
        ✅ CRÍTICO: Buscar CBML primero para establecer contexto en el servidor
        MapGIS necesita esto antes de consultar otras capas
        """
        try:
            if self._ultimo_cbml == cbml:
                logger.info(f"[MapGIS] CBML {cbml} ya fue buscado en esta sesión, omitiendo búsqueda")
                return True
            
            logger.info(f"[MapGIS] Estableciendo contexto para CBML: {cbml}")
            
            response = self.session.post(
                self.ENDPOINTS['buscar_cbml'],
                data=f'cbml={cbml}',
                timeout=15
            )
            
            logger.info(f"[MapGIS] Búsqueda CBML - Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Verificar estructura correcta (debe ser dict, no lista)
                    if isinstance(data, dict):
                        logger.info(f"[MapGIS] ✅ Contexto establecido para CBML: {cbml}")
                        self._ultimo_cbml = cbml
                        
                        # ✅ CRÍTICO: Pequeña pausa para que MapGIS procese
                        time.sleep(0.5)
                        return True
                    else:
                        logger.warning(f"[MapGIS] Búsqueda retornó lista en lugar de dict")
                        return False
                        
                except json.JSONDecodeError as e:
                    logger.error(f"[MapGIS] Error parsing JSON de búsqueda: {str(e)}")
                    return False
            
            return False
            
        except Exception as e:
            logger.error(f"[MapGIS] Error buscando CBML: {str(e)}", exc_info=True)
            return False
    
    def buscar_por_cbml(self, cbml: str) -> Optional[Dict]:
        """
        Buscar lote por CBML y obtener geometría
        Args:
            cbml: Código CBML (sin validar longitud)
        Returns:
            Dict con datos del lote o None
        """
        try:
            if not self._sesion_inicializada:
                logger.info("[MapGIS] Sesión no inicializada, inicializando...")
                if not self.inicializar_sesion():
                    logger.error("[MapGIS] No se pudo inicializar sesión")
                    return None
            
            logger.info(f"[MapGIS] Buscando CBML: {cbml}")
            
            # ✅ PASO 2: Buscar por CBML
            response = self.session.post(
                self.ENDPOINTS['buscar_cbml'],
                data=f'cbml={cbml}',
                timeout=15
            )
            
            logger.info(f"[MapGIS] Búsqueda CBML - Status: {response.status_code}")
            logger.info(f"[MapGIS] Búsqueda CBML - Response: {response.text[:500]}")
            
            if response.status_code != 200:
                logger.error(f"[MapGIS] Error HTTP {response.status_code}")
                return None
            
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                logger.error(f"[MapGIS] Error parsing JSON: {str(e)}")
                logger.error(f"[MapGIS] Raw response: {response.text[:1000]}")
                return None
            
            # ✅ Validar que retorna lista con resultados
            if not isinstance(data, list):
                logger.error(f"[MapGIS] Respuesta no es una lista: {type(data)}")
                logger.error(f"[MapGIS] Data recibida: {data}")
                return None
            
            if len(data) == 0:
                logger.warning(f"[MapGIS] No se encontró CBML: {cbml} (lista vacía)")
                return None
            
            resultado = data[0]
            logger.info(f"[MapGIS] ✅ CBML encontrado: {resultado.get('cbml')}")
            logger.info(f"[MapGIS] Keys en respuesta: {list(resultado.keys())}")
            
            return resultado
            
        except Exception as e:
            logger.error(f"[MapGIS] Error buscando CBML {cbml}: {str(e)}", exc_info=True)
            return None
    
    def _consultar_endpoint(self, cbml: str, consulta: str, campos: str) -> Optional[Dict]:
        """
        Consulta genérica a endpoint de MapGIS
        Args:
            cbml: Código CBML
            consulta: Tipo de consulta SQL
            campos: Campos a consultar (separados por comas)
        Returns:
            Dict con resultados o None
        """
        try:
            # ✅ CRÍTICO: URL encode de los campos
            campos_encoded = quote(campos)
            url = f"{self.ENDPOINTS['consultas']}?cbml={cbml}&consulta={consulta}&campos={campos_encoded}"
            
            logger.info(f"[MapGIS] Consultando: {consulta}")
            
            # ✅ MEJORADO: Timeout más largo y retry
            max_retries = 2
            for attempt in range(max_retries):
                try:
                    response = self.session.post(url, data='', timeout=20)
                    
                    logger.info(f"[MapGIS] {consulta} - Status: {response.status_code}")
                    
                    # ✅ NUEVO: Log de contenido crudo para debug
                    raw_content = response.text[:500] if response.text else '(empty)'
                    logger.info(f"[MapGIS] {consulta} - Response: {raw_content}")
                    
                    if response.status_code != 200:
                        logger.error(f"[MapGIS] Error HTTP {response.status_code} en {consulta}")
                        return None
                    
                    # ✅ CRÍTICO: Verificar si la respuesta está vacía
                    if not response.text or response.text.strip() == '':
                        logger.warning(f"[MapGIS] Respuesta vacía para {consulta}")
                        
                        # Retry una vez más
                        if attempt < max_retries - 1:
                            logger.info(f"[MapGIS] Reintentando {consulta}...")
                            time.sleep(1)
                            continue
                        
                        return None
                    
                    try:
                        data = response.json()
                        return data
                    except json.JSONDecodeError as e:
                        logger.error(f"[MapGIS] Error parsing JSON en {consulta}: {str(e)}")
                        
                        # Retry una vez más
                        if attempt < max_retries - 1:
                            logger.info(f"[MapGIS] Reintentando {consulta}...")
                            time.sleep(1)
                            continue
                        
                        return None
                        
                except requests.Timeout:
                    logger.warning(f"[MapGIS] Timeout en {consulta} (intento {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    return None
            
            return None
            
        except Exception as e:
            logger.error(f"[MapGIS] Error consultando {consulta}: {str(e)}", exc_info=True)
            return None
    
    def consultar_clasificacion_suelo(self, cbml: str) -> Optional[str]:
        """Consultar clasificación del suelo"""
        data = self._consultar_endpoint(
            cbml,
            self.CONSULTAS['clasificacion_suelo'],
            'Clasificación del suelo'
        )
        
        if data and 'resultados' in data and len(data['resultados']) > 0:
            if len(data['resultados'][0]) > 0:
                return data['resultados'][0][0].get('valor')
        
        return None
    
    def consultar_usos_generales(self, cbml: str) -> Optional[List[Dict]]:
        """Consultar usos generales del suelo"""
        data = self._consultar_endpoint(
            cbml,
            self.CONSULTAS['usos_generales'],
            'Categoría de uso,Subcategoría de uso,COD_SUBCAT_USO,porcentaje'
        )
        
        if data and 'resultados' in data and len(data['resultados']) > 0:
            usos = []
            for resultado in data['resultados']:
                if len(resultado) >= 4:
                    uso = {
                        'porcentaje': resultado[0].get('valor'),
                        'categoria_uso': resultado[1].get('valor'),
                        'subcategoria_uso': resultado[2].get('valor'),
                        'codigo_subcategoria': resultado[3].get('valor')
                    }
                    usos.append(uso)
            return usos
        
        return None
    
    def consultar_aprovechamientos_urbanos(self, cbml: str) -> Optional[List[Dict]]:
        """Consultar aprovechamientos urbanos"""
        data = self._consultar_endpoint(
            cbml,
            self.CONSULTAS['aprovechamientos'],
            'TRATAMIENTO,Dens habit max (Viv/ha),Dens max tot venta derechos,IC max,IC max venta derechos,Altura normativa,IDENTIFICADOR'
        )
        
        if data and 'resultados' in data and len(data['resultados']) > 0:
            aprovechamientos = []
            for resultado in data['resultados']:
                if len(resultado) >= 7:
                    aprov = {
                        'codigo_tratamiento': resultado[0].get('valor'),
                        'identificador': resultado[1].get('valor'),
                        'tratamiento': resultado[2].get('valor'),
                        'densidad_habitacional_max': resultado[3].get('valor'),
                        'densidad_max_venta': resultado[4].get('valor'),
                        'indice_construccion_max': resultado[5].get('valor'),
                        'indice_construccion_venta': resultado[6].get('valor'),
                        'altura_normativa': resultado[7].get('valor') if len(resultado) > 7 else None
                    }
                    aprovechamientos.append(aprov)
            return aprovechamientos
        
        return None
    
    def consultar_restriccion_amenaza(self, cbml: str) -> Optional[str]:
        """Consultar restricción por amenaza/riesgo"""
        data = self._consultar_endpoint(
            cbml,
            self.CONSULTAS['restriccion_amenaza'],
            'Condiciones de riesgo y RNM'
        )
        
        if data and 'resultados' in data and len(data['resultados']) > 0:
            if len(data['resultados'][0]) > 0:
                return data['resultados'][0][0].get('valor')
        
        return None
    
    def consultar_restriccion_rios(self, cbml: str) -> Optional[str]:
        """Consultar restricción por retiros a ríos/quebradas"""
        data = self._consultar_endpoint(
            cbml,
            self.CONSULTAS['restriccion_rios'],
            'Restric por retiro a quebrada'
        )
        
        if data and 'resultados' in data and len(data['resultados']) > 0:
            if len(data['resultados'][0]) > 0:
                valor = data['resultados'][0][0].get('valor')
                # Si retorna vacío, significa que no hay restricción
                return valor if valor else "Sin restricciones"
        
        return "Sin restricciones"
    
    def buscar_por_matricula(self, matricula: str) -> Optional[Dict]:
        """
        Buscar lote por matrícula
        Args:
            matricula: Número de matrícula
        Returns:
            Dict con datos del lote o None
        """
        try:
            if not self._sesion_inicializada:
                if not self.inicializar_sesion():
                    return None
            
            logger.info(f"[MapGIS] Buscando matrícula: {matricula}")
            
            response = self.session.post(
                self.ENDPOINTS['buscar_matricula'],
                data=f'matricula={matricula}',
                timeout=15
            )
            
            logger.info(f"[MapGIS] Matrícula - Status: {response.status_code}")
            logger.info(f"[MapGIS] Matrícula - Response: {response.text[:500]}")
            
            if response.status_code != 200:
                logger.error(f"[MapGIS] Error HTTP {response.status_code}")
                return None
            
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                logger.error(f"[MapGIS] Error parsing JSON: {str(e)}")
                return None
            
            # ✅ Respuesta esperada: {"matricula":"174838","cbml":"12070080003",...}
            if data and 'cbml' in data:
                logger.info(f"[MapGIS] ✅ Matrícula encontrada, CBML: {data.get('cbml')}")
                return data
            
            logger.warning(f"[MapGIS] No se encontró matrícula: {matricula}")
            return None
            
        except Exception as e:
            logger.error(f"[MapGIS] Error buscando matrícula {matricula}: {str(e)}", exc_info=True)
            return None
    
    def consultar_datos_completos(self, cbml: str) -> Dict:
        """
        Consulta TODAS las capas de información de un CBML
        Returns:
            Dict con toda la información disponible
        """
        if not self._sesion_inicializada:
            if not self.inicializar_sesion():
                return {'error': True, 'mensaje': 'No se pudo inicializar sesión'}
        
        # ✅ CRÍTICO: Buscar CBML primero para establecer contexto
        if not self._buscar_cbml_primero(cbml):
            logger.warning(f"[MapGIS] No se pudo establecer contexto para CBML: {cbml}")
            # Continuar de todos modos, puede funcionar
        
        logger.info(f"[MapGIS] ===== Consulta completa para CBML: {cbml} =====")
        
        # ✅ Ejecutar todas las consultas
        datos = {
            'cbml': cbml,
            'clasificacion_suelo': self.consultar_clasificacion_suelo(cbml),
            'usos_generales': self.consultar_usos_generales(cbml),
            'aprovechamientos_urbanos': self.consultar_aprovechamientos_urbanos(cbml),
            'restriccion_amenaza_riesgo': self.consultar_restriccion_amenaza(cbml),
            'restriccion_retiros_rios': self.consultar_restriccion_rios(cbml),
        }
        
        # ✅ Verificar que al menos una consulta tuvo éxito
        tiene_datos = any([
            datos['clasificacion_suelo'],
            datos['usos_generales'],
            datos['aprovechamientos_urbanos'],
            datos['restriccion_amenaza_riesgo'],
            datos['restriccion_retiros_rios'] != "Sin restricciones"
        ])
        
        if not tiene_datos:
            logger.warning(f"[MapGIS] ⚠️ No se obtuvo ningún dato para CBML: {cbml}")
            return {
                'error': True,
                'mensaje': 'No se encontró información para este CBML en MapGIS',
                'cbml': cbml
            }
        
        logger.info(f"[MapGIS] ✅ Consulta completa exitosa para CBML: {cbml}")
        return datos
    
    def health_check(self) -> Dict:
        """Verificar salud del servicio"""
        try:
            if self.inicializar_sesion():
                return {
                    'status': 'ok',
                    'session_initialized': True,
                    'base_url': self.BASE_URL,
                    'cookies': list(self.session.cookies.get_dict().keys())
                }
            else:
                return {
                    'status': 'error',
                    'session_initialized': False,
                    'base_url': self.BASE_URL,
                    'message': 'No se pudo inicializar sesión'
                }
        except Exception as e:
            logger.error(f"[MapGIS] Health check error: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'session_initialized': False,
                'error': str(e)
            }
