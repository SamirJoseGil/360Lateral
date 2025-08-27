"""
Servicio para lógica de negocio de lotes
"""
import logging
from typing import Dict, Optional
from django.core.cache import cache

from .base_service import BaseService

logger = logging.getLogger(__name__)

class LotesService(BaseService):
    """
    Servicio para lógica de negocio relacionada con lotes
    """
    
    def __init__(self):
        super().__init__()
        # Importación tardía para evitar problemas circulares
        self._mapgis_service = None
        self.cache_timeout = 3600  # 1 hora
    
    @property
    def mapgis_service(self):
        """Lazy loading del MapGISService"""
        if self._mapgis_service is None:
            from .mapgis_service import MapGISService
            self._mapgis_service = MapGISService()
        return self._mapgis_service
    
    def consultar_predio_completo(self, valor: str, tipo_busqueda: str) -> Dict:
        """
        Consulta completa de predio con cache y validaciones
        """
        try:
            # Validar entrada
            if not valor or not valor.strip():
                return self._error_response("Valor de búsqueda requerido")
            
            valor = valor.strip()
            
            # Validar tipo de búsqueda
            if tipo_busqueda not in ['cbml', 'matricula', 'direccion']:
                return self._error_response("Tipo de búsqueda inválido")
            
            # Verificar cache
            cache_key = f"mapgis_{tipo_busqueda}_{valor}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"📋 Resultado desde cache: {cache_key}")
                cached_result['from_cache'] = True
                return cached_result
            
            # Mostrar información detallada para depuración
            logger.info(f"🔍 Consulta de predio - Tipo: {tipo_busqueda}, Valor: {valor}")
            
            # Realizar consulta según el tipo
            if tipo_busqueda == 'cbml':
                result = self.mapgis_service.buscar_por_cbml(valor)
            elif tipo_busqueda == 'matricula':
                result = self.mapgis_service.buscar_por_matricula(valor)
            else:  # direccion
                result = self.mapgis_service.buscar_por_direccion(valor)
            
            # Enriquecer resultado
            result = self._enriquecer_resultado(result, valor, tipo_busqueda)
            
            # Guardar en cache si es exitoso
            if result.get('encontrado'):
                cache.set(cache_key, result, self.cache_timeout)
                logger.info(f"💾 Resultado guardado en cache: {cache_key}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error en consultar_predio_completo: {str(e)}")
            return self._error_response("Error en consulta de predio", str(e))
    
    def _enriquecer_resultado(self, result: Dict, valor: str, tipo_busqueda: str) -> Dict:
        """Enriquece el resultado con información adicional"""
        try:
            # Actualizado para usar 'success' en lugar de 'encontrado'
            if result.get('success'):
                # Agregar metadatos de consulta
                result['consulta'] = {
                    'valor_buscado': valor,
                    'tipo_busqueda': tipo_busqueda,
                    'timestamp': self._get_timestamp()
                }
                
                # Validar y limpiar datos - Adaptado para usar 'data' en lugar de 'datos'
                if 'data' in result:
                    result['data'] = self._validar_datos_predio(result['data'])
                
                # Agregar información de confiabilidad
                result['confiabilidad'] = self._calcular_confiabilidad(result)
                
            return result
            
        except Exception as e:
            logger.error(f"❌ Error enriqueciendo resultado: {str(e)}")
            return result
    
    def _validar_datos_predio(self, datos: Dict) -> Dict:
        """Valida y limpia los datos del predio"""
        validated_data = {}
        
        # Campos esperados y sus validaciones
        field_validators = {
            'cbml': lambda x: x if x and str(x).isdigit() and len(str(x)) >= 10 else None,
            'matricula': lambda x: x if x and len(str(x)) >= 6 else None,
            'direccion': lambda x: self._clean_text_value(x) if x and len(str(x)) >= 5 else None,
            'barrio': lambda x: self._clean_text_value(x) if x else None,
            'comuna': lambda x: str(x) if x else None,
            'estrato': lambda x: int(x) if x and str(x).isdigit() and 1 <= int(x) <= 6 else None,
            'area_terreno': lambda x: self._clean_numeric_value(x) if x else None,
            'area_construida': lambda x: self._clean_numeric_value(x) if x else None,
            'clasificacion_suelo': lambda x: self._clean_text_value(x) if x else None
        }
        
        for field, validator in field_validators.items():
            if field in datos:
                try:
                    validated_value = validator(datos[field])
                    if validated_value is not None:
                        validated_data[field] = validated_value
                except Exception as e:
                    logger.debug(f"Error validando campo {field}: {str(e)}")
        
        return validated_data
    
    def _calcular_confiabilidad(self, result: Dict) -> Dict:
        """Calcula métricas de confiabilidad del resultado"""
        try:
            datos = result.get('datos', {})
            total_campos = len(datos)
            campos_completos = sum(1 for v in datos.values() if v is not None and str(v).strip())
            
            confiabilidad = {
                'total_campos': total_campos,
                'campos_completos': campos_completos,
                'porcentaje_completitud': round((campos_completos / max(total_campos, 1)) * 100, 2),
                'fuente_datos': result.get('fuente', 'Desconocida'),
                'es_respuesta_html': result.get('content_type') == 'text/html'
            }
            
            # Clasificar calidad
            if confiabilidad['porcentaje_completitud'] >= 80:
                confiabilidad['calidad'] = 'Alta'
            elif confiabilidad['porcentaje_completitud'] >= 50:
                confiabilidad['calidad'] = 'Media'
            else:
                confiabilidad['calidad'] = 'Baja'
            
            return confiabilidad
            
        except Exception as e:
            logger.error(f"❌ Error calculando confiabilidad: {str(e)}")
            return {'calidad': 'Desconocida', 'error': str(e)}
    
    def limpiar_cache_mapgis(self) -> Dict:
        """Limpia el cache de consultas MapGIS"""
        try:
            # En Django, no hay una forma directa de limpiar cache por patrón
            # Esto requeriría implementación específica según el backend de cache
            logger.info("🧹 Limpieza de cache solicitada")
            return self._success_response({}, "Cache limpiado (implementación pendiente)")
        except Exception as e:
            logger.error(f"❌ Error limpiando cache: {str(e)}")
            return self._error_response("Error limpiando cache", str(e))
    
    def _get_timestamp(self) -> str:
        """Obtiene timestamp actual"""
        from datetime import datetime
        return datetime.now().isoformat()
