#!/usr/bin/env python
"""
Script para limpiar archivos temporales y dejar proyecto normal
"""

import os
from pathlib import Path

def main():
    """Limpiar archivos de debugging"""
    print("🧹 Limpiando archivos temporales...")
    
    BASE_DIR = Path(__file__).resolve().parent
    
    # Lista de archivos temporales a eliminar
    temp_files = [
        'manage_forced.py',
        'manage_test.py', 
        'clean_cache.py',
        'clean_conflicts.py',
        'debug_settings.py',
        'diagnose_settings.py',
        'fix_settings.py',
        'init_django.py',
        'config/settings_test.py'
    ]
    
    # Lista de carpetas temporales a eliminar
    temp_dirs = [
        'config/settings_backup',
        'apps_backup'
    ]
    
    for temp_file in temp_files:
        file_path = BASE_DIR / temp_file
        if file_path.exists():
            try:
                file_path.unlink()
                print(f"✅ Eliminado archivo: {temp_file}")
            except Exception as e:
                print(f"⚠️  Error eliminando {temp_file}: {e}")
        else:
            print(f"📝 No existe: {temp_file}")
    
    # Eliminar carpetas temporales
    import shutil
    for temp_dir in temp_dirs:
        dir_path = BASE_DIR / temp_dir
        if dir_path.exists():
            try:
                shutil.rmtree(dir_path)
                print(f"✅ Eliminada carpeta: {temp_dir}")
            except Exception as e:
                print(f"⚠️  Error eliminando carpeta {temp_dir}: {e}")
        else:
            print(f"📝 No existe carpeta: {temp_dir}")
    
    print(f"\n🎯 Limpieza completada!")

if __name__ == '__main__':
    main()