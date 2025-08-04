# Imagen base
FROM python:3.11-slim

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependencias del sistema incluyendo netcat
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r django \
    && useradd -r -g django django

# Crear directorio de trabajo
WORKDIR /app

# Copiar e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Crear carpetas necesarias y ajustar permisos
RUN mkdir -p /app/media /app/static /app/logs \
    && chown -R django:django /app

# Copiar el código fuente con permisos de usuario django
COPY --chown=django:django . .

# Copiar script de entrada y hacerlo ejecutable
COPY scripts/entrypoint.sh /app/scripts/entrypoint.sh
RUN chmod +x /app/scripts/entrypoint.sh

# Cambiar al usuario django (no root)
USER django

# Exponer puerto
EXPOSE 8000

# Health check simple para desarrollo
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Usar el entrypoint para inicialización
ENTRYPOINT ["/app/scripts/entrypoint.sh"]

# Comando por defecto
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
