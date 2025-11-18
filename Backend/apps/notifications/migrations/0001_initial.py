# Generated migration for notifications

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('type', models.CharField(choices=[('lote_aprobado', 'Lote Aprobado'), ('lote_rechazado', 'Lote Rechazado'), ('documento_validado', 'Documento Validado'), ('documento_rechazado', 'Documento Rechazado'), ('solicitud_respondida', 'Solicitud Respondida'), ('nuevo_mensaje', 'Nuevo Mensaje'), ('sistema', 'Notificación del Sistema')], db_index=True, max_length=50, verbose_name='Tipo')),
                ('title', models.CharField(max_length=255, verbose_name='Título')),
                ('message', models.TextField(verbose_name='Mensaje')),
                ('priority', models.CharField(choices=[('low', 'Baja'), ('normal', 'Normal'), ('high', 'Alta'), ('urgent', 'Urgente')], default='normal', max_length=10, verbose_name='Prioridad')),
                ('lote_id', models.UUIDField(blank=True, null=True, verbose_name='ID Lote')),
                ('document_id', models.UUIDField(blank=True, null=True, verbose_name='ID Documento')),
                ('solicitud_id', models.IntegerField(blank=True, null=True, verbose_name='ID Solicitud')),
                ('data', models.JSONField(blank=True, default=dict, verbose_name='Datos Adicionales')),
                ('action_url', models.CharField(blank=True, max_length=500, null=True, verbose_name='URL de Acción')),
                ('is_read', models.BooleanField(db_index=True, default=False, verbose_name='Leída')),
                ('read_at', models.DateTimeField(blank=True, null=True, verbose_name='Fecha de Lectura')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL, verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Notificación',
                'verbose_name_plural': 'Notificaciones',
                'db_table': 'notifications_notification',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', '-created_at'], name='notificatio_user_id_1234ab'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read'], name='notificatio_user_id_5678cd'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['type', '-created_at'], name='notificatio_type_9012ef'),
        ),
    ]
