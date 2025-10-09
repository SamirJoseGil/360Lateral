from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('stats', '0002_fix_stat_fields'),
    ]

    operations = [
        # Eliminar el campo user_id que causa conflicto
        migrations.RunSQL(
            """
            DO $$
            BEGIN
                -- Eliminar campo user_id si existe
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'stats_stat' AND column_name = 'user_id') THEN
                    ALTER TABLE stats_stat DROP COLUMN user_id;
                END IF;
            END
            $$;
            """,
            reverse_sql="-- No reverse operation needed"
        ),
    ]
