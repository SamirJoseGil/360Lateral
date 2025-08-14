"""
Script completo para configurar PostgreSQL y ejecutar migraciones
"""
import os
import sys
import subprocess
from pathlib import Path
from create_db_postgres import create_database

def run_command(command, description):
    """Ejecuta un comando y maneja errores"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completado")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error en {description}: {e}")
        if e.stdout:
            print(f"STDOUT: {e.stdout}")
        if e.stderr:
            print(f"STDERR: {e.stderr}")
        return False

def setup_postgresql():
    """Configuración completa de PostgreSQL"""
    
    print("🚀 Configurando PostgreSQL para Lateral 360°")
    
    # Verificar que estamos en el directorio correcto
    backend_dir = Path(__file__).parent.parent
    os.chdir(backend_dir)
    print(f"📁 Directorio de trabajo: {backend_dir}")
    
    # Paso 1: Crear base de datos
    print("\n📂 Paso 1: Crear base de datos PostgreSQL")
    if not create_database():
        print("❌ Error creando la base de datos")
        return False
    
    # Paso 2: Limpiar migraciones anteriores
    print("\n🧹 Paso 2: Limpiar migraciones anteriores")
    scripts_dir = Path(__file__).parent
    delete_migrations_script = scripts_dir / "delete_migrations.py"
    
    if delete_migrations_script.exists():
        if not run_command("python scripts/delete_migrations.py", "Limpieza de migraciones"):
            print("⚠️ Advertencia: No se pudieron limpiar las migraciones")
    
    # Paso 3: Crear nuevas migraciones
    print("\n📝 Paso 3: Crear migraciones")
    commands = [
        ("python manage.py makemigrations users", "Crear migraciones de usuarios"),
        ("python manage.py makemigrations lotes", "Crear migraciones de lotes"),
        ("python manage.py makemigrations", "Crear migraciones restantes"),
    ]
    
    for command, description in commands:
        if not run_command(command, description):
            print(f"❌ Error en: {description}")
            return False
    
    # Paso 4: Aplicar migraciones
    print("\n🔄 Paso 4: Aplicar migraciones")
    if not run_command("python manage.py migrate", "Aplicar migraciones"):
        print("❌ Error aplicando migraciones")
        return False
    
    # Paso 5: Crear usuarios demo
    print("\n👥 Paso 5: Crear usuarios de demostración")
    if not run_command("python manage.py create_demo_users", "Crear usuarios demo"):
        print("⚠️ Advertencia: No se pudieron crear usuarios demo")
    
    # Paso 6: Verificar conexión
    print("\n🔍 Paso 6: Verificar conexión a la base de datos")
    if not run_command("python manage.py shell -c \"from django.db import connection; print('✅ Conexión exitosa:', connection.vendor)\"", "Verificar conexión"):
        print("❌ Error verificando conexión")
        return False
    
    print("\n🎉 ¡Configuración de PostgreSQL completada exitosamente!")
    print("\n📋 Próximos pasos:")
    print("   1. Ejecutar: python manage.py runserver")
    print("   2. Acceder a: http://localhost:8000/admin")
    print("   3. Probar API: http://localhost:8000/api/")
    
    return True

if __name__ == "__main__":
    success = setup_postgresql()
    sys.exit(0 if success else 1)
