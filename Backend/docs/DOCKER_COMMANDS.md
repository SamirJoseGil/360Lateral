# 🐳 Comandos Docker - Lateral 360°

Guía de comandos para gestionar la aplicación con Docker.

## 🚀 Inicio Rápido

### 1. Primera vez (construir e iniciar)
```bash
docker-compose up --build
```

### 2. Iniciar servicios existentes
```bash
docker-compose up
```

### 3. Iniciar en background (detached)
```bash
docker-compose up -d
```

### 4. Detener servicios
```bash
docker-compose down
```

### 5. Detener y eliminar volúmenes
```bash
docker-compose down -v
```

---

## 📦 Gestión de Servicios

### Ver logs en tiempo real
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo database
docker-compose logs -f db
```

### Estado de servicios
```bash
docker-compose ps
```

### Reiniciar servicio específico
```bash
docker-compose restart backend
```

---

## 🔧 Comandos de Django

### Ejecutar migraciones
```bash
docker-compose exec backend python manage.py migrate
```

### Crear migraciones
```bash
docker-compose exec backend python manage.py makemigrations
```

### Crear superusuario
```bash
docker-compose exec backend python manage.py createsuperuser
```

### Recolectar archivos estáticos
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

### Ejecutar shell de Django
```bash
docker-compose exec backend python manage.py shell
```

### Ejecutar tests
```bash
docker-compose exec backend python manage.py test
```

---

## 💾 Base de Datos

### Acceder a PostgreSQL
```bash
docker-compose exec db psql -U postgres -d lateral360
```

### Backup de base de datos
```bash
docker-compose exec db pg_dump -U postgres lateral360 > backup.sql
```

### Restaurar base de datos
```bash
docker-compose exec -T db psql -U postgres lateral360 < backup.sql
```

### Ver tablas
```bash
docker-compose exec db psql -U postgres -d lateral360 -c "\dt"
```

---

## 🧹 Limpieza

### Eliminar contenedores detenidos
```bash
docker container prune
```

### Eliminar imágenes no usadas
```bash
docker image prune
```

### Eliminar volúmenes no usados
```bash
docker volume prune
```

### Limpieza completa del sistema
```bash
docker system prune -a --volumes
```

---

## 🔍 Debugging

### Entrar al contenedor
```bash
docker-compose exec backend bash
```

### Ver variables de entorno
```bash
docker-compose exec backend env
```

### Inspeccionar contenedor
```bash
docker inspect lateral360_backend
```

### Ver uso de recursos
```bash
docker stats
```

---

## 📊 Health Checks

### Verificar estado de servicios
```bash
# Backend
curl http://localhost:8000/

# Database
docker-compose exec db pg_isready -U postgres

# Redis
docker-compose exec redis redis-cli ping
```

---

## 🔄 Reconstruir

### Reconstruir imagen específica
```bash
docker-compose build backend
```

### Reconstruir todo sin cache
```bash
docker-compose build --no-cache
```

---

## 📝 Notas Importantes

1. **Primera ejecución**: El script `entrypoint.sh` crea automáticamente:
   - Usuario admin: `admin / admin123`
   - Ejecuta migraciones
   - Recolecta archivos estáticos

2. **Puerto 8000**: El backend estará disponible en `http://localhost:8000`

3. **Puerto 5432**: PostgreSQL accesible en `localhost:5432`

4. **Puerto 6379**: Redis accesible en `localhost:6379`

5. **Volúmenes persistentes**:
   - `postgres_data`: Datos de PostgreSQL
   - `static_volume`: Archivos estáticos
   - `media_volume`: Archivos de usuario

---

## 🆘 Troubleshooting

### Error: "port is already allocated"
```bash
# Ver procesos usando el puerto
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Cambiar puerto en docker-compose.yml
ports:
  - "8001:8000"
```

### Error: "Cannot connect to database"
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps db

# Ver logs de PostgreSQL
docker-compose logs db

# Reiniciar servicio
docker-compose restart db
```

### Error: "No space left on device"
```bash
# Limpiar Docker
docker system prune -a --volumes
```

---

**Última actualización**: Octubre 2024
