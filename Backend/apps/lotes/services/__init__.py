"""
Servicios para la aplicación de lotes
"""
from .base_service import BaseService
from .mapgis_service import MapGISService
from .lotes_service import LotesService
from .tratamientos_service import tratamientos_service

# Instancias globales para compatibilidad hacia atrás
mapgis_service = MapGISService()
lotes_service = LotesService()

# Exportar para uso directo
__all__ = [
    'BaseService',
    'MapGISService', 
    'LotesService',
    'mapgis_service',
    'lotes_service',
    'tratamientos_service'
]
