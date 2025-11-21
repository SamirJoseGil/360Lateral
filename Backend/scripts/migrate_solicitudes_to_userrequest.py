"""
Script para migrar datos de Solicitud a UserRequest
"""
import os
import sys
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from apps.solicitudes.models import Solicitud
from apps.users.models import UserRequest
import logging

logger = logging.getLogger(__name__)


def migrate_solicitudes():
    """
    Migra todas las solicitudes de Solicitud a UserRequest
    """
    print("="*80)
    print("🔄 MIGRANDO SOLICITUDES A USERREQUEST")
    print("="*80)
    
    # Contar solicitudes existentes
    solicitudes_count = Solicitud.objects.count()
    user_requests_count = UserRequest.objects.count()
    
    print(f"\n📊 Estado inicial:")
    print(f"   - Solicitud (tabla antigua): {solicitudes_count} registros")
    print(f"   - UserRequest (tabla nueva): {user_requests_count} registros")
    
    if solicitudes_count == 0:
        print("\n⚠️  No hay solicitudes para migrar")
        return
    
    # Mapeos de campos
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
    
    estado_map = {
        'pendiente': 'pending',
        'en_revision': 'in_review',
        'aprobado': 'approved',
        'rechazado': 'rejected',
        'completado': 'completed'
    }
    
    prioridad_map = {
        'baja': 'low',
        'normal': 'normal',
        'alta': 'high',
        'urgente': 'urgent'
    }
    
    migrated = 0
    skipped = 0
    errors = 0
    
    print("\n🔄 Iniciando migración...\n")
    
    for sol in Solicitud.objects.all():
        try:
            # Verificar si ya existe
            existing = UserRequest.objects.filter(
                user=sol.usuario,
                title=sol.titulo,
                created_at=sol.created_at
            ).first()
            
            if existing:
                print(f"  ⚠️  Ya existe: {sol.titulo} (ID: {sol.id})")
                skipped += 1
                continue
            
            # Mapear tipo
            request_type = tipo_map.get(sol.tipo, 'other')
            
            # Mapear estado
            status_value = estado_map.get(sol.estado, 'pending')
            
            # Mapear prioridad
            priority = prioridad_map.get(sol.prioridad, 'normal')
            
            # Crear UserRequest
            user_request = UserRequest(
                user=sol.usuario,
                lote=sol.lote,
                request_type=request_type,
                title=sol.titulo,
                description=sol.descripcion,
                status=status_value,
                priority=priority,
                reviewer=sol.revisor,
                review_notes=sol.notas_revision,
                resolved_at=sol.resuelta_at,
                metadata=sol.metadatos or {}
            )
            
            # Preservar fechas originales
            user_request.created_at = sol.created_at
            user_request.updated_at = sol.updated_at
            
            # Guardar
            user_request.save()
            
            migrated += 1
            print(f"  ✅ Migrada: {sol.titulo} (ID: {sol.id} → {user_request.id})")
            print(f"     Usuario: {sol.usuario.email}")
            print(f"     Tipo: {sol.tipo} → {request_type}")
            print(f"     Estado: {sol.estado} → {status_value}")
            
        except Exception as e:
            errors += 1
            print(f"  ❌ Error migrando {sol.titulo} (ID: {sol.id}): {e}")
            logger.error(f"Error migrando solicitud {sol.id}: {e}", exc_info=True)
    
    print("\n" + "="*80)
    print("📊 RESUMEN DE MIGRACIÓN")
    print("="*80)
    print(f"✅ Migradas:  {migrated}")
    print(f"⚠️  Omitidas:  {skipped}")
    print(f"❌ Errores:   {errors}")
    print("="*80)
    
    # Verificar resultado
    new_count = UserRequest.objects.count()
    print(f"\n📊 Estado final:")
    print(f"   - UserRequest (tabla nueva): {new_count} registros")
    print(f"   - Incremento: +{new_count - user_requests_count}")
    
    # Verificar datos del usuario de prueba
    print("\n🔍 Verificando usuario propietario@lateral360.com:")
    try:
        from apps.users.models import User
        user = User.objects.get(email='propietario@lateral360.com')
        user_requests = UserRequest.objects.filter(user=user)
        print(f"   - ID: {user.id}")
        print(f"   - UserRequest para este usuario: {user_requests.count()}")
        
        if user_requests.exists():
            print(f"\n   Solicitudes:")
            for req in user_requests[:3]:
                print(f"   • {req.id}: {req.title} - {req.status}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n✅ Migración completada")
    print("="*80)


if __name__ == "__main__":
    try:
        migrate_solicitudes()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migración interrumpida por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        logger.error("Error en migración", exc_info=True)
        sys.exit(1)
