"""
Middleware común para seguridad y logging
"""

import json
import logging
import time
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from jsonschema import ValidationError

User = get_user_model()
logger = logging.getLogger('security')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware que añade headers de seguridad a todas las respuestas
    """
    
    def process_response(self, request, response):
        # Headers de seguridad específicos
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Cache control para datos sensibles
        if hasattr(self, 'sensitive_data') and self.sensitive_data:
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        
        return response


def get_client_ip(request):
    """Obtener IP del cliente de forma segura"""
    if not request:
        return 'unknown'
        
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    return ip


def sanitize_filename(filename):
    """
    Sanitizar nombres de archivo para prevenir ataques de path traversal
    """
    import os
    import re
    
    # Remover caracteres peligrosos
    filename = os.path.basename(filename)  # Remover cualquier path
    filename = re.sub(r'[^\w\-_\.]', '', filename)  # Solo caracteres seguros
    
    # Limitar longitud
    if len(filename) > 100:
        name, ext = os.path.splitext(filename)
        filename = name[:95] + ext
    
    # Prevenir nombres especiales de Windows
    reserved_names = [
        'CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5',
        'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4',
        'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]
    
    name_without_ext = os.path.splitext(filename)[0].upper()
    if name_without_ext in reserved_names:
        filename = f"file_{filename}"
    
    return filename


def generate_secure_filename(original_filename):
    """
    Generar un nombre de archivo seguro y único
    """
    import uuid
    import os
    from datetime import datetime
    
    # Sanitizar nombre original
    clean_name = sanitize_filename(original_filename)
    
    # Obtener extensión
    _, ext = os.path.splitext(clean_name)
    
    # Generar nombre único
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4().hex)[:8]
    
    return f"{timestamp}_{unique_id}{ext}"


def validate_file_content(file):
    """
    Validar contenido de archivo para detectar malware básico
    """
    try:
        # Leer una muestra del archivo
        file.seek(0)
        content = file.read(1024)  # Primeros 1KB
        file.seek(0)
        
        # Patrones sospechosos básicos
        suspicious_patterns = [
            b'<script',
            b'javascript:',
            b'vbscript:',
            b'<?php',
            b'<%',
            b'exec(',
            b'eval(',
            b'system(',
            b'shell_exec(',
        ]
        
        content_lower = content.lower()
        for pattern in suspicious_patterns:
            if pattern in content_lower:
                raise ValidationError(f"Archivo contiene contenido sospechoso")
        
        return True
        
    except Exception as e:
        logger.warning(f"File validation error: {str(e)}")
        raise ValidationError("Error al validar archivo")


def hash_sensitive_data(data):
    """
    Hash de datos sensibles para logging seguro
    """
    import hashlib
    
    if not data:
        return "empty"
    
    return hashlib.sha256(str(data).encode()).hexdigest()[:16]


def mask_sensitive_data(data, mask_char='*'):
    """
    Enmascarar datos sensibles manteniendo algunos caracteres visibles
    """
    if not data or len(data) < 3:
        return mask_char * len(data) if data else ""
    
    if '@' in data:  # Email
        local, domain = data.split('@', 1)
        masked_local = local[:2] + mask_char * (len(local) - 2)
        return f"{masked_local}@{domain}"
    
    # Otros datos - mostrar primeros y últimos caracteres
    visible_chars = min(2, len(data) // 3)
    masked_middle = mask_char * (len(data) - 2 * visible_chars)
    return data[:visible_chars] + masked_middle + data[-visible_chars:]


def check_password_strength(password):
    """
    Verificar fortaleza de contraseña más allá de las validaciones de Django
    """
    import re
    
    issues = []
    
    if len(password) < 12:
        issues.append("Recomendado: usar al menos 12 caracteres")
    
    if not re.search(r'[A-Z]', password):
        issues.append("Falta: al menos una mayúscula")
    
    if not re.search(r'[a-z]', password):
        issues.append("Falta: al menos una minúscula")
    
    if not re.search(r'\d', password):
        issues.append("Falta: al menos un número")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Falta: al menos un carácter especial")
    
    # Patrones comunes
    common_patterns = [
        r'(.)\1{2,}',  # 3+ caracteres repetidos
        r'123|abc|qwe',  # Secuencias comunes
        r'password|admin|user',  # Palabras comunes
    ]
    
    for pattern in common_patterns:
        if re.search(pattern, password.lower()):
            issues.append("Evitar: patrones comunes o repetitivos")
            break
    
    return {
        'is_strong': len(issues) == 0,
        'issues': issues,
        'score': max(0, 100 - len(issues) * 20)
    }


def generate_secure_token(length=32):
    """
    Generar token seguro para diversos usos
    """
    import secrets
    import string
    
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def validate_json_structure(data, required_fields=None, max_depth=5, current_depth=0):
    """
    Validar estructura JSON para prevenir ataques de JSON bombing
    """
    if current_depth > max_depth:
        raise ValidationError("JSON structure too deep")
    
    if isinstance(data, dict):
        if len(data) > 100:  # Limitar número de campos
            raise ValidationError("Too many fields in JSON object")
        
        if required_fields:
            missing_fields = set(required_fields) - set(data.keys())
            if missing_fields:
                raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")
        
        for key, value in data.items():
            if not isinstance(key, str) or len(key) > 100:
                raise ValidationError("Invalid field name")
            
            validate_json_structure(value, max_depth=max_depth, current_depth=current_depth + 1)
    
    elif isinstance(data, list):
        if len(data) > 1000:  # Limitar tamaño de arrays
            raise ValidationError("Array too large")
        
        for item in data:
            validate_json_structure(item, max_depth=max_depth, current_depth=current_depth + 1)
    
    elif isinstance(data, str):
        if len(data) > 10000:  # Limitar tamaño de strings
            raise ValidationError("String too long")
    
    return True


def audit_log(action, user, resource=None, details=None, ip_address=None):
    """
    Crear log de auditoría para acciones importantes
    """
    import json
    from datetime import datetime
    
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'action': action,
        'user_id': user.id if user else None,
        'user_email': mask_sensitive_data(user.email) if user else None,
        'resource': resource,
        'details': details,
        'ip_address': ip_address,
    }
    
    logger.info(f"AUDIT: {json.dumps(log_entry)}")
    
    return log_entry