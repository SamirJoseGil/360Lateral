"""
Servicio de lógica de negocio para lotes
"""
from typing import Dict, Optional, List
import logging
from django.db.models import Q, Count, Avg
from decimal import Decimal

from ..models import Lote

logger = logging.getLogger(__name__)


class LotesService:
    """
    Servicio para operaciones de negocio relacionadas con lotes
    """
    
    @staticmethod
    def buscar_lotes(filtros: Dict) -> List[Lote]:
        """
        Busca lotes según filtros proporcionados
        
        Args:
            filtros: Diccionario con filtros de búsqueda
            
        Returns:
            Lista de lotes que cumplen los criterios
        """
        queryset = Lote.objects.filter(is_verified=True, estado='active')
        
        # Filtro por área
        if 'area_min' in filtros:
            queryset = queryset.filter(area__gte=filtros['area_min'])
        if 'area_max' in filtros:
            queryset = queryset.filter(area__lte=filtros['area_max'])
        
        # Filtro por ubicación
        if 'barrio' in filtros:
            queryset = queryset.filter(barrio__icontains=filtros['barrio'])
        if 'comuna' in filtros:
            queryset = queryset.filter(comuna=filtros['comuna'])
        if 'estrato' in filtros:
            queryset = queryset.filter(estrato=filtros['estrato'])
        
        # Filtro por normativa
        if 'tratamiento_pot' in filtros:
            queryset = queryset.filter(tratamiento_pot__icontains=filtros['tratamiento_pot'])
        if 'uso_suelo' in filtros:
            queryset = queryset.filter(uso_suelo__icontains=filtros['uso_suelo'])
        
        # Filtro por precio
        if 'precio_min' in filtros:
            queryset = queryset.filter(valor_comercial__gte=filtros['precio_min'])
        if 'precio_max' in filtros:
            queryset = queryset.filter(valor_comercial__lte=filtros['precio_max'])
        
        logger.info(f"Búsqueda de lotes: {queryset.count()} resultados")
        return list(queryset)
    
    @staticmethod
    def calcular_estadisticas_lote(lote: Lote) -> Dict:
        """
        Calcula estadísticas y métricas de un lote
        
        Args:
            lote: Instancia del lote
            
        Returns:
            Diccionario con estadísticas calculadas
        """
        estadisticas = {
            'id': str(lote.id),
            'cbml': lote.cbml,
            'area': float(lote.area) if lote.area else 0,
        }
        
        # Potencial constructivo
        if lote.area and lote.indice_construccion:
            area_maxima = float(lote.area) * float(lote.indice_construccion)
            estadisticas['potencial_constructivo'] = {
                'area_maxima_construccion': round(area_maxima, 2),
                'indice_construccion': float(lote.indice_construccion),
            }
            
            if lote.altura_maxima and lote.indice_ocupacion:
                area_por_piso = float(lote.area) * float(lote.indice_ocupacion)
                pisos_maximos = int(float(lote.altura_maxima) / 3)  # 3m por piso
                
                estadisticas['potencial_constructivo'].update({
                    'pisos_maximos': pisos_maximos,
                    'area_por_piso': round(area_por_piso, 2),
                })
        
        # Valoración
        if lote.valor_comercial:
            estadisticas['valoracion'] = {
                'valor_comercial': float(lote.valor_comercial),
                'valor_m2': float(lote.valor_m2) if lote.valor_m2 else 0,
            }
            
            if lote.avaluo_catastral:
                estadisticas['valoracion']['avaluo_catastral'] = float(lote.avaluo_catastral)
        
        return estadisticas
    
    @staticmethod
    def obtener_lotes_similares(lote: Lote, limite: int = 5) -> List[Lote]:
        """
        Encuentra lotes similares al proporcionado
        
        Args:
            lote: Lote de referencia
            limite: Número máximo de lotes a retornar
            
        Returns:
            Lista de lotes similares
        """
        # Buscar lotes en la misma zona con características similares
        queryset = Lote.objects.filter(
            is_verified=True,
            estado='active'
        ).exclude(id=lote.id)
        
        # Filtrar por ubicación similar
        if lote.barrio:
            queryset = queryset.filter(barrio=lote.barrio)
        elif lote.comuna:
            queryset = queryset.filter(comuna=lote.comuna)
        
        # Filtrar por área similar (±30%)
        if lote.area:
            area_min = float(lote.area) * 0.7
            area_max = float(lote.area) * 1.3
            queryset = queryset.filter(area__gte=area_min, area__lte=area_max)
        
        # Filtrar por tratamiento similar
        if lote.tratamiento_pot:
            queryset = queryset.filter(tratamiento_pot=lote.tratamiento_pot)
        
        logger.info(f"Encontrados {queryset.count()} lotes similares a {lote.cbml}")
        return list(queryset[:limite])
    
    @staticmethod
    def validar_lote_para_publicacion(lote: Lote) -> tuple[bool, List[str]]:
        """
        Valida que un lote cumple los requisitos para ser publicado
        
        Args:
            lote: Instancia del lote a validar
            
        Returns:
            Tupla (es_valido, lista_de_errores)
        """
        errores = []
        
        # Validar campos obligatorios
        if not lote.cbml:
            errores.append("CBML es obligatorio")
        if not lote.direccion:
            errores.append("Dirección es obligatoria")
        if not lote.area or lote.area <= 0:
            errores.append("Área debe ser mayor a 0")
        
        # Validar ubicación
        if not lote.barrio and not lote.comuna:
            errores.append("Debe especificar barrio o comuna")
        
        # Validar coordenadas
        if not lote.latitud or not lote.longitud:
            errores.append("Coordenadas GPS son obligatorias")
        
        # Validar clasificación
        if not lote.clasificacion_suelo:
            errores.append("Clasificación del suelo es obligatoria")
        
        es_valido = len(errores) == 0
        
        if es_valido:
            logger.info(f"Lote {lote.cbml} validado para publicación")
        else:
            logger.warning(f"Lote {lote.cbml} no cumple requisitos: {errores}")
        
        return es_valido, errores
    
    @staticmethod
    def calcular_precio_sugerido(lote: Lote) -> Optional[Decimal]:
        """
        Calcula un precio sugerido basado en lotes similares
        
        Args:
            lote: Instancia del lote
            
        Returns:
            Precio sugerido o None si no hay datos suficientes
        """
        # Buscar lotes similares con precio
        lotes_similares = Lote.objects.filter(
            is_verified=True,
            estado='active',
            valor_m2__isnull=False
        )
        
        if lote.barrio:
            lotes_similares = lotes_similares.filter(barrio=lote.barrio)
        elif lote.comuna:
            lotes_similares = lotes_similares.filter(comuna=lote.comuna)
        
        if lote.estrato:
            lotes_similares = lotes_similares.filter(estrato=lote.estrato)
        
        # Calcular precio promedio por m²
        resultado = lotes_similares.aggregate(Avg('valor_m2'))
        valor_m2_promedio = resultado['valor_m2__avg']
        
        if valor_m2_promedio and lote.area:
            precio_sugerido = Decimal(str(valor_m2_promedio)) * lote.area
            logger.info(f"Precio sugerido para {lote.cbml}: ${precio_sugerido:,.0f}")
            return precio_sugerido
        
        logger.warning(f"No hay datos suficientes para calcular precio de {lote.cbml}")
        return None
    
    @staticmethod
    def obtener_estadisticas_zona(barrio: str = None, comuna: int = None) -> Dict:
        """
        Obtiene estadísticas de lotes en una zona específica
        
        Args:
            barrio: Nombre del barrio (opcional)
            comuna: Número de comuna (opcional)
            
        Returns:
            Diccionario con estadísticas de la zona
        """
        queryset = Lote.objects.filter(is_verified=True, estado='active')
        
        if barrio:
            queryset = queryset.filter(barrio__icontains=barrio)
        if comuna:
            queryset = queryset.filter(comuna=comuna)
        
        if not queryset.exists():
            return {
                'zona': barrio or f"Comuna {comuna}",
                'total_lotes': 0,
                'mensaje': 'No hay datos disponibles para esta zona'
            }
        
        # Calcular estadísticas
        total = queryset.count()
        area_promedio = queryset.aggregate(Avg('area'))['area__avg']
        valor_m2_promedio = queryset.filter(
            valor_m2__isnull=False
        ).aggregate(Avg('valor_m2'))['valor_m2__avg']
        
        # Distribución por estrato
        por_estrato = queryset.values('estrato').annotate(
            count=Count('id')
        ).order_by('estrato')
        
        estadisticas = {
            'zona': barrio or f"Comuna {comuna}",
            'total_lotes': total,
            'area_promedio': round(float(area_promedio), 2) if area_promedio else 0,
            'valor_m2_promedio': round(float(valor_m2_promedio), 2) if valor_m2_promedio else 0,
            'distribucion_estrato': {
                f"estrato_{item['estrato']}": item['count']
                for item in por_estrato if item['estrato']
            }
        }
        
        logger.info(f"Estadísticas de zona calculadas: {estadisticas['zona']}")
        return estadisticas
