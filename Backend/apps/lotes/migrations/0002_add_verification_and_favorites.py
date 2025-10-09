# Generated manually to add verification fields and favorites table

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('lotes', '0001_initial'),
    ]

    operations = [
        # Agregar campos de verificación al modelo Lote
        migrations.AddField(
            model_name='lote',
            name='is_verified',
            field=models.BooleanField(default=False, help_text='Indica si el lote ha sido verificado por un administrador'),
        ),
        migrations.AddField(
            model_name='lote',
            name='verified_by',
            field=models.ForeignKey(
                blank=True,
                help_text='Administrador que verificó el lote',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='lotes_verificados',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name='lote',
            name='verified_at',
            field=models.DateTimeField(blank=True, help_text='Fecha y hora de verificación', null=True),
        ),
        migrations.AddField(
            model_name='lote',
            name='rejection_reason',
            field=models.TextField(blank=True, help_text='Razón de rechazo si el estado es rejected', null=True),
        ),
        
        # Crear tabla de favoritos
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('notas', models.TextField(blank=True, help_text='Notas personales sobre el lote', null=True)),
                ('lote', models.ForeignKey(
                    help_text='Lote marcado como favorito',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='favoritos',
                    to='lotes.lote'
                )),
                ('usuario', models.ForeignKey(
                    help_text='Usuario que marcó el lote como favorito',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='lotes_favoritos',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'verbose_name': 'Lote Favorito',
                'verbose_name_plural': 'Lotes Favoritos',
                'db_table': 'lotes_favoritos',
                'ordering': ['-created_at'],
            },
        ),
        
        # Agregar índices
        migrations.AddIndex(
            model_name='favorite',
            index=models.Index(fields=['usuario', 'created_at'], name='lotes_fav_usuario_idx'),
        ),
        migrations.AddIndex(
            model_name='favorite',
            index=models.Index(fields=['lote', 'created_at'], name='lotes_fav_lote_idx'),
        ),
        
        # Agregar unique_together
        migrations.AlterUniqueTogether(
            name='favorite',
            unique_together={('usuario', 'lote')},
        ),
    ]
