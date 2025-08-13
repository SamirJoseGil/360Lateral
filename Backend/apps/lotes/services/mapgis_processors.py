"""
Procesadores de datos específicos de MapGIS - Uso del suelo, aprovechamiento, etc.
"""
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class MapGISProcessors:
    """
    Procesadores especializados para diferentes tipos de datos de MapGIS
    """
    
    @staticmethod
    def procesar_datos_uso_suelo(resultados: list) -> Dict:
        """Procesa los datos de uso del suelo"""
        try:
            uso_data = {}
            for item in resultados:
                nombre = item.get('nombre', '').lower()
                valor = item.get('valor', '')
                
                if 'porcentaje' in nombre:
                    try:
                        uso_data['porcentaje'] = float(valor)
                    except:
                        uso_data['porcentaje'] = valor
                elif 'categoría de uso' in nombre:
                    uso_data['categoria_uso'] = valor
                elif 'subcategoría de uso' in nombre:
                    uso_data['subcategoria_uso'] = valor
                elif 'cod_subcat_uso' in nombre:
                    uso_data['codigo_subcategoria'] = valor
            
            return uso_data
        except Exception as e:
            logger.error(f"Error procesando uso del suelo: {str(e)}")
            return {}
    
    @staticmethod
    def procesar_datos_aprovechamiento(resultados: list) -> Dict:
        """Procesa los datos de aprovechamiento urbano"""
        try:
            aprovechamiento_data = {}
            for item in resultados:
                nombre = item.get('nombre', '').lower()
                valor = item.get('valor', '')
                
                if 'tratamiento' in nombre and 'código' not in nombre:
                    aprovechamiento_data['tratamiento'] = valor
                elif 'código tratamiento' in nombre:
                    aprovechamiento_data['codigo_tratamiento'] = valor
                elif 'dens habit max' in nombre:
                    try:
                        aprovechamiento_data['densidad_habitacional_max'] = int(valor)
                    except:
                        aprovechamiento_data['densidad_habitacional_max'] = valor
                elif 'ic max' in nombre and 'venta' not in nombre:
                    aprovechamiento_data['indice_construccion_max'] = valor
                elif 'altura normativa' in nombre:
                    aprovechamiento_data['altura_normativa'] = valor
                elif 'identificador' in nombre:
                    aprovechamiento_data['identificador'] = valor
            
            return aprovechamiento_data
        except Exception as e:
            logger.error(f"Error procesando aprovechamiento urbano: {str(e)}")
            return {}
    
    @staticmethod
    def procesar_datos_clasificacion(data: Dict) -> Dict:
        """Procesa datos de clasificación del suelo"""
        try:
            if data.get('resultados') and len(data['resultados']) > 0:
                clasificacion = data['resultados'][0][0]['valor']
                return {
                    'clasificacion_suelo': clasificacion,
                    'es_urbano': clasificacion.lower() == 'urbano',
                    'es_rural': clasificacion.lower() == 'rural'
                }
            return {}
        except Exception as e:
            logger.error(f"Error procesando clasificación: {str(e)}")
            return {}
    
    @staticmethod
    def procesar_datos_area(data: Dict) -> Dict:
        """Procesa datos de área del lote"""
        try:
            if data.get('resultados') and len(data['resultados']) > 0:
                area_valor = data['resultados'][0][0]['valor']
                from .mapgis_extractors import MapGISExtractors
                area_numerica = MapGISExtractors.extraer_valor_numerico_area(area_valor)
                
                return {
                    'area_lote': area_valor,
                    'area_lote_m2': area_numerica,
                    'area_valida': area_numerica > 0
                }
            return {}
        except Exception as e:
            logger.error(f"Error procesando área: {str(e)}")
            return {}
    
    @staticmethod
    def consolidar_datos_completos(resultado_base: Dict, consultas_adicionales: Dict) -> Dict:
        """Consolida todos los datos obtenidos de las diferentes consultas"""
        try:
            # Agregar datos de área del lote
            if consultas_adicionales.get('area_lote', {}).get('success'):
                area_data = consultas_adicionales['area_lote']
                resultado_base['datos']['area_lote'] = area_data.get('area_lote')
                if area_data.get('area_lote_m2', 0) > 0:
                    resultado_base['datos']['area_lote_m2'] = area_data['area_lote_m2']
            
            # Agregar clasificación del suelo
            if consultas_adicionales.get('clasificacion_suelo', {}).get('success'):
                clasificacion_data = consultas_adicionales['clasificacion_suelo']
                resultado_base['datos']['clasificacion_suelo'] = clasificacion_data.get('clasificacion_suelo')
            
            # Agregar uso del suelo
            if consultas_adicionales.get('uso_suelo', {}).get('success'):
                uso_data = consultas_adicionales['uso_suelo']
                resultado_base['datos']['uso_suelo'] = uso_data.get('uso_suelo')
            
            # Agregar aprovechamiento urbano
            if consultas_adicionales.get('aprovechamiento_urbano', {}).get('success'):
                aprovechamiento_data = consultas_adicionales['aprovechamiento_urbano']
                resultado_base['datos']['aprovechamiento_urbano'] = aprovechamiento_data.get('aprovechamiento_urbano')
            
            # Agregar casos POT
            if consultas_adicionales.get('casos_pot', {}).get('success'):
                casos_data = consultas_adicionales['casos_pot']
                if 'casos_pot' in casos_data:
                    resultado_base['datos']['casos_pot'] = casos_data['casos_pot']
                elif 'casos_pot_text' in casos_data:
                    resultado_base['datos']['casos_pot_text'] = casos_data['casos_pot_text']
            
            # Agregar geometría
            if consultas_adicionales.get('geometria', {}).get('success'):
                geometria_data = consultas_adicionales['geometria']
                resultado_base['datos']['geometria'] = geometria_data.get('geometria')
            
            return resultado_base
            
        except Exception as e:
            logger.error(f"❌ Error consolidando datos: {str(e)}")
            return resultado_base
