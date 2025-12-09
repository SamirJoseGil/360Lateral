# Lateral 360° - Backend API Documentation

## 📋 Índice General

### 🏗️ Configuración del Proyecto
- [Configuración General](config/config.md) - Settings, variables de entorno, deployment

### 👥 Módulos de Usuario y Autenticación
- [Autenticación](apps/authentication/authentication.md) - Login, registro, JWT, seguridad
- [Usuarios](apps/users.md/users.md) - Gestión de usuarios, roles, perfiles

### 🏘️ Módulos de Lotes y Documentos
- [Lotes](apps/lotes/lotes.md) - Gestión de terrenos, verificación, favoritos
- [Documentos](apps/documents/documents.md) - Carga, validación, gestión de archivos

### 📊 Módulos de Análisis y Normativa
- [Análisis Urbanístico](apps/analisis/analisis.md) - Análisis con IA, POT, aprovechamiento
- [POT](apps/pot/pot.md) - Plan de Ordenamiento Territorial, tratamientos
- [MapGIS](apps/mapgis/mapgis.md) - Integración con sistema catastral de Medellín

### 💼 Módulos de Negocio
- [Criterios de Inversión](apps/investments/investments.md) - Búsqueda, matching, alertas
- [Notificaciones](apps/notifications/notifications.md) - Sistema de alertas y mensajes
- [Solicitudes](apps/solicitudes/solicitudes.md) - Soporte, PQR, contacto

### 🛠️ Utilidades
- [Common](apps/common/common.md) - Utilidades compartidas, middleware, permisos

---

## 🚀 Quick Start

### Requisitos Previos

```bash
# Python 3.11+
python --version

# PostgreSQL 14+
psql --version

# Git
git --version
```

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/yourusername/360Lateral.git
cd 360Lateral/Backend

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Crear base de datos
createdb lateral360_db

# 6. Aplicar migraciones
python manage.py migrate

# 7. Crear superusuario
python manage.py createsuperuser

# 8. Correr servidor
python manage.py runserver
```

### Acceso a la API

- **API Base**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/
- **Documentación**: http://localhost:8000/docs/ (si está configurado)

---

## 📋 Índice General

### 🏗️ Configuración del Proyecto
- [Configuración General](config/config.md) - Settings, variables de entorno, deployment

### 👥 Módulos de Usuario y Autenticación
- [Autenticación](apps/authentication/authentication.md) - Login, registro, JWT, seguridad
- [Usuarios](apps/users.md/users.md) - Gestión de usuarios, roles, perfiles

### 🏘️ Módulos de Lotes y Documentos
- [Lotes](apps/lotes/lotes.md) - Gestión de terrenos, verificación, favoritos
- [Documentos](apps/documents/documents.md) - Carga, validación, gestión de archivos

### 📊 Módulos de Análisis y Normativa
- [Análisis Urbanístico](apps/analisis/analisis.md) - Análisis con IA, POT, aprovechamiento
- [POT](apps/pot/pot.md) - Plan de Ordenamiento Territorial, tratamientos
- [MapGIS](apps/mapgis/mapgis.md) - Integración con sistema catastral de Medellín

### 💼 Módulos de Negocio
- [Criterios de Inversión](apps/investments/investments.md) - Búsqueda, matching, alertas
- [Notificaciones](apps/notifications/notifications.md) - Sistema de alertas y mensajes
- [Solicitudes](apps/solicitudes/solicitudes.md) - Soporte, PQR, contacto

### 🛠️ Utilidades
- [Common](apps/common/common.md) - Utilidades compartidas, middleware, permisos

---

## 🚀 Quick Start

### Requisitos Previos

```bash
# Python 3.11+
python --version

# PostgreSQL 14+
psql --version

# Git
git --version
```

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/yourusername/360Lateral.git
cd 360Lateral/Backend

# 2. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 5. Crear base de datos
createdb lateral360_db

# 6. Aplicar migraciones
python manage.py migrate

# 7. Crear superusuario
python manage.py createsuperuser

# 8. Correr servidor
python manage.py runserver
```

### Acceso a la API

- **API Base**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/
- **Documentación**: http://localhost:8000/docs/ (si está configurado)

---

## 📁 Estructura del Proyecto

```
Backend/
├── apps/                           # Aplicaciones Django
│   ├── analisis/                   # Análisis urbanísticos con IA
│   ├── authentication/             # Login, registro, JWT
│   ├── common/                     # Utilidades compartidas
│   ├── documents/                  # Gestión de documentos
│   ├── investment_criteria/        # Criterios de búsqueda
│   ├── lotes/                      # Gestión de lotes
│   ├── mapgis/                     # Integración MapGIS Medellín
│   ├── notifications/              # Sistema de notificaciones
│   ├── pot/                        # POT y tratamientos urbanísticos
│   ├── solicitudes/                # Solicitudes de soporte
│   └── users/                      # Gestión de usuarios
│
├── config/                         # Configuración Django
│   ├── settings.py                 # Settings principal
│   ├── urls.py                     # URLs principales
│   ├── wsgi.py                     # WSGI para deployment
│   └── asgi.py                     # ASGI para WebSockets
│
├── docs/                           # Documentación
│   ├── apps/                       # Docs por módulo
│   ├── config/                     # Docs de configuración
│   └── readme.md                   # Este archivo
│
├── media/                          # Archivos subidos (gitignored)
├── staticfiles/                    # Archivos estáticos (gitignored)
├── logs/                           # Logs de la aplicación (gitignored)
│
├── .env                            # Variables de entorno (gitignored)
├── .env.example                    # Ejemplo de .env
├── .gitignore                      # Archivos ignorados por Git
├── .dockerignore                   # Archivos ignorados por Docker
│
├── Dockerfile                      # Configuración Docker
├── docker-compose.yml              # Docker Compose (si existe)
├── entrypoint.sh                   # Script de inicialización
│
├── manage.py                       # CLI de Django
├── requirements.txt                # Dependencias Python
└── README.md                       # Readme del proyecto
```

---

## 🔧 Archivos de Configuración Raíz

### manage.py

Script CLI de Django para gestión del proyecto.

**Ubicación**: manage.py

**Uso Común**:

```bash
# Servidor de desarrollo
python manage.py runserver

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell interactivo
python manage.py shell

# Collectstatic
python manage.py collectstatic

# Tests
python manage.py test

# Crear app nueva
python manage.py startapp nombre_app
```

**Contenido**:

```python
#!/usr/bin/env python
import os
import sys

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
```

---

### requirements.txt

Dependencias Python del proyecto.

**Ubicación**: requirements.txt

**Principales Dependencias**:

```txt
# Core Django
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0

# Base de datos
psycopg2-binary==2.9.9  # PostgreSQL

# CORS y seguridad
django-cors-headers==4.3.0
django-ratelimit==4.1.0

# Validación y utilidades
django-filter==23.5
python-decouple==3.8

# IA y APIs externas
google-generativeai==0.3.2  # Gemini AI
requests==2.31.0

# Procesamiento de archivos
Pillow==10.1.0  # Imágenes

# Testing
pytest==7.4.3
pytest-django==4.7.0

# Production
gunicorn==21.2.0  # WSGI server
whitenoise==6.6.0  # Static files
```

**Instalación**:

```bash
pip install -r requirements.txt
```

**Actualización**:

```bash
pip freeze > requirements.txt
```

---

### .env y .env.example

Variables de entorno para configuración sensible.

**Ubicación**: .env (gitignored)

**.env.example** (Template):

```bash
# Django Core
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=lateral360_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_ACCESS_TOKEN_LIFETIME=60  # minutos
JWT_REFRESH_TOKEN_LIFETIME=10080  # 7 días en minutos

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Media and Static
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

# Redis (opcional, para cache)
REDIS_URL=redis://localhost:6379/1

# Sentry (opcional, para error tracking)
SENTRY_DSN=your-sentry-dsn-here
```

**Crear tu .env**:

```bash
cp .env.example .env
# Editar .env con tus valores
```

**Importante**: 
- ⚠️ Nunca subir .env a Git
- ✅ Siempre mantener .env.example actualizado
- 🔐 Usar valores seguros en producción

---

### .gitignore

Archivos y carpetas ignorados por Git.

**Ubicación**: `Backend/.gitignore`

**Contenido Principal**:

```gitignore
# Python
*.py[cod]
__pycache__/
*.so
*.egg
*.egg-info/
dist/
build/

# Django
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Environment
.env
venv/
env/
ENV/

# Media files (subidos por usuarios)
media/

# Static files (generados)
staticfiles/
static_root/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
.coverage
htmlcov/
.pytest_cache/

# Logs
logs/
*.log
```

---

### .dockerignore

Archivos ignorados al construir imagen Docker.

**Ubicación**: .dockerignore

**Contenido**:

```dockerignore
# Git
.git
.gitignore

# Python
__pycache__
*.pyc
*.pyo
*.pyd
.Python

# Virtual environments
venv/
env/
ENV/

# Environment files
.env
.env.local

# Media and static (se generan en container)
media/
staticfiles/

# Development
*.sqlite3
db.sqlite3

# IDEs
.vscode/
.idea/

# Logs
logs/
*.log

# Documentation
docs/
*.md
!README.md

# Tests
.coverage
htmlcov/
.pytest_cache/
```

---

### Dockerfile

Configuración para crear imagen Docker del backend.

**Ubicación**: Dockerfile

**Contenido**:

```dockerfile
# Imagen base
FROM python:3.11-slim

# Variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar proyecto
COPY . .

# Collectstatic
RUN python manage.py collectstatic --noinput

# Exponer puerto
EXPOSE 8000

# Script de entrada
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Comando por defecto
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

**Construir imagen**:

```bash
docker build -t lateral360-backend .
```

**Correr container**:

```bash
docker run -p 8000:8000 --env-file .env lateral360-backend
```

---

### entrypoint.sh

Script de inicialización para Docker.

**Ubicación**: entrypoint.sh

**Contenido**:

```bash
#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "PostgreSQL started"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting server..."
exec "$@"
```

**Hacer ejecutable**:

```bash
chmod +x entrypoint.sh
```

**Qué hace**:
1. ⏳ Espera a que PostgreSQL esté listo
2. 🔄 Aplica migraciones
3. 📦 Recolecta archivos estáticos
4. 🚀 Inicia el servidor

---

### docker-compose.yml (Opcional)

Configuración para múltiples servicios con Docker Compose.

**Ubicación**: `Backend/docker-compose.yml`

**Contenido**:

```yaml
version: '3.8'

services:
  # Base de datos
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend Django
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
      - DJANGO_SETTINGS_MODULE=config.settings
      - DB_HOST=db
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - .env

  # Redis (opcional, para cache)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Nginx (opcional, para producción)
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

**Uso**:

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## 🌐 Arquitectura del Sistema

### Flujo de Request-Response

```
┌─────────────┐
│   Cliente   │ (React/Vue/Mobile)
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────┐
│   CORS Middleware   │ (Validar origen)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Authentication     │ (JWT Token)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   API View          │ (ViewSet/APIView)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Serializer        │ (Validación)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Service Layer     │ (Lógica de negocio)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Models (ORM)      │ (PostgreSQL)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Response          │ (JSON)
└─────────────────────┘
```

---

## 🔐 Seguridad

### Implementaciones de Seguridad

✅ **JWT Authentication**: Tokens con expiración
✅ **Rate Limiting**: Límite de requests por IP
✅ **CORS**: Solo orígenes permitidos
✅ **Password Hashing**: PBKDF2 + SHA256
✅ **HTTPS**: Redirect en producción
✅ **CSRF Protection**: Deshabilitado para API (JWT)
✅ **SQL Injection**: Protección por ORM de Django
✅ **XSS Protection**: Headers de seguridad
✅ **Input Validation**: Serializers de DRF

### Headers de Seguridad (Producción)

```python
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
X_FRAME_OPTIONS = 'DENY'
```

---

## 📊 Base de Datos

### PostgreSQL Schema

**Principales Tablas**:

- `users_user` - Usuarios del sistema
- `lotes_lote` - Lotes/terrenos
- `documents_document` - Documentos asociados
- `analisis_analisisurbanistico` - Análisis solicitados
- `notifications_notification` - Notificaciones
- `investment_criteria_investmentcriteria` - Criterios de búsqueda
- `pot_tratamientopot` - Tratamientos urbanísticos
- `mapgis_mapgiscache` - Cache de consultas MapGIS

### Backup y Restore

**Backup**:

```bash
# Backup completo
pg_dump -U postgres lateral360_db > backup.sql

# Backup solo datos
pg_dump -U postgres --data-only lateral360_db > data.sql
```

**Restore**:

```bash
# Restore completo
psql -U postgres lateral360_db < backup.sql

# Restore solo datos
psql -U postgres lateral360_db < data.sql
```

---

## 🧪 Testing

### Correr Tests

```bash
# Todos los tests
python manage.py test

# Tests de una app específica
python manage.py test apps.lotes

# Tests con coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Genera reporte HTML
```

### Estructura de Tests

```python
from django.test import TestCase
from apps.users.models import User

class UserTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='TestPass123!',
            role='owner'
        )
    
    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertTrue(self.user.is_owner)
```

---

## 📈 Monitoreo y Logs

### Logging

**Ubicación de Logs**: `Backend/logs/`

**Configuración en settings.py**:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
            'formatter': 'verbose'
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

**Uso en código**:

```python
import logging

logger = logging.getLogger(__name__)

logger.info("Usuario creado exitosamente")
logger.warning("Intento de login fallido")
logger.error("Error al procesar pago", exc_info=True)
```

---

## 🚀 Deployment

### Preparación para Producción

1. **Variables de entorno**:
   ```bash
   DEBUG=False
   SECRET_KEY=<strong-random-key>
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
   ```

2. **Base de datos**:
   ```bash
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```

3. **Servidor WSGI**:
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```

### Plataformas Recomendadas

- **Heroku**: Fácil deployment con PostgreSQL incluido
- **AWS**: EC2 + RDS + S3
- **DigitalOcean**: Droplets con App Platform
- **Railway**: Deployment simple con DB incluida
- **Render**: Alternativa moderna a Heroku

---

## 🤝 Contribución

### Flujo de Trabajo

1. Fork el repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código

- **PEP 8**: Seguir guía de estilo de Python
- **Docstrings**: Documentar funciones y clases
- **Type Hints**: Usar cuando sea posible
- **Tests**: Agregar tests para nuevas features

---

## 📞 Soporte

### Contacto

- **Email**: soporte@lateral360.com
- **Documentación**: docs
- **Issues**: GitHub Issues

### Links Útiles

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Gemini API](https://ai.google.dev/docs)

---

## 📄 Licencia

Este proyecto es propiedad de Lateral 360°. Todos los derechos reservados.

---

**Última actualización**: 2025-12-04
**Versión**: 1.0.0