"""
Servicio para integración con MapGIS de Medellín
"""

import requests
import logging
from typing import Dict, Optional
from datetime import datetime
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class MapGISService:
    """Servicio principal para interactuar con MapGIS"""
    
    def __init__(self):
        self.base_url = "https://www.medellin.gov.co"
        self.timeout = 30
        self.session = requests.Session()
        self._setup_session()
    
    def _setup_session(self):
        """Configura headers de sesión"""
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'es-ES,es;q=0.9',
            'X-Requested-With': 'XMLHttpRequest',
        })
    
    def buscar_por_cbml(self, cbml: str) -> Dict:
        """
        Busca información de un predio por CBML
        
        Args:
            cbml: Código CBML del predio
            
        Returns:
            Diccionario con información del predio
        """
        try:
            logger.info(f"Buscando información para CBML: {cbml}")
            
            url = f"{self.base_url}/site_consulta_pot/buscarFichaCBML.hyg"
            data = {'cbml': cbml}
            
            response = self.session.post(url, data=data, timeout=self.timeout)
            
            if response.status_code == 200:
                resultado = self._parsear_respuesta_cbml(response.json())
                logger.info(f"Información encontrada para CBML {cbml}")
                return {
                    'success': True,
                    'encontrado': True,
                    'data': resultado
                }
            
            logger.warning(f"CBML {cbml} no encontrado")
            return {
                'success': False,
                'encontrado': False,
                'message': 'CBML no encontrado'
            }
            
        except Exception as e:
            logger.error(f"Error buscando CBML {cbml}: {str(e)}")
            return {
                'success': False,
                'encontrado': False,
                'error': str(e)
            }
    
    def buscar_por_matricula(self, matricula: str) -> Dict:
        """
        Busca información de un predio por matrícula
        
        Args:
            matricula: Número de matrícula inmobiliaria
            
        Returns:
            Diccionario con información del predio
        """
        try:
            logger.info(f"Buscando información para matrícula: {matricula}")
            
            # Limpiar matrícula
            matricula_limpia = matricula.lstrip('0') or '0'
            
            url = f"{self.base_url}/site_consulta_pot/buscarFichaMat.hyg"
            data = {'matricula': matricula_limpia}
            
            response = self.session.post(url, data=data, timeout=self.timeout)
            
            if response.status_code == 200:
                resultado = response.json()
                
                # Verificar si se encontró CBML
                if resultado.get('cbml'):
                    # Buscar por CBML para obtener información completa
                    return self.buscar_por_cbml(resultado['cbml'])
                
                logger.warning(f"Matrícula {matricula} no encontrada")
                return {
                    'success': False,
                    'encontrado': False,
                    'message': 'Matrícula no encontrada'
                }
            
            return {
                'success': False,
                'encontrado': False,
                'message': 'Error en la consulta'
            }
            
        except Exception as e:
            logger.error(f"Error buscando matrícula {matricula}: {str(e)}")
            return {
                'success': False,
                'encontrado': False,
                'error': str(e)
            }
    
    def buscar_por_direccion(self, direccion: str) -> Dict:
        """
        Busca predios por dirección
        
        Args:
            direccion: Dirección a buscar
            
        Returns:
            Diccionario con resultados de la búsqueda
        """
        try:
            logger.info(f"Buscando predios en dirección: {direccion}")
            
            url = f"{self.base_url}/site_consulta_pot/buscarFichaDireccion.hyg"
            data = {'direccion': direccion}
            
            response = self.session.post(url, data=data, timeout=self.timeout)
            
            if response.status_code == 200:
                resultados = response.json()
                
                return {
                    'success': True,
                    'encontrado': len(resultados) > 0,
                    'resultados': resultados,
                    'total': len(resultados)
                }
            
            return {
                'success': False,
                'encontrado': False,
                'message': 'Error en la búsqueda'
            }
            
        except Exception as e:
            logger.error(f"Error buscando dirección {direccion}: {str(e)}")
            return {
                'success': False,
                'encontrado': False,
                'error': str(e)
            }
    
    def _parsear_respuesta_cbml(self, data: Dict) -> Dict:
        """
        Parsea la respuesta JSON de MapGIS
        
        Args:
            data: Respuesta JSON de MapGIS
            
        Returns:
            Diccionario con información estructurada
        """
        resultado = {
            'cbml': data.get('cbml'),
            'direccion': data.get('direccion'),
            'barrio': data.get('barrio'),
            'comuna': data.get('comuna'),
            'estrato': data.get('estrato'),
            'area_lote_m2': data.get('area'),
            'clasificacion_suelo': data.get('clasificacion'),
            'uso_suelo': {
                'categoria_uso': data.get('uso_principal'),
                'subcategoria_uso': data.get('uso_complementario'),
            },
            'aprovechamiento_urbano': {
                'tratamiento': data.get('tratamiento'),
                'densidad_habitacional_max': data.get('densidad_max'),
                'altura_normativa': data.get('altura_max'),
                'indice_construccion': data.get('indice_construccion'),
                'indice_ocupacion': data.get('indice_ocupacion'),
            },
            'restricciones_ambientales': data.get('restricciones', {}),
            'coordenadas': {
                'latitud': data.get('latitud'),
                'longitud': data.get('longitud'),
            }
        }
        
        return resultado
    
    def health_check(self) -> Dict:
        """
        Verifica la disponibilidad del servicio MapGIS
        
        Returns:
            Diccionario con estado del servicio
        """
        try:
            response = self.session.get(
                f"{self.base_url}/site_consulta_pot/",
                timeout=10
            )
            
            disponible = response.status_code == 200
            
            return {
                'status': 'ok' if disponible else 'error',
                'mapgis_available': disponible,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error en health check: {str(e)}")
            return {
                'status': 'error',
                'mapgis_available': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }