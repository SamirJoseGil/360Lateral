# Lateral 360° - Plataforma de Gestión Urbanística

## Descripción General

Lateral 360° es una plataforma integral para la gestión y análisis de lotes urbanos en Colombia. Conecta propietarios de lotes con desarrolladores inmobiliarios mediante análisis urbanístico automatizado y herramientas avanzadas de evaluación de proyectos.

## Arquitectura del Sistema

### Stack Tecnológico

**Backend:**
- Django 4.2.7
- Django REST Framework 3.14.0
- PostgreSQL 15
- Redis 7
- JWT Authentication

**Frontend:**
- Remix (React Framework)
- TypeScript
- Tailwind CSS
- Vite

**Infraestructura:**
- Docker & Docker Compose
- Nginx (producción)
- Gunicorn (WSGI server)

## Estructura del Proyecto

```
360Lateral/
├── Backend/              # Aplicación Django
│   ├── apps/            # Módulos de la aplicación
│   ├── config/          # Configuración Django
│   ├── scripts/         # Scripts de utilidad
│   └── requirements.txt # Dependencias Python
├── Frontend/            # Aplicación Remix
│   ├── app/            # Código fuente
│   ├── public/         # Archivos estáticos
│   └── package.json    # Dependencias Node
├── docker-compose.yml   # Orquestación de servicios
└── docs/               # Documentación adicional
```

## Requisitos Previos

- Docker 20.10+
- Docker Compose 2.0+
- Git
- 4GB RAM mínimo
- 10GB espacio en disco

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd 360Lateral
```

### 2. Configurar Variables de Entorno

**Backend (.env):**
```bash
cp Backend/.env.example Backend/.env
```

Editar `Backend/.env` con tus configuraciones:
```env
DJANGO_ENV=development
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=lateral360
DB_USER=postgres
DB_PASSWORD=postgres
```

**Frontend (.env):**
```bash
cp Frontend/.env.example Frontend/.env
```

### 3. Iniciar Servicios con Docker

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Acceder a la Aplicación

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- API Docs: http://localhost:8000/api/docs/

### Usuarios de Prueba

```
Admin:
  Email: admin@lateral360.com
  Password: admin123

Propietario:
  Email: propietario@lateral360.com
  Password: propietario123

Desarrollador:
  Email: desarrollador@lateral360.com
  Password: desarrollador123
```

## Comandos Útiles

### Backend

```bash
# Acceder al contenedor
docker-compose exec backend bash

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Ejecutar tests
docker-compose exec backend python manage.py test

# Recolectar archivos estáticos
docker-compose exec backend python manage.py collectstatic
```

### Frontend

```bash
# Acceder al contenedor
docker-compose exec frontend sh

# Instalar dependencias
docker-compose exec frontend npm install

# Ejecutar build
docker-compose exec frontend npm run build
```

### Base de Datos

```bash
# Backup
docker-compose exec db pg_dump -U postgres lateral360 > backup.sql

# Restore
docker-compose exec -T db psql -U postgres lateral360 < backup.sql
```

## Módulos Principales

### Backend

#### 1. Authentication (`apps.authentication`)
Gestión de autenticación y autorización con JWT.

**Endpoints principales:**
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/register/` - Registro de usuarios
- `POST /api/auth/logout/` - Cerrar sesión
- `GET /api/auth/me/` - Obtener usuario actual

#### 2. Users (`apps.users`)
Gestión de perfiles de usuario.

**Roles:**
- `admin` - Administrador del sistema
- `owner` - Propietario de lotes
- `developer` - Desarrollador inmobiliario

#### 3. Lotes (`apps.lotes`)
Gestión y análisis de lotes urbanos.

**Funcionalidades:**
- Registro de lotes
- Búsqueda por CBML, matrícula, dirección
- Análisis urbanístico automatizado
- Integración con MapGIS

#### 4. POT (`apps.pot`)
Integración con Plan de Ordenamiento Territorial.

#### 5. Documents (`apps.documents`)
Gestión de documentos y archivos asociados a lotes.

#### 6. Stats (`apps.stats`)
Estadísticas y métricas del sistema.

### Frontend

#### 1. Routes
Estructura de rutas de la aplicación Remix.

#### 2. Components
Componentes reutilizables de UI.

#### 3. Utils
Utilidades y helpers.

#### 4. Services
Servicios para comunicación con API.

## Configuración de Desarrollo

### Backend

El backend utiliza Django con configuración modular:

```python
# Archivo principal: config/settings.py
# Detecta automáticamente el entorno basado en DJANGO_ENV
```

**Entornos soportados:**
- `development` - Desarrollo local
- `production` - Producción
- `testing` - Tests automatizados

### Frontend

El frontend usa Remix con Vite:

```typescript
// Configuración: vite.config.ts
// Variables de entorno en tiempo de build
```

**Configuración de API:**
- SSR (Server): `http://backend:8000`
- Cliente: `http://localhost:8000`

## Despliegue en Producción

### Preparación

1. Configurar variables de entorno de producción
2. Generar SECRET_KEY seguro
3. Configurar dominio y certificados SSL
4. Ajustar ALLOWED_HOSTS y CORS

### Docker Production

```bash
# Construir para producción
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Testing

### Backend Tests

```bash
# Ejecutar todos los tests
docker-compose exec backend python manage.py test

# Tests específicos
docker-compose exec backend python manage.py test apps.authentication

# Con coverage
docker-compose exec backend coverage run manage.py test
docker-compose exec backend coverage report
```

### Frontend Tests

```bash
# Ejecutar tests
docker-compose exec frontend npm test

# Tests con cobertura
docker-compose exec frontend npm run test:coverage
```

## Monitoreo y Logs

### Logs de Aplicación

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Todos los servicios
docker-compose logs -f
```

### Health Checks

- Backend: `GET http://localhost:8000/`
- Frontend: `GET http://localhost:3000/`
- Database: `docker-compose exec db pg_isready`
- Redis: `docker-compose exec redis redis-cli ping`

## Troubleshooting

### Problemas Comunes

#### 1. Error de conexión CORS

**Problema:** Frontend no puede conectarse al backend.

**Solución:**
```bash
# Verificar variables de entorno
docker-compose exec backend env | grep CORS

# Reiniciar servicios
docker-compose restart backend frontend
```

#### 2. Error de base de datos

**Problema:** Backend no puede conectarse a PostgreSQL.

**Solución:**
```bash
# Verificar estado de la base de datos
docker-compose ps db

# Verificar logs
docker-compose logs db

# Reiniciar base de datos
docker-compose restart db
```

#### 3. Frontend no carga

**Problema:** Página en blanco o error 500.

**Solución:**
```bash
# Verificar logs
docker-compose logs frontend

# Reconstruir node_modules
docker-compose exec frontend rm -rf node_modules
docker-compose exec frontend npm install
docker-compose restart frontend
```

## Seguridad

### Mejores Prácticas

1. **Nunca** commitear archivos `.env`
2. Usar SECRET_KEY fuerte en producción
3. Mantener dependencias actualizadas
4. Revisar logs regularmente
5. Implementar rate limiting
6. Validar todos los inputs de usuario
7. Usar HTTPS en producción

### Actualizaciones de Seguridad

```bash
# Backend
docker-compose exec backend pip list --outdated

# Frontend
docker-compose exec frontend npm outdated
```

## Contribución

### Workflow

1. Fork el repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código

**Python (Backend):**
- PEP 8
- Type hints cuando sea posible
- Docstrings en todas las funciones públicas

**TypeScript (Frontend):**
- ESLint
- Prettier
- Interfaces para todos los tipos

## Licencia

[Especificar licencia aquí]

## Contacto y Soporte

- Email: soporte@lateral360.com
- Documentación: [URL de documentación]
- Issues: [URL de issues]

## Changelog

### Version 1.0.0 (2024)
- Lanzamiento inicial
- Sistema de autenticación JWT
- Gestión de lotes
- Análisis urbanístico básico
- Integración MapGIS