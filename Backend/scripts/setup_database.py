"""
Script para configurar la base de datos en el orden correcto
"""
import os
import sys
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

import django
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model

def setup_database():
    """Configurar la base de datos en el orden correcto"""
    print("Creando directorios necesarios...")
    for directory in ['static', 'media', 'logs', 'staticfiles']:
        path = backend_dir / directory
        path.mkdir(exist_ok=True)
        print(f"✅ Directorio {directory} verificado")
    
    print("\n1️⃣ Creando migraciones para la app de usuarios...")
    call_command('makemigrations', 'users', verbosity=1)
    
    print("\n2️⃣ Aplicando migraciones de usuarios PRIMERO...")
    call_command('migrate', 'users', verbosity=1)
    
    print("\n3️⃣ Creando migraciones para contenttypes y auth...")
    call_command('migrate', 'contenttypes', verbosity=1)
    call_command('migrate', 'auth', verbosity=1)
    
    print("\n4️⃣ Creando migraciones para el resto de apps...")
    call_command('makemigrations', verbosity=1)
    
    print("\n5️⃣ Aplicando todas las migraciones restantes...")
    call_command('migrate', verbosity=1)
    
    print("\n6️⃣ Verificando que la app de usuarios está correctamente configurada...")
    User = get_user_model()
    try:
        users_count = User.objects.count()
        print(f"✅ App de usuarios configurada correctamente. Hay {users_count} usuarios en la base de datos.")
    except Exception as e:
        print(f"❌ Error al acceder a los usuarios: {e}")
        return False
    
    print("\n✅ Configuración de base de datos completada")
    return True

if __name__ == "__main__":
    setup_database()
