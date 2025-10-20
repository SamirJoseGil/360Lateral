"""
Script para crear usuarios adicionales con roles específicos
"""
import os
import sys
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from apps.users.models import User
from django.db import connection

def check_database_connection():
    """Verificar conexión a la base de datos"""
    try:
        connection.ensure_connection()
        print("[INFO] ✅ Conexión a base de datos establecida")
        return True
    except Exception as e:
        print(f"[ERROR] ❌ Error de conexión a base de datos: {e}")
        return False

def create_users():
    """Crear usuarios con roles específicos"""
    
    # Verificar conexión antes de continuar
    if not check_database_connection():
        return
    
    users_data = [
        {
            'email': 'admin@lateral360.com',
            'first_name': 'Admin',
            'last_name': 'Sistema',
            'role': 'admin',
            'password': 'admin123',
            'is_staff': True,
            'is_superuser': True,
            'department': 'Administración',  # ✅ Agregar department para admin
        },
        {
            'email': 'propietario@lateral360.com',
            'first_name': 'María',
            'last_name': 'Propietaria',
            'role': 'owner',
            'password': 'propietario123',
            'phone': '+57 300 123 4567',
        },
        {
            'email': 'desarrollador@lateral360.com',
            'first_name': 'Carlos',
            'last_name': 'Desarrollador',
            'role': 'developer',
            'password': 'desarrollador123',
            'company': 'Constructora ABC',
            'phone': '+57 300 765 4321',
        }
    ]
    
    for user_data in users_data:
        email = user_data['email']
        
        # Verificar si el usuario ya existe
        if User.objects.filter(email=email).exists():
            print(f"[INFO] Usuario {email} ya existe")
            continue
        
        # Generar un username único basado en el email
        username = email.split('@')[0]
        counter = 1
        original_username = username
        
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1
        
        user_data['username'] = username
        
        # Extraer contraseña antes de crear el usuario
        password = user_data.pop('password')
        
        try:
            # Crear usuario
            user = User.objects.create_user(**user_data)
            user.set_password(password)
            user.is_verified = True
            user.save()
            
            print(f"[SUCCESS] Usuario {email} creado con rol {user.role}")
        except Exception as e:
            print(f"[ERROR] Error creando usuario {email}: {e}")
    
    print("\n[COMPLETE] Proceso de creación de usuarios finalizado")
    
    # Listar todos los usuarios
    print("\n[INFO] Usuarios en el sistema:")
    try:
        for user in User.objects.all():
            print(f"  - {user.email} ({user.role}) - Activo: {user.is_active}")
    except Exception as e:
        print(f"[ERROR] Error listando usuarios: {e}")

if __name__ == "__main__":
    create_users()
