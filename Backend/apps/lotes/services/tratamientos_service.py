import json
import os
from typing import Dict, Any, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class TratamientosService:
    """
    Servicio para gestión de tratamientos urbanísticos del POT de Medellín
    """
    
    def __init__(self):
        self.tratamientos_data = None
        self._cargar_tratamientos()
    
    def _cargar_tratamientos(self):
        """Carga los datos de tratamientos desde el archivo JSON"""
        try:
            # Ruta al archivo de tratamientos
            file_path = os.path.join(
                os.path.dirname(__file__), 
                '..', 
                'data', 
                'tratamientos_pot.json'
            )
            
            with open(file_path, 'r', encoding='utf-8') as file:
                self.tratamientos_data = json.load(file)
                logger.info(f"Cargados {len(self.tratamientos_data)} tratamientos del POT")
                
        except FileNotFoundError:
            logger.error("Archivo de tratamientos no encontrado")
            self.tratamientos_data = {}
        except json.JSONDecodeError as e:
            logger.error(f"Error al parsear JSON de tratamientos: {e}")
            self.tratamientos_data = {}
        except Exception as e:
            logger.error(f"Error inesperado al cargar tratamientos: {e}")
            self.tratamientos_data = {}
    
    def obtener_tratamiento(self, nombre_tratamiento: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene la información completa de un tratamiento específico
        
        Args:
            nombre_tratamiento: Nombre del tratamiento (ej: "Consolidación Nivel 4")
        
        Returns:
            Dict con la información del tratamiento o None si no existe
        """
        if not self.tratamientos_data:
            return None
            
        # Buscar tratamiento exacto
        if nombre_tratamiento in self.tratamientos_data:
            return self.tratamientos_data[nombre_tratamiento]
        
        # Buscar tratamiento con variaciones (sin sensibilidad a mayúsculas/minúsculas)
        nombre_lower = nombre_tratamiento.lower()
        for tratamiento_key, tratamiento_data in self.tratamientos_data.items():
            if tratamiento_key.lower() == nombre_lower:
                return tratamiento_data
        
        logger.warning(f"Tratamiento no encontrado: {nombre_tratamiento}")
        return None
    
    def calcular_aprovechamiento(self, tratamiento_nombre: str, area_lote: float, 
                               tipologia: str = "multifamiliar") -> Dict[str, Any]:
        """
        Calcula el aprovechamiento urbanístico para un lote específico
        
        Args:
            tratamiento_nombre: Nombre del tratamiento
            area_lote: Área del lote en m²
            tipologia: Tipo de vivienda (unifamiliar, multifamiliar, etc.)
        
        Returns:
            Dict con los cálculos de aprovechamiento
        """
        tratamiento = self.obtener_tratamiento(tratamiento_nombre)
        if not tratamiento:
            return {
                "error": f"Tratamiento '{tratamiento_nombre}' no encontrado",
                "tratamiento_valido": False
            }
        
        try:
            # Parámetros básicos
            indice_ocupacion = tratamiento.get('indice_ocupacion', 0.7)
            indice_construccion = tratamiento.get('indice_construccion', 2.0)
            altura_maxima = tratamiento.get('altura_maxima', 3)
            
            # Cálculos principales
            area_ocupacion = area_lote * indice_ocupacion
            area_construccion_maxima = area_lote * indice_construccion
            numero_pisos_maximo = int(altura_maxima)
            
            # Área mínima de lote según tipología
            area_minima_lote = tratamiento.get('area_minima_lote', {}).get(tipologia, 60)
            
            # Verificar si cumple área mínima
            cumple_area_minima = area_lote >= area_minima_lote
            
            # Estimación de unidades (basado en área promedio por unidad)
            area_promedio_unidad = tratamiento.get('area_minima_vivienda', {}).get('2_alcobas', 45)
            unidades_estimadas = int(area_construccion_maxima / area_promedio_unidad)
            
            resultado = {
                "tratamiento_nombre": tratamiento_nombre,
                "tratamiento_valido": True,
                "area_lote": area_lote,
                "tipologia": tipologia,
                "parametros_normativos": {
                    "indice_ocupacion": indice_ocupacion,
                    "indice_construccion": indice_construccion,
                    "altura_maxima": altura_maxima,
                    "area_minima_lote": area_minima_lote
                },
                "calculos_aprovechamiento": {
                    "area_ocupacion_maxima": round(area_ocupacion, 2),
                    "area_construccion_maxima": round(area_construccion_maxima, 2),
                    "numero_pisos_maximo": numero_pisos_maximo,
                    "unidades_estimadas": unidades_estimadas,
                    "cumple_area_minima": cumple_area_minima
                },
                "retiros": {
                    "frontal": tratamiento.get('retiro_frontal', 3),
                    "lateral": tratamiento.get('retiro_lateral', 3),
                    "posterior": tratamiento.get('retiro_posterior', 3)
                }
            }
            
            logger.info(f"Cálculo exitoso para {tratamiento_nombre} - Área: {area_lote}m²")
            return resultado
            
        except Exception as e:
            logger.error(f"Error en cálculo de aprovechamiento: {e}")
            return {
                "error": f"Error en cálculo: {str(e)}",
                "tratamiento_valido": False
            }
    
    def obtener_tipologias_viables(self, tratamiento_nombre: str, area_lote: float, 
                                 frente_lote: float = None) -> Dict[str, Any]:
        """
        Determina qué tipologías son viables para un lote específico
        
        Args:
            tratamiento_nombre: Nombre del tratamiento
            area_lote: Área del lote en m²
            frente_lote: Frente del lote en metros (opcional)
        
        Returns:
            Dict con las tipologías viables
        """
        tratamiento = self.obtener_tratamiento(tratamiento_nombre)
        if not tratamiento:
            return {"error": f"Tratamiento '{tratamiento_nombre}' no encontrado"}
        
        tipologias_viables = []
        areas_minimas = tratamiento.get('area_minima_lote', {})
        frentes_minimos = tratamiento.get('frente_minimo', {})
        
        for tipologia, area_minima in areas_minimas.items():
            frente_minimo = frentes_minimos.get(tipologia, 6)
            
            # Verificar área
            cumple_area = area_lote >= area_minima
            
            # Verificar frente si se proporciona
            cumple_frente = True
            if frente_lote is not None:
                cumple_frente = frente_lote >= frente_minimo
            
            if cumple_area and cumple_frente:
                aprovechamiento = self.calcular_aprovechamiento(
                    tratamiento_nombre, area_lote, tipologia
                )
                
                tipologias_viables.append({
                    "tipologia": tipologia,
                    "area_minima_requerida": area_minima,
                    "frente_minimo_requerido": frente_minimo,
                    "cumple_requisitos": True,
                    "aprovechamiento": aprovechamiento.get('calculos_aprovechamiento', {})
                })
        
        return {
            "tratamiento_nombre": tratamiento_nombre,
            "area_lote": area_lote,
            "frente_lote": frente_lote,
            "tipologias_viables": tipologias_viables,
            "total_tipologias_viables": len(tipologias_viables)
        }
    
    def listar_tratamientos(self) -> Dict[str, Any]:
        """
        Lista todos los tratamientos disponibles
        
        Returns:
            Dict con todos los tratamientos y sus descripciones
        """
        if not self.tratamientos_data:
            return {"error": "No hay tratamientos cargados"}
        
        tratamientos_lista = {}
        for nombre, datos in self.tratamientos_data.items():
            tratamientos_lista[nombre] = {
                "descripcion": datos.get('descripcion', ''),
                "indice_ocupacion": datos.get('indice_ocupacion', 0),
                "indice_construccion": datos.get('indice_construccion', 0),
                "altura_maxima": datos.get('altura_maxima', 0)
            }
        
        return {
            "tratamientos": tratamientos_lista,
            "total": len(tratamientos_lista)
        }

# Instancia global
tratamientos_service = TratamientosService()
