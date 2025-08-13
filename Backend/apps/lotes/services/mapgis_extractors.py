"""
Extractores de datos del servicio MapGIS - HTML, JSON, patrones
"""
import json
import re
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class MapGISExtractors:
    """
    Extractores de datos para diferentes formatos de respuesta de MapGIS
    """
    
    @staticmethod
    def extraer_datos_html(html_content: str) -> Dict:
        """Extrae datos específicos del HTML de MapGIS"""
        try:
            datos = {}
            
            # Patrones para extraer información
            patterns = {
                'direccion': [
                    r'Dirección[:\s]*([^<>\n]+)',
                    r'direccion["\s]*:\s*["\']([^"\']+)',
                    r'<td[^>]*>([^<]*calle[^<]*)</td>',
                ],
                'barrio': [
                    r'Barrio[:\s]*([^<>\n]+)',
                    r'barrio["\s]*:\s*["\']([^"\']+)',
                ],
                'comuna': [
                    r'Comuna[:\s]*([^<>\n]+)',
                    r'comuna["\s]*:\s*["\']([^"\']+)',
                ],
                'estrato': [
                    r'Estrato[:\s]*(\d+)',
                    r'estrato["\s]*:\s*["\']?(\d+)',
                ],
                'area_terreno': [
                    r'Área.*?(\d+[\.,]?\d*)\s*m',
                    r'area["\s]*:\s*["\']?(\d+[\.,]?\d*)',
                ],
                'uso_suelo': [
                    r'Uso[:\s]*([^<>\n]+)',
                    r'uso["\s]*:\s*["\']([^"\']+)',
                ]
            }
            
            for campo, regex_list in patterns.items():
                for pattern in regex_list:
                    match = re.search(pattern, html_content, re.IGNORECASE)
                    if match:
                        valor = match.group(1).strip()
                        if valor and valor != 'null':
                            # Limpiar el valor
                            valor = re.sub(r'[<>]', '', valor).strip()
                            
                            # Convertir tipos específicos
                            if campo == 'estrato':
                                try:
                                    datos[campo] = int(valor)
                                except:
                                    datos[campo] = valor
                            elif campo == 'area_terreno':
                                try:
                                    # Reemplazar coma por punto para decimales
                                    valor_num = float(valor.replace(',', '.'))
                                    datos[campo] = valor_num
                                except:
                                    datos[campo] = valor
                            else:
                                datos[campo] = valor
                            break
            
            logger.info(f"✅ Datos extraídos del HTML: {len(datos)} campos")
            return datos
            
        except Exception as e:
            logger.error(f"❌ Error extrayendo datos del HTML: {str(e)}")
            return {}
    
    @staticmethod
    def procesar_respuesta_json(data: Dict, valor: str, search_type: str) -> Dict:
        """Procesa una respuesta JSON de MapGIS"""
        try:
            resultado_base = {
                'encontrado': True,
                'datos': {
                    'cbml': valor if search_type == 'cbml' else data.get('cbml'),
                    'matricula': valor if search_type == 'matricula' else data.get('matricula'),
                    'direccion': valor if search_type == 'direccion' else data.get('direccion'),
                    'fuente': 'MapGIS Medellín',
                    'timestamp': MapGISExtractors._get_timestamp()
                }
            }
            
            # Extraer información adicional del JSON
            if 'predios' in data and len(data['predios']) > 0:
                predio = data['predios'][0]
                resultado_base['datos'].update({
                    'direccion': predio.get('direccion', ''),
                    'barrio': predio.get('barrio', ''),
                    'comuna': predio.get('comuna', ''),
                    'zona': predio.get('zona', '')
                })
            
            return resultado_base
            
        except Exception as e:
            logger.error(f"❌ Error procesando JSON: {str(e)}")
            return {'error': True, 'mensaje': str(e)}
    
    @staticmethod
    def extraer_valor_numerico_area(area_texto: str) -> float:
        """Extrae el valor numérico del área desde el texto"""
        try:
            # Buscar números con decimales en el texto (ej: "428.95 m²")
            match = re.search(r'(\d+\.?\d*)', area_texto)
            if match:
                return float(match.group(1))
            return 0.0
        except:
            return 0.0
    
    @staticmethod
    def _get_timestamp() -> str:
        """Obtiene timestamp actual"""
        from datetime import datetime
        return datetime.now().isoformat()
