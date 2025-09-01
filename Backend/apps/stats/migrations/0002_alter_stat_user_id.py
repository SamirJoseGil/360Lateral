# Generated manually to convert user_id field from Integer to CharField

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stat',
            name='user_id',
            field=models.CharField(blank=True, max_length=36, null=True, verbose_name='ID de Usuario'),
        ),
    ]
