"""
Script simplificado para migraciones sin emojis
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
from django.db import connection

def main():
    print("Iniciando proceso de migraciones...")
    
    # 1. Limpiar migraciones
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM django_migrations WHERE app IN ('users', 'lotes');")
            print("Registros de migraciones limpiados")
    except:
        print("No se pudo limpiar - continuando...")
    
    # 2. Crear migraciones
    try:
        call_command('makemigrations', 'users', verbosity=1)
        print("Migraciones users creadas")
    except Exception as e:
        print(f"Error creando migraciones users: {e}")
    
    try:
        call_command('makemigrations', 'lotes', verbosity=1)
        print("Migraciones lotes creadas")
    except Exception as e:
        print(f"Error creando migraciones lotes: {e}")
    
    # 3. Aplicar migraciones
    try:
        call_command('migrate', verbosity=1)
        print("Migraciones aplicadas")
    except Exception as e:
        print(f"Error aplicando migraciones: {e}")
    
    # 4. Crear usuarios demo
    try:
        call_command('create_demo_users')
        print("Usuarios demo creados")
    except Exception as e:
        print(f"Error creando usuarios demo: {e}")
    
    print("Proceso completado")

if __name__ == "__main__":
    main()
