# Guía de Despliegue - Lateral 360°

## Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración de Entornos](#configuración-de-entornos)
3. [Despliegue en Desarrollo](#despliegue-en-desarrollo)
4. [Despliegue en Staging](#despliegue-en-staging)
5. [Despliegue en Producción](#despliegue-en-producción)
6. [CI/CD](#cicd)
7. [Monitoreo](#monitoreo)
8. [Rollback](#rollback)
9. [Troubleshooting](#troubleshooting)

## Pre-requisitos

### Software Requerido

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- Node.js 20+ (para builds locales)
- Python 3.11+ (para desarrollo)

### Accesos Necesarios

- Repositorio Git
- Servidor de producción (SSH)
- Credenciales de base de datos
- Claves API externas
- Certificados SSL

## Configuración de Entornos

### Variables de Entorno

Crear archivos `.env` para cada entorno:

#### Development (.env.dev)

```bash
# Django
DJANGO_ENV=development
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database
DB_NAME=lateral360_dev
DB_USER=postgres
DB_PASSWORD=postgres_dev
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Frontend
VITE_API_URL=http://backend:8000
VITE_API_URL_EXTERNAL=http://localhost:8000
```

#### Production (.env.prod)

```bash
# Django
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=<STRONG_SECRET_KEY_HERE>
ALLOWED_HOSTS=api.lateral360.com,lateral360.com

# Database
DB_NAME=lateral360_prod
DB_USER=lateral360_user
DB_PASSWORD=<STRONG_PASSWORD>
DB_HOST=db-prod.internal
DB_PORT=5432

# Redis
REDIS_HOST=redis-prod.internal
REDIS_PORT=6379
REDIS_PASSWORD=<REDIS_PASSWORD>

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=<SENDGRID_API_KEY>

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# Frontend
VITE_API_URL=https://api.lateral360.com
VITE_API_URL_EXTERNAL=https://api.lateral360.com
```

## Despliegue en Desarrollo

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/organization/lateral360.git
cd lateral360

# 2. Configurar variables de entorno
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env

# 3. Construir y iniciar servicios
docker-compose up -d

# 4. Verificar servicios
docker-compose ps

# 5. Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# 6. Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

### Hot Reload

El entorno de desarrollo está configurado para hot reload:
- **Backend**: Cambios en `.py` recargan automáticamente
- **Frontend**: Cambios en `.tsx/.ts` recargan automáticamente

## Despliegue en Staging

### Configuración Staging

```bash
# 1. Configurar servidor staging
ssh user@staging-server

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clonar repositorio
git clone https://github.com/organization/lateral360.git
cd lateral360

# 4. Configurar variables de entorno
cp .env.staging.example .env

# 5. Construir imágenes
docker-compose -f docker-compose.staging.yml build

# 6. Iniciar servicios
docker-compose -f docker-compose.staging.yml up -d

# 7. Ejecutar migraciones
docker-compose -f docker-compose.staging.yml exec backend python manage.py migrate

# 8. Recolectar archivos estáticos
docker-compose -f docker-compose.staging.yml exec backend python manage.py collectstatic --noinput
```

## Despliegue en Producción

### Checklist Pre-Despliegue

- [ ] Tests pasando
- [ ] Variables de entorno configuradas
- [ ] Backup de base de datos creado
- [ ] Certificados SSL válidos
- [ ] DNS configurado
- [ ] Firewall configurado
- [ ] Monitoreo configurado
- [ ] Plan de rollback preparado

### Despliegue Manual

```bash
# 1. Conectar al servidor
ssh user@production-server

# 2. Navegar al directorio del proyecto
cd /opt/lateral360

# 3. Hacer backup de base de datos
docker-compose exec db pg_dump -U postgres lateral360 > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Pull últimos cambios
git pull origin main

# 5. Reconstruir imágenes
docker-compose -f docker-compose.prod.yml build --no-cache

# 6. Detener servicios actuales
docker-compose -f docker-compose.prod.yml down

# 7. Iniciar nuevos servicios
docker-compose -f docker-compose.prod.yml up -d

# 8. Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput

# 9. Recolectar estáticos
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput --clear

# 10. Verificar salud de servicios
docker-compose -f docker-compose.prod.yml ps
curl https://api.lateral360.com/health/

# 11. Verificar logs
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
docker-compose -f docker-compose.prod.yml logs --tail=50 frontend
```

### Configuración Nginx

```nginx
# /etc/nginx/sites-available/lateral360

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name lateral360.com www.lateral360.com;
    return 301 https://$server_name$request_uri;
}

# Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name lateral360.com www.lateral360.com;

    ssl_certificate /etc/letsencrypt/live/lateral360.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lateral360.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.lateral360.com;

    ssl_certificate /etc/letsencrypt/live/api.lateral360.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lateral360.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /opt/lateral360/Backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /opt/lateral360/Backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

## CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd Backend
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        cd Backend
        python manage.py test
    
    - name: Run frontend tests
      run: |
        cd Frontend
        npm install
        npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.PRODUCTION_HOST }}
        username: ${{ secrets.PRODUCTION_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /opt/lateral360
          git pull origin main
          docker-compose -f docker-compose.prod.yml build
          docker-compose -f docker-compose.prod.yml up -d
          docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
          docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
```

## Monitoreo

### Health Checks

```bash
# Backend health
curl https://api.lateral360.com/health/

# Frontend health
curl https://lateral360.com/

# Database health
docker-compose exec db pg_isready -U postgres
```

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend

# Ver últimos 100 logs
docker-compose logs --tail=100 backend

# Buscar errores
docker-compose logs backend | grep ERROR
```

### Métricas

Configurar monitoreo con:
- Sentry para errores
- DataDog/New Relic para APM
- Prometheus + Grafana para métricas
- Uptime Robot para disponibilidad

## Rollback

### Procedimiento de Rollback

```bash
# 1. Identificar versión anterior
git log --oneline -10

# 2. Checkout a versión anterior
git checkout <commit-hash>

# 3. Reconstruir servicios
docker-compose -f docker-compose.prod.yml build

# 4. Detener servicios actuales
docker-compose -f docker-compose.prod.yml down

# 5. Restaurar backup de BD (si es necesario)
docker-compose exec -T db psql -U postgres lateral360 < backup_20240115_100000.sql

# 6. Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# 7. Verificar funcionamiento
curl https://api.lateral360.com/health/
```

## Troubleshooting

### Servicio no inicia

```bash
# Ver logs detallados
docker-compose logs --tail=100 <service-name>

# Verificar configuración
docker-compose config

# Reiniciar servicio específico
docker-compose restart <service-name>
```

### Error de base de datos

```bash
# Verificar conectividad
docker-compose exec backend python manage.py dbshell

# Verificar migraciones
docker-compose exec backend python manage.py showmigrations

# Aplicar migraciones forzadas
docker-compose exec backend python manage.py migrate --run-syncdb
```

### Problemas de memoria

```bash
# Ver uso de recursos
docker stats

# Limpiar recursos no usados
docker system prune -a

# Reiniciar servicios con límites
docker-compose down
docker-compose up -d --scale backend=2
```

## Mantenimiento

### Tareas Periódicas

**Diarias:**
- Verificar logs de errores
- Revisar métricas de rendimiento
- Backup de base de datos

**Semanales:**
- Actualizar dependencias de seguridad
- Revisar uso de disco
- Limpiar logs antiguos

**Mensuales:**
- Revisar y optimizar queries lentas
- Actualizar certificados SSL
- Auditoría de seguridad

## Contacto

Para soporte en despliegue:
- Email: devops@lateral360.com
- Slack: #deployments
- On-call: +57 XXX XXX XXXX
