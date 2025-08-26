"""
Inicialización del paquete de vistas de lotes por usuario
"""

# Importar las vistas necesarias
from .views import UserLotesView, my_lotes, UserLoteStatsView

# Definir los símbolos exportados
__all__ = ['UserLotesView', 'my_lotes', 'UserLoteStatsView']