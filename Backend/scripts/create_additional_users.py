"""
Script para crear usuarios adicionales con roles específicos
"""
import os
import sys
import time
from pathlib import Path

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

try:
    import django
    django.setup()
except Exception as e:
    print(f"[ERROR] ❌ Error configurando Django: {e}")
    sys.exit(1)

from apps.users.models import User
from django.db import connection, OperationalError

def wait_for_db(max_retries=10):
    """Esperar a que la base de datos esté lista"""
    for i in range(max_retries):
        try:
            connection.ensure_connection()
            print("[INFO] ✅ Conexión a base de datos establecida")
            return True
        except OperationalError:
            print(f"[INFO] ⏳ Esperando base de datos... (intento {i+1}/{max_retries})")
            time.sleep(2)
    print("[ERROR] ❌ No se pudo conectar a la base de datos")
    return False

def get_safe_user_data(base_data):
    """Obtener datos de usuario seguros, filtrando campos que no existen"""
    safe_data = {}
    
    # Obtener todos los campos del modelo User
    user_fields = [field.name for field in User._meta.get_fields()]
    
    for key, value in base_data.items():
        if key in user_fields:
            safe_data[key] = value
        else:
            print(f"[WARNING] ⚠️  Campo '{key}' no existe en el modelo User, omitiendo...")
    
    return safe_data

def create_users():
    """Crear usuarios con roles específicos"""
    
    # Verificar conexión antes de continuar
    if not wait_for_db():
        sys.exit(1)
    
    # ✅ Datos base de usuarios con TODOS los campos requeridos según el modelo
    users_data = [
        {
            'email': 'admin@lateral360.com',
            'first_name': 'Admin',
            'last_name': 'Sistema',
            'role': 'admin',
            'password': 'admin123',
            'is_staff': True,
            'is_superuser': True,
            # Campos específicos para admin
            'department': 'IT',  # Campo requerido para admin
            'permissions_scope': 'full',  # Campo requerido para admin
        },
        {
            'email': 'propietario@lateral360.com',
            'first_name': 'María',
            'last_name': 'Propietaria',
            'role': 'owner',
            'password': 'propietario123',
            'phone': '+57 300 123 4567',
            # ✅ CRÍTICO: Campos requeridos para propietarios
            'document_type': 'CC',  # Cédula de ciudadanía
            'document_number': '12345678',
            'address': 'Carrera 43A #16-25, Medellín',
        },
        {
            'email': 'desarrollador@lateral360.com',
            'first_name': 'Carlos',
            'last_name': 'Desarrollador',
            'role': 'developer',
            'password': 'desarrollador123',
            'phone': '+57 300 765 4321',
            # ✅ CRÍTICO: Campos requeridos para desarrolladores
            'company_name': 'Constructora ABC S.A.S.',  # Campo requerido
            'company_nit': '900123456-7',
            'position': 'Gerente de Proyectos',
            'experience_years': 8,
            'focus_area': 'residential',  # residential, commercial, mixed, industrial
        }
    ]
    
    print(f"[INFO] 🚀 Iniciando creación de {len(users_data)} usuarios...")
    
    for i, user_data in enumerate(users_data, 1):
        email = user_data['email']
        print(f"\n[INFO] 👤 Procesando usuario {i}/{len(users_data)}: {email}")
        
        # Verificar si el usuario ya existe
        if User.objects.filter(email=email).exists():
            print(f"[INFO] ℹ️  Usuario {email} ya existe, omitiendo...")
            continue
        
        # Generar un username único basado en el email
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user_data['username'] = username
        
        # Extraer contraseña antes de crear el usuario
        password = user_data.pop('password')
        
        # Filtrar datos seguros
        safe_data = get_safe_user_data(user_data)
        
        try:
            print(f"[INFO] 🔧 Creando usuario {safe_data['role']} con datos: {list(safe_data.keys())}")
            
            # ✅ SEPARAR campos especiales antes de crear
            is_staff = safe_data.pop('is_staff', False)
            is_superuser = safe_data.pop('is_superuser', False)
            
            # Crear usuario según tipo
            if is_superuser:
                print(f"[INFO] 👑 Creando superusuario...")
                user = User.objects.create_superuser(
                    email=safe_data['email'],
                    username=safe_data['username'],
                    password=password,
                    **{k: v for k, v in safe_data.items() if k not in ['email', 'username']}
                )
            else:
                print(f"[INFO] 👤 Creando usuario regular...")
                user = User.objects.create_user(
                    email=safe_data['email'],
                    username=safe_data['username'],
                    password=password,
                    **{k: v for k, v in safe_data.items() if k not in ['email', 'username']}
                )
            
            # Configurar campos adicionales
            if is_staff:
                user.is_staff = True
            if is_superuser:
                user.is_superuser = True
                
            # Asegurar que esté verificado
            user.is_verified = True
            user.save()
            
            print(f"[SUCCESS] ✅ Usuario {email} creado exitosamente")
            print(f"           - Username: {user.username}")
            print(f"           - Rol: {user.role}")
            print(f"           - Password: {password}")
            
            # Mostrar campos específicos según rol
            if user.role == 'owner':
                print(f"           - Documento: {user.document_type} {user.document_number}")
                print(f"           - Dirección: {user.address}")
            elif user.role == 'developer':
                print(f"           - Empresa: {user.company_name}")
                print(f"           - NIT: {user.company_nit}")
                print(f"           - Experiencia: {user.experience_years} años")
            elif user.role == 'admin':
                print(f"           - Departamento: {user.department}")
                print(f"           - Alcance: {user.permissions_scope}")
            
        except Exception as e:
            print(f"[ERROR] ❌ Error creando usuario {email}: {e}")
            import traceback
            print(f"[DEBUG] Traceback: {traceback.format_exc()}")
            
            # Intentar obtener detalles del error
            if hasattr(e, 'message_dict'):
                print(f"[ERROR] Detalles de validación: {e.message_dict}")
            
            continue
    
    print(f"\n[COMPLETE] 🎉 Proceso de creación de usuarios finalizado")
    
    # Listar todos los usuarios creados
    print(f"\n[INFO] 📋 Usuarios en el sistema:")
    try:
        users = User.objects.all().order_by('email')
        if users.exists():
            for user in users:
                status = "✅ Activo" if user.is_active else "❌ Inactivo"
                staff_status = " (Staff)" if user.is_staff else ""
                super_status = " (Superuser)" if user.is_superuser else ""
                print(f"  - {user.email} ({user.role}){staff_status}{super_status} - {status}")
        else:
            print("  No hay usuarios en el sistema")
    except Exception as e:
        print(f"[ERROR] ❌ Error listando usuarios: {e}")

def get_field_choices_info():
    """Obtener información sobre las opciones de campos del modelo"""
    try:
        print("\n[DEBUG] 🔍 Información de campos del modelo User:")
        
        # Obtener choices de campos específicos
        field_info = {}
        
        for field in User._meta.get_fields():
            if hasattr(field, 'choices') and field.choices:
                field_info[field.name] = [choice[0] for choice in field.choices]
        
        if field_info:
            for field_name, choices in field_info.items():
                print(f"  - {field_name}: {choices}")
        else:
            print("  No se encontraron campos con choices definidas")
            
    except Exception as e:
        print(f"[ERROR] Error obteniendo info de campos: {e}")

def main():
    """Función principal"""
    try:
        print("=" * 60)
        print("🚀 LATERAL 360° - CREAR USUARIOS ADICIONALES")
        print("=" * 60)
        
        # Mostrar información de debug en caso de errores
        get_field_choices_info()
        
        create_users()
        
        print("\n" + "=" * 60)
        print("✅ Script completado exitosamente")
        print("⚠️  IMPORTANTE: Cambiar las contraseñas en producción")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n[INFO] ⚠️  Script interrumpido por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] ❌ Error inesperado: {e}")
        import traceback
        print(f"[DEBUG] Traceback completo:\n{traceback.format_exc()}")
        sys.exit(1)

if __name__ == "__main__":
    main()
