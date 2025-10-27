"""
Script para verificar el estado de las migraciones y tablas
"""
import os
import sys
import django
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
except Exception as e:
    print(f'❌ Error setting up Django: {str(e)}')
    sys.exit(1)

from django.db import connection
from django.core.management import call_command
from django.apps import apps

def check_database_tables():
    """Verificar qué tablas existen en la base de datos"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema='public' 
                ORDER BY table_name
            """)
            tables = [row[0] for row in cursor.fetchall()]
            
        print(f"📊 Found {len(tables)} tables in database:")
        for table in tables:
            print(f"  - {table}")
            
        # Verificar tablas específicas que necesitamos
        required_tables = ['lotes', 'users_user', 'auth_user']
        missing_tables = []
        
        for table in required_tables:
            if table not in tables:
                missing_tables.append(table)
            else:
                print(f"✅ Table {table} exists")
                
        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
            return False
        else:
            print("✅ All required tables exist")
            return True
            
    except Exception as e:
        print(f"❌ Error checking tables: {e}")
        return False

def check_migrations():
    """Verificar el estado de las migraciones"""
    try:
        print("\n🔍 Checking migration status...")
        
        # Obtener apps instaladas
        installed_apps = [app.label for app in apps.get_app_configs()]
        print(f"📱 Installed apps: {installed_apps}")
        
        # Verificar migraciones pendientes
        try:
            call_command('showmigrations', verbosity=1)
        except Exception as e:
            print(f"⚠️  Could not show migrations: {e}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking migrations: {e}")
        return False

def main():
    print("=" * 60)
    print("🔍 LATERAL 360° - DATABASE CHECK")
    print("=" * 60)
    
    # Verificar conexión a la base de datos
    try:
        connection.ensure_connection()
        print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    # Verificar tablas
    tables_ok = check_database_tables()
    
    # Verificar migraciones
    migrations_ok = check_migrations()
    
    print("\n" + "=" * 60)
    if tables_ok and migrations_ok:
        print("✅ Database check completed successfully")
    else:
        print("❌ Database check found issues")
        print("\n🔧 To fix issues, try:")
        print("   docker-compose exec backend python manage.py makemigrations")
        print("   docker-compose exec backend python manage.py migrate")
    print("=" * 60)

if __name__ == "__main__":
    main()
