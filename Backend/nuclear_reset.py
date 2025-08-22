#!/usr/bin/env python
"""
Reset nuclear completo - elimina TODO y recrea desde cero
"""
import os
import sqlite3
import subprocess
from pathlib import Path

def nuclear_reset():
    """Reset nuclear completo"""
    
    print("🚨 RESET NUCLEAR - ELIMINANDO TODO...")
    
    # 1. ELIMINAR TODAS LAS BASES DE DATOS POSIBLES
    db_patterns = ["*.sqlite3", "*.db", "*.sqlite"]
    for pattern in db_patterns:
        for db_file in Path(".").glob(pattern):
            try:
                db_file.unlink()
                print(f"💥 Eliminado: {db_file}")
            except:
                pass
    
    # 2. ELIMINAR DIRECTORIO MIGRATIONS COMPLETO Y RECREARLO
    migrations_dir = Path("app/migrations")
    if migrations_dir.exists():
        import shutil
        shutil.rmtree(migrations_dir)
        print(f"💥 Eliminado directorio completo: {migrations_dir}")
    
    # Recrear directorio migrations
    migrations_dir.mkdir(exist_ok=True)
    
    # Crear __init__.py
    init_file = migrations_dir / "__init__.py"
    init_file.write_text("# Migrations directory\n")
    print(f"✅ Recreado: {migrations_dir}")
    
    print("\n🔄 EJECUTANDO COMANDOS DE RECUPERACIÓN...")
    
    # Secuencia exacta para recuperar
    commands = [
        "python manage.py makemigrations app",
        "python manage.py migrate --run-syncdb",
        "python manage.py migrate --fake-initial"
    ]
    
    for cmd in commands:
        print(f"\n🔄 Ejecutando: {cmd}")
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"✅ Éxito: {cmd}")
                if result.stdout:
                    print(f"📝 Salida: {result.stdout}")
            else:
                print(f"❌ Error en: {cmd}")
                if result.stderr:
                    print(f"🔥 Error: {result.stderr}")
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout en: {cmd}")
        except Exception as e:
            print(f"💥 Excepción en {cmd}: {e}")
    
    print(f"\n🎉 RESET NUCLEAR COMPLETADO")
    print(f"🚀 Ahora ejecuta: python manage.py runserver")

if __name__ == "__main__":
    nuclear_reset()