"""
Comando para corregir el modelo Stat y permitir guardar UUIDs como user_id
"""
from django.core.management.base import BaseCommand
from django.db import connection
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Corrige el modelo Stat para permitir UUIDs como user_id'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando corrección del modelo Stat...')
        
        # Verificar si la tabla existe
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM stats_stat")
                count = cursor.fetchone()[0]
                self.stdout.write(self.style.SUCCESS(f'✅ La tabla stats_stat existe con {count} registros'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️ La tabla stats_stat no existe: {e}'))
            self.stdout.write('Creando tablas de estadísticas...')
            
            try:
                call_command('makemigrations', 'stats')
                call_command('migrate', 'stats')
                self.stdout.write(self.style.SUCCESS('✅ Tablas de stats creadas exitosamente'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error al crear tablas: {e}'))
                return
        
        # Intentar aplicar la migración 0002_alter_stat_user_id
        try:
            self.stdout.write('Aplicando migración para permitir UUIDs...')
            call_command('migrate', 'stats', '0002_alter_stat_user_id')
            self.stdout.write(self.style.SUCCESS('✅ Modelo Stat actualizado correctamente'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error al aplicar migración: {e}'))
            
            # Intentar crear la migración
            try:
                self.stdout.write('Intentando crear la migración manualmente...')
                from django.db import models
                from django.db.migrations.state import ProjectState
                from django.db.migrations.writer import MigrationWriter
                from django.db.migrations import Migration, AlterField
                
                operation = AlterField(
                    model_name='stat',
                    name='user_id',
                    field=models.CharField(blank=True, max_length=36, null=True, verbose_name='ID de Usuario'),
                )
                
                migration = Migration('0002_alter_stat_user_id', 'stats')
                migration.operations = [operation]
                migration.dependencies = [('stats', '0001_initial')]
                
                writer = MigrationWriter(migration)
                with open(writer.path, 'w') as f:
                    f.write(writer.as_string())
                
                self.stdout.write(self.style.SUCCESS(f'✅ Migración creada en {writer.path}'))
                
                # Aplicar la migración
                call_command('migrate', 'stats')
                self.stdout.write(self.style.SUCCESS('✅ Migración aplicada exitosamente'))
            except Exception as e2:
                self.stdout.write(self.style.ERROR(f'❌ Error al crear migración manualmente: {e2}'))
                
                # Última opción: crear un SQL personalizado
                self.stdout.write('Intentando modificar la base de datos directamente...')
                try:
                    with connection.cursor() as cursor:
                        # Verificar si la columna es de tipo entero
                        cursor.execute("SELECT data_type FROM information_schema.columns WHERE table_name = 'stats_stat' AND column_name = 'user_id'")
                        data_type = cursor.fetchone()
                        
                        if data_type and data_type[0] == 'integer':
                            # Cambiar el tipo de la columna a varchar(36)
                            cursor.execute("ALTER TABLE stats_stat ALTER COLUMN user_id TYPE varchar(36)")
                            self.stdout.write(self.style.SUCCESS('✅ Columna user_id modificada exitosamente mediante SQL'))
                except Exception as e3:
                    self.stdout.write(self.style.ERROR(f'❌ Error al modificar la base de datos directamente: {e3}'))
