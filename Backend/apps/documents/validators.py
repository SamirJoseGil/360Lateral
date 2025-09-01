"""
Validadores para la aplicación de documentos.
"""
from django.core.exceptions import ValidationError
import os

def validate_file_extension(value):
    """
    Valida que la extensión del archivo sea una de las permitidas.
    """
    ext = os.path.splitext(value.name)[1].lower()
    allowed_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', 
                         '.jpg', '.jpeg', '.png', '.dwg', '.dxf',
                         '.zip', '.rar', '.7z', '.txt']
    
    if ext not in allowed_extensions:
        allowed_ext_str = ', '.join(allowed_extensions)
        raise ValidationError(f'Extensión de archivo no soportada. Las extensiones permitidas son: {allowed_ext_str}')

def validate_file_size(value):
    """
    Valida que el tamaño del archivo no exceda el límite.
    """
    # 50 MB como máximo (en bytes)
    max_size = 50 * 1024 * 1024
    
    if value.size > max_size:
        raise ValidationError(f'El archivo es demasiado grande. El tamaño máximo permitido es de 50 MB.')

def validate_file_name(value):
    """
    Valida que el nombre del archivo cumpla con ciertas restricciones.
    """
    # Verificar que el nombre no sea demasiado largo
    if len(value.name) > 100:
        raise ValidationError('El nombre del archivo es demasiado largo. Máximo 100 caracteres.')
    
    # Verificar caracteres no permitidos
    forbidden_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
    for char in forbidden_chars:
        if char in os.path.basename(value.name):
            raise ValidationError(f'El nombre del archivo contiene caracteres no permitidos: {", ".join(forbidden_chars)}')