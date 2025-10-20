"""
Script para crear superusuario de forma segura.
"""
import os
import sys
import time
import django
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
except Exception as e:
    print(f'❌ Error setting up Django: {str(e)}')
    sys.exit(1)

from django.contrib.auth import get_user_model
from django.db import connection, OperationalError

User = get_user_model()

def wait_for_db(max_retries=10):
    """Esperar a que la base de datos esté lista"""
    for i in range(max_retries):
        try:
            connection.ensure_connection()
            print('✅ Database connection established')
            return True
        except OperationalError:
            print(f'⏳ Waiting for database... (attempt {i+1}/{max_retries})')
            time.sleep(2)
    return False

def get_valid_department():
    """Obtener un department válido del modelo User"""
    try:
        # Intentar obtener las opciones de department del modelo
        department_field = User._meta.get_field('department')
        if hasattr(department_field, 'choices') and department_field.choices:
            valid_departments = [choice[0] for choice in department_field.choices]
            print(f'📋 Departments disponibles: {valid_departments}')
            # Usar el primer department válido o 'IT' como fallback común
            return valid_departments[0] if valid_departments else 'IT'
        else:
            print('⚠️  Campo department no tiene choices definidas, usando None')
            return None
    except Exception as e:
        print(f'⚠️  Error obteniendo department field: {e}')
        return None

def create_superuser():
    """Crea un superusuario si no existe"""
    
    # Esperar a que la base de datos esté lista
    if not wait_for_db():
        print('❌ Could not connect to database')
        sys.exit(1)
    
    # Datos del superusuario
    email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@lateral360.com')
    username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
    password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin123')
    
    try:
        # Verificar si ya existe
        if User.objects.filter(email=email).exists():
            print(f'ℹ️  User with email {email} already exists')
            return
        
        if User.objects.filter(username=username).exists():
            print(f'ℹ️  User with username {username} already exists')
            return
        
        # Obtener department válido
        department = get_valid_department()
        
        # Datos del usuario
        user_data = {
            'email': email,
            'username': username,
            'password': password,
            'first_name': 'Admin',
            'last_name': 'System',
            'role': 'admin',
        }
        
        # Solo agregar department si es un valor válido
        if department is not None:
            user_data['department'] = department
            print(f'📍 Usando department: {department}')
        else:
            print('⚠️  Creando usuario SIN department (campo opcional)')
        
        # Crear superusuario
        user = User.objects.create_superuser(**user_data)
        
        # Asegurar que esté verificado
        user.is_verified = True
        user.save()
        
        print('✅ Superuser created successfully!')
        print(f'   Email: {email}')
        print(f'   Username: {username}')
        print(f'   Password: {password}')
        if department:
            print(f'   Department: {department}')
        print('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!')
        
    except Exception as e:
        print(f'❌ Error creating superuser: {str(e)}')
        import traceback
        traceback.print_exc()
        
        # Intentar crear sin department si falla
        try:
            print('\n🔄 Intentando crear superuser SIN department...')
            user = User.objects.create_superuser(
                email=email,
                username=username,
                password=password,
                first_name='Admin',
                last_name='System',
                role='admin'
            )
            user.is_verified = True
            user.save()
            print('✅ Superuser created successfully (without department)!')
        except Exception as e2:
            print(f'❌ Error en segundo intento: {str(e2)}')
            sys.exit(1)

if __name__ == '__main__':
    create_superuser()
