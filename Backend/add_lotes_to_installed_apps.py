"""
Script para asegurar que 'apps.lotes' está en INSTALLED_APPS.
"""
import os
import re
import sys

def find_settings_files():
    """Busca archivos de configuración de Django"""
    settings_files = []
    
    # Buscar en las ubicaciones comunes
    base_dirs = ["config", "backend", "myproject", "app", "."]
    for base_dir in base_dirs:
        if os.path.exists(base_dir):
            for root, dirs, files in os.walk(base_dir):
                for file in files:
                    if file.endswith("settings.py") or "settings" in file and file.endswith(".py"):
                        settings_files.append(os.path.join(root, file))
    
    return settings_files

def add_lotes_to_installed_apps(settings_file):
    """Agrega 'apps.lotes' a INSTALLED_APPS si no está presente"""
    with open(settings_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar la sección INSTALLED_APPS
    installed_apps_pattern = r'INSTALLED_APPS\s*=\s*\[(.*?)\]'
    match = re.search(installed_apps_pattern, content, re.DOTALL)
    
    if not match:
        print(f"No se encontró INSTALLED_APPS en {settings_file}")
        return False
    
    installed_apps_content = match.group(1)
    
    # Verificar si 'apps.lotes' ya está incluido
    if "'apps.lotes'" in installed_apps_content or '"apps.lotes"' in installed_apps_content:
        print(f"'apps.lotes' ya está en INSTALLED_APPS en {settings_file}")
        return False
    
    if "'lotes'" in installed_apps_content or '"lotes"' in installed_apps_content:
        print(f"'lotes' ya está en INSTALLED_APPS en {settings_file}")
        return False
    
    # Encontrar el último elemento de INSTALLED_APPS
    last_app_pattern = r',\s*([\'"][^\'",]+[\'"])\s*\]'
    last_app_match = re.search(last_app_pattern, content)
    
    if last_app_match:
        # Agregar 'apps.lotes' después del último elemento
        modified_content = content.replace(
            last_app_match.group(0),
            f",\n    'apps.lotes',\n]"
        )
        
        with open(settings_file, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        
        print(f"✅ Se agregó 'apps.lotes' a INSTALLED_APPS en {settings_file}")
        return True
    else:
        print(f"No se pudo encontrar el último elemento de INSTALLED_APPS en {settings_file}")
        return False

def main():
    """Función principal"""
    print("Buscando archivos de configuración...")
    settings_files = find_settings_files()
    
    if not settings_files:
        print("No se encontraron archivos de configuración.")
        return
    
    print(f"Se encontraron {len(settings_files)} archivos de configuración.")
    
    updated_files = 0
    for settings_file in settings_files:
        print(f"\nVerificando {settings_file}...")
        if add_lotes_to_installed_apps(settings_file):
            updated_files += 1
    
    if updated_files > 0:
        print(f"\n✅ Se actualizaron {updated_files} archivos de configuración.")
        print("Ahora ejecuta 'python manage.py makemigrations lotes' y luego 'python manage.py migrate lotes'")
    else:
        print("\nNo se realizaron cambios en los archivos de configuración.")
        print("Verifica manualmente que 'apps.lotes' o 'lotes' esté en INSTALLED_APPS.")

if __name__ == "__main__":
    main()