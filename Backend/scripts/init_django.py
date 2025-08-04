#!/usr/bin/env python3
"""
Script para inicializar el proyecto Django con la estructura correcta
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, cwd=None):
    """Ejecutar comando y mostrar output"""
    print(f"Ejecutando: {command}")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            cwd=cwd,
            capture_output=True,
            text=True
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error ejecutando: {command}")
        print(f"Error: {e.stderr}")
        return False

def create_django_structure():
    """Crear estructura inicial de Django"""
    
    # Directorio base del backend
    backend_dir = Path("/app")
    os.chdir(backend_dir)
    
    # 1. Crear proyecto Django si no existe
    if not (backend_dir / "config").exists():
        print("Creando proyecto Django...")
        run_command("django-admin startproject config .")
    
    # 2. Crear directorio apps si no existe
    apps_dir = backend_dir / "apps"
    apps_dir.mkdir(exist_ok=True)
    
    # Crear __init__.py en apps
    (apps_dir / "__init__.py").touch()
    
    # 3. Crear apps básicas
    apps_to_create = ["users", "lotes", "documents", "stats"]
    
    for app_name in apps_to_create:
        app_path = apps_dir / app_name
        if not app_path.exists():
            print(f"Creando app: {app_name}")
            run_command(f"python manage.py startapp {app_name} apps/{app_name}")
    
    # 4. Crear directorio utils
    utils_dir = backend_dir / "utils"
    utils_dir.mkdir(exist_ok=True)
    (utils_dir / "__init__.py").touch()
    
    # 5. Crear directorios adicionales
    for directory in ["media", "static", "logs", "templates"]:
        (backend_dir / directory).mkdir(exist_ok=True)
    
    print("✅ Estructura Django creada exitosamente!")

if __name__ == "__main__":
    create_django_structure()
