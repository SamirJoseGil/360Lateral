"""
Script maestro para actualizar la base de datos con todas las migraciones y correcciones.

Uso:
python scripts/update_database.py
"""

import os
import sys
import django
import logging
import importlib

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.management import call_command

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Función principal para ejecutar todas las actualizaciones."""
    try:
        logger.info("=== INICIANDO PROCESO DE ACTUALIZACIÓN DE BASE DE DATOS ===")
        
        # 1. Aplicar migraciones generales
        logger.info("Aplicando migraciones generales...")
        call_command('migrate', interactive=False)
        
        # 2. Aplicar migraciones específicas para POT
        logger.info("Aplicando migraciones específicas para la app POT...")
        
        # Importar y ejecutar el script de migración de POT
        try:
            pot_script = importlib.import_module('scripts.migrate_pot')
            pot_result = pot_script.main()
            if pot_result != 0:
                logger.warning("La migración de POT completó con advertencias.")
        except Exception as e:
            logger.error(f"Error durante la migración de POT: {str(e)}")
        
        # 3. Corregir lotes sin usuario
        logger.info("Corrigiendo lotes sin usuario...")
        
        # Importar y ejecutar el script de corrección de lotes
        try:
            fix_lotes_script = importlib.import_module('scripts.fix_lotes_usuario')
            lotes_result = fix_lotes_script.main()
            if lotes_result != 0:
                logger.warning("La corrección de lotes completó con advertencias.")
        except Exception as e:
            logger.error(f"Error durante la corrección de lotes: {str(e)}")
        
        logger.info("=== PROCESO DE ACTUALIZACIÓN COMPLETADO ===")
        return 0
    except Exception as e:
        logger.error(f"Error durante el proceso de actualización: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())