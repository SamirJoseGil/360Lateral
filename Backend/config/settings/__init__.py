"""
Django settings for Lateral 360° project.

This module automatically loads the appropriate settings based on environment.
"""
import os

# Determinar el entorno basado en DJANGO_SETTINGS_MODULE o usar development por defecto
settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'config.settings.development')

if 'production' in settings_module:
    from .production import *
elif 'testing' in settings_module:
    from .testing import *
else:
    # Por defecto, usar configuración de desarrollo
    from .development import *

# Solo revisando el contenido sin modificarlo