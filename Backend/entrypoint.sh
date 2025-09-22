#!/bin/bash
set -e

echo "🚀 Starting Backend entrypoint script..."

# Function to check if PostgreSQL is ready
function postgres_ready() {
python << END
import sys
import psycopg2
try:
    conn = psycopg2.connect(
        dbname="${DB_NAME:-lateral360}",
        user="${DB_USER:-postgres}",
        password="${DB_PASSWORD:-postgres}",
        host="${DB_HOST:-db}",
        port="${DB_PORT:-5432}",
    )
    conn.close()
except psycopg2.OperationalError:
    sys.exit(1)
sys.exit(0)
END
}

# Function to check if Redis is ready
function redis_ready() {
python << END
import sys
import redis
try:
    r = redis.Redis(host="${REDIS_HOST:-redis}", port="${REDIS_PORT:-6379}", db=0)
    r.ping()
except redis.ConnectionError:
    sys.exit(1)
sys.exit(0)
END
}

# Wait for PostgreSQL to be ready
echo "🔄 Waiting for PostgreSQL..."
until postgres_ready; do
  echo >&2 "🔄 PostgreSQL is unavailable - waiting..."
  sleep 2
done
echo >&2 "✅ PostgreSQL is up - continuing..."

# Wait for Redis to be ready
echo "🔄 Waiting for Redis..."
until redis_ready; do
  echo >&2 "🔄 Redis is unavailable - waiting..."
  sleep 2
done
echo >&2 "✅ Redis is up - continuing..."

# Apply database migrations
echo >&2 "🔧 Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo >&2 "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create cache table if needed
echo >&2 "🗄️ Setting up cache table..."
python manage.py createcachetable || true

# Check URL configuration
echo >&2 "🔍 Checking Django configuration..."
python manage.py check || true

# Start the Django application
echo >&2 "🚀 Starting Django application..."
exec "$@"