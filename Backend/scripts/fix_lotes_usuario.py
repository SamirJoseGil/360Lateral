"""
Script para asignar un usuario administrador a los lotes que quedaron sin usuario después de la migración.

Uso:
python scripts/fix_lotes_usuario.py
"""

import os
import sys
import django
import logging

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.lotes.models import Lote

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

User = get_user_model()

def main():
    """Función principal para asignar usuario a lotes."""
    try:
        logger.info("Iniciando la corrección de lotes sin usuario...")
        
        # Buscar lotes sin usuario asignado
        lotes_sin_usuario = Lote.objects.filter(usuario__isnull=True)
        
        if not lotes_sin_usuario.exists():
            logger.info("No se encontraron lotes sin usuario. No hay nada que corregir.")
            return 0
        
        # Buscar un usuario administrador para asignar a los lotes
        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                logger.warning("No se encontró un usuario administrador. Utilizando el primer usuario disponible.")
                admin_user = User.objects.first()
            
            if not admin_user:
                logger.error("No se encontró ningún usuario en el sistema. No se puede continuar.")
                return 1
                
        except Exception as e:
            logger.error(f"Error buscando usuario administrador: {str(e)}")
            return 1
        
        logger.info(f"Se utilizará el usuario {admin_user.username} (ID: {admin_user.id}) para asignar a los lotes.")
        
        # Asignar el usuario administrador a todos los lotes sin usuario
        count = lotes_sin_usuario.count()
        lotes_sin_usuario.update(usuario=admin_user)
        
        logger.info(f"Se han actualizado {count} lotes que no tenían usuario asignado.")
        
        return 0
    except Exception as e:
        logger.error(f"Error durante el proceso de corrección: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())