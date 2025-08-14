import os
import sys
from pathlib import Path
from django.db import connection

def delete_migration_files():
    """Eliminar archivos de migraciones en todas las apps."""
    base_dir = Path(__file__).resolve().parent.parent / "apps"
    for app_dir in base_dir.iterdir():
        migrations_dir = app_dir / "migrations"
        if migrations_dir.exists() and migrations_dir.is_dir():
            print(f"📂 Limpiando migraciones en: {migrations_dir}")
            for file in migrations_dir.iterdir():
                if file.name != "__init__.py" and file.suffix == ".py":
                    print(f"🗑️ Eliminando: {file}")
                    file.unlink()

def clear_migration_table():
    """Eliminar entradas de migraciones en la base de datos."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM django_migrations;")
            print("✅ Tabla 'django_migrations' limpiada exitosamente.")
    except Exception as e:
        print(f"❌ Error al limpiar la tabla 'django_migrations': {e}")

if __name__ == "__main__":
    # Configurar el entorno de Django
    backend_dir = Path(__file__).resolve().parent.parent
    sys.path.append(str(backend_dir))  # Agregar el directorio del backend al PATH
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")  # Usar configuración de desarrollo

    import django
    django.setup()

    print("🚀 Eliminando archivos de migraciones...")
    delete_migration_files()

    print("🚀 Limpiando tabla de migraciones en la base de datos...")
    clear_migration_table()

    print("✅ Proceso completado.")
