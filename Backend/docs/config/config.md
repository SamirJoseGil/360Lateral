# Configuración del Proyecto (Config)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Estructura de Settings](#estructura-de-settings)
- [Variables de Entorno](#variables-de-entorno)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Configuración de JWT](#configuración-de-jwt)
- [Configuración de CORS](#configuración-de-cors)
- [Configuración de Media y Static](#configuración-de-media-y-static)
- [Apps Instaladas](#apps-instaladas)
- [Middleware](#middleware)
- [URLs Principales](#urls-principales)
- [WSGI y ASGI](#wsgi-y-asgi)
- [Deployment](#deployment)

---

## Descripción General

El directorio `config/` contiene toda la configuración del proyecto Django, incluyendo settings, URLs principales, y configuración de WSGI/ASGI.

### Estructura de Archivos

# Configuración del Proyecto (Config)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Estructura de Settings](#estructura-de-settings)
- [Variables de Entorno](#variables-de-entorno)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Configuración de JWT](#configuración-de-jwt)
- [Configuración de CORS](#configuración-de-cors)
- [Configuración de Media y Static](#configuración-de-media-y-static)
- [Apps Instaladas](#apps-instaladas)
- [Middleware](#middleware)
- [URLs Principales](#urls-principales)
- [WSGI y ASGI](#wsgi-y-asgi)
- [Deployment](#deployment)

---

## Descripción General

El directorio `config/` contiene toda la configuración del proyecto Django, incluyendo settings, URLs principales, y configuración de WSGI/ASGI.

### Estructura de Archivos

```
config/
├── __init__.py
├── settings/
│   ├── __init__.py
│   ├── base.py           # Configuración base compartida
│   ├── development.py    # Configuración de desarrollo
│   └── production.py     # Configuración de producción
├── urls.py               # URLs principales del proyecto
├── wsgi.py              # Configuración WSGI
└── asgi.py              # Configuración ASGI
```

---

## Estructura de Settings

### Settings por Ambiente

El proyecto utiliza **múltiples archivos de settings** según el ambiente:

```python
# Base (config/settings/base.py)
# - Configuración compartida
# - Apps instaladas
# - Middleware
# - Templates
# - Database base
# - Auth settings

# Development (config/settings/development.py)
# - DEBUG = True
# - Database local
# - CORS permisivo
# - Media local

# Production (config/settings/production.py)
# - DEBUG = False
# - Database remota
# - CORS restrictivo
# - Media en S3/Cloud
# - HTTPS obligatorio
```

### Selección de Settings

En manage.py y wsgi.py:

```python
import os

# Por defecto: development
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Para producción:
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
```

---

## Variables de Entorno

### Archivo .env

**Ubicación**: `Backend/.env`

```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=lateral360_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_ACCESS_TOKEN_LIFETIME=60  # minutos
JWT_REFRESH_TOKEN_LIFETIME=10080  # 7 días en minutos

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Media/Static
MEDIA_ROOT=/path/to/media
STATIC_ROOT=/path/to/static

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# Email (opcional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-password

# MapGIS (no requiere configuración, es público)
```

### Uso en Settings

```python
import os
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='insecure-key-for-development')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('DB_NAME', default='lateral360_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='postgres'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}
```

---

## Configuración de Base de Datos

### PostgreSQL (Recomendado)

**Ubicación**: `config/settings/base.py`

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
        'OPTIONS': {
            'client_encoding': 'UTF8',
        },
        'CONN_MAX_AGE': 600,  # Conexiones persistentes
    }
}
```

### Configuración de Timezone

```python
TIME_ZONE = 'America/Bogota'
USE_TZ = True  # Usar timezone-aware datetimes
```

### Migraciones

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Ver estado
python manage.py showmigrations
```

---

## Configuración de JWT

### Simple JWT

**Ubicación**: `config/settings/base.py`

```python
from datetime import timedelta

SIMPLE_JWT = {
    # Duración de tokens
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    
    # Rotación de refresh tokens
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    # Algoritmo
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    # Headers
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    
    # Claims
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    # Token classes
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    
    # Sliding tokens (deshabilitado)
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}
```

### REST Framework Authentication

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # ...
}
```

---

## Configuración de CORS

### Django CORS Headers

**Ubicación**: `config/settings/base.py`

#### Development

```python
CORS_ALLOW_ALL_ORIGINS = True  # Solo en desarrollo
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

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
]
```

#### Production

```python
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = [
    'https://lateral360.com',
    'https://www.lateral360.com',
    'https://app.lateral360.com',
]

CORS_ALLOW_CREDENTIALS = True
```

---

## Configuración de Media y Static

### Media Files (Archivos subidos por usuarios)

**Ubicación**: `config/settings/base.py`

```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Tamaño máximo de archivo (10MB)
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Extensiones permitidas para documentos
ALLOWED_DOCUMENT_EXTENSIONS = [
    '.pdf', '.doc', '.docx',
    '.jpg', '.jpeg', '.png',
    '.dwg', '.dxf',
    '.xlsx', '.xls',
]
```

### Static Files (CSS, JS, imágenes del proyecto)

```python
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]
```

### Configuración en URLs (development)

**Ubicación**: urls.py

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ...urls...
]

# Servir media files en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

---

## Apps Instaladas

### INSTALLED_APPS

**Ubicación**: `config/settings/base.py`

```python
INSTALLED_APPS = [
    # Django apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.users',
    'apps.authentication',
    'apps.lotes',
    'apps.documents',
    'apps.analisis',
    'apps.notifications',
    'apps.investment_criteria',
    'apps.mapgis',
    'apps.pot',
    'apps.solicitudes',
    'apps.common',
]
```

### Orden de Apps

**Importante**: El orden importa para:
1. **Middleware**: Se ejecuta en orden
2. **Templates**: Django busca templates en orden
3. **Static files**: Orden de búsqueda de archivos estáticos

---

## Middleware

### MIDDLEWARE

**Ubicación**: `config/settings/base.py`

```python
MIDDLEWARE = [
    # Security
    'django.middleware.security.SecurityMiddleware',
    
    # Sessions
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    # CORS (debe estar antes de CommonMiddleware)
    'corsheaders.middleware.CorsMiddleware',
    
    # Common
    'django.middleware.common.CommonMiddleware',
    
    # CSRF
    'django.middleware.csrf.CsrfViewMiddleware',
    
    # Authentication
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    
    # Messages
    'django.contrib.messages.middleware.MessageMiddleware',
    
    # Clickjacking
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Custom middleware
    'apps.common.middleware.api_logging.APILoggingMiddleware',
]
```

### Middleware Personalizado

#### APILoggingMiddleware

**Ubicación**: api_logging.py

Registra todas las requests/responses para debugging.

```python
class APILoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log request
        logger.info(f"{request.method} {request.path}")
        
        # Process request
        response = self.get_response(request)
        
        # Log response
        logger.info(f"Response: {response.status_code}")
        
        return response
```

---

## URLs Principales

### urls.py

**Ubicación**: urls.py

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/lotes/', include('apps.lotes.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/analisis/', include('apps.analisis.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/investment-criteria/', include('apps.investment_criteria.urls')),
    path('api/mapgis/', include('apps.mapgis.urls')),
    path('api/pot/', include('apps.pot.urls')),
    path('api/solicitudes/', include('apps.solicitudes.urls')),
    
    # Health check
    path('api/health/', include('apps.common.urls')),
]

# Media files en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

### Admin Customization

```python
# config/settings/base.py

ADMIN_SITE_HEADER = 'Lateral 360° - Administración'
ADMIN_SITE_TITLE = 'Lateral 360°'
ADMIN_INDEX_TITLE = 'Panel de Administración'
```

---

## WSGI y ASGI

### WSGI (Web Server Gateway Interface)

**Ubicación**: wsgi.py

```python
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_wsgi_application()
```

**Uso**: Servidores como Gunicorn, uWSGI

```bash
# Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

---

### ASGI (Asynchronous Server Gateway Interface)

**Ubicación**: asgi.py

```python
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

application = get_asgi_application()
```

**Uso**: Servidores como Daphne, Uvicorn (para WebSockets)

```bash
# Uvicorn
uvicorn config.asgi:application --host 0.0.0.0 --port 8000
```

---

## Deployment

### Configuración de Producción

#### Security Settings

```python
# config/settings/production.py

DEBUG = False

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
```

#### Allowed Hosts

```python
ALLOWED_HOSTS = [
    'lateral360.com',
    'www.lateral360.com',
    'api.lateral360.com',
]
```

#### Database (Production)

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,
        'OPTIONS': {
            'sslmode': 'require',  # SSL obligatorio
        },
    }
}
```

---

### Comandos de Deployment

#### 1. Collectstatic

```bash
python manage.py collectstatic --noinput
```

#### 2. Migraciones

```bash
python manage.py migrate --noinput
```

#### 3. Crear Superusuario

```bash
python manage.py createsuperuser
```

#### 4. Iniciar Servidor

```bash
# Development
python manage.py runserver 0.0.0.0:8000

# Production (Gunicorn)
gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
```

---

### Docker Deployment

#### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar proyecto
COPY . .

# Collectstatic
RUN python manage.py collectstatic --noinput

# Exponer puerto
EXPOSE 8000

# Comando por defecto
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: lateral360_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  backend:
    build: .
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - .:/app
      - media_volume:/app/media
      - static_volume:/app/staticfiles
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SETTINGS_MODULE=config.settings.production
    depends_on:
      - db
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - media_volume:/media
      - static_volume:/static
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  media_volume:
  static_volume:
```

---

## Logging

### Configuración de Logs

**Ubicación**: `config/settings/base.py`

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

---

## Cache

### Redis Cache (Producción)

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'lateral360',
        'TIMEOUT': 300,  # 5 minutos
    }
}
```

---

## Testing

### Test Settings

```python
# config/settings/test.py

from .base import *

DEBUG = True
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Deshabilitar migraciones para tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Deshabilitar rate limiting
RATELIMIT_ENABLE = False
```

---

## Troubleshooting

### Problema: SECRET_KEY no configurada

**Error**: `django.core.exceptions.ImproperlyConfigured: The SECRET_KEY setting must not be empty.`

**Solución**: Crear archivo .env con `SECRET_KEY=your-secret-key`

---

### Problema: CORS errors en frontend

**Causa**: Frontend no está en CORS_ALLOWED_ORIGINS

**Solución**: Agregar origen en settings:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
]
```

---

### Problema: Media files no se sirven

**Causa**: MEDIA_ROOT o MEDIA_URL mal configurados

**Solución**: Verificar en urls.py que estén las rutas static en desarrollo

---

## Comandos Útiles

```bash
# Crear proyecto
django-admin startproject config .

# Crear app
python manage.py startapp nombre_app

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Superusuario
python manage.py createsuperuser

# Shell
python manage.py shell

# Collectstatic
python manage.py collectstatic

# Check
python manage.py check

# Test
python manage.py test

# Runserver
python manage.py runserver 0.0.0.0:8000
```

---

**Última actualización**: 2024-01-15


Made changes.

Similar code found with 4 license types