# 🔧 Backend - Lateral 360° API

API REST desarrollada con Django y Django REST Framework para la gestión de lotes inmobiliarios.

## 📋 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [⚙️ Configuración](#️-configuración)
- [🗄️ Base de Datos](#️-base-de-datos)
- [🔐 Autenticación](#-autenticación)
- [📚 API Documentation](#-api-documentation)
- [🧪 Testing](#-testing)
- [🐛 Debugging](#-debugging)

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

# 5. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 6. Ejecutar migraciones
python manage.py migrate

# 7. Crear superusuario
python manage.py createsuperuser

# 8. Ejecutar servidor de desarrollo
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