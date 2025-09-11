"""
Utilidades específicas para la aplicación de estadísticas.
"""
import uuid
import json
from datetime import datetime


def json_serializable(obj):
    """
    Hace que un objeto sea JSON serializable. Maneja casos especiales como UUID y datetime.
    
    Args:
        obj: Objeto a convertir
    
    Returns:
        Versión serializable del objeto
    """
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if hasattr(obj, 'isoformat'):  # Para objetos datetime
        return obj.isoformat()
    return str(obj)  # Fallback para otros tipos
