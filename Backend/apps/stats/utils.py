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


def stats_to_dict(stats):
    """
    Convierte una estadística o lista de estadísticas a diccionarios serializables
    
    Args:
        stats: Un objeto Stat o lista de objetos Stat
    
    Returns:
        Dict o lista de dicts con datos serializables
    """
    if not stats:
        return []
    
    if isinstance(stats, list):
        return [stats_to_dict(stat) for stat in stats]
        
    # Caso para un único objeto Stat
    try:
        return {
            'id': stats.id,
            'type': stats.type,
            'name': stats.name,
            'value': stats.value,
            'timestamp': stats.timestamp.isoformat() if stats.timestamp else None,
            'user_id': str(stats.user_id) if stats.user_id else None,
            'session_id': stats.session_id,
            'ip_address': stats.ip_address
        }
    except AttributeError:
        # Si no es un objeto Stat válido, devolver un dict vacío
        return {}


def make_backup_entry(type, name, value, user_id, session_id, ip_address):
    """
    Crea una entrada para el archivo de respaldo con todos los campos serializados correctamente.
    
    Returns:
        str: Cadena JSON con la entrada serializada
    """
    log_entry = {
        'type': type,
        'name': name,
        'value': value,
        'timestamp': datetime.now().isoformat(),
        'user_id': str(user_id) if user_id else None,
        'session_id': session_id,
        'ip_address': str(ip_address) if ip_address else None
    }
    
    return json.dumps(log_entry, default=json_serializable)
