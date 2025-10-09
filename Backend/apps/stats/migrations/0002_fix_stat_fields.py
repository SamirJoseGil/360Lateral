from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('stats', '0001_initial'),
    ]

    operations = [
        # Eliminar campo user_id que está causando conflictos
        migrations.RunSQL(
            """
            DO $$
            BEGIN
                -- Verificar si la columna user_id existe y eliminarla
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'stats_stat' AND column_name = 'user_id') THEN
                    ALTER TABLE stats_stat DROP COLUMN user_id;
                END IF;
                
                -- Agregar campo user como ForeignKey si no existe
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name = 'stats_stat' AND column_name = 'user_id') THEN
                    -- Agregar la columna user_id como UUID para ForeignKey
                    ALTER TABLE stats_stat ADD COLUMN user_id UUID NULL;
                    
                    -- Agregar constraint de foreign key
                    ALTER TABLE stats_stat 
                    ADD CONSTRAINT stats_stat_user_id_fkey 
                    FOREIGN KEY (user_id) REFERENCES users_user(id) 
                    ON DELETE SET NULL;
                END IF;
                
                -- Renombrar campos si existen con nombres antiguos
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'stats_stat' AND column_name = 'type') THEN
                    ALTER TABLE stats_stat RENAME COLUMN type TO event_type;
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'stats_stat' AND column_name = 'name') THEN
                    ALTER TABLE stats_stat RENAME COLUMN name TO event_name;
                END IF;
                
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'stats_stat' AND column_name = 'value') THEN
                    ALTER TABLE stats_stat RENAME COLUMN value TO event_value;
                END IF;
                
                -- Agregar user_agent si no existe
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name = 'stats_stat' AND column_name = 'user_agent') THEN
                    ALTER TABLE stats_stat ADD COLUMN user_agent TEXT DEFAULT '' NOT NULL;
                END IF;
            END
            $$;
            """,
            reverse_sql="-- No reverse operation"
        ),
    ]