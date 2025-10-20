# ==============================================
# 🐍 DOCKERFILE PARA DJANGO - MULTI-STAGE
# ==============================================

# Stage 1: Base image with dependencies
FROM python:3.11-slim AS base

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Development
FROM base AS development

# Crear usuario django
RUN groupadd -r django && useradd -r -g django django

# Crear directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Crear carpetas necesarias y ajustar permisos
RUN mkdir -p /app/media /app/static /app/logs /app/scripts \
    && chown -R django:django /app

# Copiar scripts primero
COPY --chown=django:django scripts/ /app/scripts/

# Copiar el código fuente con permisos de usuario django
COPY --chown=django:django . .

# Hacer ejecutable el entrypoint y scripts
RUN chmod +x /app/entrypoint.sh && \
    chmod +x /app/scripts/*.py || true

# Cambiar al usuario django (no root)
USER django

# Exponer puerto
EXPOSE 8000

# Health check corregido
HEALTHCHECK --interval=30s --timeout=30s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || curl -f http://localhost:8000/ || exit 1

# Usar el entrypoint para inicialización
ENTRYPOINT ["/app/entrypoint.sh"]

# Comando por defecto
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# Stage 3: Production
FROM base AS production

# Crear usuario django
RUN groupadd -r django && useradd -r -g django django

WORKDIR /app

# Copiar e instalar solo dependencias de producción
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn

# Crear carpetas necesarias
RUN mkdir -p /app/media /app/static /app/logs /app/scripts \
    && chown -R django:django /app

# Copiar scripts
COPY --chown=django:django scripts/ /app/scripts/

# Copiar código fuente
COPY --chown=django:django . .
RUN chmod +x /app/entrypoint.sh && \
    chmod +x /app/scripts/*.py || true

USER django
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=30s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || curl -f http://localhost:8000/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "config.wsgi:application"]
