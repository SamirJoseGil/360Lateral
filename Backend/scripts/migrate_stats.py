"""
Script para realizar las migraciones de la aplicación stats de forma controlada.

Uso:
python scripts/migrate_stats.py
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

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Función principal para ejecutar las migraciones de la app stats."""
    try:
        logger.info("Iniciando migración de la aplicación stats...")
        
        # 1. Crear migraciones específicas para la app stats
        logger.info("Creando migraciones para la app stats...")
        call_command('makemigrations', 'stats')
        
        # 2. Aplicar migraciones
        logger.info("Aplicando migraciones para la app stats...")
        call_command('migrate', 'stats')
        
        logger.info("Migración de stats completada exitosamente.")
        
        # 3. Verificar que la tabla existe
        from django.db import connection
        with connection.cursor() as cursor:
            try:
                cursor.execute("SELECT COUNT(*) FROM stats_stat")
                count = cursor.fetchone()[0]
                logger.info(f"✅ Tabla stats_stat verificada. Contiene {count} registros.")
            except Exception as e:
                logger.error(f"❌ La tabla stats_stat aún no existe: {str(e)}")
                logger.info("Intentando migración completa...")
                call_command('migrate')
                
                # Verificar nuevamente
                try:
                    cursor.execute("SELECT COUNT(*) FROM stats_stat")
                    count = cursor.fetchone()[0]
                    logger.info(f"✅ Tabla stats_stat creada. Contiene {count} registros.")
                except Exception as e:
                    logger.error(f"❌ La tabla stats_stat sigue sin existir: {str(e)}")
                    return 1
        
        return 0
    except Exception as e:
        logger.error(f"Error durante el proceso de migración: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
