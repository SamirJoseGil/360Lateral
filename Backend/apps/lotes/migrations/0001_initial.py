"""
Migración inicial para la app lotes.
Creada manualmente para solucionar problemas de migración.
"""
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),  # Asumiendo que la app 'users' tiene una migración inicial
    ]

    operations = [
        migrations.CreateModel(
            name='Lote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=255)),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('direccion', models.CharField(max_length=255)),
                ('area', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('codigo_catastral', models.CharField(blank=True, max_length=30, null=True, unique=True)),
                ('matricula', models.CharField(blank=True, max_length=30, null=True, unique=True)),
                ('cbml', models.CharField(blank=True, max_length=20, null=True)),
                ('latitud', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitud', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('estrato', models.IntegerField(blank=True, choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5'), (6, '6')], null=True)),
                ('tratamiento_pot', models.CharField(blank=True, max_length=100, null=True)),
                ('uso_suelo', models.CharField(blank=True, max_length=100, null=True)),
                ('status', models.CharField(choices=[('active', 'Activo'), ('pending', 'Pendiente'), ('archived', 'Archivado')], default='active', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lotes', to='users.user', verbose_name='Propietario')),
            ],
            options={
                'verbose_name': 'Lote',
                'verbose_name_plural': 'Lotes',
                'ordering': ['-created_at'],
            },
        ),
    ]