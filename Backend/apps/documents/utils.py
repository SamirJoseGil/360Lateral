"""
Utilidades para el módulo de documentos
"""
import os
import logging

logger = logging.getLogger(__name__)

def build_external_file_url(file_field, request=None):
    """
    Construye una URL EXTERNA accesible desde el navegador para un archivo.
    
    En Docker, esto significa usar localhost:8000 en lugar del hostname interno (backend).
    Fuera de Docker, usa la URL normal del request.
    
    Args:
        file_field: Campo FileField/ImageField de Django
        request: Request object (opcional)
        
    Returns:
        str: URL completa accesible desde el navegador, o None si no hay archivo
    """
    if not file_field:
        return None
    
    try:
        # Obtener URL relativa del archivo (ej: /media/documents/file.pdf)
        file_relative_url = file_field.url
        
        # Verificar si estamos en Docker
        is_docker = os.getenv('DOCKER_ENV') == 'true'
        
        if is_docker:
            # ✅ En Docker: usar localhost para que el navegador pueda acceder
            # El contenedor backend escucha en 0.0.0.0:8000
            # pero el navegador debe acceder via localhost:8000
            external_url = f"http://localhost:8000{file_relative_url}"
            logger.debug(f"[File URL] Docker mode - External URL: {external_url}")
        else:
            # Fuera de Docker: usar build_absolute_uri si hay request
            if request:
                external_url = request.build_absolute_uri(file_relative_url)
            else:
                # Fallback si no hay request
                external_url = f"http://localhost:8000{file_relative_url}"
            logger.debug(f"[File URL] Non-Docker mode - External URL: {external_url}")
        
        return external_url
        
    except Exception as e:
        logger.error(f"[File URL] Error building external URL: {e}")
        return None
