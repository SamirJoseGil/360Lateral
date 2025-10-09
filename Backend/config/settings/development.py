"""
Development settings for Lateral 360° project.
"""

from .base import *
from .security import *

# =============================================================================
# DEVELOPMENT OVERRIDES
# =============================================================================

# Security settings for development
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-lateral360-dev-key-2024-CHANGE-IN-PRODUCTION')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# =============================================================================
# DATABASE DEVELOPMENT
# =============================================================================

# Override database settings for development if needed
# DATABASES already configured in base.py with environment variables

# =============================================================================
# CORS CONFIGURATION - MUY IMPORTANTE
# =============================================================================

# Lista expandida de orígenes permitidos para desarrollo
# Asegúrate de incluir TODOS los puertos y dominios que tu frontend usa
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# Orígenes confiables para CSRF
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS.copy()

# Configuración más permisiva para desarrollo
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# Logging mejorado para debugging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'apps.authentication': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# =============================================================================
# CACHE CONFIGURATION FOR DEVELOPMENT
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'lateral360-dev-cache',
        'TIMEOUT': 300,  # 5 minutes
    }
}

# =============================================================================
# LOGGING CONFIGURATION FOR DEVELOPMENT
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'development.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'app': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'security': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Crear directorio de logs si no existe
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# =============================================================================
# REST FRAMEWORK DEVELOPMENT OVERRIDES
# =============================================================================

# Configuración base si no existe
if 'REST_FRAMEWORK' not in locals():
    REST_FRAMEWORK = {
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework_simplejwt.authentication.JWTAuthentication',
        ],
        'DEFAULT_PERMISSION_CLASSES': [
            'rest_framework.permissions.IsAuthenticated',
        ],
        'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
        'PAGE_SIZE': 20
    }

# Actualizar con configuraciones de desarrollo
REST_FRAMEWORK.update({
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',  # Más permisivo en desarrollo
    ],
    # Agregar BrowsableAPIRenderer para desarrollo
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
})

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================

# Django Debug Toolbar (opcional, descomentear si se instala)
# if 'debug_toolbar' in INSTALLED_APPS:
#     MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
#     INTERNAL_IPS = ['127.0.0.1', 'localhost']

# =============================================================================
# MAPGIS DEVELOPMENT CONFIGURATION
# =============================================================================

# MapGIS settings for development
MAPGIS_BASE_URL = os.environ.get('MAPGIS_BASE_URL', 'https://www.medellin.gov.co')
MAPGIS_TIMEOUT = int(os.environ.get('MAPGIS_TIMEOUT', 30))
MAPGIS_RETRY_ATTEMPTS = int(os.environ.get('MAPGIS_RETRY_ATTEMPTS', 3))
MAPGIS_FORCE_REAL = os.environ.get('MAPGIS_FORCE_REAL', 'True').lower() == 'true'

# GeoMedellín settings
GEOMEDELLIN_BASE_URL = os.environ.get('GEOMEDELLIN_BASE_URL', 'https://geomedellin.gov.co/api')
GEOMEDELLIN_TIMEOUT = int(os.environ.get('GEOMEDELLIN_TIMEOUT', 30))

# POT settings
POT_DATA_SOURCE = os.environ.get('POT_DATA_SOURCE', 'https://pot.medellin.gov.co/api')
POT_CACHE_TIMEOUT = int(os.environ.get('POT_CACHE_TIMEOUT', 3600))

# =============================================================================
# BUSINESS LOGIC CONFIGURATION
# =============================================================================

# Cálculos urbanísticos
URBANISTIC_CALCULATIONS_ENABLED = True
DEFAULT_CONSTRUCTION_COST_PER_M2 = int(os.environ.get('DEFAULT_CONSTRUCTION_COST_PER_M2', 1200000))
DEFAULT_INDIRECT_COST_PERCENTAGE = int(os.environ.get('DEFAULT_INDIRECT_COST_PERCENTAGE', 25))
DEFAULT_FINANCIAL_COST_PERCENTAGE = int(os.environ.get('DEFAULT_FINANCIAL_COST_PERCENTAGE', 15))
DEFAULT_PROFIT_MARGIN_PERCENTAGE = int(os.environ.get('DEFAULT_PROFIT_MARGIN_PERCENTAGE', 20))

# VIS (Vivienda de Interés Social)
VIS_ENABLED = True
VIS_IVA_RETURN_PERCENTAGE = int(os.environ.get('VIS_IVA_RETURN_PERCENTAGE', 19))
VIS_MAX_VALUE_SMMLV = int(os.environ.get('VIS_MAX_VALUE_SMMLV', 135))

# =============================================================================
# SECURITY CHECKLIST (Al final para tener acceso a todas las variables)
# =============================================================================

def get_security_checklist():
    """Return a checklist of security settings for monitoring."""
    return {
        'SECRET_KEY_SECURE': len(os.environ.get('SECRET_KEY', '')) > 50,
        'DEBUG_OFF': not DEBUG,
        'ALLOWED_HOSTS_SET': bool(ALLOWED_HOSTS and ALLOWED_HOSTS != ['*']),
        'HTTPS_ENABLED': not DEBUG,
        'SECURE_HEADERS': True,
        'STRONG_PASSWORDS': True,
        'JWT_SECURE': True,
        'RATE_LIMITING': True,
        'LOGGING_ENABLED': True,
        'FILE_VALIDATION': True,
        'CORS_CONFIGURED': bool(CSRF_TRUSTED_ORIGINS),
        'SESSION_SECURE': SESSION_COOKIE_HTTPONLY,
    }

SECURITY_CHECKLIST = get_security_checklist()

# =============================================================================
# LANGUAGES BIDI CHECK
# =============================================================================

# Solo revisando el contenido sin modificarlo
