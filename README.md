# 🏗️ Lateral 360° - Plataforma de Gestión de Lotes Inmobiliarios

Una plataforma integral para la gestión, visualización y administración de lotes inmobiliarios con capacidades de mapeo 360°, gestión de documentos y análisis de datos.

## 📋 Tabla de Contenidos

- [🚀 Características Principales](#-características-principales)
- [🛠️ Tecnologías](#️-tecnologías)
- [⚡ Inicio Rápido](#-inicio-rápido)
- [🐳 Instalación con Docker](#-instalación-con-docker)
- [🔧 Desarrollo Local](#-desarrollo-local)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🌐 API y Endpoints](#-api-y-endpoints)
- [⚙️ Variables de Entorno](#️-variables-de-entorno)
- [👥 Equipo de Desarrollo](#-equipo-de-desarrollo)

## ⚡ Inicio Rápido

### Docker (Recomendado)
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/360Lateral.git
cd 360Lateral

# Ejecutar con Docker
docker-compose up -d

# Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Admin Panel: http://localhost:8000/admin
# API Docs: http://localhost:8000/swagger
```

### Desarrollo Local
```bash
# Backend
cd Backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (en otra terminal)
cd Frontend
npm install
npm run dev
```

## 🚀 Características Principales

### 🏡 Gestión de Lotes
- **Registro completo** de lotes con información detallada
- **Visualización en mapas** con integración de geolocalización
- **Estados y categorías** personalizables
- **Historial de cambios** y auditoría completa

### 📄 Gestión de Documentos
- **Subida y almacenamiento** seguro de documentos
- **Categorización automática** por tipo de documento
- **Versionado de documentos** con historial
- **Vista previa** de documentos directamente en la plataforma

### 📊 Dashboard y Estadísticas
- **Métricas en tiempo real** de ventas y disponibilidad
- **Gráficos interactivos** con filtros avanzados
- **Reportes exportables** en PDF y Excel
- **Análisis de tendencias** y proyecciones

### 👤 Sistema de Usuarios
- **Autenticación segura** con JWT
- **Roles diferenciados**: Admin, Propietario, Desarrollador
- **Permisos granulares** por funcionalidad
- **Perfil de usuario** personalizable

## 🛠️ Tecnologías

### Backend
- **Django 5.2** - Framework web principal
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y sesiones
- **Swagger/OpenAPI** - Documentación de API

### Frontend
- **Remix** - Framework React full-stack
- **TailwindCSS + DaisyUI** - Diseño y componentes
- **TypeScript** - Tipado estático
- **Vite** - Bundler y dev server

### DevOps
- **Docker & Docker Compose** - Containerización
- **nginx** - Proxy reverso y servidor web
- **PostgreSQL** - Base de datos
- **Redis** - Cache y sesiones

## ⚙️ Variables de Entorno

### Backend Local (`Backend/.env`)
```bash
# Database
DB_NAME=lateral360_local
DB_HOST=localhost
DB_PORT=5432

# API
CORS_ALLOWED_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key
```

### Frontend Local (`Frontend/.env`)
```bash
# API
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Lateral 360°"

# Features
VITE_ENABLE_DEBUG=true
```

### Docker
Las variables para Docker están en:
- `Backend/.env.docker`
- `Frontend/.env.docker`

## 🐳 Instalación con Docker

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/360Lateral.git
cd 360Lateral

# Construir y ejecutar servicios
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Ejecutar migraciones (primera vez)
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes
docker-compose down -v
```

## 🔧 Desarrollo Local

### Prerrequisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend
```bash
cd Backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor de desarrollo
python manage.py runserver
```

### Frontend
```bash
cd Frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📁 Estructura del Proyecto

```
360Lateral/
├── Backend/                 # Django REST API
│   ├── apps/               # Aplicaciones Django
│   │   ├── users/          # Gestión de usuarios
│   │   ├── lotes/          # Gestión de lotes
│   │   ├── documents/      # Gestión de documentos
│   │   └── stats/          # Estadísticas
│   ├── config/             # Configuración Django
│   │   ├── settings/       # Settings por ambiente
│   │   ├── urls.py         # URLs principales
│   │   └── wsgi.py         # WSGI config
│   ├── utils/              # Utilidades y helpers
│   ├── requirements.txt    # Dependencias Python
│   ├── Dockerfile          # Docker para backend
│   ├── .env                # Variables locales
│   └── .env.docker         # Variables Docker
├── Frontend/               # Remix Frontend
│   ├── app/                # Código de la aplicación
│   │   ├── routes/         # Rutas de Remix
│   │   ├── components/     # Componentes React
│   │   ├── utils/          # Utilidades
│   │   └── styles/         # Estilos CSS
│   ├── public/             # Archivos estáticos
│   ├── package.json        # Dependencias Node.js
│   ├── Dockerfile          # Docker para frontend
│   ├── .env                # Variables locales
│   └── .env.docker         # Variables Docker
├── docker-compose.yml      # Orquestación Docker
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Esta documentación
```

## 🌐 API y Endpoints

### Principales Endpoints

#### Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/logout/` - Cerrar sesión
- `POST /api/auth/register/` - Registrar usuario
- `GET /api/auth/users/me/` - Perfil del usuario actual

#### Health Checks
- `GET /api/health/` - Estado completo del sistema
- `GET /api/health/simple/` - Health check simple

#### Documentación
- `GET /swagger/` - Documentación Swagger UI
- `GET /redoc/` - Documentación ReDoc

### Acceso a Servicios

**Desarrollo Local:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- API Docs: http://localhost:8000/swagger

**Docker:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- API Docs: http://localhost:8000/swagger

## 👥 Equipo de Desarrollo

**🏗️ Hecho con ❤️ por el equipo de Guartinajas**

---

### 📝 Notas de Desarrollo

- Las migraciones se ejecutan automáticamente en Docker
- Los archivos de log se encuentran en `Backend/logs/`
- Los archivos de media se almacenan en `Backend/media/`
- El hot reload está habilitado en desarrollo

### 🐛 Solución de Problemas

**Error de conexión a la base de datos:**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de la base de datos
docker-compose logs db
```

**Error en el frontend:**
```bash
# Limpiar node_modules
rm -rf Frontend/node_modules
cd Frontend && npm install
```

**Problemas con Docker:**
```bash
# Reconstruir contenedores
docker-compose down
docker-compose up --build
```