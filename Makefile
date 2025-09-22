# ==============================================
# 🛠️ MAKEFILE - LATERAL 360°
# ==============================================

.PHONY: help build up down logs clean restart shell-backend shell-frontend test

# Mostrar ayuda
help:
	@echo "🚀 Comandos disponibles para Lateral 360°:"
	@echo "  make build      - Construir todos los contenedores"
	@echo "  make up         - Levantar todos los servicios"
	@echo "  make down       - Bajar todos los servicios"
	@echo "  make restart    - Reiniciar todos los servicios"
	@echo "  make logs       - Ver logs de todos los servicios"
	@echo "  make clean      - Limpiar contenedores y volúmenes"
	@echo "  make shell-backend  - Acceder al shell del backend"
	@echo "  make shell-frontend - Acceder al shell del frontend"

# Construir contenedores
build:
	docker-compose build --no-cache

# Levantar servicios
up:
	docker-compose up -d

# Bajar servicios
down:
	docker-compose down

# Reiniciar servicios
restart:
	docker-compose restart

# Ver logs
logs:
	docker-compose logs -f

# Limpiar todo
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Shell del backend
shell-backend:
	docker-compose exec backend /bin/bash

# Shell del frontend
shell-frontend:
	docker-compose exec frontend /bin/sh

# Migrations del backend
migrate:
	docker-compose exec backend python manage.py migrate

# Crear superuser
superuser:
	docker-compose exec backend python manage.py createsuperuser
