#!/usr/bin/env python
"""
Script de emergencia para resetear completamente Django
"""
import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd):
    """Ejecuta un comando y muestra el resultado"""
    print(f"\n🔄 Ejecutando: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(f"✅ Salida: {result.stdout}")
    if result.stderr:
        print(f"❌ Error: {result.stderr}")
    return result.returncode == 0

def emergency_reset():
    """Reset de emergencia completo"""
    
    # 1. Eliminar todas las bases de datos
    db_patterns = ["*.sqlite3", "*.db", "*.sqlite"]
    for pattern in db_patterns:
        for db_file in Path(".").glob(pattern):
            db_file.unlink()
            print(f"✓ Eliminado: {db_file}")
    
    # 2. Eliminar migraciones
    for migrations_dir in Path(".").rglob("migrations"):
        if migrations_dir.is_dir() and migrations_dir.name == "migrations":
            for file in migrations_dir.glob("*.py"):
                if file.name != "__init__.py":
                    file.unlink()
                    print(f"✓ Eliminado: {file}")
    
    print("\n🚀 EJECUTANDO COMANDOS DE RESET...")
    
    # Secuencia de comandos para resetear
    commands = [
        "python manage.py migrate --run-syncdb",
        "python manage.py makemigrations",
        "python manage.py migrate --fake-initial",
        "python manage.py migrate"
    ]
    
    for cmd in commands:
        success = run_command(cmd)
        if not success:
            print(f"❌ Falló el comando: {cmd}")
            print("🔧 Intentando comando alternativo...")
            if "makemigrations" in cmd:
                run_command("python manage.py makemigrations app")
    
    print("\n✅ Reset completo. Ahora ejecuta:")
    print("python manage.py runserver")

if __name__ == "__main__":
    emergency_reset()