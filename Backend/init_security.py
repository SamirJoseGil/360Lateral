#!/usr/bin/env python
"""
Script de inicialización de seguridad para Lateral 360°
Configura automáticamente las funcionalidades de seguridad implementadas
"""

import os
import sys
import django
from pathlib import Path

# Añadir el directorio del proyecto al path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.contrib.auth import get_user_model
from django.core.cache import cache
from app.models import SecurityLog

User = get_user_model()


def check_dependencies():
    """Verificar que todas las dependencias de seguridad estén instaladas"""
    print("🔍 Verificando dependencias de seguridad...")
    
    required_packages = [
        'magic',
        'redis', 
        'bleach',
        'rest_framework_simplejwt',
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} - Instalado")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} - NO INSTALADO")
    
    if missing_packages:
        print(f"\n🚨 Faltan dependencias: {', '.join(missing_packages)}")
        print("📦 Ejecuta: pip install -r requirements.txt")
        return False
    
    print("✅ Todas las dependencias de seguridad están instaladas\n")
    return True


def check_directories():
    """Crear directorios necesarios para seguridad"""
    print("📁 Verificando directorios...")
    
    directories = [
        BASE_DIR / 'logs',
        BASE_DIR / 'media',
        BASE_DIR / 'media' / 'documentos',
        BASE_DIR / 'static',
    ]
    
    for directory in directories:
        if not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
            print(f"📁 Creado: {directory}")
        else:
            print(f"✅ Existe: {directory}")
    
    print("✅ Todos los directorios están configurados\n")


def check_environment():
    """Verificar variables de entorno críticas"""
    print("🔧 Verificando variables de entorno...")
    
    critical_vars = {
        'SECRET_KEY': 'Clave secreta de Django',
        'DB_NAME': 'Nombre de la base de datos',
        'DB_USER': 'Usuario de la base de datos',
        'DB_PASSWORD': 'Contraseña de la base de datos',
    }
    
    recommended_vars = {
        'JWT_SECRET_KEY': 'Clave secreta JWT',
        'REDIS_URL': 'URL de Redis',
        'ALLOWED_HOSTS': 'Hosts permitidos',
    }
    
    # Verificar variables críticas
    missing_critical = []
    for var, description in critical_vars.items():
        if not os.environ.get(var):
            missing_critical.append(f"{var} ({description})")
            print(f"❌ {var} - NO CONFIGURADA")
        else:
            print(f"✅ {var} - Configurada")
    
    # Verificar variables recomendadas
    missing_recommended = []
    for var, description in recommended_vars.items():
        if not os.environ.get(var):
            missing_recommended.append(f"{var} ({description})")
            print(f"⚠️  {var} - NO CONFIGURADA (recomendada)")
        else:
            print(f"✅ {var} - Configurada")
    
    if missing_critical:
        print(f"\n🚨 Variables críticas faltantes:")
        for var in missing_critical:
            print(f"   - {var}")
        print("📝 Copia .env.example a .env y configura las variables")
        return False
    
    if missing_recommended:
        print(f"\n⚠️  Variables recomendadas faltantes:")
        for var in missing_recommended:
            print(f"   - {var}")
    
    print("✅ Variables de entorno verificadas\n")
    return True


def test_redis_connection():
    """Probar conexión a Redis"""
    print("🔗 Probando conexión a Redis...")
    
    try:
        cache.set('test_key', 'test_value', 10)
        value = cache.get('test_key')
        
        if value == 'test_value':
            print("✅ Redis - Conexión exitosa")
            cache.delete('test_key')
            return True
        else:
            print("❌ Redis - Error en get/set")
            return False
            
    except Exception as e:
        print(f"❌ Redis - Error de conexión: {str(e)}")
        print("💡 Redis es necesario para rate limiting")
        return False


def test_database_connection():
    """Probar conexión a la base de datos"""
    print("🗄️  Probando conexión a la base de datos...")
    
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            
        print("✅ Base de datos - Conexión exitosa")
        return True
        
    except Exception as e:
        print(f"❌ Base de datos - Error de conexión: {str(e)}")
        return False


def run_migrations():
    """Ejecutar migraciones si es necesario"""
    print("🔄 Verificando migraciones...")
    
    try:
        from django.core.management.commands.migrate import Command as MigrateCommand
        from django.core.management.commands.showmigrations import Command as ShowMigrationsCommand
        from io import StringIO
        
        # Verificar si hay migraciones pendientes
        output = StringIO()
        cmd = ShowMigrationsCommand()
        cmd.stdout = output
        cmd.handle(verbosity=0)
        
        if '[ ]' in output.getvalue():
            print("📦 Ejecutando migraciones pendientes...")
            execute_from_command_line(['manage.py', 'migrate', '--verbosity=1'])
            print("✅ Migraciones completadas")
        else:
            print("✅ No hay migraciones pendientes")
            
        return True
        
    except Exception as e:
        print(f"❌ Error en migraciones: {str(e)}")
        return False


def create_admin_user():
    """Crear usuario administrador si no existe"""
    print("👤 Verificando usuario administrador...")
    
    admin_users = User.objects.filter(role='admin')
    
    if admin_users.exists():
        print(f"✅ Usuario admin existe: {admin_users.first().email}")
        return True
    
    print("🆕 Creando usuario administrador...")
    
    # Datos por defecto para admin
    admin_data = {
        'email': 'admin@lateral360.com',
        'username': 'admin',
        'first_name': 'Admin',
        'last_name': 'Sistema',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'is_active': True,
    }
    
    try:
        admin_user = User.objects.create_user(**admin_data)
        admin_user.set_password('Admin123!Change')  # Contraseña temporal
        admin_user.save()
        
        print(f"✅ Usuario admin creado: {admin_user.email}")
        print("🔐 Contraseña temporal: Admin123!Change")
        print("⚠️  IMPORTANTE: Cambiar esta contraseña inmediatamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creando admin: {str(e)}")
        return False


def verify_security_features():
    """Verificar que las funcionalidades de seguridad estén activas"""
    print("🛡️  Verificando funcionalidades de seguridad...")
    
    from django.conf import settings
    
    security_checks = {
        'JWT_AUTHENTICATION': hasattr(settings, 'SIMPLE_JWT'),
        'SECURITY_MIDDLEWARE': 'app.middleware.SecurityHeadersMiddleware' in settings.MIDDLEWARE,
        'RATE_LIMITING': 'app.middleware.RateLimitMiddleware' in settings.MIDDLEWARE,
        'SECURITY_LOGGING': 'app.middleware.SecurityLoggingMiddleware' in settings.MIDDLEWARE,
        'CUSTOM_USER_MODEL': settings.AUTH_USER_MODEL == 'app.User',
        'CORS_CONFIGURED': hasattr(settings, 'CORS_ALLOWED_ORIGINS'),
    }
    
    all_enabled = True
    for feature, enabled in security_checks.items():
        if enabled:
            print(f"✅ {feature}")
        else:
            print(f"❌ {feature}")
            all_enabled = False
    
    if all_enabled:
        print("✅ Todas las funcionalidades de seguridad están activas\n")
    else:
        print("⚠️  Algunas funcionalidades de seguridad no están activas\n")
    
    return all_enabled


def main():
    """Función principal de inicialización"""
    print("🚀 Inicializando seguridad de Lateral 360°\n")
    print("=" * 60)
    
    checks = [
        ("Dependencias", check_dependencies),
        ("Directorios", check_directories),
        ("Variables de entorno", check_environment),
        ("Conexión Redis", test_redis_connection),
        ("Conexión BD", test_database_connection),
        ("Migraciones", run_migrations),
        ("Usuario Admin", create_admin_user),
        ("Funcionalidades", verify_security_features),
    ]
    
    results = {}
    
    for check_name, check_func in checks:
        try:
            results[check_name] = check_func()
        except Exception as e:
            print(f"❌ Error en {check_name}: {str(e)}")
            results[check_name] = False
        
        print("-" * 40)
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE INICIALIZACIÓN")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for check_name, result in results.items():
        status_icon = "✅" if result else "❌"
        print(f"{status_icon} {check_name}")
    
    print(f"\n📊 Resultado: {passed}/{total} verificaciones exitosas")
    
    if passed == total:
        print("🎉 ¡Seguridad completamente configurada!")
        print("🚀 El backend está listo para usar de forma segura")
        print("\n🔐 Credenciales de admin temporal:")
        print("   Email: admin@lateral360.com")
        print("   Password: Admin123!Change")
        print("   ⚠️  CAMBIAR INMEDIATAMENTE")
    else:
        print("⚠️  Configuración incompleta - revisar errores")
        print("📝 Consultar documentación en info/users.md")
    
    print("\n" + "=" * 60)


if __name__ == '__main__':
    main()