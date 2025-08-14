"""
Script para solucionar específicamente las migraciones de users
"""
import os
import sys
import subprocess
from pathlib import Path
from django.db import connection

# Configurar codificación UTF-8 para Windows
if os.name == 'nt':  # Windows
    os.environ['PYTHONIOENCODING'] = 'utf-8'

def run_command(command, description):
    """Ejecuta un comando y maneja errores"""
    print(f"\n[INFO] {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, encoding='utf-8')
        print(f"[SUCCESS] {description} completado")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Error en {description}: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False

def delete_empty_migrations():
    """Eliminar migraciones vacías"""
    users_migrations_dir = Path(__file__).parent.parent / "apps" / "users" / "migrations"
    lotes_migrations_dir = Path(__file__).parent.parent / "apps" / "lotes" / "migrations"
    
    # Eliminar archivos de migración vacíos
    for migrations_dir in [users_migrations_dir, lotes_migrations_dir]:
        if migrations_dir.exists():
            for file in migrations_dir.glob("*.py"):
                if file.name != "__init__.py":
                    print(f"[DELETE] Eliminando migración vacía: {file}")
                    file.unlink()
    
    print("[SUCCESS] Migraciones vacías eliminadas")

def fix_users_migrations():
    """Solucionar migraciones de users específicamente"""
    
    print("[START] Solucionando migraciones de users...")
    
    # Verificar que estamos en el directorio correcto
    backend_dir = Path(__file__).parent.parent
    os.chdir(backend_dir)
    print(f"[INFO] Directorio de trabajo: {backend_dir}")
    
    # Paso 1: Eliminar migraciones vacías
    print("\n[STEP 1] Eliminar migraciones vacías")
    delete_empty_migrations()
    
    # Paso 2: Limpiar registros de migraciones en la base de datos
    print("\n[STEP 2] Limpiar registros de migraciones")
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM django_migrations WHERE app IN ('users', 'lotes');")
            print("[SUCCESS] Registros de migraciones limpiados")
    except Exception as e:
        print(f"[WARNING] No se pudo limpiar registros: {e}")
    
    # Paso 3: Crear migraciones reales
    print("\n[STEP 3] Crear migraciones reales")
    commands = [
        ("python manage.py makemigrations users --verbosity=2", "Crear migraciones users con verbose"),
        ("python manage.py makemigrations lotes --verbosity=2", "Crear migraciones lotes con verbose"),
    ]
    
    for command, description in commands:
        run_command(command, description)
    
    # Paso 4: Verificar que las migraciones se crearon correctamente
    print("\n[STEP 4] Verificar migraciones creadas")
    run_command("python manage.py showmigrations users lotes", "Verificar estado de migraciones")
    
    # Paso 5: Aplicar migraciones
    print("\n[STEP 5] Aplicar migraciones")
    migration_order = [
        ("python manage.py migrate users", "Migrar users"),
        ("python manage.py migrate lotes", "Migrar lotes"),
        ("python manage.py migrate", "Migrar apps restantes"),
    ]
    
    for command, description in migration_order:
        if not run_command(command, description):
            print(f"[ERROR] Error en: {description}")
            return False
    
    # Paso 6: Crear usuarios demo
    print("\n[STEP 6] Crear usuarios demo")
    run_command("python manage.py create_demo_users", "Crear usuarios demo")
    
    print("\n[SUCCESS] Migraciones de users solucionadas exitosamente!")
    return True

if __name__ == "__main__":
    # Configurar Django
    backend_dir = Path(__file__).resolve().parent.parent
    sys.path.append(str(backend_dir))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    
    import django
    django.setup()
    
    success = fix_users_migrations()
    sys.exit(0 if success else 1)
