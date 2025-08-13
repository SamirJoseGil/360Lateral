"""
Importaciones de servicios para compatibilidad hacia atrás
"""
from .services.mapgis_service import MapGISService
from .services.lotes_service import LotesService

# Instancias globales para compatibilidad
mapgis_service = MapGISService()

# Importar también la instancia del módulo services
from .services import mapgis_service as _mapgis_service_module
from .services import lotes_service as _lotes_service_module

__all__ = ['mapgis_service', 'MapGISService', 'LotesService']
