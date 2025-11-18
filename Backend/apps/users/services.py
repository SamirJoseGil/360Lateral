"""
Servicios para el módulo de usuarios
Contiene lógica de negocio para gestión de solicitudes de usuario
"""
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
import logging

from .models import UserRequest

logger = logging.getLogger(__name__)


class RequestStatusService:
    """
    Servicio para gestionar y recuperar estados de solicitudes de usuario.
    Proporciona métodos para consultar, filtrar y obtener estadísticas de solicitudes.
    """
    
    @staticmethod
    def get_user_requests(user, request_type=None, status=None):
        """
        Obtiene todas las solicitudes de un usuario con filtros opcionales.
        
        Args:
            user: Objeto User o ID de usuario
            request_type: Tipo de solicitud opcional para filtrar
            status: Estado opcional para filtrar
            
        Returns:
            QuerySet: QuerySet de objetos UserRequest
            
        Example:
            >>> requests = RequestStatusService.get_user_requests(
            ...     user=user,
            ...     request_type='support',
            ...     status='pending'
            ... )
        """
        try:
            # Obtener ID del usuario
            user_id = user.id if hasattr(user, 'id') else user
            
            # Query base
            queryset = UserRequest.objects.filter(user_id=user_id)
            
            # Aplicar filtros si se proporcionan
            if request_type:
                queryset = queryset.filter(request_type=request_type)
                logger.debug(f"Filtering by request_type: {request_type}")
            
            if status:
                queryset = queryset.filter(status=status)
                logger.debug(f"Filtering by status: {status}")
            
            # Ordenar por más reciente primero
            queryset = queryset.order_by('-created_at')
            
            logger.info(f"Retrieved {queryset.count()} requests for user {user_id}")
            return queryset
            
        except Exception as e:
            logger.error(f"Error getting user requests: {str(e)}", exc_info=True)
            return UserRequest.objects.none()
    
    @staticmethod
    def get_request_details(request_id, user=None):
        """
        Obtiene información detallada de una solicitud específica.
        Si se proporciona un usuario, verifica que le pertenezca.
        
        Args:
            request_id: ID de la solicitud
            user: Objeto User opcional para verificar propiedad
            
        Returns:
            UserRequest: Objeto UserRequest o None si no se encuentra
            
        Raises:
            PermissionError: Si el usuario no es propietario de la solicitud
        """
        try:
            if user:
                request = UserRequest.objects.get(id=request_id, user=user)
                logger.info(f"Request {request_id} retrieved for user {user.id}")
            else:
                request = UserRequest.objects.get(id=request_id)
                logger.info(f"Request {request_id} retrieved")
            
            return request
            
        except UserRequest.DoesNotExist:
            logger.warning(f"Request {request_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error getting request details: {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def get_request_status_summary(user):
        """
        Obtiene un resumen de estados de solicitudes para un usuario.
        
        Args:
            user: Objeto User o ID de usuario
            
        Returns:
            dict: Diccionario con conteos por estado y tipo
            {
                'total': int,
                'pending': int,
                'in_review': int,
                'approved': int,
                'rejected': int,
                'completed': int,
                'by_type': {
                    'access': int,
                    'feature': int,
                    ...
                }
            }
        """
        try:
            user_id = user.id if hasattr(user, 'id') else user
            
            # Obtener todas las solicitudes del usuario
            requests = UserRequest.objects.filter(user_id=user_id)
            
            # Contar por estado
            status_counts = requests.values('status').annotate(count=Count('id'))
            status_dict = {item['status']: item['count'] for item in status_counts}
            
            # Contar por tipo
            type_counts = requests.values('request_type').annotate(count=Count('id'))
            by_type = {item['request_type']: item['count'] for item in type_counts}
            
            summary = {
                'total': requests.count(),
                'pending': status_dict.get('pending', 0),
                'in_review': status_dict.get('in_review', 0),
                'approved': status_dict.get('approved', 0),
                'rejected': status_dict.get('rejected', 0),
                'completed': status_dict.get('completed', 0),
                'by_type': by_type
            }
            
            logger.info(f"Generated status summary for user {user_id}: {summary['total']} total requests")
            return summary
            
        except Exception as e:
            logger.error(f"Error generating status summary: {str(e)}", exc_info=True)
            return {
                'total': 0,
                'pending': 0,
                'in_review': 0,
                'approved': 0,
                'rejected': 0,
                'completed': 0,
                'by_type': {}
            }
    
    @staticmethod
    def get_recent_status_updates(user, days=30, limit=10):
        """
        Obtiene actualizaciones recientes de solicitudes de un usuario.
        
        Args:
            user: Objeto User o ID de usuario
            days: Número de días hacia atrás para buscar (default: 30)
            limit: Número máximo de actualizaciones a retornar (default: 10)
            
        Returns:
            QuerySet: QuerySet de objetos UserRequest actualizados recientemente
        """
        try:
            user_id = user.id if hasattr(user, 'id') else user
            
            # Calcular fecha de inicio
            start_date = timezone.now() - timedelta(days=days)
            
            # Obtener solicitudes actualizadas recientemente
            recent_updates = UserRequest.objects.filter(
                user_id=user_id,
                updated_at__gte=start_date
            ).order_by('-updated_at')[:limit]
            
            logger.info(
                f"Retrieved {recent_updates.count()} recent updates "
                f"for user {user_id} (last {days} days)"
            )
            
            return recent_updates
            
        except Exception as e:
            logger.error(f"Error getting recent updates: {str(e)}", exc_info=True)
            return UserRequest.objects.none()
    
    @staticmethod
    def update_request_status(request_id, new_status, reviewer=None, review_notes=None):
        """
        Actualiza el estado de una solicitud.
        
        Args:
            request_id: ID de la solicitud
            new_status: Nuevo estado a aplicar
            reviewer: Usuario que realiza la revisión (opcional)
            review_notes: Notas de la revisión (opcional)
            
        Returns:
            tuple: (success: bool, message: str, request: UserRequest)
        """
        try:
            request = UserRequest.objects.get(id=request_id)
            old_status = request.status
            
            # Actualizar estado
            request.status = new_status
            
            if reviewer:
                request.reviewer = reviewer
            
            if review_notes:
                request.review_notes = review_notes
            
            request.save()
            
            logger.info(
                f"Request {request_id} status updated: "
                f"{old_status} -> {new_status} by {reviewer}"
            )
            
            return (
                True,
                f"Estado actualizado de {old_status} a {new_status}",
                request
            )
            
        except UserRequest.DoesNotExist:
            logger.error(f"Request {request_id} not found")
            return (False, "Solicitud no encontrada", None)
        except Exception as e:
            logger.error(f"Error updating request status: {str(e)}", exc_info=True)
            return (False, f"Error al actualizar: {str(e)}", None)
    
    @staticmethod
    def get_pending_requests_count(user):
        """
        Obtiene el conteo de solicitudes pendientes de un usuario.
        
        Args:
            user: Objeto User o ID de usuario
            
        Returns:
            int: Número de solicitudes pendientes
        """
        try:
            user_id = user.id if hasattr(user, 'id') else user
            
            count = UserRequest.objects.filter(
                user_id=user_id,
                status='pending'
            ).count()
            
            logger.debug(f"User {user_id} has {count} pending requests")
            return count
            
        except Exception as e:
            logger.error(f"Error counting pending requests: {str(e)}", exc_info=True)
            return 0
    
    @staticmethod
    def get_requests_by_date_range(user, start_date, end_date):
        """
        Obtiene solicitudes de un usuario en un rango de fechas.
        
        Args:
            user: Objeto User o ID de usuario
            start_date: Fecha de inicio
            end_date: Fecha de fin
            
        Returns:
            QuerySet: QuerySet de objetos UserRequest
        """
        try:
            user_id = user.id if hasattr(user, 'id') else user
            
            requests = UserRequest.objects.filter(
                user_id=user_id,
                created_at__gte=start_date,
                created_at__lte=end_date
            ).order_by('-created_at')
            
            logger.info(
                f"Retrieved {requests.count()} requests for user {user_id} "
                f"between {start_date} and {end_date}"
            )
            
            return requests
            
        except Exception as e:
            logger.error(f"Error getting requests by date range: {str(e)}", exc_info=True)
            return UserRequest.objects.none()


class PasswordResetService:
    """
    Servicio para gestionar recuperación de contraseñas.
    ⚠️ TEMPORAL: Sin envío de emails (SMTP no configurado)
    """
    
    @staticmethod
    def generate_reset_token(user):
        """
        Genera un token de recuperación para un usuario.
        
        Args:
            user: Objeto User
            
        Returns:
            PasswordResetToken: Token generado
        """
        from .models import PasswordResetToken
        from django.utils import timezone
        from datetime import timedelta
        import secrets
        
        # Generar token seguro
        token_string = secrets.token_urlsafe(32)
        
        # Calcular expiración (1 hora desde ahora)
        expires_at = timezone.now() + timedelta(hours=1)
        
        # Crear token
        token = PasswordResetToken.objects.create(
            user=user,
            token=token_string,
            expires_at=expires_at
        )
        
        logger.info(f"Password reset token generated for {user.email}: {token_string}")
        
        # ⚠️ TEMPORAL: Imprimir token en consola (eliminar en producción)
        print("\n" + "="*80)
        print("🔐 PASSWORD RESET TOKEN GENERADO")
        print("="*80)
        print(f"Usuario: {user.email}")
        print(f"Token: {token_string}")
        print(f"Expira: {expires_at}")
        print(f"URL: http://localhost:3000/reset-password?token={token_string}")
        print("="*80 + "\n")
        
        return token
    
    @staticmethod
    def reset_password(token_string, new_password):
        """
        Resetea la contraseña de un usuario usando un token.
        
        Args:
            token_string: Token de recuperación
            new_password: Nueva contraseña
            
        Returns:
            tuple: (success: bool, message: str, user: User or None)
        """
        from .models import PasswordResetToken
        
        try:
            # Obtener token
            token = PasswordResetToken.objects.get(token=token_string)
            
            # Verificar validez
            if not token.is_valid():
                if token.is_used:
                    return (False, "Este token ya ha sido utilizado", None)
                else:
                    return (False, "Este token ha expirado", None)
            
            # Cambiar contraseña
            user = token.user
            user.set_password(new_password)
            user.save()
            
            # Marcar token como usado
            token.mark_as_used()
            
            logger.info(f"Password reset successful for {user.email}")
            
            return (True, "Contraseña actualizada correctamente", user)
            
        except PasswordResetToken.DoesNotExist:
            logger.warning(f"Invalid password reset token attempted: {token_string}")
            return (False, "Token inválido", None)
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}", exc_info=True)
            return (False, f"Error al resetear contraseña: {str(e)}", None)
    
    @staticmethod
    def invalidate_user_tokens(user):
        """
        Invalida todos los tokens de recuperación de un usuario.
        Útil cuando el usuario cambia su contraseña exitosamente.
        
        Args:
            user: Objeto User
        """
        from .models import PasswordResetToken
        
        tokens = PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        )
        
        count = tokens.update(is_used=True)
        logger.info(f"Invalidated {count} password reset tokens for {user.email}")