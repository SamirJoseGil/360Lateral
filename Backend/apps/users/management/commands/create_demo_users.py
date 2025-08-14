from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Crear usuarios de demostración para los roles admin, owner y developer'
    
    def handle(self, *args, **options):
        # Lista de usuarios de demostración
        demo_users = [
            {
                'email': 'admin@lateral360.com',
                'first_name': 'Admin',
                'last_name': 'Sistema',
                'role': 'admin',
                'password': 'admin123',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'owner@lateral360.com',
                'first_name': 'María',
                'last_name': 'González',
                'role': 'owner',
                'password': 'owner123',
                'phone': '+57 300 123 4567',
            },
            {
                'email': 'developer@lateral360.com',
                'first_name': 'Carlos',
                'last_name': 'Rodríguez',
                'role': 'developer',
                'password': 'developer123',
                'company': 'Constructora ABC',
                'phone': '+57 300 765 4321',
            }
        ]
        
        for user_data in demo_users:
            email = user_data['email']
            
            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f'Usuario {email} ya existe')
                )
                continue
            
            password = user_data.pop('password')
            user = User.objects.create_user(**user_data)
            user.set_password(password)
            user.is_verified = True
            user.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Usuario {email} creado exitosamente')
            )
        
        self.stdout.write(
            self.style.SUCCESS('✅ Usuarios de demostración creados')
        )
        self.stdout.write(
            self.style.SUCCESS('✅ Usuarios de demostración creados')
        )
