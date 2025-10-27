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

# Función para limpiar migraciones conflictivas
clean_migration_conflicts() {
    echo "🧹 Checking for migration conflicts..."
    
    # Intentar detectar conflictos
    if python manage.py showmigrations --plan 2>&1 | grep -q "Conflicting migrations"; then
        echo "⚠️  Migration conflicts detected, attempting to resolve..."
        
        # Intentar merge automático
        python manage.py makemigrations --merge --noinput || {
            echo "❌ Could not auto-merge migrations"
            echo "🔧 Attempting manual conflict resolution..."
            
            # Eliminar archivos de migración conflictivos si existen
            find apps/*/migrations/ -name "0002_*.py" -type f | head -n -1 | xargs rm -f 2>/dev/null || true
            
            # Recrear migraciones limpias
            python manage.py makemigrations --noinput || echo "⚠️  Could not recreate migrations"
        }
    fi
}

# Función para ejecutar migraciones de manera segura
migrate_app() {
    local app_name=$1
    echo "🔄 Migrating ${app_name}..."
    
    # Verificar si hay migraciones para la app
    if [ -d "apps/${app_name}/migrations" ]; then
        # Ejecutar migraciones existentes
        python manage.py migrate ${app_name} --noinput || {
            echo "⚠️  Migration failed for ${app_name}, attempting recovery..."
            
            # Si falla, intentar crear migraciones desde cero
            python manage.py makemigrations ${app_name} --noinput || echo "   ⚠️  Could not create migrations for ${app_name}"
            python manage.py migrate ${app_name} --noinput || echo "   ⚠️  Recovery migration failed for ${app_name}"
        }
    else
        echo "   Creating migrations directory for ${app_name}..."
        mkdir -p "apps/${app_name}/migrations"
        touch "apps/${app_name}/migrations/__init__.py"
        python manage.py makemigrations ${app_name} --noinput || echo "   ⚠️  Could not create initial migrations for ${app_name}"
        python manage.py migrate ${app_name} --noinput || echo "   ⚠️  Could not run initial migrations for ${app_name}"
    fi
}

# ✅ LIMPIAR CONFLICTOS ANTES DE MIGRAR
clean_migration_conflicts

# ✅ EJECUTAR MIGRACIONES EN ORDEN CORRECTO
echo "🔄 Running migrations in correct order..."

echo "1️⃣ Migrating contenttypes..."
python manage.py migrate contenttypes --noinput

echo "2️⃣ Migrating auth..."
python manage.py migrate auth --noinput

echo "3️⃣ Migrating users (custom user model)..."
migrate_app users

echo "4️⃣ Migrating pot..."
migrate_app pot

echo "5️⃣ Migrating lotes..."
migrate_app lotes

echo "6️⃣ Migrating documents..."
migrate_app documents

echo "7️⃣ Migrating stats..."
migrate_app stats

echo "8️⃣ Running remaining migrations..."
python manage.py makemigrations --noinput || echo "⚠️  Warning: Could not create additional migrations"
python manage.py migrate --noinput || echo "⚠️  Warning: Could not run remaining migrations"

# ✅ VERIFICAR QUE LAS TABLAS EXISTAN
echo "🔍 Verifying database tables..."
python -c "
import django
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public'\")
tables = [row[0] for row in cursor.fetchall()]
print(f'📊 Found {len(tables)} tables: {sorted(tables)[:5]}...')
required_tables = ['lotes', 'users_user']
for table in required_tables:
    if table in tables:
        print(f'✅ Table {table} exists')
    else:
        print(f'❌ Table {table} does not exist!')
" || echo "⚠️  Could not verify tables"

# Recolectar archivos estáticos
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear || echo "⚠️  Warning: Could not collect static files"

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