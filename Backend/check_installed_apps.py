"""
Script para verificar si la app 'lotes' está registrada en INSTALLED_APPS.
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    # Intentar inicializar Django
    django.setup()
    
    # Importar configuración
    from django.conf import settings
    
    # Obtener apps instaladas
    installed_apps = settings.INSTALLED_APPS
    
    print("\n===== APPS INSTALADAS =====")
    for app in installed_apps:
        print(f"- {app}")
    
    # Verificar si 'lotes' o 'apps.lotes' está en las apps instaladas
    lotes_app = any(app == 'lotes' or app == 'apps.lotes' or app.endswith('.lotes') for app in installed_apps)
    
    if lotes_app:
        print("\n✅ La app 'lotes' está correctamente registrada en INSTALLED_APPS.")
    else:
        print("\n❌ La app 'lotes' NO está registrada en INSTALLED_APPS.")
        print("   Debes agregar 'apps.lotes' o 'lotes' a INSTALLED_APPS en tu archivo de configuración.")
        
        # Sugerir solución
        print("\nSolución: Agrega la siguiente línea a INSTALLED_APPS en config/settings.py:")
        print("    'apps.lotes',")
    
except Exception as e:
    print(f"\n❌ Error al inicializar Django: {str(e)}")
    print("   Verifica que la configuración de Django sea correcta.")
    
    # Mostrar paths
    print("\n===== PYTHON PATH =====")
    for path in sys.path:
        print(f"- {path}")
    
    # Sugerir solución para problemas comunes
    print("\nSoluciones posibles:")
    print("1. Verifica que estás ejecutando el script desde el directorio raíz del proyecto.")
    print("2. Asegúrate de que el módulo de configuración 'config.settings' existe.")
    print("3. Activa el entorno virtual si estás usando uno: source venv/bin/activate (Linux/Mac) o venv\\Scripts\\activate (Windows)")
    print("4. Instala Django si no está instalado: pip install django")