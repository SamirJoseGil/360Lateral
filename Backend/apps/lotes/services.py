"""
Servicios consolidados para lógica de negocio de lotes
"""
from typing import Dict, Optional, List
import logging
from decimal import Decimal
from django.db.models import Avg, Count

from .models import Lote, Tratamiento

logger = logging.getLogger(__name__)


# =============================================================================
# SERVICIO DE LOTES
# =============================================================================

class LotesService:
    """Lógica de negocio para lotes"""
    
    @staticmethod
    def buscar_lotes(filtros: Dict) -> List[Lote]:
        """Busca lotes según filtros"""
        queryset = Lote.objects.filter(is_verified=True, status='active')
        
        if 'area_min' in filtros:
            queryset = queryset.filter(area__gte=filtros['area_min'])
        if 'area_max' in filtros:
            queryset = queryset.filter(area__lte=filtros['area_max'])
        if 'barrio' in filtros:
            queryset = queryset.filter(barrio__icontains=filtros['barrio'])
        if 'estrato' in filtros:
            queryset = queryset.filter(estrato=filtros['estrato'])
        
        return list(queryset)
    
    @staticmethod
    def validar_para_publicacion(lote: Lote) -> tuple[bool, List[str]]:
        """Valida que un lote puede ser publicado"""
        errores = []
        
        if not lote.nombre:
            errores.append("Nombre es obligatorio")
        if not lote.direccion:
            errores.append("Dirección es obligatoria")
        if not lote.area or lote.area <= 0:
            errores.append("Área debe ser mayor a 0")
        
        return len(errores) == 0, errores


# =============================================================================
# SERVICIO DE TRATAMIENTOS
# =============================================================================

class TratamientosService:
    """Cálculos de tratamientos urbanísticos"""
    
    @staticmethod
    def calcular_aprovechamiento(area_lote: float, tratamiento_codigo: str) -> Dict:
        """Calcula aprovechamiento urbanístico"""
        try:
            tratamiento = Tratamiento.objects.get(codigo=tratamiento_codigo, activo=True)
        except Tratamiento.DoesNotExist:
            return {'error': 'Tratamiento no encontrado'}
        
        calculo = {
            'area_lote': area_lote,
            'tratamiento': {
                'codigo': tratamiento.codigo,
                'nombre': tratamiento.nombre,
            }
        }
        
        if tratamiento.indice_construccion:
            area_maxima = area_lote * float(tratamiento.indice_construccion)
            calculo['area_maxima_construccion'] = round(area_maxima, 2)
        
        if tratamiento.indice_ocupacion:
            area_piso = area_lote * float(tratamiento.indice_ocupacion)
            calculo['area_maxima_por_piso'] = round(area_piso, 2)
        
        return calculo
