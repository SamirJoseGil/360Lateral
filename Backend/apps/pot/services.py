"""
Servicio para consultas de tratamientos POT sin dependencias circulares
"""
import logging
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)

class POTService:
    """
    Servicio independiente para gestión de tratamientos POT
    """
    
    def __init__(self):
        pass
    
    @staticmethod
    def obtener_codigo_desde_nombre(nombre_tratamiento):
        """
        Determina el código POT desde el nombre del tratamiento
        """
        if not nombre_tratamiento:
            return None
        
        nombre_lower = nombre_tratamiento.lower()
        
        if "consolidación nivel 1" in nombre_lower or "consolidacion nivel 1" in nombre_lower:
            return "CN1"
        elif "consolidación nivel 2" in nombre_lower or "consolidacion nivel 2" in nombre_lower:
            return "CN2"
        elif "consolidación nivel 3" in nombre_lower or "consolidacion nivel 3" in nombre_lower:
            return "CN3"
        elif "consolidación nivel 4" in nombre_lower or "consolidacion nivel 4" in nombre_lower:
            return "CN4"
        elif "redesarrollo" in nombre_lower:
            return "RD"
        elif "desarrollo" in nombre_lower:
            return "D"
        elif "conservación" in nombre_lower or "conservacion" in nombre_lower:
            return "C"
        else:
            return nombre_tratamiento[:3].upper()  # Fallback
    
    def consultar_normativa_por_cbml(self, cbml):
        """
        Consulta normativa POT para un CBML específico usando MapGIS
        """
        try:
            # Importar MapGIS de manera segura
            from apps.lotes.services.mapgis_service import MapGISService
            
            mapgis_service = MapGISService()
            resultado_mapgis = mapgis_service.buscar_por_cbml(cbml)
            
            if not resultado_mapgis.get('encontrado'):
                return {
                    'success': False,
                    'error': f'No se encontró información para el CBML: {cbml}'
                }
            
            datos = resultado_mapgis.get('datos', {})
            aprovechamiento = datos.get('aprovechamiento_urbano', {})
            nombre_tratamiento = aprovechamiento.get('tratamiento', '')
            
            if not nombre_tratamiento:
                return {
                    'success': False,
                    'error': 'No se encontró información del tratamiento en MapGIS'
                }
            
            # Determinar código
            codigo = self.obtener_codigo_desde_nombre(nombre_tratamiento)
            
            return {
                'success': True,
                'cbml': cbml,
                'nombre_tratamiento': nombre_tratamiento,
                'codigo_tratamiento': codigo,
                'datos_mapgis': datos
            }
            
        except ImportError as e:
            logger.error(f"No se pudo importar MapGISService: {e}")
            return {
                'success': False,
                'error': 'Servicio MapGIS no disponible'
            }
        except Exception as e:
            logger.exception(f"Error consultando normativa por CBML: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def obtener_tratamiento_por_codigo(self, codigo):
        """
        Obtiene un tratamiento POT por su código
        """
        try:
            from .models import TratamientoPOT
            from .serializers import TratamientoPOTDetailSerializer
            
            tratamiento = TratamientoPOT.objects.get(codigo=codigo.upper(), activo=True)
            serializer = TratamientoPOTDetailSerializer(tratamiento)
            
            return {
                'success': True,
                'tratamiento': serializer.data
            }
            
        except TratamientoPOT.DoesNotExist:
            return {
                'success': False,
                'error': f'No se encontró tratamiento con código: {codigo}'
            }
        except Exception as e:
            logger.exception(f"Error obteniendo tratamiento por código: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def listar_tratamientos_activos(self):
        """
        Lista todos los tratamientos POT activos
        """
        try:
            from .models import TratamientoPOT
            from .serializers import TratamientoPOTListSerializer
            
            tratamientos = TratamientoPOT.objects.filter(activo=True).order_by('codigo')
            serializer = TratamientoPOTListSerializer(tratamientos, many=True)
            
            return {
                'success': True,
                'count': len(serializer.data),
                'tratamientos': serializer.data
            }
            
        except Exception as e:
            logger.exception(f"Error listando tratamientos: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def calcular_aprovechamiento(self, codigo_tratamiento, area_lote, tipologia='multifamiliar'):
        """
        Calcula el aprovechamiento urbanístico para un lote específico
        """
        try:
            from .models import TratamientoPOT
            
            tratamiento = TratamientoPOT.objects.get(codigo=codigo_tratamiento.upper(), activo=True)
            
            # Cálculos básicos
            area_ocupada = None
            area_construible = None
            
            if tratamiento.indice_ocupacion and area_lote:
                area_ocupada = float(tratamiento.indice_ocupacion) * float(area_lote)
            
            if tratamiento.indice_construccion and area_lote:
                area_construible = float(tratamiento.indice_construccion) * float(area_lote)
            
            return {
                'success': True,
                'tratamiento': {
                    'codigo': tratamiento.codigo,
                    'nombre': tratamiento.nombre,
                    'indice_ocupacion': float(tratamiento.indice_ocupacion) if tratamiento.indice_ocupacion else None,
                    'indice_construccion': float(tratamiento.indice_construccion) if tratamiento.indice_construccion else None,
                    'altura_maxima': tratamiento.altura_maxima
                },
                'calculos': {
                    'area_lote': float(area_lote),
                    'area_ocupada_maxima': area_ocupada,
                    'area_construible_maxima': area_construible,
                    'tipologia': tipologia
                }
            }
            
        except TratamientoPOT.DoesNotExist:
            return {
                'success': False,
                'error': f'No se encontró tratamiento con código: {codigo_tratamiento}'
            }
        except Exception as e:
            logger.exception(f"Error calculando aprovechamiento: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Instancia global
pot_service = POTService()