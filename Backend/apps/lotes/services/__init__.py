"""
Servicios de la aplicación de lotes - CORREGIDO SIN INICIALIZACIÓN AUTOMÁTICA
"""
# ❌ NO instanciar servicios aquí, solo importar las clases
# Esto evita problemas de inicialización circular

from .mapgis_service import MapGISService
from .lotes_service import LotesService

# ✅ Exportar solo las clases, NO instancias
__all__ = ['MapGISService', 'LotesService']

# ❌ ELIMINAR ESTA LÍNEA que causa el error:
# mapgis_service = MapGISService()

# Los servicios deben ser instanciados donde se necesiten:
from apps.lotes.services import MapGISService
#mapgis_service = MapGISService()
lotes_service = LotesService()