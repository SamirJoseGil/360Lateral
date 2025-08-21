#!/usr/bin/env python
"""
Script para crear usuario de prueba
"""

import os
import sys
from pathlib import Path

def main():
    """Crear usuario de prueba"""
    BASE_DIR = Path(__file__).resolve().parent
    sys.path.insert(0, str(BASE_DIR))
    
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    
    import django
    django.setup()
    
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Crear usuario de prueba
    email = "test@lateral360.com"
    username = "testuser"
    password = "test123456"
    
    if User.objects.filter(email=email).exists():
        print(f"✅ Usuario {email} ya existe")
    else:
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            first_name="Test",
            last_name="User",
            is_active=True
        )
        print(f"✅ Usuario creado: {email} / {password}")
    
    # Crear admin si no existe
    admin_email = "admin@lateral360.com"
    if User.objects.filter(email=admin_email).exists():
        print(f"✅ Admin {admin_email} ya existe")
    else:
        admin = User.objects.create_user(
            email=admin_email,
            username="admin",
            password="admin123456",
            first_name="Admin",
            last_name="User",
            is_staff=True,
            is_superuser=True,
            role="admin"
        )
        print(f"✅ Admin creado: {admin_email} / admin123456")

if __name__ == '__main__':
    main()