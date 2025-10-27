# Generated migration for documents app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('lotes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Document',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('document_type', models.CharField(choices=[
                    ('ctl', 'Certificado de Tradición y Libertad'),
                    ('planos', 'Planos Arquitectónicos'),
                    ('topografia', 'Levantamiento Topográfico'),
                    ('licencia_construccion', 'Licencia de Construcción'),
                    ('escritura_publica', 'Escritura Pública'),
                    ('certificado_libertad', 'Certificado de Libertad'),
                    ('avaluo_comercial', 'Avalúo Comercial'),
                    ('estudio_suelos', 'Estudio de Suelos'),
                    ('otros', 'Otros Documentos'),
                ], help_text='Tipo de documento', max_length=50)),
                ('title', models.CharField(help_text='Título del documento', max_length=200)),
                ('description', models.TextField(blank=True, help_text='Descripción del documento', null=True)),
                ('file', models.FileField(help_text='Archivo del documento', upload_to='documents/%Y/%m/%d/')),
                ('file_size', models.IntegerField(blank=True, help_text='Tamaño del archivo en bytes', null=True)),
                ('mime_type', models.CharField(blank=True, help_text='Tipo MIME del archivo', max_length=100, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict, help_text='Metadatos adicionales del documento')),
                ('is_active', models.BooleanField(default=True, help_text='Si el documento está activo')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lote', models.ForeignKey(blank=True, help_text='Lote al que pertenece el documento', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='documentos', to='lotes.lote')),
                ('user', models.ForeignKey(help_text='Usuario que subió el documento', on_delete=django.db.models.deletion.CASCADE, related_name='documents', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Documento',
                'verbose_name_plural': 'Documentos',
                'db_table': 'documents',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['user', '-created_at'], name='documents_user_id_2e6f61_idx'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['lote', '-created_at'], name='documents_lote_id_30f5c6_idx'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['document_type'], name='documents_documen_93e53b_idx'),
        ),
    ]
