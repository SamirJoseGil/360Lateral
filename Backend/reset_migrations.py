#!/usr/bin/env python
"""
Script para resetear las migraciones y arreglar el historial inconsistente
"""

import os
import sqlite3
import shutil
from pathlib import Path

def reset_migrations():
    """Resetea todas las migraciones y la base de datos"""
    
    # 1. Buscar y eliminar TODAS las bases de datos SQLite
    db_files = [
        Path("db.sqlite3"),
        Path("lateral360.db"),
        Path("database.db"),
    ]
    
    for db_file in db_files:
        if db_file.exists():
            db_file.unlink()
            print(f"✓ Base de datos {db_file} eliminada")
    
    # 2. Eliminar archivos de migración en TODAS las apps
    migration_dirs = [
        Path("app/migrations"),
        Path("accounts/migrations"),
        Path("users/migrations"),
        Path("core/migrations"),
        # Buscar automáticamente otras carpetas de migrations
    ]
    
    # Buscar automáticamente directorios de migrations
    for item in Path(".").iterdir():
        if item.is_dir() and not item.name.startswith('.') and item.name != 'venv':
            migrations_path = item / "migrations"
            if migrations_path.exists():
                migration_dirs.append(migrations_path)
    
    for migration_dir in migration_dirs:
        if migration_dir.exists():
            print(f"📁 Limpiando {migration_dir}")
            for file in migration_dir.glob("*.py"):
                if file.name != "__init__.py" and not file.name.startswith("__"):
                    file.unlink()
                    print(f"  ✓ Eliminado {file.name}")
            
            # También eliminar archivos .pyc
            for file in migration_dir.glob("*.pyc"):
                file.unlink()
                print(f"  ✓ Eliminado {file.name}")
            
            # Limpiar __pycache__
            pycache = migration_dir / "__pycache__"
            if pycache.exists():
                shutil.rmtree(pycache)
                print(f"  ✓ Eliminado __pycache__")
    
    print("\n🔄 SOLUCIÓN DEFINITIVA - Ejecuta EXACTAMENTE estos comandos:")
    print("python manage.py migrate --fake-initial")
    print("python manage.py migrate --run-syncdb")
    print("python manage.py makemigrations app")
    print("python manage.py migrate app 0001 --fake")
    print("python manage.py migrate")
    print("python manage.py runserver")

if __name__ == "__main__":
    reset_migrations()