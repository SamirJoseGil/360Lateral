"""
Servicio para integración con MapGIS de Medellín - FUNCIONAL
"""

import logging
from typing import Dict

from .base_service import BaseService
from .mapgis.core import MapGISCore
from .mapgis.queries import MapGISQueries

logger = logging.getLogger(__name__)

class MapGISService(BaseService):
    """Servicio principal para consultas a MapGIS"""
    
    def __init__(self):
        super().__init__()
        self.core = MapGISCore()
        self.queries = MapGISQueries(self.core)
    
    def buscar_por_cbml(self, cbml: str) -> Dict:
        """
        Busca información completa de un lote por CBML
        """
        try:
            cbml_limpio = self._limpiar_cbml(cbml)
            
            if not cbml_limpio or len(cbml_limpio) < 10:
                return self._error_response(
                    "CBML inválido",
                    f"El CBML debe tener al menos 10 dígitos"
                )
            
            logger.info(f"🔍 Buscando datos para CBML: {cbml_limpio}")
            
            # Inicializar sesión
            if not self.core.inicializar_sesion():
                return self._error_response(
                    "Error de sesión",
                    "No se pudo inicializar la sesión con MapGIS"
                )
            
            # Buscar ficha básica
            ficha = self.queries.buscar_ficha_por_cbml(cbml_limpio)
            
            if not ficha:
                return self._error_response(
                    "No se encontró información",
                    f"No existe información para el CBML: {cbml_limpio}"
                )
            
            # Construir datos básicos
            datos = {
                'cbml': cbml_limpio,
                'matricula': ficha.get('matricula'),
                'direccion': ficha.get('direccion'),
                'x': ficha.get('x'),
                'y': ficha.get('y')
            }
            
            # Consultar información adicional
            area_result = self.queries.consultar_area_lote(cbml_limpio)
            if area_result.get('success'):
                datos['area_lote'] = area_result['area_lote']
                datos['area_lote_m2'] = area_result['area_lote_m2']
            
            clasificacion_result = self.queries.consultar_clasificacion_suelo(cbml_limpio)
            if clasificacion_result.get('success'):
                datos['clasificacion_suelo'] = clasificacion_result['clasificacion_suelo']
            
            logger.info(f"✅ Datos encontrados para CBML {cbml_limpio}")
            
            return {
                'success': True,
                'encontrado': True,
                'data': datos,
                'fuente': 'mapgis_real',
                'cbml': cbml_limpio
            }
            
        except Exception as e:
            logger.error(f"Error en buscar_por_cbml: {str(e)}")
            return self._error_response("Error en consulta", str(e))
    
    def buscar_por_matricula(self, matricula: str) -> Dict:
        """
        Busca información completa de un lote por matrícula
        """
        try:
            matricula_limpia = self._limpiar_matricula(matricula)
            
            if not matricula_limpia:
                return self._error_response(
                    "Matrícula inválida",
                    "La matrícula proporcionada no es válida"
                )
            
            logger.info(f"🔍 Buscando datos para matrícula: {matricula_limpia}")
            
            # Inicializar sesión
            if not self.core.inicializar_sesion():
                return self._error_response(
                    "Error de sesión",
                    "No se pudo inicializar la sesión con MapGIS"
                )
            
            # Buscar ficha por matrícula
            ficha = self.queries.buscar_ficha_por_matricula(matricula_limpia)
            
            if not ficha or not ficha.get('cbml'):
                return self._error_response(
                    "No se encontró información",
                    f"No existe información para la matrícula: {matricula_limpia}"
                )
            
            cbml_encontrado = ficha['cbml']
            logger.info(f"✅ CBML encontrado para matrícula {matricula_limpia}: {cbml_encontrado}")
            
            # Buscar datos completos usando el CBML
            resultado_cbml = self.buscar_por_cbml(cbml_encontrado)
            
            if resultado_cbml.get('success'):
                resultado_cbml['data']['matricula'] = matricula_limpia
                resultado_cbml['cbml_obtenido'] = cbml_encontrado
                resultado_cbml['busqueda_origen'] = 'matricula'
                
                # Agregar coordenadas de la ficha
                if 'x' in ficha and 'y' in ficha:
                    resultado_cbml['data']['longitud'] = float(ficha['x'])
                    resultado_cbml['data']['latitud'] = float(ficha['y'])
                
                return resultado_cbml
            
            return self._error_response(
                "Datos incompletos",
                f"Se encontró CBML {cbml_encontrado} pero no se pudo obtener información completa"
            )
            
        except Exception as e:
            logger.error(f"Error en buscar_por_matricula: {str(e)}")
            return self._error_response("Error en consulta", str(e))
    
    def _limpiar_cbml(self, cbml: str) -> str:
        """Limpiar y normalizar CBML"""
        if not cbml:
            return ""
        
        import re
        return re.sub(r'[^\d]', '', str(cbml))
    
    def _limpiar_matricula(self, matricula: str) -> str:
        """Limpiar y normalizar matrícula"""
        if not matricula:
            return ""
        
        import re
        # Quitar guiones y ceros iniciales
        matricula_limpia = re.sub(r'[^\d]', '', str(matricula))
        matricula_limpia = matricula_limpia.lstrip('0') or '0'
        
        return matricula_limpia