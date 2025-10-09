"""
Consultas específicas del servicio MapGIS
"""
import json
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class MapGISQueries:
    """
    Consultas específicas a los diferentes endpoints de MapGIS
    """
    
    def __init__(self, core_service):
        self.core = core_service
    
    def buscar_ficha_por_matricula(self, matricula: str) -> Optional[Dict]:
        """
        Busca la ficha de un predio por matrícula
        Retorna el CBML asociado si se encuentra
        """
        try:
            ficha_url = f"{self.core.base_url}/site_consulta_pot/buscarFichaMat.hyg"
            
            headers = {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': f'{self.core.base_url}/site_consulta_pot/ConsultaPot.hyg'
            }
            
            # CRÍTICO: Enviar como form data, no como JSON
            data = f"matricula={matricula}"
            logger.info(f"🔍 Consultando ficha por matrícula: {matricula}")
            logger.debug(f"Request URL: {ficha_url}")
            logger.debug(f"Request data: {data}")
            
            response = self.core.session.post(
                ficha_url,
                data=data,
                headers=headers,
                timeout=self.core.timeout
            )
            
            logger.info(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    # Leer el texto de la respuesta
                    response_text = response.text.strip()
                    logger.debug(f"Response raw text: {response_text}")
                    
                    # CRÍTICO: Verificar si la respuesta está vacía
                    if not response_text:
                        logger.warning(f"⚠️ Respuesta vacía para matrícula {matricula}")
                        return None
                    
                    result = json.loads(response_text)
                    logger.debug(f"Parsed JSON: {result}")
                    
                    # CRÍTICO: Verificar que tenemos datos válidos
                    if result and isinstance(result, dict):
                        # MapGIS puede devolver el CBML en diferentes campos
                        cbml = result.get('cbml') or result.get('CBML') or result.get('codigo')
                        
                        # CRÍTICO: Validar que el CBML no esté vacío
                        if cbml and str(cbml).strip() and str(cbml).strip().lower() not in ['null', 'none', '']:
                            logger.info(f"✅ CBML encontrado: {cbml}")
                            # Asegurar que el CBML está en el resultado
                            result['cbml'] = str(cbml).strip()
                            return result
                        else:
                            logger.warning(f"⚠️ CBML vacío o null en respuesta: cbml={cbml}")
                            logger.debug(f"Response completa: {result}")
                    
                    logger.warning(f"⚠️ No se encontró CBML válido para matrícula {matricula}")
                    return None
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Error decodificando JSON: {str(e)}")
                    logger.error(f"Response content: {response.text[:500]}")
                    return None
                except Exception as e:
                    logger.error(f"Error procesando respuesta: {str(e)}")
                    return None
            else:
                logger.error(f"❌ Error HTTP {response.status_code}")
                logger.debug(f"Response body: {response.text[:500]}")
                return None
            
        except Exception as e:
            logger.error(f"❌ Error consultando ficha por matrícula: {str(e)}", exc_info=True)
            return None
    
    def buscar_ficha_por_cbml(self, cbml: str) -> Optional[Dict]:
        """Busca la ficha de un predio por CBML"""
        try:
            ficha_url = f"{self.core.base_url}/site_consulta_pot/buscarFichaCBML.hyg"
            
            headers = {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': f'{self.core.base_url}/site_consulta_pot/ConsultaPot.hyg'
            }
            
            data = f"cbml={cbml}"
            logger.info(f"🔍 Consultando ficha por CBML: {cbml}")
            
            response = self.core.session.post(
                ficha_url,
                data=data,
                headers=headers,
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                try:
                    response_text = response.text.strip()
                    
                    if not response_text:
                        logger.warning(f"⚠️ Respuesta vacía para CBML {cbml}")
                        return None
                    
                    result = response.json()
                    if result:
                        logger.info(f"✅ Ficha encontrada para CBML {cbml}")
                        return result
                except json.JSONDecodeError:
                    logger.error("Error decodificando respuesta JSON")
            
            return None
            
        except Exception as e:
            logger.error(f"Error consultando ficha por CBML: {str(e)}")
            return None
    
    def consultar_geometria_lote(self, cbml: str) -> Dict:
        """Consulta la geometría del lote"""
        try:
            lotes_url = f"{self.core.base_url}/site_consulta_pot/consultarLotes.hyg"
            
            headers = {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': f'{self.core.base_url}/site_consulta_pot/ConsultaPot.hyg'
            }
            
            # CRÍTICO: Este endpoint SÍ espera JSON
            data = json.dumps({"cbml": cbml})
            
            logger.info(f"🗺️ Consultando geometría para CBML: {cbml}")
            
            response = self.core.session.post(
                lotes_url,
                data=data,
                headers=headers,
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                geometria_data = response.json()
                if geometria_data and len(geometria_data) > 0:
                    logger.info(f"✅ Geometría obtenida")
                    return {
                        'success': True,
                        'geometria': geometria_data[0]
                    }
            
            return {'success': False}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo geometría: {str(e)}")
            return {'success': False}
    
    def consultar_area_lote(self, cbml: str) -> Dict:
        """Consulta el área del lote"""
        try:
            area_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_LOTE',
                'campos': 'Área de lote'
            }
            
            response = self.core.session.post(
                area_url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('resultados') and len(data['resultados']) > 0:
                    area_valor = data['resultados'][0][0]['valor']
                    logger.info(f"✅ Área del lote: {area_valor}")
                    
                    # Extraer valor numérico
                    import re
                    match = re.search(r'(\d+(?:\.\d+)?)', area_valor)
                    area_m2 = float(match.group(1)) if match else 0.0
                    
                    return {
                        'success': True,
                        'area_lote': area_valor,
                        'area_lote_m2': area_m2
                    }
            
            return {'success': False}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo área: {str(e)}")
            return {'success': False}
    
    def consultar_clasificacion_suelo(self, cbml: str) -> Dict:
        """Consulta la clasificación del suelo"""
        try:
            url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_CLASIFICACIONSUELO',
                'campos': 'Clasificación del suelo'
            }
            
            response = self.core.session.post(
                url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('resultados') and len(data['resultados']) > 0:
                    clasificacion = data['resultados'][0][0]['valor']
                    logger.info(f"✅ Clasificación: {clasificacion}")
                    return {
                        'success': True,
                        'clasificacion_suelo': clasificacion
                    }
            
            return {'success': False}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo clasificación: {str(e)}")
            return {'success': False}
