import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connection

print("🧹 Limpiando migraciones de users en la BD...")

with connection.cursor() as cursor:
    cursor.execute("DELETE FROM django_migrations WHERE app = 'users';")
    print(f"✅ Eliminadas todas las migraciones de 'users'")

print("✅ Limpieza completada")
