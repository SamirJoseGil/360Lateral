"""
Configuración de desarrollo para Lateral 360°
"""
from .base import *
import os
from datetime import timedelta

# Development specific settings
DEBUG = True
ALLOWED_HOSTS = ['*']

# ✅ SOLO PostgreSQL - Eliminar opción SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'lateral360'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', '1234'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'options': '-c client_encoding=UTF8',  # ✅ Forzar codificación UTF-8
        },
    }
}
print(f"📊 Database: PostgreSQL - {DATABASES['default']['HOST']}:{DATABASES['default']['PORT']}")

# CORS settings para desarrollo
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:8002",  # Puerto del frontend
]

CORS_ALLOW_ALL_ORIGINS = True  # Solo para desarrollo
CORS_ALLOW_CREDENTIALS = True

# CSRF settings
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:8002",  # Puerto del frontend
]

# ✅ Configuración adicional para desarrollo
CSRF_COOKIE_SECURE = False  # Solo para desarrollo
CSRF_COOKIE_HTTPONLY = False  # Permitir acceso desde JS en desarrollo
CSRF_COOKIE_SAMESITE = 'Lax'  # Permitir requests cross-site en desarrollo
SESSION_COOKIE_SECURE = False  # Solo para desarrollo
SESSION_COOKIE_SAMESITE = 'Lax'

# ✅ Configuración específica para CSRF en desarrollo
CSRF_USE_SESSIONS = False  # Usar cookies en lugar de sesiones
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # 1 hora para desarrollo
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# Email backend para desarrollo (imprime en consola)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache simple para desarrollo
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# ✅ Redis URL para desarrollo (local)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

# Logging para desarrollo
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',  # Cambiar a DEBUG para más detalles
    },
    'loggers': {
        'django.db.backends': {  # Logs de la base de datos
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# ✅ Configuración de impresión de debug (solo una vez, SIN EMOJIS)
if not os.environ.get('DJANGO_SETTINGS_PRINTED'):
    print("Django running in DEVELOPMENT mode")
    db_config = DATABASES['default']
    print(f"Database: PostgreSQL - {db_config['HOST']}:{db_config['PORT']} - {db_config['NAME']}")
    print(f"Redis: {REDIS_URL}")
    print(f"CORS Allow All: {CORS_ALLOW_ALL_ORIGINS}")
    os.environ['DJANGO_SETTINGS_PRINTED'] = 'true'
