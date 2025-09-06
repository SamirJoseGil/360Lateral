# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0002_alter_document_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='estado_validacion',
            field=models.CharField(choices=[('pendiente', 'Pendiente'), ('validado', 'Validado'), ('rechazado', 'Rechazado')], default='pendiente', max_length=20, verbose_name='Estado de validación'),
        ),
        migrations.AddField(
            model_name='document',
            name='validacion_comentarios',
            field=models.TextField(blank=True, null=True, verbose_name='Comentarios de validación'),
        ),
        migrations.AddField(
            model_name='document',
            name='validacion_fecha',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Fecha de validación'),
        ),
    ]