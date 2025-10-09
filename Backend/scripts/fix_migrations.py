"""
Script para limpiar y regenerar migraciones de forma segura
"""
import os
import sys
import django
import shutil
from pathlib import Path

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.core.management import call_command

def backup_migrations():
    """Backup de migraciones existentes"""
    print("\n📦 Creando backup de migraciones...")
    
    apps_dir = Path(__file__).parent.parent / 'apps'
    backup_dir = Path(__file__).parent.parent / 'migrations_backup'
    
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    
    backup_dir.mkdir()
    
    for app in ['lotes', 'documents', 'stats', 'pot']:
        app_migrations = apps_dir / app / 'migrations'
        if app_migrations.exists():
            backup_app = backup_dir / app
            backup_app.mkdir()
            
            # Copiar solo archivos .py excepto __init__.py
            for file in app_migrations.glob('*.py'):
                if file.name != '__init__.py':
                    shutil.copy2(file, backup_app / file.name)
                    print(f"  ✓ Backup: {app}/migrations/{file.name}")
    
    print(f"✅ Backup guardado en: {backup_dir}")

def clean_migration_files():
    """Eliminar archivos de migración (excepto __init__.py)"""
    print("\n🧹 Limpiando archivos de migración...")
    
    apps_dir = Path(__file__).parent.parent / 'apps'
    
    for app in ['lotes', 'documents', 'stats', 'pot']:
        migrations_dir = apps_dir / app / 'migrations'
        
        if migrations_dir.exists():
            # Eliminar solo archivos .py numerados
            for file in migrations_dir.glob('0*.py'):
                print(f"  🗑️  Eliminando: {app}/migrations/{file.name}")
                file.unlink()

def verify_init_files():
    """Verificar que existen __init__.py en migrations"""
    print("\n🔍 Verificando archivos __init__.py...")
    
    apps_dir = Path(__file__).parent.parent / 'apps'
    
    for app in ['lotes', 'documents', 'stats', 'pot']:
        migrations_dir = apps_dir / app / 'migrations'
        init_file = migrations_dir / '__init__.py'
        
        if not migrations_dir.exists():
            migrations_dir.mkdir(parents=True)
            print(f"  📁 Creado: {app}/migrations/")
        
        if not init_file.exists():
            init_file.touch()
            print(f"  ✓ Creado: {app}/migrations/__init__.py")

def reset_migrations_table():
    """Limpiar tabla de migraciones en base de datos"""
    print("\n🗄️  Limpiando tabla de migraciones en base de datos...")
    
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Eliminar registros de migraciones de las apps problemáticas
        for app in ['lotes', 'documents', 'stats', 'pot']:
            try:
                cursor.execute(
                    "DELETE FROM django_migrations WHERE app = %s",
                    [app]
                )
                print(f"  ✓ Limpiado: {app}")
            except Exception as e:
                print(f"  ⚠️  Error limpiando {app}: {e}")

def create_fresh_migrations():
    """Crear nuevas migraciones"""
    print("\n🆕 Creando nuevas migraciones...")
    
    # Orden de creación de migraciones
    migration_order = ['users', 'lotes', 'documents', 'stats', 'pot']
    
    for app in migration_order:
        print(f"\n  📝 Creando migración para: {app}")
        try:
            call_command('makemigrations', app, interactive=False)
            print(f"  ✅ Migración creada para {app}")
        except Exception as e:
            print(f"  ⚠️  Error: {e}")

def apply_migrations():
    """Aplicar todas las migraciones"""
    print("\n⚙️  Aplicando migraciones...")
    
    try:
        call_command('migrate', interactive=False)
        print("✅ Migraciones aplicadas exitosamente")
    except Exception as e:
        print(f"❌ Error aplicando migraciones: {e}")
        return False
    
    return True

def main():
    """Función principal"""
    print("=" * 70)
    print("🔧 SCRIPT DE REPARACIÓN DE MIGRACIONES")
    print("=" * 70)
    
    confirm = input("\n⚠️  Este script eliminará las migraciones actuales. ¿Continuar? (s/n): ")
    
    if confirm.lower() != 's':
        print("❌ Operación cancelada")
        return
    
    try:
        # Paso 1: Backup
        backup_migrations()
        
        # Paso 2: Limpiar archivos
        clean_migration_files()
        
        # Paso 3: Verificar __init__.py
        verify_init_files()
        
        # Paso 4: Limpiar tabla de migraciones
        reset_migrations_table()
        
        # Paso 5: Crear nuevas migraciones
        create_fresh_migrations()
        
        # Paso 6: Aplicar migraciones
        success = apply_migrations()
        
        if success:
            print("\n" + "=" * 70)
            print("✅ PROCESO COMPLETADO EXITOSAMENTE")
            print("=" * 70)
        else:
            print("\n" + "=" * 70)
            print("⚠️  PROCESO COMPLETADO CON ERRORES")
            print("   Revisa los mensajes anteriores")
            print("=" * 70)
    
    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO: {e}")
        print("\nPuedes restaurar desde el backup en: migrations_backup/")

if __name__ == "__main__":
    main()
