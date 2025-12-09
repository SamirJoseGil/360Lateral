# Lateral 360° - Backend API

Sistema de gestión inmobiliaria para propietarios, desarrolladores y análisis urbanísticos en Medellín, Colombia.

---

## 🚀 Quick Start

### Requisitos

- Python 3.11+
- PostgreSQL 14+
- Git

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

### Acceso

- **API**: http://localhost:8000/api/
- **Admin**: http://localhost:8000/admin/

---

## 📚 Documentación Completa

Toda la documentación del proyecto está en la carpeta `docs/`:

### 🏗️ Configuración
- **[Configuración General](docs/config/config.md)** - Settings, deployment, Docker

### 👥 Autenticación y Usuarios
- **[Autenticación](docs/apps/authentication/authentication.md)** - Login, registro, JWT, seguridad
- **[Usuarios](docs/apps/users.md/users.md)** - Gestión de usuarios, roles, perfiles

### 🏘️ Lotes y Documentos
- **[Lotes](docs/apps/lotes/lotes.md)** - Gestión de terrenos, verificación, favoritos
- **[Documentos](docs/apps/documents/documents.md)** - Carga, validación, gestión de archivos

### 📊 Análisis y Normativa
- **[Análisis Urbanístico](docs/apps/analisis/analisis.md)** - Análisis con IA, POT, aprovechamiento
- **[POT](docs/apps/pot/pot.md)** - Plan de Ordenamiento Territorial, tratamientos
- **[MapGIS](docs/apps/mapgis/mapgis.md)** - Integración con sistema catastral de Medellín

### 💼 Módulos de Negocio
- **[Criterios de Inversión](docs/apps/investments/investments.md)** - Búsqueda, matching, alertas
- **[Notificaciones](docs/apps/notifications/notifications.md)** - Sistema de alertas y mensajes
- **[Solicitudes](docs/apps/solicitudes/solicitudes.md)** - Soporte, PQR, contacto

### 🛠️ Utilidades
- **[Common](docs/apps/common/common.md)** - Utilidades compartidas, middleware, permisos

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

```
Backend/
├── apps/                      # Aplicaciones Django
│   ├── authentication/       # Autenticación JWT - Ver README
│   ├── users/               # Gestión de usuarios y perfiles - Ver README
│   ├── lotes/               # Gestión de lotes urbanos - Ver README
│   ├── pot/                 # Plan de Ordenamiento Territorial
│   ├── documents/           # Gestión de documentos
│   ├── stats/               # Estadísticas y analytics - Ver README
│   └── common/              # Utilidades comunes - Ver README
├── config/                   # Configuración Django
│   ├── settings.py          # Settings unificado con auto-detección de entorno
│   ├── urls.py              # URLs principales
│   ├── wsgi.py              # WSGI config
│   └── asgi.py              # ASGI config
├── scripts/                  # Scripts de utilidad
├── media/                    # Archivos subidos por usuarios
├── staticfiles/             # Archivos estáticos recolectados
├── logs/                     # Logs de aplicación
├── requirements.txt          # Dependencias Python
├── manage.py                # CLI de Django
├── .env                     # Variables de entorno (no en git)
├── .env.example             # Ejemplo de variables de entorno
├── Dockerfile               # Configuración Docker
├── docker-compose.yml       # Orquestación de servicios
├── entrypoint.sh            # Script de inicialización Docker
└── README.md                # Esta documentación
```

### Stack Tecnológico

- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14+
- **Base de Datos**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Autenticación**: JWT (djangorestframework-simplejwt)
- **Documentación**: drf-spectacular (OpenAPI 3.0)
- **Testing**: Django TestCase + Coverage
- **Deployment**: Docker + Docker Compose

## 🔧 Instalación

### Prerequisitos

- Python 3.12+
- PostgreSQL 15+
- Redis 7+ (opcional para cache)
- Git

### Instalación Local (Sin Docker)

1. **Clonar el repositorio**
```bash
cd Backend
```

2. **Crear y activar entorno virtual**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
# DB_PASSWORD=tu_password
# SECRET_KEY=tu_secret_key
```

5. **Configurar base de datos PostgreSQL**
```bash
# Crear base de datos
psql -U postgres
CREATE DATABASE lateral360;
CREATE USER lateral360_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE lateral360 TO lateral360_user;
\q
```

6. **Ejecutar migraciones**
```bash
python manage.py migrate
```

7. **Crear superusuario**
```bash
python manage.py createsuperuser
```

8. **Recolectar archivos estáticos**
```bash
python manage.py collectstatic --noinput
```

9. **Iniciar servidor de desarrollo**
```bash
python manage.py runserver
```

El servidor estará disponible en `http://localhost:8000`

### Instalación con Docker

1. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env según necesidades
```

2. **Construir y levantar servicios**
```bash
docker-compose up --build
```

3. **Ejecutar migraciones (en otro terminal)**
```bash
docker-compose exec backend python manage.py migrate
```

4. **Crear superusuario**
```bash
docker-compose exec backend python manage.py createsuperuser
```

El servidor estará disponible en `http://localhost:8000`

## ⚙️ Configuración

### Variables de Entorno

El archivo `.env` debe contener las siguientes variables:

```env
# Django Configuration
DJANGO_ENV=development                    # development, production, testing
DEBUG=True                                # False en producción
SECRET_KEY=your-secret-key-here          # Generar clave segura
ALLOWED_HOSTS=localhost,127.0.0.1        # Dominios permitidos

# Database Configuration
DB_NAME=lateral360
DB_USER=postgres
DB_PASSWORD=tu_password_seguro
DB_HOST=localhost                         # 'db' en Docker
DB_PORT=5432

# Redis Configuration (Opcional)
REDIS_HOST=localhost                      # 'redis' en Docker
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_ACCESS_MINUTES=60                     # Tiempo de vida del access token
JWT_REFRESH_DAYS=7                        # Tiempo de vida del refresh token

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# API Configuration
API_PAGE_SIZE=20                          # Tamaño de página por defecto

# File Upload
MAX_UPLOAD_SIZE=10485760                  # 10MB en bytes

# Email Configuration (Producción)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-app-password

# Docker
DOCKER_ENV=false                          # true en Docker

# Admin
ADMIN_ENABLED=True                        # Habilitar Django Admin
```

### Settings Unificado

El sistema utiliza un archivo de settings unificado (`config/settings.py`) que auto-detecta el entorno basado en `DJANGO_ENV`:

- **development**: DEBUG=True, logs detallados, email a consola
- **production**: DEBUG=False, seguridad máxima, SSL, email SMTP
- **testing**: Sin validaciones de password, base de datos en memoria

## 📦 Módulos de Aplicación

### 1. Authentication (`apps.authentication`)

Gestión de autenticación con JWT.

**Características:**
- Login/Logout con JWT
- Registro de usuarios
- Refresh de tokens
- Cambio de contraseña
- Rate limiting anti-bruteforce

**Endpoints principales:**
```
POST   /api/auth/login/           # Iniciar sesión
POST   /api/auth/logout/          # Cerrar sesión
POST   /api/auth/register/        # Registrar usuario
GET    /api/auth/me/              # Usuario actual
POST   /api/auth/change-password/ # Cambiar contraseña
POST   /api/auth/token/refresh/   # Renovar token
POST   /api/auth/token/verify/    # Verificar token
```

📖 **[Ver documentación completa](apps/authentication/README.md)**

### 2. Users (`apps.users`)

Gestión de perfiles de usuario y roles.

**Características:**
- Modelo de usuario personalizado
- Perfiles según rol (Owner, Developer, Admin)
- Sistema de solicitudes de usuario
- Gestión de permisos

**Modelo User:**
- Campos comunes: email, username, first_name, last_name, phone, company
- Campos Owner: document_type, document_number, lots_count
- Campos Developer: company_name, nit, experience_years, portfolio
- Campos Admin: department, permissions_scope

**Endpoints principales:**
```
GET    /api/users/                # Lista de usuarios
POST   /api/users/                # Crear usuario (admin)
GET    /api/users/{id}/           # Detalle de usuario
PUT    /api/users/{id}/           # Actualizar usuario
DELETE /api/users/{id}/           # Eliminar usuario
GET    /api/users/me/             # Usuario actual
PUT    /api/users/me/update/      # Actualizar perfil
GET    /api/users/requests/       # Solicitudes de usuario
```

📖 **[Ver documentación completa](apps/users/README.md)**

### 3. Lotes (`apps.lotes`)

Gestión de lotes urbanos con integración a MapGIS.

**Características:**
- Registro y búsqueda de lotes
- Integración con MapGIS de Medellín
- Análisis urbanístico automatizado
- Cálculo de potencial constructivo
- Gestión de documentos asociados
- Historial de cambios

**Modelo Lote:**
- Identificación: cbml, matricula, direccion
- Dimensiones: area, frente, fondo, ubicacion
- Urbanismo: tratamiento, uso_suelo, indices
- Valoración: avaluo_catastral, valor_comercial

**Endpoints principales:**
```
GET    /api/lotes/                      # Lista de lotes
POST   /api/lotes/                      # Crear lote
GET    /api/lotes/{id}/                 # Detalle de lote
PUT    /api/lotes/{id}/                 # Actualizar lote
DELETE /api/lotes/{id}/                 # Eliminar lote
POST   /api/lotes/public/cbml/          # Buscar por CBML
POST   /api/lotes/public/matricula/     # Buscar por matrícula
POST   /api/lotes/public/direccion/     # Buscar por dirección
GET    /api/lotes/{id}/analisis/        # Análisis urbanístico
GET    /api/lotes/{id}/documentos/      # Documentos del lote
GET    /api/lotes/{id}/historial/       # Historial de cambios
```

📖 **[Ver documentación completa](apps/lotes/README.md)**

### 4. POT (`apps.pot`)

Plan de Ordenamiento Territorial de Medellín.

**Características:**
- Consulta de normativa urbanística
- Tratamientos urbanísticos
- Uso de suelo
- Índices de construcción
- Validación de normativa

### 5. Documents (`apps.documents`)

Gestión de documentos asociados a lotes.

**Características:**
- Upload de documentos
- Validación de formato y tamaño
- Categorización por tipo
- Control de acceso por usuario
- Versionado de documentos

**Tipos de documentos:**
- escritura: Escritura pública
- cedula_catastral: Cédula catastral
- plano: Planos arquitectónicos
- foto: Fotografías del lote
- otro: Otros documentos

### 6. Stats (`apps.stats`)

Estadísticas y analytics del sistema.

**Características:**
- Registro de eventos de usuario
- Estadísticas de uso
- Métricas de rendimiento
- Reportes personalizados
- Dashboard de analytics

**Endpoints principales:**
```
POST   /api/stats/events/         # Registrar evento
GET    /api/stats/summary/        # Resumen de estadísticas
GET    /api/stats/user/{id}/      # Analytics de usuario
```

📖 **[Ver documentación completa](apps/stats/README.md)**

### 7. Common (`apps.common`)

Utilidades comunes y middleware.

**Componentes:**
- `APILoggingMiddleware`: Log de requests
- `custom_exception_handler`: Manejo de excepciones
- Validadores personalizados
- Health checks
- Utilidades de auditoría

**Endpoints de health check:**
```
GET    /health/                   # Health check general
GET    /health/database/          # Estado de base de datos
GET    /health/redis/             # Estado de Redis
```

📖 **[Ver documentación completa](apps/common/README.md)**

## 🔐 Autenticación

### Flujo de Autenticación

1. **Login**: Usuario envía credenciales
2. **Tokens**: Servidor retorna access y refresh token
3. **Requests**: Cliente incluye access token en header
4. **Refresh**: Al expirar access, usar refresh token
5. **Logout**: Invalidar refresh token

### Uso de Tokens

**Header de autenticación:**
```
Authorization: Bearer <access_token>
```

**Ejemplo en JavaScript:**
```javascript
const response = await fetch('/api/lotes/', {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    }
});
```

### Configuración JWT

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

## 📚 API Documentation

### Swagger UI

Documentación interactiva disponible en:

- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

### Formato de Respuestas

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Operación exitosa",
    "data": { ... }
}
```

**Respuesta con error:**
```json
{
    "success": false,
    "message": "Error en la operación",
    "errors": {
        "field": ["Mensaje de error específico"]
    }
}
```

### Paginación

Las listas usan paginación por defecto:

```json
{
    "count": 100,
    "next": "http://api.example.com/api/lotes/?page=2",
    "previous": null,
    "results": [...]
}
```

**Query params:**
- `page`: Número de página
- `page_size`: Tamaño de página (max 100)

### Filtrado y Búsqueda

**Filtros:**
```
GET /api/lotes/?status=active&comuna=14
```

**Búsqueda:**
```
GET /api/lotes/?search=poblado
```

**Ordenamiento:**
```
GET /api/lotes/?ordering=-created_at
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
python manage.py test

# Tests de un módulo
python manage.py test apps.authentication

# Tests con coverage
coverage run manage.py test
coverage report
coverage html  # Genera reporte HTML en htmlcov/
```

### Estructura de Tests

Cada app tiene su carpeta de tests:

```
apps/authentication/tests/
├── __init__.py
├── test_models.py
├── test_views.py
├── test_serializers.py
└── test_permissions.py
```

### Ejemplo de Test

```python
from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User

class LoteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='Test123!',
            role='owner'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_lote(self):
        response = self.client.post('/api/lotes/', {
            'cbml': '01010010010010',
            'area': 500.00
        })
        self.assertEqual(response.status_code, 201)
```

## 🗄️ Base de Datos

### Migraciones

```bash
# Detectar cambios en modelos
python manage.py makemigrations

# Ver SQL de migración
python manage.py sqlmigrate app_name 0001

# Aplicar migraciones
python manage.py migrate

# Listar migraciones
python manage.py showmigrations

# Revertir migración
python manage.py migrate app_name 0001
```

### Backup y Restore

**Backup:**
```bash
# PostgreSQL
pg_dump -U postgres lateral360 > backup.sql

# Django fixtures
python manage.py dumpdata > backup.json
```

**Restore:**
```bash
# PostgreSQL
psql -U postgres lateral360 < backup.sql

# Django fixtures
python manage.py loaddata backup.json
```

## 📊 Logging

### Configuración de Logs

Los logs se guardan en `logs/`:
- `development.log` - Logs de desarrollo
- `production.log` - Logs de producción
- `errors.log` - Solo errores
- `security.log` - Eventos de seguridad

### Niveles de Log

```python
import logging
logger = logging.getLogger(__name__)

logger.debug('Información de debugging')
logger.info('Información general')
logger.warning('Advertencia')
logger.error('Error')
logger.critical('Error crítico')
```

## 🚀 Deployment

### Checklist Pre-Deploy

- [ ] Actualizar `SECRET_KEY` con valor seguro
- [ ] Configurar `DEBUG=False`
- [ ] Actualizar `ALLOWED_HOSTS`
- [ ] Configurar base de datos de producción
- [ ] Configurar Redis para cache
- [ ] Configurar email SMTP
- [ ] Ejecutar `collectstatic`
- [ ] Ejecutar migraciones
- [ ] Configurar logs
- [ ] Configurar backups automáticos
- [ ] Configurar SSL/TLS
- [ ] Configurar firewall
- [ ] Configurar monitoreo

### Deploy con Docker

```bash
# Producción
docker-compose -f docker-compose.prod.yml up -d

# Verificar servicios
docker-compose ps

# Ver logs
docker-compose logs -f backend
```

### Deploy Manual

```bash
# Instalar dependencias
pip install -r requirements.txt

# Recolectar estáticos
python manage.py collectstatic --noinput

# Ejecutar migraciones
python manage.py migrate --noinput

# Iniciar con Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## 🔍 Troubleshooting

### Error: UnicodeDecodeError en PostgreSQL

**Causa**: Encoding incorrecto en archivo `.env` o contraseña con caracteres especiales.

**Solución**:
```bash
# Recrear .env con UTF-8
# O cambiar contraseña de PostgreSQL
psql -U postgres
ALTER USER postgres WITH PASSWORD 'password_simple';
```

### Error: "No module named 'dotenv'"

**Causa**: Falta instalar python-dotenv.

**Solución**:
```bash
pip install python-dotenv
```

### Error: "Connection refused" a PostgreSQL

**Causa**: PostgreSQL no está corriendo o mal configurado.

**Solución**:
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -h localhost
```

### Error: Migraciones en conflicto

**Causa**: Migraciones inconsistentes.

**Solución**:
```bash
# Ver estado de migraciones
python manage.py showmigrations

# Fake migración inicial si es necesario
python manage.py migrate --fake-initial
```

### Error: "Static files not found"

**Causa**: No se ejecutó collectstatic.

**Solución**:
```bash
python manage.py collectstatic --noinput
```

## 📈 Performance

### Optimizaciones

1. **Database Indexing**: Índices en campos frecuentes
2. **Query Optimization**: select_related, prefetch_related
3. **Caching**: Redis para datos frecuentes
4. **Static Files**: Servidos por Nginx en producción
5. **Connection Pooling**: Reutilización de conexiones
6. **Async Operations**: Operaciones asíncronas cuando sea posible

### Monitoreo

```bash
# Tiempo de queries
python manage.py shell
from django.db import connection
print(connection.queries)

# Profiling
python -m cProfile manage.py runserver
```

## 🔒 Seguridad

### Best Practices

1. **Nunca** commitear `.env` al repositorio
2. Usar contraseñas fuertes para base de datos
3. Mantener dependencias actualizadas
4. Implementar rate limiting
5. Validar todos los inputs
6. Sanitizar outputs
7. Usar HTTPS en producción
8. Implementar CORS correctamente
9. Mantener logs de auditoría
10. Realizar backups regulares

### Security Headers

En producción se configuran automáticamente:
- HTTPS redirect
- HSTS
- XSS Protection
- Content Type nosniff
- X-Frame-Options

## 📞 Soporte

### Recursos

- **Documentación Django**: https://docs.djangoproject.com/
- **Django REST Framework**: https://www.django-rest-framework.org/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Redis**: https://redis.io/documentation

### Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Copyright © 2025 Lateral 360°. Todos los derechos reservados.

---

**Desarrollado con ❤️ para la transformación digital del sector inmobiliario en Medellín**