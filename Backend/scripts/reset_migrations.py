"""
Script para resetear migraciones del proyecto.
ADVERTENCIA: Esto eliminará todas las migraciones existentes.
"""
import os
import sys
from pathlib import Path

# Agregar el directorio raíz al path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

def reset_migrations():
    """Elimina todos los archivos de migración excepto __init__.py"""
    apps = ['users', 'authentication', 'lotes', 'documents', 'stats', 'pot', 'common']
    
    for app in apps:
        migrations_dir = BASE_DIR / 'apps' / app / 'migrations'
        
        if migrations_dir.exists():
            print(f"📂 Limpiando migraciones de {app}...")
            
            for file in migrations_dir.glob('*.py'):
                if file.name != '__init__.py':
                    file.unlink()
                    print(f"   ✅ Eliminado: {file.name}")
        else:
            print(f"⚠️  No existe: {migrations_dir}")
    
    print("\n✅ Migraciones reseteadas correctamente")
    print("\n📝 Siguiente paso:")
    print("   python manage.py makemigrations")
    print("   python manage.py migrate")

if __name__ == '__main__':
    reset_migrations()
