"""
Script para verificar qué tablas de solicitudes existen y qué datos contienen
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

from django.db import connection

def check_tables():
    """Verificar qué tablas de solicitudes existen"""
    print("="*80)
    print("🔍 VERIFICANDO TABLAS DE SOLICITUDES")
    print("="*80)
    
    with connection.cursor() as cursor:
        # Buscar todas las tablas relacionadas con solicitudes
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema='public' 
            AND (table_name LIKE '%solicitud%' OR table_name LIKE '%request%')
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        
        print(f"\n📋 Tablas encontradas ({len(tables)}):")
        for table in tables:
            table_name = table[0]
            print(f"\n  ✓ {table_name}")
            
            # Contar registros
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            print(f"    - Registros: {count}")
            
            # Mostrar estructura
            cursor.execute(f"""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position
            """)
            columns = cursor.fetchall()
            print(f"    - Columnas principales:")
            for col_name, col_type in columns[:10]:  # Mostrar primeras 10
                print(f"      • {col_name}: {col_type}")
            
            # Si tiene datos, mostrar algunos registros
            if count > 0:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                rows = cursor.fetchall()
                print(f"    - Primeros registros:")
                for i, row in enumerate(rows, 1):
                    print(f"      {i}. ID: {row[0]}")

def check_models():
    """Verificar qué modelos de solicitudes existen en Django"""
    print("\n" + "="*80)
    print("🔍 VERIFICANDO MODELOS DE DJANGO")
    print("="*80)
    
    try:
        from apps.users.models import UserRequest
        print("\n✅ UserRequest (apps.users)")
        print(f"   - Tabla: {UserRequest._meta.db_table}")
        count = UserRequest.objects.count()
        print(f"   - Registros: {count}")
        
        if count > 0:
            print(f"   - Primeros registros:")
            for req in UserRequest.objects.all()[:3]:
                print(f"     • {req.id}: {req.title} - {req.user.email}")
    except Exception as e:
        print(f"\n❌ Error con UserRequest: {e}")
    
    try:
        from apps.solicitudes.models import Solicitud
        print("\n✅ Solicitud (apps.solicitudes)")
        print(f"   - Tabla: {Solicitud._meta.db_table}")
        count = Solicitud.objects.count()
        print(f"   - Registros: {count}")
        
        if count > 0:
            print(f"   - Primeros registros:")
            for sol in Solicitud.objects.all()[:3]:
                print(f"     • {sol.id}: {sol.titulo} - {sol.usuario.email}")
    except Exception as e:
        print(f"\n❌ Error con Solicitud: {e}")

def check_user_data():
    """Verificar datos del usuario de prueba"""
    print("\n" + "="*80)
    print("🔍 VERIFICANDO USUARIO PROPIETARIO")
    print("="*80)
    
    try:
        from apps.users.models import User
        user = User.objects.get(email='propietario@lateral360.com')
        print(f"\n✅ Usuario encontrado: {user.email}")
        print(f"   - ID: {user.id}")
        print(f"   - Role: {user.role}")
        print(f"   - Username: {user.username}")
        
        # Verificar solicitudes de UserRequest
        from apps.users.models import UserRequest
        user_requests = UserRequest.objects.filter(user=user)
        print(f"\n📊 UserRequest para este usuario: {user_requests.count()}")
        
        # Verificar solicitudes de Solicitud
        from apps.solicitudes.models import Solicitud
        solicitudes = Solicitud.objects.filter(usuario=user)
        print(f"📊 Solicitud para este usuario: {solicitudes.count()}")
        
        if solicitudes.exists():
            print("\n⚠️  PROBLEMA DETECTADO:")
            print("   Las solicitudes están en Solicitud pero el frontend busca en UserRequest")
            print("   Necesitamos MIGRAR los datos o cambiar el endpoint")
            
    except Exception as e:
        print(f"\n❌ Error verificando usuario: {e}")

def main():
    print("\n🚀 DIAGNÓSTICO DE SOLICITUDES")
    print("="*80)
    
    check_tables()
    check_models()
    check_user_data()
    
    print("\n" + "="*80)
    print("✅ DIAGNÓSTICO COMPLETADO")
    print("="*80)
    
    print("\n💡 RECOMENDACIÓN:")
    print("   1. Si las solicitudes están en 'solicitudes_solicitud':")
    print("      → Migrar datos a 'users_userrequest'")
    print("   2. O cambiar el frontend para usar /api/solicitudes/")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
