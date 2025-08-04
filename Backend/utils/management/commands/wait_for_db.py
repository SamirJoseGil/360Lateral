import time
from django.db import connection
from django.db.utils import OperationalError
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Django command to pause execution until database is available"""

    def handle(self, *args, **options):
        self.stdout.write('⏳ Esperando conexión a la base de datos...')
        db_conn = None
        while not db_conn:
            try:
                connection.ensure_connection()
                db_conn = True
            except OperationalError:
                self.stdout.write('Base de datos no disponible, esperando 1 segundo...')
                time.sleep(1)

        self.stdout.write(self.style.SUCCESS('✅ Base de datos conectada!'))
