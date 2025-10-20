"""
Script para verificar y debuggear usuarios
"""
import os
import sys
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def check_user(email):
    """Verificar usuario y contraseña"""
    try:
        user = User.objects.get(email=email)
        print(f"✅ Usuario encontrado:")
        print(f"   Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Role: {user.role}")
        print(f"   Is Active: {user.is_active}")
        print(f"   Is Staff: {user.is_staff}")
        print(f"   Is Superuser: {user.is_superuser}")
        
        # Verificar contraseña
        password = input("\nIngresa la contraseña para verificar: ")
        if user.check_password(password):
            print("✅ Contraseña correcta")
        else:
            print("❌ Contraseña incorrecta")
            
    except User.DoesNotExist:
        print(f"❌ Usuario con email {email} no encontrado")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == '__main__':
    email = input("Ingresa el email del usuario a verificar: ")
    check_user(email)
