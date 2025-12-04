"""
Consultas específicas del servicio MapGIS - Área, clasificación, usos, aprovechamiento
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
        """
        Inicializa las queries con el servicio core
        
        Args:
            core_service: Instancia de MapGISCore
        """
        self.core = core_service
    
    def consultar_area_lote(self, cbml: str) -> Dict:
        """
        Consulta el área del lote por CBML
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con información del área o error
        """
        try:
            area_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_LOTE',
                'campos': 'Área de lote'
            }
            
            logger.info(f"🔍 Consultando área del lote CBML: {cbml}")
            
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
                    
                    # Extraer valor numérico
                    from .mapgis_extractors import MapGISExtractors
                    area_numerica = MapGISExtractors.extraer_valor_numerico_area(area_valor)
                    
                    logger.info(f"✅ Área del lote: {area_valor} ({area_numerica} m²)")
                    return {
                        'success': True,
                        'area_lote': area_valor,
                        'area_lote_m2': area_numerica
                    }
            
            return {'success': False, 'error': 'No se encontró información de área'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo área del lote: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_clasificacion_suelo(self, cbml: str) -> Dict:
        """
        Consulta la clasificación del suelo (urbano/rural)
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con clasificación o error
        """
        try:
            clasificacion_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_CLASIFICACIONSUELO',
                'campos': 'Clasificación del suelo'
            }
            
            logger.info(f"🔍 Consultando clasificación del suelo CBML: {cbml}")
            
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
                        'clasificacion_suelo': clasificacion,
                        'es_urbano': clasificacion.lower() == 'urbano',
                        'es_rural': clasificacion.lower() == 'rural'
                    }
            
            return {'success': False, 'error': 'No se encontró clasificación del suelo'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo clasificación del suelo: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_usos_generales(self, cbml: str) -> Dict:
        """
        Consulta los usos generales del suelo urbano
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con información de usos o error
        """
        try:
            usos_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_USOSGENERALES',
                'campos': 'Categoría de uso,Subcategoría de uso,COD_SUBCAT_USO,porcentaje'
            }
            
            logger.info(f"🔍 Consultando usos del suelo CBML: {cbml}")
            
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
        """
        Consulta el aprovechamiento urbano (tratamiento, densidad, índices)
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con información de aprovechamiento o error
        """
        try:
            aprovechamiento_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_APROVECHAMIENTOSURBANOS',
                'campos': 'TRATAMIENTO,Código Tratamiento,Dens habit max (Viv/ha),IC max,Altura normativa,IDENTIFICADOR'
            }
            
            logger.info(f"🔍 Consultando aprovechamiento urbano CBML: {cbml}")
            
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
    
    def consultar_restriccion_amenaza_riesgo(self, cbml: str) -> Dict:
        """
        Consulta restricciones por amenaza y riesgo
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con información de restricciones o error
        """
        try:
            restriccion_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_RESTRICCIONAMENAZARIESGO',
                'campos': 'Condiciones de riesgo y RNM'
            }
            
            logger.info(f"🔍 Consultando restricción amenaza/riesgo CBML: {cbml}")
            
            response = self.core.session.post(
                restriccion_url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                data = json.loads(response.text)
                if data.get('resultados') and len(data['resultados']) > 0:
                    valor = data['resultados'][0][0]['valor']
                    logger.info(f"✅ Restricción amenaza: {valor}")
                    return {
                        'success': True,
                        'amenaza_riesgo': valor
                    }
            
            return {'success': False, 'error': 'No se encontró información de amenaza/riesgo'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo restricción amenaza/riesgo: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_restriccion_rios_quebradas(self, cbml: str) -> Dict:
        """
        Consulta restricciones por retiros a ríos y quebradas
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con información de restricciones o error
        """
        try:
            restriccion_url = f"{self.core.base_url}/site_consulta_pot/consultas.hyg"
            params = {
                'cbml': cbml,
                'consulta': 'SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS',
                'campos': 'Restric por retiro a quebrada'
            }
            
            logger.info(f"🔍 Consultando restricción ríos/quebradas CBML: {cbml}")
            
            response = self.core.session.post(
                restriccion_url,
                params=params,
                headers={'X-Requested-With': 'XMLHttpRequest'},
                timeout=self.core.timeout
            )
            
            if response.status_code == 200:
                data = json.loads(response.text)
                if data.get('resultados') and len(data['resultados']) > 0:
                    valor = data['resultados'][0][0]['valor']
                    logger.info(f"✅ Restricción ríos: {valor}")
                    return {
                        'success': True,
                        'retiros_rios': valor
                    }
                else:
                    # Si no hay resultados, significa que no hay restricciones
                    return {
                        'success': True,
                        'retiros_rios': 'Sin restricciones por retiros a ríos o quebradas'
                    }
            
            return {'success': False, 'error': 'No se pudo consultar información de retiros'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo restricción ríos/quebradas: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_casos_pot(self, cbml: str) -> Dict:
        """
        Consulta los casos POT específicos del lote
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con casos POT o error
        """
        try:
            casos_url = f"{self.core.base_url}/site_consulta_pot/consultarCasosPot.hyg"
            params = {'cbml': cbml}
            
            logger.info(f"🔍 Consultando casos POT CBML: {cbml}")
            
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
                    # Si no es JSON válido, retornar como texto
                    return {
                        'success': True,
                        'casos_pot_text': response.text.strip()
                    }
            
            return {'success': False, 'error': 'No se encontraron casos POT'}
            
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo casos POT: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def consultar_geometria_lote(self, cbml: str) -> Dict:
        """
        Consulta la geometría del lote (coordenadas)
        
        Args:
            cbml: Código CBML del lote
            
        Returns:
            Dict con geometría o error
        """
        try:
            lotes_url = f"{self.core.base_url}/site_consulta_pot/consultarLotes.hyg"
            headers = {
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            }
            data = json.dumps({"cbml": cbml})
            
            logger.info(f"🔍 Consultando geometría del lote CBML: {cbml}")
            
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
