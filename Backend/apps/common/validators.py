"""
Validadores personalizados para toda la aplicación
"""
import os
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_file_extension(value):
    """
    Valida que la extensión del archivo esté permitida.
    
    Args:
        value: Archivo a validar
        
    Raises:
        ValidationError: Si la extensión no está permitida
    """
    ext = os.path.splitext(value.name)[1].lower()
    
    # Extensiones permitidas
    valid_extensions = [
        '.pdf', '.doc', '.docx',  # Documentos
        '.jpg', '.jpeg', '.png', '.gif',  # Imágenes
        '.xlsx', '.xls', '.csv',  # Hojas de cálculo
        '.txt', '.zip'  # Otros
    ]
    
    if ext not in valid_extensions:
        raise ValidationError(
            _('Extensión de archivo no permitida. Extensiones válidas: %(extensions)s'),
            params={'extensions': ', '.join(valid_extensions)},
        )


def validate_file_size(value):
    """
    Valida que el tamaño del archivo no exceda el máximo permitido.
    
    Args:
        value: Archivo a validar
        
    Raises:
        ValidationError: Si el archivo es demasiado grande
    """
    filesize = value.size
    max_size_mb = 10
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if filesize > max_size_bytes:
        raise ValidationError(
            _('El tamaño máximo de archivo es %(max_size)s MB. Tu archivo tiene %(file_size)s MB'),
            params={
                'max_size': max_size_mb,
                'file_size': round(filesize / (1024 * 1024), 2)
            },
        )


def validate_image_file(value):
    """
    Valida que el archivo sea una imagen válida.
    
    Args:
        value: Archivo a validar
        
    Raises:
        ValidationError: Si el archivo no es una imagen válida
    """
    ext = os.path.splitext(value.name)[1].lower()
    valid_image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
    
    if ext not in valid_image_extensions:
        raise ValidationError(
            _('El archivo debe ser una imagen (jpg, jpeg, png, gif, bmp)')
        )


def validate_cbml(value):
    """
    Valida el formato del CBML (Código Base Municipal de Lote).
    Formato esperado: 14 dígitos numéricos
    
    Args:
        value: CBML a validar
        
    Returns:
        bool: True si es válido
        
    Raises:
        ValidationError: Si el formato es inválido
    """
    if not value:
        raise ValidationError(_('El CBML es requerido'))
    
    # Limpiar espacios
    value = str(value).strip()
    
    # Verificar longitud
    if len(value) != 14:
        raise ValidationError(
            _('El CBML debe tener exactamente 14 dígitos. Actual: %(length)s'),
            params={'length': len(value)}
        )
    
    # Verificar que sea numérico
    if not value.isdigit():
        raise ValidationError(_('El CBML debe contener solo números'))
    
    return True


def validate_matricula(value):
    """
    Valida el formato de matrícula inmobiliaria.
    Formato esperado: XXX-XXXXXX (3 dígitos, guion, 6 dígitos)
    
    Args:
        value: Matrícula a validar
        
    Returns:
        bool: True si es válida
        
    Raises:
        ValidationError: Si el formato es inválido
    """
    if not value:
        raise ValidationError(_('La matrícula es requerida'))
    
    # Limpiar espacios
    value = str(value).strip()
    
    # Patrón: XXX-XXXXXX
    pattern = r'^\d{3}-\d{6}$'
    
    if not re.match(pattern, value):
        raise ValidationError(
            _('La matrícula debe tener el formato XXX-XXXXXX (ejemplo: 001-123456)')
        )
    
    return True


def validate_phone_number(value):
    """
    Valida formato de número telefónico colombiano.
    
    Args:
        value: Número a validar
        
    Raises:
        ValidationError: Si el formato es inválido
    """
    if not value:
        return  # Permitir vacío si el campo es opcional
    
    # Limpiar el número
    cleaned = re.sub(r'\s+', '', str(value))
    cleaned = cleaned.replace('(', '').replace(')', '').replace('-', '')
    
    # Patrones válidos para Colombia
    # Celular: +57 3XX XXX XXXX o 3XX XXX XXXX
    # Fijo: +57 X XXX XXXX o X XXX XXXX
    patterns = [
        r'^\+57\d{10}$',  # +573001234567
        r'^\d{10}$',       # 3001234567
        r'^\+57\d{7}$',    # +5712345678 (fijo)
        r'^\d{7}$',        # 1234567 (fijo)
    ]
    
    is_valid = any(re.match(pattern, cleaned) for pattern in patterns)
    
    if not is_valid:
        raise ValidationError(
            _('Número telefónico inválido. Formato válido: +57 300 123 4567 o 300 123 4567')
        )


def validate_nit(value):
    """
    Valida formato de NIT colombiano.
    
    Args:
        value: NIT a validar
        
    Raises:
        ValidationError: Si el formato es inválido
    """
    if not value:
        raise ValidationError(_('El NIT es requerido'))
    
    # Limpiar el NIT
    cleaned = re.sub(r'[^\d]', '', str(value))
    
    # Debe tener entre 9 y 10 dígitos
    if len(cleaned) < 9 or len(cleaned) > 10:
        raise ValidationError(
            _('El NIT debe tener entre 9 y 10 dígitos')
        )
    
    return True


def validate_email_domain(value):
    """
    Valida que el email no sea de dominios temporales/desechables.
    
    Args:
        value: Email a validar
        
    Raises:
        ValidationError: Si el dominio no está permitido
    """
    blocked_domains = [
        'tempmail.com',
        'throwaway.email',
        'guerrillamail.com',
        '10minutemail.com',
        'mailinator.com',
    ]
    
    if not value:
        return
    
    domain = value.split('@')[-1].lower()
    
    if domain in blocked_domains:
        raise ValidationError(
            _('No se permiten direcciones de email temporales')
        )


def validate_positive_number(value):
    """
    Valida que el número sea positivo.
    
    Args:
        value: Número a validar
        
    Raises:
        ValidationError: Si el número no es positivo
    """
    if value is not None and value < 0:
        raise ValidationError(_('El valor debe ser positivo'))


def validate_percentage(value):
    """
    Valida que el valor esté entre 0 y 100.
    
    Args:
        value: Valor a validar
        
    Raises:
        ValidationError: Si el valor no está en el rango
    """
    if value is not None and (value < 0 or value > 100):
        raise ValidationError(_('El valor debe estar entre 0 y 100'))