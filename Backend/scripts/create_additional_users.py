"""
Script para crear usuarios adicionales en Lateral 360°
Incluye: admin, propietario y desarrollador con datos de ejemplo
ACTUALIZADO: Compatible con modelo User actualizado (sin campos eliminados)
"""

import os
import sys
import django
from pathlib import Path

# Configurar el path de Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Configurar Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.exceptions import ValidationError
from apps.users.models import User

def print_separator():
    print("=" * 60)

def print_header():
    print_separator()
    print("🚀 LATERAL 360° - CREAR USUARIOS ADICIONALES")
    print_separator()

def print_user_model_info():
    """Imprime información de los campos del modelo User para debugging"""
    print("\n[DEBUG] 🔍 Información de campos del modelo User:")
    
    # Obtener choices de los campos
    field_choices = {
        'role': User.ROLE_CHOICES,
        'developer_type': User.DEVELOPER_TYPE_CHOICES,
        'person_type': User.PERSON_TYPE_CHOICES,
        'document_type': User.DOCUMENT_TYPE_CHOICES,
    }
    
    for field_name, choices in field_choices.items():
        print(f"\n  📋 {field_name}:")
        for value, label in choices:
            print(f"     - '{value}': {label}")
    
    print()

def create_users():
    """Crear usuarios de ejemplo"""
    
    print("[INFO] ✅ Conexión a base de datos establecida")
    
    # Definición de usuarios a crear
    users_data = [
        {
            'email': 'admin@lateral360.com',
            'username': 'admin',
            'first_name': 'Admin',
            'last_name': 'Sistema',
            'password': 'admin123',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
        },
        {
            'email': 'propietario@lateral360.com',
            'username': 'propietario',
            'first_name': 'Juan',
            'last_name': 'Propietario',
            'password': 'propietario123',
            'role': 'owner',
            'phone': '+57 300 123 4567',
            'document_type': 'CC',
            'document_number': '12345678',
            'legal_name': 'Juan Propietario',
            'person_type': 'natural',
        },
        {
            'email': 'desarrollador@lateral360.com',
            'username': 'desarrollador',
            'first_name': 'María',
            'last_name': 'Desarrolladora',
            'password': 'desarrollador123',
            'role': 'developer',
            'phone': '+57 301 234 5678',
            # ✅ Campos obligatorios para developers
            'developer_type': 'constructora',
            'person_type': 'juridica',
            'legal_name': 'Constructora ABC S.A.S.',
            'document_type': 'NIT',
            'document_number': '900123456',
            # ✅ Campos de perfil de inversión
            'ciudades_interes': ['Medellín', 'Bogotá'],
            'usos_preferidos': ['residencial', 'comercial'],
            'modelos_pago': ['contado', 'hitos'],
            'volumen_ventas_min': 'entre_150_350',
            'ticket_inversion_min': 'entre_150_350',
            'perfil_completo': True,
        },
    ]
    
    print(f"[INFO] 🚀 Iniciando creación de {len(users_data)} usuarios...\n")
    
    created_count = 0
    error_count = 0
    
    for idx, user_data in enumerate(users_data, 1):
        email = user_data['email']
        print(f"[INFO] 👤 Procesando usuario {idx}/{len(users_data)}: {email}")
        
        try:
            # Verificar si el usuario ya existe
            if User.objects.filter(email=email).exists():
                print(f"[WARNING] ⚠️  Usuario {email} ya existe, omitiendo...\n")
                continue
            
            # Extraer password antes de crear
            password = user_data.pop('password')
            
            # ✅ Log de datos antes de crear
            print(f"[DEBUG] 📋 Creando usuario con datos:")
            print(f"  - email: {user_data.get('email')}")
            print(f"  - role: {user_data.get('role')}")
            if user_data.get('role') == 'developer':
                print(f"  - developer_type: {user_data.get('developer_type')}")
                print(f"  - person_type: {user_data.get('person_type')}")
                print(f"  - legal_name: {user_data.get('legal_name')}")
            
            # Crear usuario según tipo
            if user_data.get('is_superuser'):
                print("[INFO] 👑 Creando superusuario...")
                user = User.objects.create_superuser(
                    email=user_data['email'],
                    username=user_data['username'],
                    password=password,
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                )
            else:
                print("[INFO] 👤 Creando usuario regular...")
                # ✅ Crear usuario con bypass de validación
                user = User(
                    email=user_data['email'],
                    username=user_data['username'],
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    role=user_data['role'],
                    is_active=True,
                )
                
                # Establecer contraseña
                user.set_password(password)
                
                # ✅ Agregar campos según rol
                if user_data['role'] == 'developer':
                    user.developer_type = user_data.get('developer_type')
                    user.person_type = user_data.get('person_type')
                    user.legal_name = user_data.get('legal_name')
                    user.document_type = user_data.get('document_type')
                    user.document_number = user_data.get('document_number')
                    user.phone = user_data.get('phone')
                    # Perfil de inversión
                    user.ciudades_interes = user_data.get('ciudades_interes', [])
                    user.usos_preferidos = user_data.get('usos_preferidos', [])
                    user.modelos_pago = user_data.get('modelos_pago', [])
                    user.volumen_ventas_min = user_data.get('volumen_ventas_min')
                    user.ticket_inversion_min = user_data.get('ticket_inversion_min')
                    user.perfil_completo = user_data.get('perfil_completo', False)
                
                elif user_data['role'] == 'owner':
                    user.person_type = user_data.get('person_type')
                    user.legal_name = user_data.get('legal_name')
                    user.document_type = user_data.get('document_type')
                    user.document_number = user_data.get('document_number')
                    user.phone = user_data.get('phone')
                
                # Guardar
                user.save()
            
            created_count += 1
            
            # Mostrar información del usuario creado
            print(f"[SUCCESS] ✅ Usuario {email} creado exitosamente")
            print(f"           - Username: {user.username}")
            print(f"           - Rol: {user.role}")
            print(f"           - Password: {password}")
            
            # Mostrar detalles según rol
            if user.role == 'developer':
                print(f"           - Tipo: {user.get_developer_type_display()}")
                print(f"           - Persona: {user.get_person_type_display()}")
                print(f"           - Empresa: {user.legal_name}")
                print(f"           - Documento: {user.get_document_type_display()} {user.document_number}")
                print(f"           - Ciudades: {', '.join(user.ciudades_interes)}")
                print(f"           - Usos: {', '.join(user.usos_preferidos)}")
                print(f"           - Perfil completo: {'✅' if user.perfil_completo else '❌'}")
            
            elif user.role == 'owner':
                print(f"           - Documento: {user.get_document_type_display()} {user.document_number}")
                print(f"           - Teléfono: {user.phone}")
            
            print()
            
        except ValidationError as e:
            error_count += 1
            print(f"[ERROR] ❌ Error de validación creando usuario {email}")
            print(f"[ERROR] Detalles: {e.message_dict}")
            print()
        
        except Exception as e:
            error_count += 1
            print(f"[ERROR] ❌ Error creando usuario {email}: {str(e)}")
            print(f"[DEBUG] Tipo de error: {type(e).__name__}")
            import traceback
            print(f"[DEBUG] Traceback: {traceback.format_exc()}")
            print()
    
    print("[COMPLETE] 🎉 Proceso de creación de usuarios finalizado\n")
    
    # Resumen final
    print("[INFO] 📋 Resumen de operación:")
    print(f"  - Usuarios creados exitosamente: {created_count}")
    print(f"  - Errores: {error_count}")
    print()
    
    # Listar todos los usuarios en el sistema
    print("[INFO] 📋 Usuarios en el sistema:")
    all_users = User.objects.all().order_by('email')
    for user in all_users:
        status_flags = []
        if user.is_staff:
            status_flags.append("Staff")
        if user.is_superuser:
            status_flags.append("Superuser")
        
        status = ' '.join([f"({flag})" for flag in status_flags])
        active = "✅ Activo" if user.is_active else "❌ Inactivo"
        
        print(f"  - {user.email} ({user.role}) {status} - {active}")
    
    print()

def main():
    """Función principal"""
    print_header()
    print_user_model_info()
    
    try:
        create_users()
        
        print_separator()
        print("✅ Script completado exitosamente")
        print("⚠️  IMPORTANTE: Cambiar las contraseñas en producción")
        print_separator()
        
    except Exception as e:
        print(f"\n[CRITICAL] ❌ Error crítico: {str(e)}")
        import traceback
        print(f"[DEBUG] Traceback completo:\n{traceback.format_exc()}")
        print_separator()
        sys.exit(1)

if __name__ == '__main__':
    main()
