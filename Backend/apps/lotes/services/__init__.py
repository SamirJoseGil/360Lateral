"""
Servicios para la aplicación de lotes - Módulo optimizado
"""

from .mapgis_service import MapGISService
from .lotes_service import LotesService
from .tratamientos_service import tratamientos_service

# Instancias globales para compatibilidad
mapgis_service = MapGISService()
lotes_service = LotesService()

__all__ = [
    'MapGISService', 
    'LotesService', 
    'mapgis_service', 
    'lotes_service',
    'tratamientos_service'
]
