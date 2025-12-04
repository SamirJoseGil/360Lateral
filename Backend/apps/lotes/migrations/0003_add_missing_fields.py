from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lotes', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='lote',
            name='ciudad',
            field=models.CharField(blank=True, help_text='Ciudad donde se ubica el lote', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='lote',
            name='valor',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Valor del lote en COP', max_digits=15, null=True),
        ),
        migrations.AddField(
            model_name='lote',
            name='forma_pago',
            field=models.CharField(blank=True, choices=[('contado', 'De Contado'), ('financiado', 'Financiado'), ('permuta', 'Permuta'), ('mixto', 'Mixto')], help_text='Forma de pago preferida', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='lote',
            name='es_comisionista',
            field=models.BooleanField(default=False, help_text='Indica si el propietario es comisionista'),
        ),
        migrations.AddField(
            model_name='lote',
            name='carta_autorizacion',
            field=models.FileField(blank=True, help_text='Carta de autorización si es comisionista', null=True, upload_to='lotes/cartas_autorizacion/'),
        ),
    ]
