"""
Script para resetear migraciones conflictivas
"""
import os
import sys
import shutil
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

def reset_app_migrations(app_name):
    """Resetear migraciones de una app específica"""
    migrations_dir = backend_dir / 'apps' / app_name / 'migrations'
    
    if migrations_dir.exists():
        print(f"🗑️  Removing migrations for {app_name}")
        
        # Conservar __init__.py
        init_file = migrations_dir / '__init__.py'
        init_content = ""
        if init_file.exists():
            with open(init_file, 'r') as f:
                init_content = f.read()
        
        # Eliminar todos los archivos de migración excepto __init__.py
        for file in migrations_dir.glob('*.py'):
            if file.name != '__init__.py':
                file.unlink()
                print(f"   Deleted {file.name}")
        
        # Recrear __init__.py si no existe
        if not init_file.exists():
            with open(init_file, 'w') as f:
                f.write(init_content or "# This file makes migrations a Python package\n")
    else:
        # Crear directorio de migraciones si no existe
        migrations_dir.mkdir(parents=True, exist_ok=True)
        with open(migrations_dir / '__init__.py', 'w') as f:
            f.write("# This file makes migrations a Python package\n")
        print(f"📁 Created migrations directory for {app_name}")

def main():
    """Función principal"""
    print("🔧 RESETTING LATERAL 360° MIGRATIONS")
    print("=" * 50)
    
    # Apps que necesitan reset
    apps_to_reset = ['lotes', 'documents', 'stats', 'pot']
    
    for app in apps_to_reset:
        reset_app_migrations(app)
    
    print("\n✅ Migration reset complete!")
    print("🔄 Now run the following commands:")
    print("   docker-compose exec backend python manage.py makemigrations")
    print("   docker-compose exec backend python manage.py migrate")

if __name__ == "__main__":
    main()
