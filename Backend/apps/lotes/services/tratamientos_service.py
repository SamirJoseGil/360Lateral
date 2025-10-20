"""
Servicio para cálculos de tratamientos urbanísticos
"""
import logging
from typing import Dict, Optional
from decimal import Decimal

from ..models import Tratamiento

logger = logging.getLogger(__name__)


class TratamientosService:
    """
    Servicio para cálculos relacionados con tratamientos urbanísticos del POT
    """
    
    @staticmethod
    def obtener_tratamiento(codigo: str) -> Optional[Tratamiento]:
        """
        Obtiene un tratamiento por su código
        
        Args:
            codigo: Código del tratamiento (ej: 'CN1', 'RU', etc.)
            
        Returns:
            Instancia de Tratamiento o None
        """
        try:
            return Tratamiento.objects.get(codigo=codigo, activo=True)
        except Tratamiento.DoesNotExist:
            logger.warning(f"Tratamiento {codigo} no encontrado")
            return None
    
    @staticmethod
    def listar_tratamientos() -> Dict:
        """
        Lista todos los tratamientos urbanísticos disponibles
        
        Returns:
            Diccionario con tratamientos agrupados por tipo
        """
        tratamientos = Tratamiento.objects.filter(activo=True).order_by('codigo')
        
        resultado = {
            'consolidacion': [],
            'otros': []
        }
        
        for t in tratamientos:
            info = {
                'codigo': t.codigo,
                'nombre': t.nombre,
                'descripcion': t.descripcion,
                'indice_ocupacion': float(t.indice_ocupacion) if t.indice_ocupacion else None,
                'indice_construccion': float(t.indice_construccion) if t.indice_construccion else None,
                'altura_maxima': t.altura_maxima,
            }
            
            if t.codigo.startswith('CN'):
                resultado['consolidacion'].append(info)
            else:
                resultado['otros'].append(info)
        
        logger.info(f"Listados {len(tratamientos)} tratamientos")
        return resultado
    
    @staticmethod
    def calcular_aprovechamiento(area_lote: float, tratamiento_codigo: str) -> Dict:
        """
        Calcula el aprovechamiento urbanístico de un lote
        
        Args:
            area_lote: Área del lote en m²
            tratamiento_codigo: Código del tratamiento aplicable
            
        Returns:
            Diccionario con cálculos de aprovechamiento
        """
        tratamiento = TratamientosService.obtener_tratamiento(tratamiento_codigo)
        
        if not tratamiento:
            return {
                'error': f'Tratamiento {tratamiento_codigo} no encontrado',
                'area_lote': area_lote,
                'tratamiento': tratamiento_codigo
            }
        
        # Cálculos básicos
        calculo = {
            'area_lote': area_lote,
            'tratamiento': {
                'codigo': tratamiento.codigo,
                'nombre': tratamiento.nombre,
            }
        }
        
        # Área máxima de construcción
        if tratamiento.indice_construccion:
            area_maxima = area_lote * float(tratamiento.indice_construccion)
            calculo['area_maxima_construccion'] = round(area_maxima, 2)
        
        # Área por piso
        if tratamiento.indice_ocupacion:
            area_piso = area_lote * float(tratamiento.indice_ocupacion)
            calculo['area_maxima_por_piso'] = round(area_piso, 2)
        
        # Número de pisos
        if tratamiento.altura_maxima:
            altura_piso = 3  # metros por piso estándar
            pisos = int(tratamiento.altura_maxima / altura_piso)
            calculo['numero_maximo_pisos'] = pisos
        
        # Retiros
        if tratamiento.retiro_frontal:
            calculo['retiro_frontal'] = float(tratamiento.retiro_frontal)
        if tratamiento.retiro_lateral:
            calculo['retiro_lateral'] = float(tratamiento.retiro_lateral)
        if tratamiento.retiro_posterior:
            calculo['retiro_posterior'] = float(tratamiento.retiro_posterior)
        
        logger.info(f"Aprovechamiento calculado para {area_lote}m² con tratamiento {tratamiento_codigo}")
        return calculo
    
    @staticmethod
    def obtener_tratamiento_por_cbml(cbml: str) -> Dict:
        """
        Obtiene el tratamiento aplicable a un predio por su CBML
        
        Args:
            cbml: Código CBML del predio
            
        Returns:
            Diccionario con información del tratamiento
        """
        from .mapgis_service import MapGISService
        
        mapgis = MapGISService()
        resultado = mapgis.buscar_por_cbml(cbml)
        
        if not resultado.get('success'):
            return {
                'error': 'No se pudo obtener información de MapGIS',
                'cbml': cbml
            }
        
        data = resultado.get('data', {})
        aprovechamiento = data.get('aprovechamiento_urbano', {})
        
        tratamiento_nombre = aprovechamiento.get('tratamiento')
        
        if tratamiento_nombre:
            return {
                'cbml': cbml,
                'tratamiento': tratamiento_nombre,
                'densidad_max': aprovechamiento.get('densidad_habitacional_max'),
                'altura_max': aprovechamiento.get('altura_normativa'),
                'indice_construccion': aprovechamiento.get('indice_construccion'),
                'indice_ocupacion': aprovechamiento.get('indice_ocupacion'),
            }
        
        return {
            'error': 'No se encontró información de tratamiento',
            'cbml': cbml
        }
