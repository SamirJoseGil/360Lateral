"""
Servicio para gestionar los tratamientos del POT.
Este módulo permite consultar y actualizar la información de tratamientos urbanísticos.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from django.db import transaction

# Asumimos que existe un modelo Tratamiento en models.py, si no existe, habrá que crearlo
from ..models import Tratamiento
from .mapgis_service import MapGISService

# Configuración del logger
logger = logging.getLogger(__name__)

class TratamientoService:
    """
    Servicio para gestionar los tratamientos del POT.
    Proporciona métodos para consultar y actualizar tratamientos urbanísticos.
    """
    
    def __init__(self):
        """Inicializa el servicio."""
        self.mapgis_service = MapGISService()
    
    def obtener_tratamientos(self) -> List[Dict]:
        """
        Obtiene la lista de tratamientos urbanísticos disponibles.
        
        Returns:
            List[Dict]: Lista de tratamientos con su información
        """
        # Verificar caché primero
        cache_key = "tratamientos_pot_list"
        cached_data = cache.get(cache_key)
        if cached_data:
            logger.debug("Usando datos cacheados para lista de tratamientos")
            return cached_data
        
        try:
            # Obtener de la base de datos
            tratamientos_db = Tratamiento.objects.filter(activo=True).order_by('nombre')
            
            resultado = []
            for t in tratamientos_db:
                resultado.append({
                    'id': t.id,
                    'codigo': t.codigo,
                    'nombre': t.nombre,
                    'descripcion': t.descripcion,
                    'fecha_actualizacion': t.fecha_actualizacion.strftime('%Y-%m-%d') if t.fecha_actualizacion else None,
                    'detalles': t.detalles or {}
                })
            
            # Guardar en caché por 24 horas
            cache.set(cache_key, resultado, 60 * 60 * 24)
            
            logger.info(f"✅ Se obtuvieron {len(resultado)} tratamientos del POT")
            return resultado
            
        except Exception as e:
            logger.error(f"❌ Error obteniendo tratamientos: {str(e)}")
            # Si hay error, devolvemos una lista básica de tratamientos
            return self._tratamientos_fallback()
    
    def obtener_tratamiento_por_cbml(self, cbml: str) -> Optional[Dict]:
        """
        Obtiene el tratamiento urbanístico aplicable a un predio por su CBML.
        
        Args:
            cbml: Código CBML del predio
            
        Returns:
            Dict o None: Información del tratamiento si se encuentra
        """
        try:
            # Consultar MapGIS para obtener el tratamiento
            resultado = self.mapgis_service.buscar_por_cbml(cbml)
            
            if resultado.get('encontrado') and resultado.get('datos'):
                datos = resultado.get('datos', {})
                aprovechamiento = datos.get('aprovechamiento_urbano', {})
                
                if aprovechamiento and aprovechamiento.get('tratamiento'):
                    nombre_tratamiento = aprovechamiento.get('tratamiento')
                    
                    # Buscar el tratamiento completo en la base de datos
                    try:
                        tratamiento = Tratamiento.objects.filter(
                            nombre__icontains=nombre_tratamiento,
                            activo=True
                        ).first()
                        
                        if tratamiento:
                            return {
                                'id': tratamiento.id,
                                'codigo': tratamiento.codigo,
                                'nombre': tratamiento.nombre,
                                'descripcion': tratamiento.descripcion,
                                'cbml': cbml,
                                'detalles': tratamiento.detalles or {},
                                'aprovechamiento': aprovechamiento
                            }
                    except Exception as e:
                        logger.warning(f"Error buscando tratamiento en DB: {str(e)}")
                    
                    # Si no se encuentra en DB, devolver la info básica
                    return {
                        'nombre': nombre_tratamiento,
                        'cbml': cbml,
                        'aprovechamiento': aprovechamiento
                    }
            
            logger.warning(f"No se encontró tratamiento para CBML: {cbml}")
            return None
                
        except Exception as e:
            logger.error(f"❌ Error consultando tratamiento por CBML: {str(e)}")
            return None
    
    @transaction.atomic
    def actualizar_tratamientos(self, forzar: bool = False) -> Dict[str, Any]:
        """
        Actualiza la lista de tratamientos desde MapGIS.
        
        Args:
            forzar: Si es True, fuerza la actualización incluso si ya se actualizó recientemente
            
        Returns:
            Dict: Resultado de la operación
        """
        # Verificar si ya se actualizó recientemente (menos de 24 horas)
        ultima_actualizacion = cache.get("ultima_actualizacion_tratamientos")
        if not forzar and ultima_actualizacion:
            diferencia = (timezone.now() - ultima_actualizacion).total_seconds()
            if diferencia < 86400:  # 24 horas
                return {
                    "actualizado": False,
                    "mensaje": f"Los tratamientos ya se actualizaron hace {int(diferencia / 3600)} horas. Use forzar=true para actualizar de todos modos.",
                    "ultima_actualizacion": ultima_actualizacion.strftime('%Y-%m-%d %H:%M:%S')
                }
        
        try:
            # Obtener lista de tratamientos desde MapGIS o alguna otra fuente externa
            # En este caso, usamos datos predefinidos, pero aquí deberías implementar
            # la lógica para obtener los datos reales de MapGIS
            tratamientos_nuevos = self._obtener_tratamientos_desde_mapgis()
            
            # Contador de cambios
            creados = 0
            actualizados = 0
            
            # Actualizar en la base de datos
            for t_nuevo in tratamientos_nuevos:
                # Buscar por código y nombre
                t_existente = Tratamiento.objects.filter(
                    codigo=t_nuevo['codigo']
                ).first()
                
                if t_existente:
                    # Actualizar
                    t_existente.nombre = t_nuevo['nombre']
                    t_existente.descripcion = t_nuevo['descripcion']
                    t_existente.detalles = t_nuevo.get('detalles', {})
                    t_existente.fecha_actualizacion = timezone.now()
                    t_existente.activo = True
                    t_existente.save()
                    actualizados += 1
                else:
                    # Crear nuevo
                    Tratamiento.objects.create(
                        codigo=t_nuevo['codigo'],
                        nombre=t_nuevo['nombre'],
                        descripcion=t_nuevo['descripcion'],
                        detalles=t_nuevo.get('detalles', {}),
                        fecha_actualizacion=timezone.now(),
                        activo=True
                    )
                    creados += 1
            
            # Limpiar caché
            cache.delete("tratamientos_pot_list")
            cache.set("ultima_actualizacion_tratamientos", timezone.now())
            
            logger.info(f"✅ Actualización de tratamientos completada: {creados} creados, {actualizados} actualizados")
            
            return {
                "actualizado": True,
                "mensaje": "Tratamientos actualizados correctamente",
                "creados": creados,
                "actualizados": actualizados,
                "total": len(tratamientos_nuevos),
                "fecha": timezone.now().strftime('%Y-%m-%d %H:%M:%S')
            }
                
        except Exception as e:
            logger.error(f"❌ Error actualizando tratamientos: {str(e)}")
            return {
                "actualizado": False,
                "mensaje": f"Error actualizando tratamientos: {str(e)}",
                "error": True
            }
    
    def _obtener_tratamientos_desde_mapgis(self) -> List[Dict]:
        """
        Obtiene la lista de tratamientos desde MapGIS.
        Esta es una implementación de ejemplo que deberías reemplazar con
        la consulta real a MapGIS.
        
        Returns:
            List[Dict]: Lista de tratamientos
        """
        # Aquí deberías implementar la lógica para obtener los tratamientos
        # reales desde MapGIS. Por ahora, devolvemos datos de ejemplo.
        return [
            {
                "codigo": "CN1",
                "nombre": "Consolidación Nivel 1",
                "descripcion": "Zonas con tendencia a un desarrollo definido y estable",
                "detalles": {
                    "max_pisos": 5,
                    "normas_aplicables": ["Decreto 1232 de 2021", "Acuerdo POT 2014"]
                }
            },
            {
                "codigo": "CN2",
                "nombre": "Consolidación Nivel 2",
                "descripcion": "Zonas con tendencia a un desarrollo definido y estable que requieren de generación de espacio público y dotación de equipamientos",
                "detalles": {
                    "max_pisos": 8,
                    "normas_aplicables": ["Decreto 1232 de 2021", "Acuerdo POT 2014"]
                }
            },
            {
                "codigo": "CN3",
                "nombre": "Consolidación Nivel 3",
                "descripcion": "Zonas con tendencia a un desarrollo definido y estable que presentan carencias en dotación de infraestructura, espacio público y equipamientos",
                "detalles": {
                    "max_pisos": 12,
                    "normas_aplicables": ["Decreto 1232 de 2021", "Acuerdo POT 2014"]
                }
            },
            {
                "codigo": "CN4",
                "nombre": "Consolidación Nivel 4",
                "descripcion": "Zonas con tendencia a un desarrollo definido y estable en sectores de alta mixtura",
                "detalles": {
                    "max_pisos": 15,
                    "normas_aplicables": ["Decreto 1232 de 2021", "Acuerdo POT 2014"]
                }
            },
            {
                "codigo": "CN5",
                "nombre": "Consolidación Nivel 5",
                "descripcion": "Zonas con tendencia a un desarrollo definido y estable con predominancia de usos económicos",
                "detalles": {
                    "max_pisos": "Variable",
                    "normas_aplicables": ["Decreto 1232 de 2021", "Acuerdo POT 2014"]
                }
            },
            {
                "codigo": "RU",
                "nombre": "Renovación Urbana",
                "descripcion": "Zonas que requieren intervenciones integrales para su transformación",
                "detalles": {
                    "max_pisos": "Variable según plan parcial",
                    "normas_aplicables": ["Decreto 1232 de 2021", "Acuerdo POT 2014", "Planes Parciales"]
                }
            },
            {
                "codigo": "D",
                "nombre": "Desarrollo",
                "descripcion": "Zonas no urbanizadas que pueden ser incorporadas al desarrollo urbano",
                "detalles": {
                    "max_pisos": "Variable según plan parcial",
                    "normas_aplicables": ["Decreto 1232 de 2021", "Acuerdo POT 2014", "Planes Parciales"]
                }
            }
        ]
    
    def _tratamientos_fallback(self) -> List[Dict]:
        """
        Lista básica de tratamientos como respaldo.
        
        Returns:
            List[Dict]: Lista básica de tratamientos
        """
        return [
            {"id": 1, "codigo": "CN1", "nombre": "Consolidación Nivel 1"},
            {"id": 2, "codigo": "CN2", "nombre": "Consolidación Nivel 2"},
            {"id": 3, "codigo": "CN3", "nombre": "Consolidación Nivel 3"},
            {"id": 4, "codigo": "CN4", "nombre": "Consolidación Nivel 4"},
            {"id": 5, "codigo": "CN5", "nombre": "Consolidación Nivel 5"},
            {"id": 6, "codigo": "RU", "nombre": "Renovación Urbana"},
            {"id": 7, "codigo": "D", "nombre": "Desarrollo"}
        ]