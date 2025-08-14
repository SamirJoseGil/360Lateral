"""
Script para solucionar el problema de migraciones faltantes
"""
import os
import sys
import subprocess
from pathlib import Path
from django.db import connection

def run_command(command, description):
    """Ejecuta un comando y maneja errores"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completado")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error en {description}: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False

def create_migration_files():
    """Crear archivos de migración manualmente si no existen"""
    
    # Crear directorio de migraciones para users
    users_migrations_dir = Path(__file__).parent.parent / "apps" / "users" / "migrations"
    users_migrations_dir.mkdir(exist_ok=True)
    
    # Crear __init__.py
    (users_migrations_dir / "__init__.py").touch()
    
    # Crear lotes migrations dir
    lotes_migrations_dir = Path(__file__).parent.parent / "apps" / "lotes" / "migrations"
    lotes_migrations_dir.mkdir(exist_ok=True)
    (lotes_migrations_dir / "__init__.py").touch()
    
    print("✅ Directorios de migraciones creados")

def fix_migrations():
    """Solucionar problemas de migraciones"""
    
    print("🚀 Solucionando problemas de migraciones...")
    
    # Verificar que estamos en el directorio correcto
    backend_dir = Path(__file__).parent.parent
    os.chdir(backend_dir)
    print(f"📁 Directorio de trabajo: {backend_dir}")
    
    # Paso 1: Crear directorios de migraciones
    print("\n📂 Paso 1: Crear directorios de migraciones")
    create_migration_files()
    
    # Paso 2: Limpiar tabla de migraciones
    print("\n🧹 Paso 2: Limpiar tabla de migraciones")
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM django_migrations;")
            print("✅ Tabla django_migrations limpiada")
    except Exception as e:
        print(f"⚠️ No se pudo limpiar tabla: {e}")
    
    # Paso 3: Crear migraciones por app específicamente
    print("\n📝 Paso 3: Crear migraciones por app")
    commands = [
        ("python manage.py makemigrations users", "Crear migraciones users"),
        ("python manage.py makemigrations lotes", "Crear migraciones lotes"),
        ("python manage.py makemigrations", "Crear migraciones restantes"),
    ]
    
    for command, description in commands:
        run_command(command, description)
    
    # Paso 4: Aplicar migraciones en orden específico
    print("\n🔄 Paso 4: Aplicar migraciones en orden")
    migration_order = [
        ("python manage.py migrate contenttypes", "Migrar contenttypes"),
        ("python manage.py migrate auth", "Migrar auth"),
        ("python manage.py migrate users", "Migrar users"),
        ("python manage.py migrate", "Migrar resto"),
    ]
    
    for command, description in migration_order:
        if not run_command(command, description):
            print(f"❌ Error en: {description}")
            return False
    
    # Paso 5: Crear usuarios demo
    print("\n👥 Paso 5: Crear usuarios demo")
    run_command("python manage.py create_demo_users", "Crear usuarios demo")
    
    print("\n🎉 ¡Migraciones solucionadas exitosamente!")
    return True

if __name__ == "__main__":
    # Configurar Django
    backend_dir = Path(__file__).resolve().parent.parent
    sys.path.append(str(backend_dir))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    
    import django
    django.setup()
    
    success = fix_migrations()
    sys.exit(0 if success else 1)
