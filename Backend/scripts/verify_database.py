"""
Script para verificar integridad de la base de datos
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

def verify_tables():
    """Verificar que las tablas críticas existen"""
    print("\n🔍 Verificando tablas críticas...")
    
    critical_tables = [
        'users_user',
        'lotes_lote',
        'lotes_favorite',
        'documents_document',
        'stats_stat',
        'lotes_tratamiento',
    ]
    
    with connection.cursor() as cursor:
        for table in critical_tables:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = '{table}'
                );
            """)
            exists = cursor.fetchone()[0]
            
            status = "✅" if exists else "❌"
            print(f"  {status} {table}")
            
            if exists:
                # Contar registros
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"      {count} registro(s)")

def verify_models():
    """Verificar que los modelos funcionan"""
    print("\n🔍 Verificando modelos de Django...")
    
    try:
        # Verificar User
        user_count = User.objects.count()
        print(f"  ✅ User model: {user_count} usuario(s)")
        
        # Verificar Lote
        from apps.lotes.models import Lote
        lote_count = Lote.objects.count()
        print(f"  ✅ Lote model: {lote_count} lote(s)")
        
        # Verificar Favorite
        from apps.lotes.models import Favorite
        fav_count = Favorite.objects.count()
        print(f"  ✅ Favorite model: {fav_count} favorito(s)")
        
        # Verificar Document
        from apps.documents.models import Document
        doc_count = Document.objects.count()
        print(f"  ✅ Document model: {doc_count} documento(s)")
        
        # Verificar Stat
        from apps.stats.models import Stat
        stat_count = Stat.objects.count()
        print(f"  ✅ Stat model: {stat_count} estadística(s)")
        
        print("\n✅ Todos los modelos funcionan correctamente")
        return True
        
    except Exception as e:
        print(f"\n❌ Error verificando modelos: {e}")
        return False

def verify_migrations():
    """Verificar estado de migraciones"""
    print("\n🔍 Verificando migraciones pendientes...")
    
    from django.core.management import call_command
    from io import StringIO
    import sys
    
    # Capturar salida de showmigrations
    old_stdout = sys.stdout
    sys.stdout = buffer = StringIO()
    
    try:
        call_command('showmigrations', '--plan')
    finally:
        sys.stdout = old_stdout
    
    output = buffer.getvalue()
    
    # Contar migraciones pendientes
    pending = output.count('[ ]')
    applied = output.count('[X]')
    
    print(f"  ✅ Aplicadas: {applied}")
    print(f"  ⏳ Pendientes: {pending}")
    
    if pending > 0:
        print(f"\n  ⚠️  Hay {pending} migraciones pendientes")
        print("     Ejecuta: python manage.py migrate")
        return False
    
    return True

def main():
    """Función principal"""
    print("=" * 70)
    print("🔍 VERIFICACIÓN DE INTEGRIDAD DE BASE DE DATOS")
    print("=" * 70)
    
    all_ok = True
    
    # Verificar tablas
    verify_tables()
    
    # Verificar migraciones
    migrations_ok = verify_migrations()
    all_ok = all_ok and migrations_ok
    
    # Verificar modelos
    models_ok = verify_models()
    all_ok = all_ok and models_ok
    
    print("\n" + "=" * 70)
    if all_ok:
        print("✅ VERIFICACIÓN COMPLETADA - TODO OK")
    else:
        print("⚠️  VERIFICACIÓN COMPLETADA - HAY PROBLEMAS")
    print("=" * 70)

if __name__ == "__main__":
    main()
