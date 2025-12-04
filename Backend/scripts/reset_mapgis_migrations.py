"""
Script para resetear migraciones de MapGIS
"""
import os
import sys
from pathlib import Path

def reset_mapgis_migrations():
    """Elimina migraciones de mapgis"""
    
    # Directorio de migraciones
    migrations_dir = Path(__file__).parent.parent / 'apps' / 'mapgis' / 'migrations'
    
    if not migrations_dir.exists():
        print("❌ Directorio de migraciones no encontrado")
        return False
    
    # Eliminar archivos de migración
    deleted_count = 0
    for file in migrations_dir.glob('0*.py'):
        file.unlink()
        deleted_count += 1
        print(f"🗑️ Eliminado: {file.name}")
    
    print(f"\n✅ {deleted_count} migraciones eliminadas")
    print("\n📋 Próximos pasos:")
    print("1. Conectar a PostgreSQL: psql -U postgres -d lateral360")
    print("2. Ejecutar: DROP TABLE IF EXISTS mapgis_cache CASCADE;")
    print("3. Ejecutar: DELETE FROM django_migrations WHERE app = 'mapgis';")
    print("4. Salir: \\q")
    print("5. Recrear: python manage.py makemigrations mapgis")
    print("6. Aplicar: python manage.py migrate mapgis")
    
    return True

if __name__ == "__main__":
    reset_mapgis_migrations()
