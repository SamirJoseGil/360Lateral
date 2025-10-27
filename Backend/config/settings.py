"""
Django settings for Lateral 360° project.
Simplified single-file configuration with environment-based overrides.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# =============================================================================
# BASE PATHS
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno desde .env
load_dotenv(BASE_DIR / '.env', encoding='utf-8')

# =============================================================================
# ENVIRONMENT DETECTION
# =============================================================================

# Detectar entorno: development, production, testing
DJANGO_ENV = os.getenv('DJANGO_ENV', 'development')
DEBUG = os.getenv('DEBUG', 'True' if DJANGO_ENV == 'development' else 'False').lower() == 'true'

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if DJANGO_ENV == 'production':
        raise ValueError("SECRET_KEY must be set in production!")
    SECRET_KEY = 'django-insecure-dev-key-change-in-production-1234567890'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*' if DEBUG else '').split(',')

# Agregar hosts de Docker si estamos en entorno Docker
if os.getenv('DOCKER_ENV') == 'true':
    ALLOWED_HOSTS.extend(['backend', 'lateral360_backend', '0.0.0.0'])

# =============================================================================
# APPLICATIONS
# =============================================================================

INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # ✅ Agregar para JWT blacklist
    'corsheaders',
    'drf_yasg',
    'django_filters',
    
    # Local apps - ORDEN IMPORTANTE
    'apps.users',              # 1️⃣ PRIMERO - Define el modelo User
    'apps.common',             # 2️⃣ SEGUNDO - Utilidades que no dependen de otros
    'apps.authentication',     # 3️⃣ TERCERO - Depende de User
    'apps.pot',                # 4️⃣ CUARTO - Independiente
    'apps.lotes',              # 5️⃣ QUINTO - Depende de User y POT
    'apps.documents',          # 6️⃣ SEXTO - Depende de User y Lotes
    'apps.stats',              # 7️⃣ SÉPTIMO - Depende de User
]

# =============================================================================
# MIDDLEWARE
# =============================================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Debe estar antes de CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Agregar middleware de debugging en desarrollo
if DEBUG:
    MIDDLEWARE.insert(2, 'apps.common.middleware.cors_middleware.CORSDebugMiddleware')

# Agregar middleware de logging de API
MIDDLEWARE.append('apps.common.middleware.api_logging.APILoggingMiddleware')

# =============================================================================
# URLS & WSGI
# =============================================================================

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
APPEND_SLASH = False

# =============================================================================
# TEMPLATES
# =============================================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# =============================================================================
# DATABASE
# =============================================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'lateral360'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600 if DJANGO_ENV == 'production' else 0,
        'OPTIONS': {
            'client_encoding': 'UTF8',
            'connect_timeout': 10,
        },
    }
}

# =============================================================================
# AUTHENTICATION
# =============================================================================

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
] if DJANGO_ENV != 'testing' else []

# =============================================================================
# JWT CONFIGURATION
# =============================================================================

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_MINUTES', 60))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# =============================================================================
# REST FRAMEWORK
# =============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': int(os.getenv('API_PAGE_SIZE', 20)),
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ] + (['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),
    'EXCEPTION_HANDLER': 'apps.common.utils.custom_exception_handler',
}

# =============================================================================
# CORS CONFIGURATION
# =============================================================================

# Lista de orígenes por defecto
DEFAULT_CORS_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# En Docker, agregar nombres de servicios
if os.getenv('DOCKER_ENV') == 'true':
    DEFAULT_CORS_ORIGINS.extend([
        'http://frontend:3000',
        'http://lateral360_frontend:3000',
        'http://0.0.0.0:3000',
    ])

# Permitir override desde ENV
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', ','.join(DEFAULT_CORS_ORIGINS)).split(',')
# Limpiar espacios en blanco y filtrar vacíos
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS if origin.strip()]

CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', ','.join(CORS_ALLOWED_ORIGINS)).split(',')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS if origin.strip()]

CORS_ALLOW_CREDENTIALS = True

# En desarrollo, permitir todos los orígenes si está configurado
CORS_ALLOW_ALL_ORIGINS = DEBUG and os.getenv('CORS_ALLOW_ALL', 'False').lower() == 'true'

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',
    'pragma',
]

CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']

# Exponer headers adicionales si es necesario
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]

# =============================================================================
# SESSION & COOKIES
# =============================================================================

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = int(os.getenv('SESSION_AGE_SECONDS', 3600))

CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'Lax'

# =============================================================================
# CACHE
# =============================================================================

REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')

if DJANGO_ENV == 'production' and REDIS_HOST != 'localhost':
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/1',
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'PASSWORD': REDIS_PASSWORD,
            },
            'KEY_PREFIX': 'lateral360',
            'TIMEOUT': 300,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'lateral360-cache',
        }
    }

# =============================================================================
# LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} - {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple' if DEBUG else 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        # ✅ CRÍTICO: Agregar logger para CORS debugging
        'apps.common.middleware.cors_middleware': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        # Silenciar logs muy verbosos en desarrollo
        'django.request': {
            'handlers': ['console'],
            'level': 'WARNING' if DEBUG else 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================

LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# =============================================================================
# STATIC & MEDIA FILES
# =============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ✅ NUEVO: Configurar MEDIA_URL para desarrollo
if DEBUG:
    # En desarrollo, asegurar que MEDIA_URL sea accesible desde el navegador
    MEDIA_URL = '/media/'
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"📁 MEDIA_ROOT: {MEDIA_ROOT}")
    logger.info(f"📁 MEDIA_URL: {MEDIA_URL}")
    logger.info(f"📁 Archivos servirán desde: http://localhost:8000{MEDIA_URL}")

# ✅ CRÍTICO: Asegurar que los directorios existan
for directory in [MEDIA_ROOT, STATIC_ROOT, BASE_DIR / 'logs']:
    directory.mkdir(parents=True, exist_ok=True)

# ✅ NUEVO: Logging para verificar configuración
if DEBUG:
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"📁 MEDIA_ROOT: {MEDIA_ROOT}")
    logger.info(f"📁 MEDIA_URL: {MEDIA_URL}")
    logger.info(f"📁 STATIC_ROOT: {STATIC_ROOT}")
    logger.info(f"📁 STATIC_URL: {STATIC_URL}")

# =============================================================================
# FILE UPLOADS
# =============================================================================

FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.getenv('MAX_UPLOAD_SIZE', 10 * 1024 * 1024))  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = FILE_UPLOAD_MAX_MEMORY_SIZE

# ✅ AGREGAR: Handlers para archivos temporales
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]

# ✅ AGREGAR: Directorio para archivos temporales
FILE_UPLOAD_TEMP_DIR = BASE_DIR / 'tmp'
FILE_UPLOAD_TEMP_DIR.mkdir(parents=True, exist_ok=True)

# =============================================================================
# EMAIL
# =============================================================================

if DJANGO_ENV == 'production':
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
    DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
    DEFAULT_FROM_EMAIL = 'noreply@lateral360.local'

# =============================================================================
# SECURITY HEADERS
# =============================================================================

if DJANGO_ENV == 'production':
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'SAMEORIGIN'  # ✅ Cambiado de DENY a SAMEORIGIN
else:
    # ✅ En desarrollo, permitir iframes del mismo origen
    X_FRAME_OPTIONS = 'SAMEORIGIN'

# =============================================================================
# ADMIN
# =============================================================================

ADMIN_ENABLED = os.getenv('ADMIN_ENABLED', 'True').lower() == 'true'

# =============================================================================
# DEFAULT PRIMARY KEY
# =============================================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# SWAGGER/API DOCS
# =============================================================================

SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    'USE_SESSION_AUTH': False,
    'JSON_EDITOR': True,
}

# =============================================================================
# LOGGING STARTUP INFO
# =============================================================================

if DEBUG:
    import logging
    logger = logging.getLogger(__name__)
    logger.info("=" * 60)
    logger.info(f"🚀 LATERAL 360° - {DJANGO_ENV.upper()} MODE")
    logger.info(f"   DEBUG: {DEBUG}")
    logger.info(f"   ALLOWED_HOSTS: {ALLOWED_HOSTS}")
    logger.info(f"   CORS_ORIGINS: {len(CORS_ALLOWED_ORIGINS)} configured")
    logger.info(f"   CORS_ALLOW_ALL: {CORS_ALLOW_ALL_ORIGINS}")
    logger.info(f"   DATABASE: {DATABASES['default']['NAME']}@{DATABASES['default']['HOST']}")
    logger.info("=" * 60)
