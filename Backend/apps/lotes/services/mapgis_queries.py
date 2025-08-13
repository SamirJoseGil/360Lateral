"""
Consultas específicas del servicio MapGIS - Área, clasificación, usos, aprovechamiento
"""
import json
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class MapGISQueries:
    """
    Consultas específicas a los diferentes endpoints de MapGIS
    """
    
    def __init__(self, core_service):
        self.core = core_service
    
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
                data = json.loads(response.text)
                if data.get('resultados') and len(data['resultados']) > 0:
                    area_valor = data['resultados'][0][0]['valor']
                    logger.info(f"✅ Área del lote: {area_valor}")
                    return {
                        'success': True,
                        'area_lote': area_valor,
                        'area_lote_m2': self._extraer_valor_numerico_area(area_valor)
                    }
            
            return {'success': False, 'error': 'No se encontró información de área'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo área del lote: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_clasificacion_suelo(self, cbml: str) -> Dict:
        """Consulta la clasificación del suelo"""
        try:
            clasificacion_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_CLASIFICACIONSUELO',
                'campos': 'Clasificación del suelo'
            }
            
            response = self.core.session.post(
                clasificacion_url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                data = json.loads(response.text)
                if data.get('resultados') and len(data['resultados']) > 0:
                    clasificacion = data['resultados'][0][0]['valor']
                    logger.info(f"✅ Clasificación del suelo: {clasificacion}")
                    return {
                        'success': True,
                        'clasificacion_suelo': clasificacion
                    }
            
            return {'success': False, 'error': 'No se encontró clasificación del suelo'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo clasificación del suelo: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_usos_generales(self, cbml: str) -> Dict:
        """Consulta los usos generales del suelo urbano"""
        try:
            usos_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_USOSGENERALES',
                'campos': 'Categoría de uso,Subcategoría de uso,COD_SUBCAT_USO,porcentaje'
            }
            
            response = self.core.session.post(
                usos_url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                data = json.loads(response.text)
                if data.get('resultados') and len(data['resultados']) > 0:
                    from .mapgis_processors import MapGISProcessors
                    uso_data = MapGISProcessors.procesar_datos_uso_suelo(data['resultados'][0])
                    logger.info(f"✅ Uso del suelo: {uso_data.get('categoria_uso', 'N/A')}")
                    return {
                        'success': True,
                        'uso_suelo': uso_data
                    }
            
            return {'success': False, 'error': 'No se encontraron usos del suelo'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo usos del suelo: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_aprovechamiento_urbano(self, cbml: str) -> Dict:
        """Consulta el aprovechamiento urbano"""
        try:
            aprovechamiento_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_APROVECHAMIENTOSURBANOS',
                'campos': 'TRATAMIENTO,Dens habit max (Viv/ha),Dens max tot venta derechos,IC max,IC max venta derechos,Altura normativa,IDENTIFICADOR'
            }
            
            response = self.core.session.post(
                aprovechamiento_url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                data = json.loads(response.text)
                if data.get('resultados') and len(data['resultados']) > 0:
                    from .mapgis_processors import MapGISProcessors
                    aprovechamiento_data = MapGISProcessors.procesar_datos_aprovechamiento(data['resultados'][0])
                    logger.info(f"✅ Aprovechamiento urbano: {aprovechamiento_data.get('tratamiento', 'N/A')}")
                    return {
                        'success': True,
                        'aprovechamiento_urbano': aprovechamiento_data
                    }
            
            return {'success': False, 'error': 'No se encontró aprovechamiento urbano'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo aprovechamiento urbano: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_casos_pot(self, cbml: str) -> Dict:
        """Consulta los casos POT"""
        try:
            casos_url = f"{self.core.base_url}/site_consulta_pot/consultarCasosPot.hyg"
            params = {'cbml': cbml}
            
            response = self.core.session.post(
                casos_url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200 and response.text.strip():
                try:
                    casos_data = json.loads(response.text)
                    logger.info("✅ Casos POT obtenidos")
                    return {
                        'success': True,
                        'casos_pot': casos_data
                    }
                except json.JSONDecodeError:
                    return {
                        'success': True,
                        'casos_pot_text': response.text.strip()
                    }
            
            return {'success': False, 'error': 'No se encontraron casos POT'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo casos POT: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_geometria_lote(self, cbml: str) -> Dict:
        """Consulta la geometría del lote"""
        try:
            lotes_url = f"{self.core.base_url}/site_consulta_pot/consultarLotes.hyg"
            headers = {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            }
            data = json.dumps({"cbml": cbml})
            
            response = self.core.session.post(
                lotes_url,
                data=data,
                headers=headers,
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                geometria_data = json.loads(response.text)
                if geometria_data and len(geometria_data) > 0:
                    logger.info("✅ Geometría del lote obtenida")
                    return {
                        'success': True,
                        'geometria': geometria_data[0]
                    }
            
            return {'success': False, 'error': 'No se encontró geometría del lote'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo geometría: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _extraer_valor_numerico_area(self, area_texto: str) -> float:
        """Extrae el valor numérico del área desde el texto"""
        try:
            import re
            # Buscar números con decimales en el texto (ej: "428.95 m²")
            match = re.search(r'(\d+\.?\d*)', area_texto)
            if match:
                return float(match.group(1))
            return 0.0
        except:
            return 0.0
