# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('lotes', '0003_merge_20250901_0037'),
    ]

    operations = [
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')),
                ('notes', models.TextField(blank=True, null=True, verbose_name='Notas')),
                ('lote', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorited_by', to='lotes.lote', verbose_name='Lote')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='users.user', verbose_name='Usuario')),
            ],
            options={
                'verbose_name': 'Favorito',
                'verbose_name_plural': 'Favoritos',
                'ordering': ['-created_at'],
                'unique_together': {('user', 'lote')},
            },
        ),
    ]