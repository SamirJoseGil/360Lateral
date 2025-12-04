"""
Servicios de scraping MapGIS Medellín
"""
from .base_service import MapGISBaseService
from .mapgis_core import MapGISCore
from .mapgis_service import MapGISService, mapgis_service

__all__ = [
    'MapGISBaseService',
    'MapGISCore',
    'MapGISService',
    'mapgis_service',
]
