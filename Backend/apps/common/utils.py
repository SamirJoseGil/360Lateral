"""
Utilidades comunes para toda la aplicación
"""
import logging
import re
from typing import Any, Dict, Optional
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def get_client_ip(request) -> str:
    """
    Obtiene la dirección IP del cliente de forma segura.
    Considera proxies y load balancers.
    
    Args:
        request: Django request object
        
    Returns:
        str: Dirección IP del cliente
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Tomar la primera IP de la lista
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    return ip


def audit_log(
    action: str,
    user: Any,
    details: Optional[Dict] = None,
    ip_address: Optional[str] = None
) -> None:
    """
    Registra una acción de auditoría en los logs.
    
    Args:
        action: Tipo de acción (e.g., 'USER_LOGIN', 'USER_CREATED')
        user: Usuario que realizó la acción
        details: Detalles adicionales de la acción
        ip_address: Dirección IP del cliente
    """
    try:
        user_email = getattr(user, 'email', 'anonymous')
        user_id = getattr(user, 'id', 'unknown')
        
        log_message = f"AUDIT: {action} | User: {user_email} ({user_id})"
        
        if ip_address:
            log_message += f" | IP: {ip_address}"
        
        if details:
            log_message += f" | Details: {details}"
        
        logger.info(log_message)
    except Exception as e:
        logger.error(f"Error in audit_log: {str(e)}")


def custom_exception_handler(exc, context):
    """
    Handler personalizado para excepciones de DRF.
    Retorna respuestas en formato consistente.
    
    Args:
        exc: Excepción que ocurrió
        context: Contexto de la vista
        
    Returns:
        Response: Respuesta con formato estándar
    """
    # Llamar al handler por defecto de DRF primero
    response = exception_handler(exc, context)
    
    if response is not None:
        # Personalizar el formato de respuesta
        custom_response_data = {
            'success': False,
            'message': 'Error en la solicitud',
            'errors': {}
        }
        
        # Extraer el mensaje de error
        if isinstance(response.data, dict):
            # Si hay un campo 'detail', usarlo como mensaje principal
            if 'detail' in response.data:
                custom_response_data['message'] = str(response.data['detail'])
                custom_response_data['errors'] = {
                    'detail': str(response.data['detail'])
                }
            else:
                # Usar todos los errores
                custom_response_data['errors'] = response.data
                
                # Intentar obtener el primer mensaje de error
                for field, messages in response.data.items():
                    if isinstance(messages, list) and messages:
                        custom_response_data['message'] = f"{field}: {messages[0]}"
                        break
                    elif isinstance(messages, str):
                        custom_response_data['message'] = f"{field}: {messages}"
                        break
        else:
            custom_response_data['message'] = str(response.data)
            custom_response_data['errors'] = {'detail': str(response.data)}
        
        response.data = custom_response_data
    
    # Loggear la excepción
    logger.error(
        f"Exception in {context.get('view', 'unknown')}: "
        f"{exc.__class__.__name__}: {str(exc)}"
    )
    
    return response


def format_success_response(
    data: Any = None,
    message: str = "Operación exitosa",
    status_code: int = status.HTTP_200_OK
) -> Response:
    """
    Formatea una respuesta exitosa en formato estándar.
    
    Args:
        data: Datos a retornar
        message: Mensaje descriptivo
        status_code: Código de estado HTTP
        
    Returns:
        Response: Respuesta formateada
    """
    response_data = {
        'success': True,
        'message': message,
    }
    
    if data is not None:
        response_data['data'] = data
    
    return Response(response_data, status=status_code)


def format_error_response(
    errors: Dict = None,
    message: str = "Error en la solicitud",
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Formatea una respuesta de error en formato estándar.
    
    Args:
        errors: Diccionario de errores
        message: Mensaje descriptivo
        status_code: Código de estado HTTP
        
    Returns:
        Response: Respuesta formateada
    """
    response_data = {
        'success': False,
        'message': message,
    }
    
    if errors:
        response_data['errors'] = errors
    
    return Response(response_data, status=status_code)


def validate_required_fields(data: Dict, required_fields: list) -> Dict:
    """
    Valida que todos los campos requeridos estén presentes.
    
    Args:
        data: Diccionario con los datos
        required_fields: Lista de campos requeridos
        
    Returns:
        Dict: Diccionario de errores (vacío si no hay errores)
    """
    errors = {}
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors[field] = f"El campo {field} es requerido"
    
    return errors


def sanitize_filename(filename: str) -> str:
    """
    Sanitiza un nombre de archivo para prevenir problemas de seguridad.
    
    Args:
        filename: Nombre del archivo original
        
    Returns:
        str: Nombre sanitizado
    """
    import unicodedata
    
    # Normalizar unicode
    filename = unicodedata.normalize('NFKD', filename)
    filename = filename.encode('ascii', 'ignore').decode('ascii')
    
    # Remover caracteres no permitidos
    filename = re.sub(r'[^\w\s.-]', '', filename).strip()
    
    # Reemplazar espacios múltiples
    filename = re.sub(r'\s+', '_', filename)
    
    return filename


def calculate_file_hash(file_obj) -> str:
    """
    Calcula el hash SHA256 de un archivo.
    
    Args:
        file_obj: Objeto archivo de Django
        
    Returns:
        str: Hash SHA256 del archivo
    """
    import hashlib
    
    sha256_hash = hashlib.sha256()
    
    # Leer el archivo en chunks
    for chunk in file_obj.chunks():
        sha256_hash.update(chunk)
    
    return sha256_hash.hexdigest()


def paginate_queryset(queryset, request, page_size=20):
    """
    Pagina un queryset según los parámetros de la request.
    
    Args:
        queryset: QuerySet a paginar
        request: Request object
        page_size: Tamaño de página por defecto
        
    Returns:
        tuple: (page_data, pagination_info)
    """
    from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
    
    page = request.GET.get('page', 1)
    size = int(request.GET.get('page_size', page_size))
    
    paginator = Paginator(queryset, size)
    
    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)
    
    pagination_info = {
        'count': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    }
    
    return page_obj.object_list, pagination_info