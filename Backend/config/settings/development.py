"""
Configuración de desarrollo para Lateral 360°
"""
from .base import *
from decouple import config

# Development specific settings
DEBUG = True

# Email backend for development
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)

# Development specific apps
INSTALLED_APPS += [
    'django_extensions',  # Si lo instalamos más adelante
]

# Database for development (puede usar SQLite si lo prefieres)
if config('USE_SQLITE', default=False, cast=bool):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Debug toolbar (si lo instalamos)
if DEBUG and config('USE_DEBUG_TOOLBAR', default=False, cast=bool):
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1', 'localhost']

# Development specific logging
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['apps']['level'] = 'DEBUG'

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=True, cast=bool)

# Disable caching in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
} if config('DISABLE_CACHE', default=True, cast=bool) else CACHES

print(f"🚀 Django running in DEVELOPMENT mode")
print(f"📊 Database: {DATABASES['default']['HOST']}:{DATABASES['default']['PORT']}")
print(f"🔗 Redis: {REDIS_URL}")
print(f"🌐 CORS Origins: {CORS_ALLOWED_ORIGINS}")
