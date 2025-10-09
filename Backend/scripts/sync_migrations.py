"""
Script para sincronizar migraciones cuando las tablas ya existen
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.core.management import call_command
from django.db import connection

def check_tables_exist():
    """Verificar qué tablas existen en la base de datos"""
    print("\n🔍 Verificando tablas existentes...")
    
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"\n📊 Se encontraron {len(tables)} tablas:")
        
        # Agrupar por prefijo
        lotes_tables = [t for t in tables if t.startswith('lotes_')]
        docs_tables = [t for t in tables if t.startswith('documents_')]
        stats_tables = [t for t in tables if t.startswith('stats_')]
        pot_tables = [t for t in tables if 'pot' in t.lower() or 'tratamiento' in t]
        
        if lotes_tables:
            print(f"\n  📦 Lotes ({len(lotes_tables)} tablas):")
            for table in lotes_tables[:5]:
                print(f"    - {table}")
            if len(lotes_tables) > 5:
                print(f"    ... y {len(lotes_tables) - 5} más")
        
        if docs_tables:
            print(f"\n  📄 Documents ({len(docs_tables)} tablas):")
            for table in docs_tables:
                print(f"    - {table}")
        
        if stats_tables:
            print(f"\n  📈 Stats ({len(stats_tables)} tablas):")
            for table in stats_tables:
                print(f"    - {table}")
        
        if pot_tables:
            print(f"\n  🏘️  POT ({len(pot_tables)} tablas):")
            for table in pot_tables:
                print(f"    - {table}")
        
        return {
            'lotes': len(lotes_tables) > 0,
            'documents': len(docs_tables) > 0,
            'stats': len(stats_tables) > 0,
            'pot': len(pot_tables) > 0,
        }

def fake_migrate_app(app_name):
    """Marcar migraciones de una app como aplicadas sin ejecutarlas"""
    print(f"\n  ⚙️  Marcando migraciones de {app_name} como aplicadas...")
    try:
        call_command('migrate', app_name, '--fake', verbosity=1)
        print(f"  ✅ Migraciones de {app_name} marcadas como aplicadas")
        return True
    except Exception as e:
        print(f"  ⚠️  Error: {e}")
        return False

def main():
    """Función principal"""
    print("=" * 70)
    print("🔄 SINCRONIZACIÓN DE MIGRACIONES")
    print("=" * 70)
    
    print("\nEste script marcará las migraciones como aplicadas")
    print("sin ejecutarlas, ya que las tablas ya existen.")
    
    confirm = input("\n¿Continuar? (s/n): ")
    
    if confirm.lower() != 's':
        print("❌ Operación cancelada")
        return
    
    try:
        # Paso 1: Verificar tablas existentes
        existing_tables = check_tables_exist()
        
        # Paso 2: Aplicar migraciones base (si es necesario)
        print("\n📋 Aplicando migraciones base del sistema...")
        call_command('migrate', 'contenttypes', verbosity=0)
        call_command('migrate', 'auth', verbosity=0)
        call_command('migrate', 'admin', verbosity=0)
        call_command('migrate', 'sessions', verbosity=0)
        print("✅ Migraciones base aplicadas")
        
        # Paso 3: Aplicar migraciones de users normalmente (ya están aplicadas)
        print("\n👤 Verificando migraciones de users...")
        try:
            call_command('migrate', 'users', verbosity=0)
            print("✅ Migraciones de users verificadas")
        except Exception as e:
            print(f"⚠️  Advertencia en users: {e}")
        
        # Paso 4: Fake migrate para apps con tablas existentes
        print("\n🔄 Sincronizando apps con tablas existentes...")
        
        apps_to_fake = []
        
        if existing_tables['lotes']:
            apps_to_fake.append('lotes')
        
        if existing_tables['documents']:
            apps_to_fake.append('documents')
        
        if existing_tables['stats']:
            apps_to_fake.append('stats')
        
        if existing_tables['pot']:
            apps_to_fake.append('pot')
        
        if not apps_to_fake:
            print("\n⚠️  No se encontraron apps con tablas existentes")
            print("   Las migraciones se aplicarán normalmente")
            call_command('migrate', verbosity=1)
        else:
            print(f"\n  Apps a sincronizar: {', '.join(apps_to_fake)}")
            
            success_count = 0
            for app in apps_to_fake:
                if fake_migrate_app(app):
                    success_count += 1
            
            print(f"\n  ✅ {success_count}/{len(apps_to_fake)} apps sincronizadas")
        
        # Paso 5: Verificar estado final
        print("\n📊 Estado final de migraciones:")
        call_command('showmigrations', verbosity=1)
        
        print("\n" + "=" * 70)
        print("✅ SINCRONIZACIÓN COMPLETADA")
        print("=" * 70)
        
        print("\n💡 Próximos pasos:")
        print("   1. Ejecuta: python manage.py check")
        print("   2. Ejecuta: python manage.py runserver")
        
    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
