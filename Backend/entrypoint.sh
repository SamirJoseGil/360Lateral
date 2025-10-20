#!/bin/bash

set -e

echo "🚀 Starting Lateral 360° Backend..."

# Esperar a que PostgreSQL esté listo
echo "⏳ Waiting for PostgreSQL..."
timeout=30
counter=0
while ! nc -z ${DB_HOST:-db} ${DB_PORT:-5432}; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL connection timeout"
        exit 1
    fi
done
echo "✅ PostgreSQL is ready!"

# Ejecutar migraciones en orden correcto
echo "🔄 Running migrations in correct order..."

echo "1️⃣ Migrating users..."
python manage.py makemigrations users --noinput || true
python manage.py migrate users --noinput

echo "2️⃣ Skipping common (no models)..."
# Common no tiene modelos, solo utilidades

echo "3️⃣ Migrating authentication..."
python manage.py makemigrations authentication --noinput || true
python manage.py migrate authentication --noinput || true

echo "4️⃣ Migrating pot..."
python manage.py makemigrations pot --noinput || true
python manage.py migrate pot --noinput || true

echo "5️⃣ Migrating lotes..."
python manage.py makemigrations lotes --noinput || true
python manage.py migrate lotes --noinput || true

echo "6️⃣ Migrating documents..."
python manage.py makemigrations documents --noinput || true
python manage.py migrate documents --noinput || true

echo "7️⃣ Migrating stats..."
python manage.py makemigrations stats --noinput || true
python manage.py migrate stats --noinput || true

echo "8️⃣ Running remaining migrations..."
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput

# Recolectar archivos estáticos
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear || true

# Crear superusuario usando script Python dedicado
echo "👤 Creating superuser if not exists..."
python scripts/create_superuser.py || echo "⚠️  Warning: Could not create superuser"

# Opcional: Crear usuarios adicionales
if [ "$CREATE_ADDITIONAL_USERS" = "true" ]; then
    echo "👥 Creating additional users..."
    python scripts/create_additional_users.py || echo "⚠️  Warning: Could not create additional users"
fi

echo "✅ Initialization complete!"
echo "🎉 Starting Django server..."

# Ejecutar comando pasado como argumentos
exec "$@"