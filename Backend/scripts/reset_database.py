"""
Script para resetear completamente la base de datos
ADVERTENCIA: Esto eliminará TODOS los datos
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.core.management import call_command
from django.db import connection
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    """Resetear la base de datos completamente"""
    print("=" * 70)
    print("⚠️  RESET COMPLETO DE BASE DE DATOS")
    print("=" * 70)
    print("\n⚠️  ADVERTENCIA: Esto eliminará TODOS los datos")
    print("⚠️  Esto incluye: usuarios, lotes, documentos, estadísticas, etc.")
    
    response = input("\n¿Estás seguro? Escribe 'SI' para continuar: ")
    
    if response != "SI":
        print("❌ Operación cancelada")
        return 1
    
    try:
        print("\n🗑️  Eliminando todas las tablas...")
        
        with connection.cursor() as cursor:
            # Obtener todas las tablas
            cursor.execute("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
            """)
            
            tables = cursor.fetchall()
            
            # Eliminar todas las tablas
            cursor.execute("DROP SCHEMA public CASCADE;")
            cursor.execute("CREATE SCHEMA public;")
            cursor.execute("GRANT ALL ON SCHEMA public TO postgres;")
            cursor.execute("GRANT ALL ON SCHEMA public TO public;")
            
            print(f"✅ Eliminadas {len(tables)} tablas")
        
        print("\n📋 Eliminando archivos de migraciones...")
        
        # Eliminar archivos de migraciones (excepto __init__.py)
        apps_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'apps')
        
        for app_name in ['users', 'lotes', 'documents', 'stats', 'pot', 'authentication', 'common']:
            migrations_dir = os.path.join(apps_dir, app_name, 'migrations')
            
            if os.path.exists(migrations_dir):
                for filename in os.listdir(migrations_dir):
                    if filename.endswith('.py') and filename != '__init__.py':
                        filepath = os.path.join(migrations_dir, filename)
                        os.remove(filepath)
                        print(f"  Eliminado: {app_name}/migrations/{filename}")
        
        print("\n🔨 Creando migraciones nuevas...")
        call_command('makemigrations')
        
        print("\n📦 Aplicando migraciones...")
        call_command('migrate')
        
        print("\n👤 Creando superusuario...")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(email='admin@lateral360.com').exists():
            admin = User.objects.create_superuser(
                email='admin@lateral360.com',
                username='admin',
                password='admin123',
                first_name='Admin',
                last_name='Lateral360',
                role='admin'
            )
            print(f"✅ Superusuario creado: admin@lateral360.com / admin123")
        
        # Crear usuario propietario de prueba
        if not User.objects.filter(email='propietario@lateral360.com').exists():
            owner = User.objects.create_user(
                email='propietario@lateral360.com',
                username='propietario',
                password='propietario123',
                first_name='Propietario',
                last_name='Test',
                role='owner'
            )
            print(f"✅ Usuario propietario creado: propietario@lateral360.com / propietario123")
        
        # Crear usuario desarrollador de prueba
        if not User.objects.filter(email='desarrollador@lateral360.com').exists():
            developer = User.objects.create_user(
                email='desarrollador@lateral360.com',
                username='desarrollador',
                password='desarrollador123',
                first_name='Desarrollador',
                last_name='Test',
                role='developer'
            )
            print(f"✅ Usuario desarrollador creado: desarrollador@lateral360.com / desarrollador123")
        
        print("\n" + "=" * 70)
        print("✅ BASE DE DATOS RESETEADA EXITOSAMENTE")
        print("=" * 70)
        print("\n📝 Usuarios de prueba creados:")
        print("   - Admin: admin@lateral360.com / admin123")
        print("   - Propietario: propietario@lateral360.com / propietario123")
        print("   - Desarrollador: desarrollador@lateral360.com / desarrollador123")
        print("\n🚀 Puedes iniciar el servidor con: python manage.py runserver")
        
        return 0
        
    except Exception as e:
        logger.error(f"❌ Error durante el reset: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(reset_database())
