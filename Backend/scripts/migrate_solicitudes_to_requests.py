"""
Migra datos de Solicitud a UserRequest
"""
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.solicitudes.models import Solicitud
from apps.users.models import UserRequest

def migrate():
    """Migrar solicitudes a UserRequest"""
    print("🔄 Migrando solicitudes...")
    
    solicitudes = Solicitud.objects.all()
    migrated = 0
    
    for sol in solicitudes:
        try:
            # Verificar si ya existe
            if UserRequest.objects.filter(
                user=sol.usuario,
                title=sol.titulo,
                created_at=sol.created_at
            ).exists():
                print(f"  ⚠️  Ya existe: {sol.titulo}")
                continue
            
            # Mapear tipo
            tipo_map = {
                'soporte_tecnico': 'soporte_tecnico',
                'analisis_urbanistico': 'analisis_urbanistico',
                'consulta_general': 'consulta_general',
                'validacion_documentos': 'validacion_documentos',
                'correccion_datos': 'correccion_datos',
                'acceso': 'access',
                'funcionalidad': 'feature',
                'otro': 'other'
            }
            
            # Mapear estado
            estado_map = {
                'pendiente': 'pending',
                'en_revision': 'in_review',
                'aprobado': 'approved',
                'rechazado': 'rejected',
                'completado': 'completed'
            }
            
            # Mapear prioridad
            prioridad_map = {
                'baja': 'low',
                'normal': 'normal',
                'alta': 'high',
                'urgente': 'urgent'
            }
            
            # Crear UserRequest
            user_request = UserRequest.objects.create(
                user=sol.usuario,
                lote=sol.lote,
                request_type=tipo_map.get(sol.tipo, 'other'),
                title=sol.titulo,
                description=sol.descripcion,
                status=estado_map.get(sol.estado, 'pending'),
                priority=prioridad_map.get(sol.prioridad, 'normal'),
                reviewer=sol.revisor,
                review_notes=sol.notas_revision,
                resolved_at=sol.resuelta_at,
                metadata=sol.metadatos
            )
            
            # Preservar fechas
            user_request.created_at = sol.created_at
            user_request.updated_at = sol.updated_at
            user_request.save(update_fields=['created_at', 'updated_at'])
            
            migrated += 1
            print(f"  ✅ Migrada: {sol.titulo}")
            
        except Exception as e:
            print(f"  ❌ Error migrando {sol.titulo}: {e}")
    
    print(f"\n✅ Migración completada: {migrated} solicitudes")

if __name__ == "__main__":
    migrate()
