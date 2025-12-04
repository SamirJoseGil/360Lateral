"""
Servicio principal de MapGIS - Orquestador de consultas
"""
from .mapgis_core import MapGISCore
from .base_service import MapGISBaseService
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class MapGISService(MapGISBaseService):
    """Servicio principal de MapGIS"""
    
    def __init__(self):
        super().__init__()
        self.core = MapGISCore()
    
    def consultar_lote_completo(self, cbml: str, use_cache: bool = True) -> Dict:
        """
        Consulta completa de un lote por CBML
        Args:
            cbml: Código CBML
            use_cache: Si usar cache
        Returns:
            Dict con datos del lote o error
        """
        try:
            logger.info(f"[MapGIS Service] Consultando CBML: {cbml}")
            
            if not cbml or not cbml.strip():
                logger.error("[MapGIS Service] CBML vacío")
                return self._error_response(
                    "CBML inválido",
                    "El CBML no puede estar vacío"
                )
            
            # ✅ NUEVO: Consultar todas las capas de información
            logger.info(f"[MapGIS Service] Iniciando consulta completa...")
            datos = self.core.consultar_datos_completos(cbml)
            
            # ✅ Verificar si hubo error
            if datos.get('error'):
                logger.warning(f"[MapGIS Service] ❌ {datos.get('mensaje')}")
                return self._error_response(
                    datos.get('mensaje', 'Error en consulta'),
                    datos.get('mensaje', 'No se encontró información')
                )
            
            # ✅ Procesar y estructurar datos para frontend
            datos_procesados = {
                'cbml': cbml,
                'clasificacion_suelo': datos.get('clasificacion_suelo') or 'No disponible',
                'es_urbano': datos.get('clasificacion_suelo') == 'Urbano',
                'fuente': 'MapGIS Medellín',
                'fecha_consulta': self._get_timestamp()
            }
            
            # ✅ Usos del suelo
            if datos.get('usos_generales'):
                # Tomar el primer uso (mayor porcentaje)
                uso_principal = datos['usos_generales'][0] if datos['usos_generales'] else None
                if uso_principal:
                    datos_procesados['uso_suelo'] = {
                        'categoria_uso': uso_principal.get('categoria_uso'),
                        'subcategoria_uso': uso_principal.get('subcategoria_uso'),
                        'codigo_subcategoria': uso_principal.get('codigo_subcategoria'),
                        'porcentaje': uso_principal.get('porcentaje')
                    }
            
            # ✅ Aprovechamiento urbano
            if datos.get('aprovechamientos_urbanos'):
                # Tomar el primer aprovechamiento
                aprov_principal = datos['aprovechamientos_urbanos'][0] if datos['aprovechamientos_urbanos'] else None
                if aprov_principal:
                    datos_procesados['aprovechamiento_urbano'] = {
                        'tratamiento': aprov_principal.get('tratamiento'),
                        'codigo_tratamiento': aprov_principal.get('codigo_tratamiento'),
                        'densidad_habitacional_max': aprov_principal.get('densidad_habitacional_max'),
                        'indice_construccion_max': aprov_principal.get('indice_construccion_max'),
                        'altura_normativa': aprov_principal.get('altura_normativa'),
                        'identificador': aprov_principal.get('identificador')
                    }
            
            # ✅ Restricciones ambientales
            datos_procesados['restricciones_ambientales'] = {
                'amenaza_riesgo': datos.get('restriccion_amenaza_riesgo'),
                'retiros_rios': datos.get('restriccion_retiros_rios')
            }
            
            logger.info(f"[MapGIS Service] ✅ Consulta exitosa: {cbml}")
            logger.info(f"[MapGIS Service] Datos construidos: {list(datos_procesados.keys())}")
            
            return self._success_response(datos_procesados)
            
        except Exception as e:
            logger.error(f"[MapGIS Service] ❌ Error: {str(e)}", exc_info=True)
            return self._error_response(
                "Error en consulta",
                f"Error al consultar MapGIS: {str(e)}"
            )
    
    def consultar_por_matricula(self, matricula: str) -> Dict:
        """
        Buscar lote por matrícula y obtener datos completos
        """
        try:
            logger.info(f"[MapGIS Service] Consultando matrícula: {matricula}")
            
            # ✅ Buscar por matrícula
            resultado = self.core.buscar_por_matricula(matricula)
            
            if not resultado:
                return self._error_response(
                    "Matrícula no encontrada",
                    f"No se encontró información para la matrícula {matricula}"
                )
            
            # ✅ Obtener CBML y consultar datos completos
            cbml = resultado.get('cbml')
            if cbml:
                logger.info(f"[MapGIS Service] Matrícula → CBML: {cbml}")
                return self.consultar_lote_completo(cbml, use_cache=False)
            
            return self._error_response(
                "CBML no disponible",
                "La matrícula no tiene CBML asociado"
            )
            
        except Exception as e:
            logger.error(f"[MapGIS Service] Error: {str(e)}", exc_info=True)
            return self._error_response(
                "Error en consulta",
                f"Error al consultar por matrícula: {str(e)}"
            )
    
    def health_check(self) -> Dict:
        """Health check del servicio"""
        return self.core.health_check()


# ✅ Instancia singleton
mapgis_service = MapGISService()
