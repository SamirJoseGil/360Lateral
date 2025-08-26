# 🚀 Backend API - Lateral 360°

API REST desarrollada con Django para la gestión de lotes inmobiliarios, usuarios y documentos.

---

## 🌐 Endpoints Principales

**Autenticación** (app `authentication`)
- `POST /api/auth/register/` — Registro de usuario
- `POST /api/auth/login/` — Inicio de sesión
- `POST /api/auth/logout/` — Cierre de sesión
- `POST /api/auth/change-password/` — Cambiar contraseña
- `POST /api/auth/password-reset/` — Solicitar reset de contraseña
- `GET /api/auth/csrf/` — Obtener token CSRF

**Usuarios** (app `users`)
- `GET /api/users/me/` — Perfil de usuario autenticado
- `GET /api/users/` — Listar usuarios
- `GET /api/users/{id}/` — Detalles de usuario
- `PUT /api/users/{id}/` — Actualizar usuario
- `DELETE /api/users/{id}/` — Eliminar usuario

**Lotes**
- `GET /api/lotes/` — Listar lotes
- `GET /api/lotes/{id}/` — Detalles de lote
- `POST /api/lotes/` — Crear lote
- `PUT /api/lotes/{id}/` — Actualizar lote
- `DELETE /api/lotes/{id}/` — Eliminar lote

**Scraping MapGIS**
- `POST /api/lotes/scrap/cbml/` — Consultar por CBML
- `POST /api/lotes/scrap/matricula/` — Consultar por matrícula
- `POST /api/lotes/scrap/direccion/` — Consultar por dirección
- `GET /api/lotes/health/mapgis/` — Health check MapGIS
- `POST /api/lotes/test/mapgis/session/` — Test sesión MapGIS
- `POST /api/lotes/test/mapgis/real/` — Test conexión real MapGIS
- `GET /api/lotes/investigate/mapgis/` — Investigar endpoints MapGIS
- `POST /api/lotes/test/mapgis/complete/` — Test extracción completa MapGIS
- `POST /api/lotes/restricciones/completas/` — Consulta restricciones ambientales

**Tratamientos POT**
- `GET /api/lotes/tratamientos/` — Listar tratamientos POT
- `POST /api/lotes/aprovechamiento/` — Calcular aprovechamiento urbanístico
- `POST /api/lotes/tipologias/` — Obtener tipologías viables

**Documentos**
- `GET /api/documentos/` — Listar documentos
- `GET /api/documentos/{id}/` — Detalles de documento
- `POST /api/documentos/` — Subir documento
- `DELETE /api/documentos/{id}/` — Eliminar documento

---

## 📋 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [⚙️ Configuración](#️-configuración)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🔐 Autenticación](#-autenticación)
- [🌐 API Endpoints](#-api-endpoints)
- [🗄️ Base de Datos](#️-base-de-datos)
- [🧪 Testing](#-testing)
- [🔧 Utilidades](#-utilidades)
- [📚 Documentación Detallada](#-documentación-detallada)
  - [👥 API de Usuarios](info/users.md)
  - [🏗️ API de Lotes](info/lotes.md)
  - [📄 API de Documentos](info/documentos.md)
  - [🗺️ Integración MapGIS](info/mapgis.md)

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up backend db redis
```

### Desarrollo Local

#### Prerequisitos
- Python 3.11+
- PostgreSQL 13+
- Redis (opcional, para cache)

#### Instalación

```bash
# 1. Navegar al directorio del backend
cd Backend

# 2. Crear entorno virtual
python -m venv venv

# 3. Activar entorno virtual
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt
# Asegurarse de que django-filter esté instalado
pip install django-filter

# 5. Configurar variables de entorno
copy .env.example .env
# Editar .env con tus configuraciones

# 6. Verificar configuración
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development'); from django.conf import settings; print('DEBUG:', settings.DEBUG)"

# 7. Crear migraciones
python manage.py makemigrations users
python manage.py makemigrations

# 8. Aplicar migraciones
python manage.py migrate

# 9. Crear superusuario
python manage.py createsuperuser

# 10. Ejecutar servidor de desarrollo
python manage.py runserver
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en el directorio Backend:

```env
# Django Configuration
SECRET_KEY=tu-clave-secreta-muy-segura
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=lateral360
DB_USER=postgres
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration (opcional)
REDIS_URL=redis://localhost:6379/1

# JWT Configuration
JWT_SECRET_KEY=tu-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=7

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password

# Media and Static Files
MEDIA_URL=/media/
STATIC_URL=/static/
```

### Configuraciones por Entorno

El proyecto usa configuraciones separadas:

- **Development**: `config/settings/development.py`
- **Production**: `config/settings/production.py`
- **Testing**: `config/settings/testing.py`

```bash
# Cambiar entorno
export DJANGO_SETTINGS_MODULE=config.settings.production
```

## 🗄️ Base de Datos

### Migraciones

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Ver estado de migraciones
python manage.py showmigrations

# Revertir migración
python manage.py migrate app_name 0001
```

### Comandos de Base de Datos

```bash
# Volcar datos
python manage.py dumpdata > backup.json

# Cargar datos
python manage.py loaddata backup.json

# Shell de Django
python manage.py shell

# SQL Shell
python manage.py dbshell
```

### Modelos Principales

#### Usuario (User)
```python
# Campos principales
- email (único)
- first_name, last_name
- role (admin, owner, developer)
- phone, company
- is_verified
```

#### Lote
```python
# Campos principales
- nombre, descripcion
- precio, area
- ubicacion (coordenadas)
- estado (disponible, vendido, reservado)
- propietario (Usuario)
```

#### Documento
```python
# Campos principales
- archivo
- tipo (contrato, plano, escritura)
- lote (relacionado)
- fecha_subida
```

## 🔐 Autenticación

### Sistema de Usuarios

El sistema usa autenticación basada en JWT con roles:

- **Admin**: Acceso completo al sistema
- **Owner**: Gestión de sus propios lotes
- **Developer**: Acceso de lectura y reportes

### Endpoints de Autenticación

```bash
# Registro
POST /api/auth/register/
{
  "username": "usuario",
  "email": "user@example.com",
  "password": "password123",
  "first_name": "Nombre",
  "last_name": "Apellido"
}

# Login
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "password123"
}

# Logout
POST /api/auth/logout/
# Headers: Authorization: Bearer <token>

# Perfil actual
GET /api/auth/users/me/
# Headers: Authorization: Bearer <token>
```

### Middleware de Autenticación

```python
# En views.py
from rest_framework.permissions import IsAuthenticated

class MiView(APIView):
    permission_classes = [IsAuthenticated]
```

## 📁 Estructura del Proyecto

```plaintext
Backend/
│
├── config/                  # Configuración del proyecto Django
│   ├── __init__.py
│   ├── settings/            # Archivos de configuración por entorno
│   │   ├── __init__.py
│   │   ├── development.py   # Configuración para desarrollo
│   │   ├── production.py    # Configuración para producción
│   │   └── testing.py       # Configuración para pruebas
│   │
│   ├── urls.py              # Rutas del proyecto
│   └── wsgi.py              # Punto de entrada para WSGI
│
├── app/                     # Aplicación principal
│   ├── __init__.py
│   ├── admin.py             # Configuración del admin de Django
│   ├── apps.py              # Configuración de la aplicación
│   ├── migrations/          # Migraciones de la base de datos
│   ├── models.py            # Modelos de la base de datos
│   ├── serializers.py       # Serializadores para la API
│   ├── tests.py             # Pruebas de la aplicación
│   └── views.py             # Vistas de la API
│
├── manage.py                # Script de administración de Django
├── requirements.txt         # Dependencias del proyecto
└── .env.example             # Ejemplo de archivo de variables de entorno
```

## 🌐 API Endpoints

### Autenticación

- `POST /api/auth/register/`: Registro de usuario
- `POST /api/auth/login/`: Inicio de sesión
- `POST /api/auth/logout/`: Cierre de sesión
- `POST /api/auth/change-password/`: Cambiar contraseña
- `POST /api/auth/password-reset/`: Solicitar reset de contraseña
- `GET /api/auth/csrf/`: Obtener token CSRF

### Usuarios

- `GET /api/users/me/`: Obtener perfil de usuario
- `GET /api/users/`: Listar usuarios
- `GET /api/users/{id}/`: Obtener detalles de un usuario
- `PUT /api/users/{id}/`: Actualizar usuario
- `DELETE /api/users/{id}/`: Eliminar usuario

### Lotes

- `GET /api/lotes/`: Listar lotes
- `GET /api/lotes/{id}/`: Obtener detalles de un lote
- `POST /api/lotes/`: Crear un nuevo lote
- `PUT /api/lotes/{id}/`: Actualizar un lote
- `DELETE /api/lotes/{id}/`: Eliminar un lote

### Documentos

- `GET /api/documentos/`: Listar documentos
- `GET /api/documentos/{id}/`: Obtener detalles de un documento
- `POST /api/documentos/`: Subir un nuevo documento
- `DELETE /api/documentos/{id}/`: Eliminar un documento

## 🧪 Testing

### Pruebas Unitarias

```bash
# Ejecutar pruebas
python manage.py test

# Ver cobertura
coverage report
```

### Pruebas Manuales

- Probar endpoints con Postman o curl
- Verificar funcionamiento en el navegador

## 🔧 Utilidades

### Comandos Útiles

```bash
# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver

# Abrir shell de Django
python manage.py shell
```

### Scripts

- `backup.sh`: Script para hacer backup de la base de datos
- `restore.sh`: Script para restaurar la base de datos desde un backup

### Notas

- Asegúrate de tener PostgreSQL y Redis corriendo si no usas Docker.
- Configura correctamente el archivo `.env` antes de iniciar el servidor.