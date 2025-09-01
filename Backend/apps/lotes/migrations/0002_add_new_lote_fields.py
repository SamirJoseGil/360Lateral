"""
Migración para agregar nuevos campos al modelo Lote.
"""
from django.db import migrations, models
import django.core.validators

class Migration(migrations.Migration):

    dependencies = [
        ('lotes', '0001_initial'),  # Ajusta esto a tu última migración
    ]

    operations = [
        # Nuevos campos para el modelo Lote
        migrations.AddField(
            model_name='lote',
            name='codigo_catastral',
            field=models.CharField(
                blank=True,
                help_text='Código catastral del predio',
                max_length=100,
                null=True,
                verbose_name='Código Catastral'
            ),
        ),
        migrations.AddField(
            model_name='lote',
            name='latitud',
            field=models.DecimalField(
                blank=True,
                decimal_places=7,
                help_text='Coordenada de latitud del lote',
                max_digits=10,
                null=True,
                verbose_name='Latitud'
            ),
        ),
        migrations.AddField(
            model_name='lote',
            name='longitud',
            field=models.DecimalField(
                blank=True,
                decimal_places=7,
                help_text='Coordenada de longitud del lote',
                max_digits=10,
                null=True,
                verbose_name='Longitud'
            ),
        ),
        migrations.AddField(
            model_name='lote',
            name='tratamiento_pot',
            field=models.CharField(
                blank=True,
                help_text='Tratamiento según Plan de Ordenamiento Territorial',
                max_length=100,
                null=True,
                verbose_name='Tratamiento POT'
            ),
        ),
        migrations.AddField(
            model_name='lote',
            name='uso_suelo',
            field=models.CharField(
                blank=True,
                help_text='Clasificación del uso del suelo',
                max_length=100,
                null=True,
                verbose_name='Uso del Suelo'
            ),
        ),
        migrations.AddField(
            model_name='lote',
            name='clasificacion_suelo',
            field=models.CharField(
                blank=True,
                help_text='Clasificación del suelo (urbano, rural, etc.)',
                max_length=100,
                null=True,
                verbose_name='Clasificación del Suelo'
            ),
        ),
        # Actualizar el campo estado para usar los valores en inglés
        migrations.AlterField(
            model_name='lote',
            name='estado',
            field=models.CharField(
                choices=[
                    ('active', 'Activo'),
                    ('inactive', 'Inactivo'),
                    ('archived', 'Archivado'),
                    ('in_process', 'En proceso'),
                    ('completed', 'Completado')
                ],
                default='active',
                help_text='Estado actual del lote (status)',
                max_length=50,
                verbose_name='Estado'
            ),
        ),
        # Actualizar el campo metadatos para incluir help_text
        migrations.AlterField(
            model_name='lote',
            name='metadatos',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Información adicional en formato JSON',
                verbose_name='Metadatos adicionales'
            ),
        ),
    ]