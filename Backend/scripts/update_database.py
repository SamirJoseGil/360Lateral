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
        
        # 2. Aplicar migraciones específicas para cada app en orden
        logger.info("Aplicando migraciones específicas para la app users...")
        call_command('makemigrations', 'users', interactive=False)
        call_command('migrate', 'users', interactive=False)
        
        logger.info("Aplicando migraciones específicas para la app authentication...")
        call_command('makemigrations', 'authentication', interactive=False)
        call_command('migrate', 'authentication', interactive=False)
        
        logger.info("Aplicando migraciones específicas para la app lotes...")
        call_command('makemigrations', 'lotes', interactive=False)
        call_command('migrate', 'lotes', interactive=False)
        
        logger.info("Aplicando migraciones específicas para la app documents...")
        call_command('makemigrations', 'documents', interactive=False)
        call_command('migrate', 'documents', interactive=False)
        
        logger.info("Aplicando migraciones específicas para la app stats...")
        call_command('makemigrations', 'stats', interactive=False)
        call_command('migrate', 'stats', interactive=False)
        
        logger.info("Aplicando migraciones específicas para la app POT...")
        try:
            pot_script = importlib.import_module('scripts.migrate_pot')
            pot_result = pot_script.main()
            if pot_result != 0:
                logger.warning("La migración de POT completó con advertencias.")
        except Exception as e:
            logger.error(f"Error durante la migración de POT: {str(e)}")
        
        # 3. Corregir lotes sin usuario
        logger.info("Corrigiendo lotes sin usuario...")
        try:
            fix_lotes_script = importlib.import_module('scripts.fix_lotes_usuario')
            lotes_result = fix_lotes_script.main()
            if lotes_result != 0:
                logger.warning("La corrección de lotes completó con advertencias.")
        except Exception as e:
            logger.error(f"Error durante la corrección de lotes: {str(e)}")
        
        # 4. Verificar tablas críticas
        logger.info("Verificando tablas críticas...")
        from django.db import connection
        tables_to_check = ['documents_document', 'lotes_lote', 'stats_stat']
        
        with connection.cursor() as cursor:
            for table in tables_to_check:
                try:
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    logger.info(f"✅ Tabla {table} verificada. Contiene {count} registros.")
                except Exception as e:
                    logger.error(f"❌ Problema con la tabla {table}: {str(e)}")
        
        logger.info("=== PROCESO DE ACTUALIZACIÓN COMPLETADO ===")
        return 0
    except Exception as e:
        logger.error(f"Error durante el proceso de actualización: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())