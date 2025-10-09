"""
Comando para arreglar favoritos sin usuario
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.lotes.models import Favorite

User = get_user_model()

class Command(BaseCommand):
    help = 'Arregla favoritos sin usuario asignado'

    def handle(self, *args, **options):
        self.stdout.write('Verificando favoritos sin usuario...')
        
        # Contar favoritos sin usuario
        orphan_favorites = Favorite.objects.filter(usuario__isnull=True)
        count = orphan_favorites.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('✓ No hay favoritos sin usuario'))
            return
        
        self.stdout.write(f'Se encontraron {count} favoritos sin usuario')
        
        # Opción 1: Eliminarlos
        confirm = input('¿Deseas eliminar estos favoritos? (s/n): ')
        if confirm.lower() == 's':
            orphan_favorites.delete()
            self.stdout.write(self.style.SUCCESS(f'✓ {count} favoritos eliminados'))
        else:
            self.stdout.write('Operación cancelada')
