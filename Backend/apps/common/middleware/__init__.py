"""
Inicializador de middleware personalizado
"""

from .api_logging import APILoggingMiddleware

__all__ = ['APILoggingMiddleware']
