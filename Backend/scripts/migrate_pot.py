"""
Script para realizar las migraciones de la aplicación POT de forma controlada.

Uso:
python scripts/migrate_pot.py
"""

import os
import sys
import django
import logging

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model

User = get_user_model()

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Función principal para ejecutar las migraciones."""
    try:
        logger.info("Iniciando migración de la aplicación POT...")
        
        # 1. Crear migraciones específicas para la app POT
        logger.info("Creando migraciones para la app POT...")
        call_command('makemigrations', 'pot')
        
        # 2. Aplicar migraciones
        logger.info("Aplicando migraciones para la app POT...")
        call_command('migrate', 'pot')
        
        logger.info("Migración de POT completada exitosamente.")
        
        # 3. Importar datos iniciales
        try:
            logger.info("Importando datos iniciales de tratamientos POT...")
            call_command('importar_tratamientos_pot')
            logger.info("Importación de datos completada.")
        except Exception as e:
            logger.error(f"Error importando datos iniciales: {str(e)}")
        
        return 0
    except Exception as e:
        logger.error(f"Error durante el proceso de migración: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())