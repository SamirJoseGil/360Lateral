# This file makes the views directory a Python package

"""
Views package para el módulo de lotes
"""

# Importar vistas CRUD básicas
from .lotes_views import (
    LoteListCreateView,
    LoteDetailView,
    LoteMapGISSearchView,
    LoteAnalysisView
)

# Importar vistas de favoritos
from .favorites_views import FavoriteViewSet

# Importar vistas públicas de MapGIS
from .public_mapgis_views import (
    PublicMapGISCBMLView,
    PublicMapGISMatriculaView,
    PublicMapGISDireccionView
)

# Importar vistas de verificación
from .verification_views import (
    LoteVerificationView,
    LotePendingVerificationListView
)

# Definir qué símbolos exporta este módulo
__all__ = [
    'LoteListCreateView',
    'LoteDetailView',
    'LoteMapGISSearchView',
    'LoteAnalysisView',
    'FavoriteViewSet',
    'PublicMapGISCBMLView',
    'PublicMapGISMatriculaView',
    'PublicMapGISDireccionView',
    'LoteVerificationView',
    'LotePendingVerificationListView',
]