"""
Servicios para el procesamiento y análisis de estadísticas.
"""
import logging
from datetime import datetime, timedelta, date
from django.utils import timezone
from django.db.models import Count, F, Sum
from django.db import connection, models, DatabaseError
from ..models import Stat, DailySummary
import uuid

logger = logging.getLogger(__name__)

class StatsService:
    """
    Clase de servicio para procesar y analizar estadísticas.
    """
    @staticmethod
    def record_stat(type, name, value=None, user_id=None, session_id=None, ip_address=None):
        """
        Registra un evento estadístico en la base de datos.
        
        Args:
            type (str): Tipo de estadística ('view', 'search', etc.)
            name (str): Nombre del evento
            value (dict, optional): Datos asociados al evento
            user_id (int/uuid, optional): ID del usuario que generó el evento
            session_id (str, optional): ID de sesión
            ip_address (str, optional): Dirección IP
            
        Returns:
            Stat: Objeto estadístico creado
        """
        try:
            if value is None:
                value = {}
            
            # Convertir user_id a string si es un UUID u otro tipo
            if user_id is not None:
                user_id = str(user_id)
                
            # Verificar que la tabla existe antes de intentar escribir
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM stats_stat LIMIT 1")
            except DatabaseError:
                logger.error("La tabla stats_stat no existe. Las migraciones no se han aplicado correctamente.")
                # Guardar en un archivo de respaldo en caso de que la tabla no exista
                StatsService._save_to_backup_log(type, name, value, user_id, session_id, ip_address)
                return None
                
            stat = Stat.objects.create(
                type=type,
                name=name,
                value=value,
                user_id=user_id,
                session_id=session_id,
                ip_address=ip_address
            )
            return stat
        except Exception as e:
            logger.error(f"Error al registrar estadística: {e}")
            # Guardar en un archivo de respaldo en caso de error
            StatsService._save_to_backup_log(type, name, value, user_id, session_id, ip_address)
            return None
    
    @staticmethod
    def _save_to_backup_log(type, name, value, user_id, session_id, ip_address):
        """Guarda la estadística en un archivo de respaldo cuando la BD falla"""
        import json
        from datetime import datetime
        import os
        
        try:
            # Crear directorio de logs si no existe
            log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'logs')
            if not os.path.exists(log_dir):
                os.makedirs(log_dir)
                
            # Crear archivo de backup
            backup_file = os.path.join(log_dir, 'stats_backup.log')
            
            # Preparar datos para el backup
            timestamp = datetime.now().isoformat()
            log_entry = {
                'type': type,
                'name': name,
                'value': value,
                'timestamp': timestamp,
                'user_id': str(user_id) if user_id else None,  # Convertir a string por si es UUID
                'session_id': session_id,
                'ip_address': str(ip_address) if ip_address else None
            }
            
            # Definir JSON encoder personalizado para objetos UUID y datetime
            def json_encoder(obj):
                if isinstance(obj, uuid.UUID):
                    return str(obj)
                if hasattr(obj, 'isoformat'):  # Para objetos datetime
                    return obj.isoformat()
                return str(obj)  # Fallback para otros tipos no serializables
            
            # Escribir en el archivo con encoder personalizado
            with open(backup_file, 'a') as f:
                f.write(json.dumps(log_entry, default=json_encoder) + '\n')
                
            logger.info(f"Estadística guardada en archivo de respaldo: {backup_file}")
        except Exception as e:
            logger.error(f"Error al guardar en archivo de respaldo: {e}")
    
    @staticmethod
    def get_daily_summary(target_date=None):
        """
        Obtiene o crea el resumen diario para una fecha específica.
        
        Args:
            target_date (date, optional): Fecha objetivo. Por defecto, hoy.
            
        Returns:
            DailySummary: Objeto de resumen diario
        """
        try:
            if target_date is None:
                target_date = timezone.now().date()
            elif isinstance(target_date, datetime):
                target_date = target_date.date()
                
            summary, created = DailySummary.objects.get_or_create(date=target_date)
            return summary
        except Exception as e:
            logger.error(f"Error al obtener resumen diario: {e}")
            # Crear un objeto vacío en memoria (no persistente)
            class EmptySummary:
                def __init__(self):
                    self.metrics = {}
                    self.date = target_date
                def refresh_from_db(self):
                    pass
            return EmptySummary()
    
    @staticmethod
    def calculate_daily_metrics(target_date=None):
        """
        Calcula métricas para un día específico y actualiza el resumen diario.
        
        Args:
            target_date (date, optional): Fecha objetivo. Por defecto, hoy.
            
        Returns:
            dict: Métricas calculadas
        """
        if target_date is None:
            target_date = timezone.now().date()
        elif isinstance(target_date, datetime):
            target_date = target_date.date()
            
        # Obtener estadísticas del día
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        day_stats = Stat.objects.filter(
            timestamp__gte=start_datetime,
            timestamp__lte=end_datetime
        )
        
        # Calcular métricas
        metrics = {
            'total_events': day_stats.count(),
            'events_by_type': {},
            'unique_users': day_stats.values('user_id').exclude(user_id__isnull=True).distinct().count(),
            'unique_sessions': day_stats.values('session_id').exclude(session_id__isnull=True).distinct().count(),
            'top_events': list(day_stats.values('name').annotate(
                count=Count('id')).order_by('-count')[:10])
        }
        
        # Eventos por tipo
        for stat_type, _ in Stat.STAT_TYPES:
            type_count = day_stats.filter(type=stat_type).count()
            metrics['events_by_type'][stat_type] = type_count
            
        # Guardar en el resumen diario
        summary = StatsService.get_daily_summary(target_date)
        summary.metrics = metrics
        summary.save()
        
        return metrics
    
    @staticmethod
    def get_stats_over_time(start_date=None, end_date=None, interval='day', stat_type=None):
        """
        Obtiene estadísticas agregadas a lo largo del tiempo.
        
        Args:
            start_date (date, optional): Fecha de inicio
            end_date (date, optional): Fecha de fin
            interval (str): Intervalo de tiempo ('day', 'week', 'month')
            stat_type (str, optional): Filtrar por tipo de estadística
            
        Returns:
            list: Datos agregados por intervalo de tiempo
        """
        if end_date is None:
            end_date = timezone.now().date()
        if start_date is None:
            start_date = end_date - timedelta(days=30)
            
        # Formato para truncar fecha según el intervalo
        trunc_format = {
            'day': 'day',
            'week': 'week',
            'month': 'month'
        }.get(interval, 'day')
        
        query = Stat.objects.all()
        
        # Filtrar por fechas y tipo si es necesario
        query = query.filter(timestamp__date__gte=start_date, timestamp__date__lte=end_date)
        if stat_type:
            query = query.filter(type=stat_type)
            
        # Agregar por intervalo de tiempo
        result = []
        
        if connection.vendor == 'postgresql':
            # Para PostgreSQL usamos date_trunc
            from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
            
            trunc_class = {
                'day': TruncDay,
                'week': TruncWeek,
                'month': TruncMonth
            }.get(interval, TruncDay)
            
            aggregated = query.annotate(
                period=trunc_class('timestamp')
            ).values('period').annotate(
                count=Count('id')
            ).order_by('period')
            
            result = list(aggregated)
        else:
            # Para otros motores hacemos agrupación manual
            # Esta implementación es simplificada y podría necesitar ajustes
            # según el motor de BD específico
            if interval == 'day':
                # Agrupación por día
                for day_offset in range((end_date - start_date).days + 1):
                    current_date = start_date + timedelta(days=day_offset)
                    count = query.filter(
                        timestamp__date=current_date
                    ).count()
                    result.append({
                        'period': datetime.combine(current_date, datetime.min.time()),
                        'count': count
                    })
            elif interval == 'week':
                # Implementar agrupación por semana
                pass
            elif interval == 'month':
                # Implementar agrupación por mes
                pass
                
        return result
    
    @staticmethod
    def get_user_activity(user_id, days=30):
        """
        Obtiene la actividad reciente de un usuario.
        
        Args:
            user_id (int/str): ID del usuario (puede ser UUID en forma de string)
            days (int): Número de días a considerar
            
        Returns:
            dict: Actividad del usuario
        """
        start_date = timezone.now() - timedelta(days=days)
        
        # Asegurar que user_id sea string
        user_id = str(user_id)
        
        stats = Stat.objects.filter(
            user_id=user_id,
            timestamp__gte=start_date
        ).order_by('-timestamp')
        
        activity = {
            'total_events': stats.count(),
            'events_by_type': {},
            'recent_events': list(stats.values('name', 'type', 'timestamp', 'value')[:20]),
            'first_activity': stats.order_by('timestamp').first(),
            'last_activity': stats.first()
        }
        
        # Eventos por tipo
        for stat_type, _ in Stat.STAT_TYPES:
            type_count = stats.filter(type=stat_type).count()
            activity['events_by_type'][stat_type] = type_count
            
        return activity
