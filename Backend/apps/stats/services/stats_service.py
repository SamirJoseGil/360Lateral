"""
Servicio para estadísticas de la aplicación
"""
import logging
from typing import Dict, List, Any
from django.db.models import Count, Q, Sum, Avg, F, ExpressionWrapper, FloatField
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)

class StatsService:
    """
    Servicio para recopilar estadísticas de la aplicación
    """
    
    def __init__(self):
        # Importaciones tardías para evitar problemas circulares
        from apps.users.models import User
        from apps.lotes.models import Lote
        from apps.documents.models import Documento
        
        self.User = User
        self.Lote = Lote
        self.Documento = Documento
    
    def get_general_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas generales de la aplicación
        """
        try:
            # Estadísticas de usuarios
            users_count = self.User.objects.count()
            active_users = self.User.objects.filter(is_active=True).count()
            staff_users = self.User.objects.filter(is_staff=True).count()
            
            # Estadísticas de lotes
            lotes_count = self.Lote.objects.count()
            
            # Estadísticas de documentos
            docs_count = self.Documento.objects.count()
            
            # Calcular porcentajes y proporciones
            user_activation_rate = (active_users / users_count * 100) if users_count > 0 else 0
            
            # Devolver resultados
            return {
                "success": True,
                "stats": {
                    "users": {
                        "total": users_count,
                        "active": active_users,
                        "staff": staff_users,
                        "activation_rate": round(user_activation_rate, 2)
                    },
                    "lotes": {
                        "total": lotes_count
                    },
                    "documents": {
                        "total": docs_count
                    },
                    "timestamp": timezone.now().isoformat()
                }
            }
        
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas generales: {e}")
            return {
                "success": False,
                "error": f"Error al obtener estadísticas: {str(e)}"
            }
    
    def get_user_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas detalladas de usuarios
        """
        try:
            # Total de usuarios por rol
            users_by_role = list(self.User.objects.values('role')
                                .annotate(count=Count('id'))
                                .order_by('-count'))
            
            # Usuarios registrados por mes (últimos 6 meses)
            six_months_ago = timezone.now() - timedelta(days=180)
            users_by_month = list(self.User.objects.filter(date_joined__gte=six_months_ago)
                                .annotate(month=TruncMonth('date_joined'))
                                .values('month')
                                .annotate(count=Count('id'))
                                .order_by('month'))
            
            # Tasa de actividad (últimos 30 días)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recently_active = self.User.objects.filter(
                last_login__gte=thirty_days_ago
            ).count()
            active_rate = (recently_active / self.User.objects.count() * 100) if self.User.objects.count() > 0 else 0
            
            return {
                "success": True,
                "stats": {
                    "by_role": users_by_role,
                    "by_month": [
                        {
                            "month": item["month"].strftime("%Y-%m"),
                            "count": item["count"]
                        }
                        for item in users_by_month
                    ],
                    "activity": {
                        "active_last_30_days": recently_active,
                        "active_rate": round(active_rate, 2),
                    },
                    "timestamp": timezone.now().isoformat()
                }
            }
        
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de usuarios: {e}")
            return {
                "success": False,
                "error": f"Error al obtener estadísticas de usuarios: {str(e)}"
            }
    
    def get_document_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas detalladas de documentos
        """
        try:
            # Total de documentos por estado
            docs_by_status = list(self.Documento.objects.values('status')
                                 .annotate(count=Count('id'))
                                 .order_by('-count'))
            
            # Documentos por tipo
            docs_by_type = list(self.Documento.objects.values('tipo')
                               .annotate(count=Count('id'))
                               .order_by('-count'))
            
            # Documentos subidos por mes (últimos 6 meses)
            six_months_ago = timezone.now() - timedelta(days=180)
            docs_by_month = list(self.Documento.objects.filter(fecha_subida__gte=six_months_ago)
                                .annotate(month=TruncMonth('fecha_subida'))
                                .values('month')
                                .annotate(count=Count('id'))
                                .order_by('month'))
            
            # Tiempo promedio de aprobación (en días)
            from django.db.models import F, ExpressionWrapper, fields
            
            # Asumiendo que hay campos fecha_subida y fecha_aprobacion
            avg_approval_time = self.Documento.objects.filter(
                status='approved',
                fecha_aprobacion__isnull=False
            ).annotate(
                dias_aprobacion=ExpressionWrapper(
                    F('fecha_aprobacion') - F('fecha_subida'),
                    output_field=fields.DurationField()
                )
            ).aggregate(
                avg_days=Avg(F('dias_aprobacion'))
            )
            
            avg_days = 0
            if avg_approval_time['avg_days']:
                avg_days = avg_approval_time['avg_days'].total_seconds() / (3600 * 24)
            
            return {
                "success": True,
                "stats": {
                    "by_status": docs_by_status,
                    "by_type": docs_by_type,
                    "by_month": [
                        {
                            "month": item["month"].strftime("%Y-%m"),
                            "count": item["count"]
                        }
                        for item in docs_by_month
                    ],
                    "approval_time": {
                        "avg_days": round(avg_days, 2)
                    },
                    "timestamp": timezone.now().isoformat()
                }
            }
        
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de documentos: {e}")
            return {
                "success": False,
                "error": f"Error al obtener estadísticas de documentos: {str(e)}"
            }
    
    def get_lotes_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas detalladas de lotes
        """
        try:
            # Total de lotes por estado
            lotes_by_status = list(self.Lote.objects.values('status')
                                  .annotate(count=Count('id'))
                                  .order_by('-count'))
            
            # Distribución por estrato
            lotes_by_estrato = list(self.Lote.objects.exclude(estrato__isnull=True)
                                   .values('estrato')
                                   .annotate(count=Count('id'))
                                   .order_by('estrato'))
            
            # Lotes por zona/comuna
            lotes_by_zona = list(self.Lote.objects.exclude(barrio__isnull=True)
                               .values('barrio')
                               .annotate(count=Count('id'))
                               .order_by('-count')[:10])  # Top 10 barrios
            
            # Área promedio de lotes
            avg_area = self.Lote.objects.aggregate(avg_area=Avg('area'))['avg_area'] or 0
            
            return {
                "success": True,
                "stats": {
                    "by_status": lotes_by_status,
                    "by_estrato": lotes_by_estrato,
                    "by_zona": lotes_by_zona,
                    "area": {
                        "avg_area": round(avg_area, 2),
                        "unit": "m²"
                    },
                    "timestamp": timezone.now().isoformat()
                }
            }
        
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas de lotes: {e}")
            return {
                "success": False,
                "error": f"Error al obtener estadísticas de lotes: {str(e)}"
            }
