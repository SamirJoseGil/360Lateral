"""
Servicio de cache centralizado para Lateral 360°
"""
from django.core.cache import caches
from django.conf import settings
import logging
from typing import Any, Optional, Callable
from functools import wraps
import hashlib
import json

logger = logging.getLogger(__name__)

class CacheService:
    """Servicio centralizado para operaciones de cache"""
    
    # Tiempos de cache por tipo
    CACHE_TIMES = {
        'user_data': 300,        # 5 minutos
        'lotes_list': 120,       # 2 minutos
        'lotes_detail': 300,     # 5 minutos
        'statistics': 60,        # 1 minuto
        'search_results': 60,    # 1 minuto
        'user_profile': 600,     # 10 minutos
    }
    
    @staticmethod
    def get_cache(cache_name: str = 'default'):
        """Obtener instancia de cache"""
        return caches[cache_name]
    
    @staticmethod
    def generate_key(*args, **kwargs) -> str:
        """
        Generar clave única para cache basada en argumentos.
        """
        key_parts = [str(arg) for arg in args]
        key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
        key_string = ":".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    @classmethod
    def get(cls, key: str, cache_name: str = 'default') -> Optional[Any]:
        """Obtener valor del cache"""
        try:
            cache = cls.get_cache(cache_name)
            value = cache.get(key)
            
            if value is not None:
                logger.debug(f"✅ Cache HIT: {key[:50]}...")
            else:
                logger.debug(f"❌ Cache MISS: {key[:50]}...")
            
            return value
        except Exception as e:
            logger.error(f"Cache GET error: {str(e)}")
            return None
    
    @classmethod
    def set(cls, key: str, value: Any, timeout: Optional[int] = None, 
            cache_name: str = 'default') -> bool:
        """Guardar valor en cache"""
        try:
            cache = cls.get_cache(cache_name)
            cache.set(key, value, timeout=timeout)
            logger.debug(f"💾 Cache SET: {key[:50]}... (timeout: {timeout}s)")
            return True
        except Exception as e:
            logger.error(f"Cache SET error: {str(e)}")
            return False
    
    @classmethod
    def delete(cls, key: str, cache_name: str = 'default') -> bool:
        """Eliminar valor del cache"""
        try:
            cache = cls.get_cache(cache_name)
            cache.delete(key)
            logger.debug(f"🗑️ Cache DELETE: {key[:50]}...")
            return True
        except Exception as e:
            logger.error(f"Cache DELETE error: {str(e)}")
            return False
    
    @classmethod
    def clear(cls, cache_name: str = 'default') -> bool:
        """Limpiar todo el cache"""
        try:
            cache = cls.get_cache(cache_name)
            cache.clear()
            logger.info(f"🧹 Cache CLEARED: {cache_name}")
            return True
        except Exception as e:
            logger.error(f"Cache CLEAR error: {str(e)}")
            return False
    
    @classmethod
    def get_or_set(cls, key: str, default_func: Callable, timeout: Optional[int] = None,
                   cache_name: str = 'default') -> Any:
        """Obtener del cache o ejecutar función si no existe"""
        value = cls.get(key, cache_name)
        
        if value is not None:
            return value
        
        try:
            value = default_func()
            cls.set(key, value, timeout, cache_name)
            return value
        except Exception as e:
            logger.error(f"Error executing default_func: {str(e)}")
            return None


def cache_result(timeout: int = 300, cache_name: str = 'default', 
                 key_prefix: str = ''):
    """Decorador para cachear resultado de función"""
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generar clave de cache
            key_parts = [key_prefix, func.__name__]
            key_parts.extend([str(arg) for arg in args])
            key_parts.extend([f"{k}={v}" for k, v in sorted(kwargs.items())])
            cache_key = ":".join(key_parts)
            
            # Intentar obtener del cache
            result = CacheService.get(cache_key, cache_name)
            
            if result is not None:
                return result
            
            # Ejecutar función y guardar en cache
            result = func(*args, **kwargs)
            CacheService.set(cache_key, result, timeout, cache_name)
            
            return result
        
        return wrapper
    return decorator


# Funciones helper específicas
def invalidate_user_cache(user_id: str):
    """Invalidar cache relacionado con un usuario"""
    CacheService.delete(f'user_data:{user_id}')
    CacheService.delete(f'user_profile:{user_id}')
    logger.info(f"🔄 User cache invalidated: {user_id}")


def invalidate_lote_cache(lote_id: str):
    """Invalidar cache relacionado con un lote"""
    CacheService.delete(f'lote_detail:{lote_id}')
    cache = CacheService.get_cache('search')
    cache.delete_pattern('lotes_list:*')
    logger.info(f"🔄 Lote cache invalidated: {lote_id}")


def invalidate_statistics_cache():
    """Invalidar cache de estadísticas"""
    CacheService.delete('admin_statistics')
    logger.info("🔄 Statistics cache invalidated")
