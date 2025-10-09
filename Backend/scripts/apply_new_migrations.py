"""
Script para aplicar nuevas migraciones de forma segura
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.core.management import call_command
from django.db import connection

def check_column_exists(table_name, column_name):
    """Verificar si una columna existe en una tabla"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = %s 
                AND column_name = %s
            );
        """, [table_name, column_name])
        return cursor.fetchone()[0]

def check_table_exists(table_name):
    """Verificar si una tabla existe"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]

def main():
    """Función principal"""
    print("=" * 70)
    print("🔧 APLICAR NUEVAS MIGRACIONES")
    print("=" * 70)
    
    # Verificar estado actual
    print("\n🔍 Verificando estado actual de la base de datos...")
    
    has_is_verified = check_column_exists('lotes_lote', 'is_verified')
    has_verified_by = check_column_exists('lotes_lote', 'verified_by_id')
    has_verified_at = check_column_exists('lotes_lote', 'verified_at')
    has_rejection_reason = check_column_exists('lotes_lote', 'rejection_reason')
    has_favorites_table = check_table_exists('lotes_favoritos')
    
    print(f"\n  Columna is_verified: {'✅ Existe' if has_is_verified else '❌ Falta'}")
    print(f"  Columna verified_by: {'✅ Existe' if has_verified_by else '❌ Falta'}")
    print(f"  Columna verified_at: {'✅ Existe' if has_verified_at else '❌ Falta'}")
    print(f"  Columna rejection_reason: {'✅ Existe' if has_rejection_reason else '❌ Falta'}")
    print(f"  Tabla lotes_favoritos: {'✅ Existe' if has_favorites_table else '❌ Falta'}")
    
    if all([has_is_verified, has_verified_by, has_verified_at, has_rejection_reason, has_favorites_table]):
        print("\n✅ Todas las estructuras ya existen. No se necesitan migraciones.")
        return
    
    print("\n⚠️  Se necesitan aplicar migraciones")
    confirm = input("\n¿Continuar con la aplicación de migraciones? (s/n): ")
    
    if confirm.lower() != 's':
        print("❌ Operación cancelada")
        return
    
    try:
        # Crear la migración si no existe
        print("\n📝 Generando migraciones...")
        call_command('makemigrations', 'lotes', verbosity=2)
        
        # Aplicar migraciones
        print("\n⚙️  Aplicando migraciones...")
        call_command('migrate', 'lotes', verbosity=2)
        
        # Verificar que se aplicaron correctamente
        print("\n🔍 Verificando aplicación...")
        
        has_is_verified = check_column_exists('lotes_lote', 'is_verified')
        has_verified_by = check_column_exists('lotes_lote', 'verified_by_id')
        has_verified_at = check_column_exists('lotes_lote', 'verified_at')
        has_rejection_reason = check_column_exists('lotes_lote', 'rejection_reason')
        has_favorites_table = check_table_exists('lotes_favoritos')
        
        print(f"\n  Columna is_verified: {'✅' if has_is_verified else '❌'}")
        print(f"  Columna verified_by: {'✅' if has_verified_by else '❌'}")
        print(f"  Columna verified_at: {'✅' if has_verified_at else '❌'}")
        print(f"  Columna rejection_reason: {'✅' if has_rejection_reason else '❌'}")
        print(f"  Tabla lotes_favoritos: {'✅' if has_favorites_table else '❌'}")
        
        if all([has_is_verified, has_verified_by, has_verified_at, has_rejection_reason, has_favorites_table]):
            print("\n" + "=" * 70)
            print("✅ MIGRACIONES APLICADAS EXITOSAMENTE")
            print("=" * 70)
            print("\n💡 Próximos pasos:")
            print("   1. Ejecuta: python manage.py check")
            print("   2. Ejecuta: python manage.py runserver")
        else:
            print("\n" + "=" * 70)
            print("⚠️  ALGUNAS ESTRUCTURAS NO SE CREARON")
            print("=" * 70)
            print("\n   Revisa los mensajes de error anteriores")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
