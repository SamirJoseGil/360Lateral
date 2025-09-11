from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible
from pathlib import Path
import re


@deconstructible
class SecureFileValidator:
    """
    Validador completo para archivos subidos que verifica:
    - Extensión permitida
    - Tipo MIME real
    - Tamaño máximo
    - Nombre de archivo seguro
    """
    
    def __init__(self, 
                 allowed_extensions=None, 
                 max_size=10*1024*1024,  # 10MB default
                 allowed_mimes=None):
        
        self.allowed_extensions = allowed_extensions or [
            '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'
        ]
        self.max_size = max_size
        self.allowed_mimes = allowed_mimes or {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.txt': 'text/plain'
        }
    
    def __call__(self, file):
        self.validate_filename(file.name)
        self.validate_extension(file.name)
        self.validate_size(file)
        self.validate_mime_type(file)
        
    def validate_filename(self, filename):
        """Validar que el nombre de archivo sea seguro"""
        # Caracteres peligrosos
        dangerous_chars = ['..', '/', '\\', '<', '>', '|', ':', '*', '?', '"']
        
        for char in dangerous_chars:
            if char in filename:
                raise ValidationError(f"Nombre de archivo contiene caracteres no permitidos: {char}")
        
        # Verificar longitud
        if len(filename) > 255:
            raise ValidationError("Nombre de archivo muy largo (máximo 255 caracteres)")
            
        # Verificar que no sea solo espacios o puntos
        if not filename.strip(' .'):
            raise ValidationError("Nombre de archivo inválido")
    
    def validate_extension(self, filename):
        """Validar extensión del archivo"""
        ext = Path(filename).suffix.lower()
        if ext not in self.allowed_extensions:
            allowed = ', '.join(self.allowed_extensions)
            raise ValidationError(f"Extensión {ext} no permitida. Extensiones permitidas: {allowed}")
    
    def validate_size(self, file):
        """Validar tamaño del archivo"""
        if file.size > self.max_size:
            max_size_mb = self.max_size / (1024 * 1024)
            raise ValidationError(f"Archivo muy grande. Tamaño máximo: {max_size_mb:.1f}MB")
    
    def validate_mime_type(self, file):
        """Validar tipo MIME real del archivo"""
        try:
            # Leer una pequeña muestra para verificar el tipo MIME
            file.seek(0)
            sample = file.read(1024)
            file.seek(0)
            
            if len(sample) == 0:
                raise ValidationError("Archivo vacío")
            
            # Verificar tipo MIME usando python-magic si está disponible
            try:
                import magic # type: ignore
                mime_type = magic.from_buffer(sample, mime=True)
                ext = Path(file.name).suffix.lower()
                
                expected_mime = self.allowed_mimes.get(ext)
                if expected_mime and mime_type != expected_mime:
                    # Algunas excepciones comunes
                    exceptions = {
                        'text/plain': ['application/octet-stream'],
                        'image/jpeg': ['image/jpg']
                    }
                    
                    if expected_mime not in exceptions or mime_type not in exceptions[expected_mime]:
                        raise ValidationError(
                            f"Tipo de archivo no coincide con extensión. "
                            f"Esperado: {expected_mime}, Encontrado: {mime_type}"
                        )
                        
            except ImportError:
                # Si python-magic no está disponible, hacer validaciones básicas
                self._basic_mime_validation(sample, file.name)
                
        except Exception as e:
            raise ValidationError(f"Error al validar archivo: {str(e)}")
    
    def _basic_mime_validation(self, sample, filename):
        """Validación básica de tipo MIME sin python-magic"""
        ext = Path(filename).suffix.lower()
        
        # Signatures básicas de archivos
        signatures = {
            '.pdf': [b'%PDF'],
            '.jpg': [b'\xff\xd8\xff'],
            '.jpeg': [b'\xff\xd8\xff'],
            '.png': [b'\x89PNG\r\n\x1a\n'],
            '.doc': [b'\xd0\xcf\x11\xe0'],
            '.docx': [b'PK\x03\x04']
        }
        
        expected_signatures = signatures.get(ext, [])
        if expected_signatures:
            valid = any(sample.startswith(sig) for sig in expected_signatures)
            if not valid:
                raise ValidationError(f"El contenido del archivo no coincide con la extensión {ext}")


def validate_no_script_injection(value):
    """Validar que el texto no contenga scripts maliciosos"""
    if not isinstance(value, str):
        return value
        
    # Patrones peligrosos básicos
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'onclick\s*=',
        r'<iframe',
        r'<object',
        r'<embed'
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, value, re.IGNORECASE | re.DOTALL):
            raise ValidationError("Contenido contiene código potencialmente peligroso")
    
    return value


def validate_safe_html(value):
    """Validar y limpiar HTML básico permitiendo solo tags seguros"""
    if not isinstance(value, str):
        return value
    
    # Lista de tags HTML permitidos (básicos y seguros)
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
    
    # Verificar que no haya tags no permitidos
    tag_pattern = r'<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>'
    found_tags = re.findall(tag_pattern, value, re.IGNORECASE)
    
    for tag in found_tags:
        if tag.lower() not in allowed_tags:
            raise ValidationError(f"Tag HTML no permitido: <{tag}>")
    
    return value


def validate_phone_number(value):
    """Validar formato de número telefónico"""
    if not value:
        return value
    
    # Patrón para números telefónicos (formato flexible)
    phone_pattern = r'^\+?[\d\s\-\(\)]{7,15}$'
    
    if not re.match(phone_pattern, value):
        raise ValidationError(
            "Formato de teléfono inválido. "
            "Use formato: +57 123 456 7890 o similar"
        )
    
    return value


def validate_strong_password(password):
    """Validar que la contraseña sea fuerte"""
    if len(password) < 8:
        raise ValidationError("La contraseña debe tener al menos 8 caracteres")
    
    if not re.search(r'[A-Z]', password):
        raise ValidationError("La contraseña debe contener al menos una mayúscula")
    
    if not re.search(r'[a-z]', password):
        raise ValidationError("La contraseña debe contener al menos una minúscula")
    
    if not re.search(r'\d', password):
        raise ValidationError("La contraseña debe contener al menos un número")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("La contraseña debe contener al menos un carácter especial")
    
    # Verificar patrones comunes débiles
    weak_patterns = [
        r'123456',
        r'password',
        r'qwerty',
        r'abc123',
        r'admin'
    ]
    
    for pattern in weak_patterns:
        if re.search(pattern, password.lower()):
            raise ValidationError("La contraseña contiene patrones comunes inseguros")
    
    return password