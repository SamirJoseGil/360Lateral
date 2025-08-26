"""
Script para diagnosticar y solucionar problemas con la app lotes.
Realiza las siguientes operaciones:
1. Verifica si la app 'lotes' está en INSTALLED_APPS
2. Verifica si existe la carpeta de migraciones
3. Crea una migración inicial si no existe
4. Aplica las migraciones
5. Verifica si las tablas existen en la base de datos
"""
import os
import sys
import subprocess
import re
import time
import django
from pathlib import Path

def run_command(command, silent=False):
    """Ejecuta un comando y muestra su salida"""
    if not silent:
        print(f"Ejecutando: {command}")
    
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate()
    
    if stdout and not silent:
        print("Salida:")
        print(stdout)
    
    if stderr and not silent:
        print("Errores:")
        print(stderr)
    
    return process.returncode, stdout, stderr

def check_installed_apps():
    """Verifica si la app 'lotes' está en INSTALLED_APPS"""
    print("\n===== VERIFICANDO SI 'lotes' ESTÁ EN INSTALLED_APPS =====")
    
    try:
        # Configurar Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        django.setup()
        
        # Importar configuración
        from django.conf import settings
        
        # Verificar si 'lotes' o 'apps.lotes' está en las apps instaladas
        installed_apps = settings.INSTALLED_APPS
        lotes_app = any(app == 'lotes' or app == 'apps.lotes' or app.endswith('.lotes') for app in installed_apps)
        
        if lotes_app:
            print("✅ La app 'lotes' está correctamente registrada en INSTALLED_APPS.")
            return True
        else:
            print("❌ La app 'lotes' NO está registrada en INSTALLED_APPS.")
            
            # Intentar agregar automáticamente
            print("\nIntentando agregar 'apps.lotes' a INSTALLED_APPS...")
            add_to_installed_apps()
            return False
    
    except Exception as e:
        print(f"❌ Error al verificar INSTALLED_APPS: {str(e)}")
        return False

def add_to_installed_apps():
    """Intenta agregar 'apps.lotes' a INSTALLED_APPS"""
    settings_files = []
    
    # Buscar en las ubicaciones comunes
    base_dirs = ["config", "backend", "myproject", "app", "."]
    for base_dir in base_dirs:
        if os.path.exists(base_dir):
            for root, dirs, files in os.walk(base_dir):
                for file in files:
                    if file.endswith("settings.py") or "settings" in file and file.endswith(".py"):
                        settings_files.append(os.path.join(root, file))
    
    if not settings_files:
        print("❌ No se encontraron archivos de configuración.")
        return False
    
    success = False
    for settings_file in settings_files:
        print(f"Verificando {settings_file}...")
        
        try:
            with open(settings_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Buscar la sección INSTALLED_APPS
            installed_apps_pattern = r'INSTALLED_APPS\s*=\s*\[(.*?)\]'
            match = re.search(installed_apps_pattern, content, re.DOTALL)
            
            if not match:
                continue
            
            installed_apps_content = match.group(1)
            
            # Verificar si 'apps.lotes' ya está incluido
            if "'apps.lotes'" in installed_apps_content or '"apps.lotes"' in installed_apps_content:
                continue
            
            if "'lotes'" in installed_apps_content or '"lotes"' in installed_apps_content:
                continue
            
            # Encontrar el último elemento de INSTALLED_APPS
            last_app_pattern = r',\s*([\'"][^\'",]+[\'"])\s*\]'
            last_app_match = re.search(last_app_pattern, content)
            
            if last_app_match:
                # Agregar 'apps.lotes' después del último elemento
                modified_content = content.replace(
                    last_app_match.group(0),
                    f",\n    'apps.lotes',\n]"
                )
                
                with open(settings_file, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                
                print(f"✅ Se agregó 'apps.lotes' a INSTALLED_APPS en {settings_file}")
                success = True
                break
        
        except Exception as e:
            print(f"Error al procesar {settings_file}: {str(e)}")
    
    return success

def check_migrations_folder():
    """Verifica si existe la carpeta de migraciones y la crea si no existe"""
    print("\n===== VERIFICANDO CARPETA DE MIGRACIONES =====")
    
    migrations_dir = Path("apps/lotes/migrations")
    
    if not migrations_dir.exists():
        print(f"❌ No existe la carpeta {migrations_dir}")
        print("Creando carpeta de migraciones...")
        
        try:
            migrations_dir.mkdir(parents=True, exist_ok=True)
            init_file = migrations_dir / "__init__.py"
            
            with open(init_file, 'w') as f:
                f.write("# Este archivo es necesario para que Python reconozca este directorio como un paquete")
            
            print(f"✅ Se creó la carpeta {migrations_dir} y el archivo __init__.py")
        except Exception as e:
            print(f"❌ Error al crear la carpeta de migraciones: {str(e)}")
            return False
    else:
        print(f"✅ La carpeta {migrations_dir} existe.")
        
        # Verificar si existe __init__.py
        init_file = migrations_dir / "__init__.py"
        if not init_file.exists():
            try:
                with open(init_file, 'w') as f:
                    f.write("# Este archivo es necesario para que Python reconozca este directorio como un paquete")
                print(f"✅ Se creó el archivo {init_file}")
            except Exception as e:
                print(f"❌ Error al crear {init_file}: {str(e)}")
    
    return True

def create_initial_migration():
    """Crea una migración inicial si no existe"""
    print("\n===== VERIFICANDO MIGRACIONES EXISTENTES =====")
    
    migrations_dir = Path("apps/lotes/migrations")
    migration_files = list(migrations_dir.glob("*.py"))
    
    # Filtrar el archivo __init__.py
    migration_files = [f for f in migration_files if f.name != "__init__.py"]
    
    if migration_files:
        print(f"✅ Ya existen {len(migration_files)} archivos de migración:")
        for f in migration_files:
            print(f"   - {f.name}")
        return True
    
    print("❌ No existen archivos de migración.")
    print("\n===== CREANDO MIGRACIÓN INICIAL =====")
    
    # Intentar crear migración automáticamente
    try:
        returncode, stdout, stderr = run_command("python manage.py makemigrations lotes")
        
        if returncode != 0:
            print("❌ Error al crear migración automáticamente.")
            print("\n===== CREANDO MIGRACIÓN MANUALMENTE =====")
            
            # Crear migración inicial manualmente
            initial_migration = migrations_dir / "0001_initial.py"
            
            migration_content = """# Generated manually to fix migration issues
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),  # Asumiendo que la app 'users' tiene una migración inicial
    ]

    operations = [
        migrations.CreateModel(
            name='Lote',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=255)),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('direccion', models.CharField(max_length=255)),
                ('area', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('codigo_catastral', models.CharField(blank=True, max_length=30, null=True, unique=True)),
                ('matricula', models.CharField(blank=True, max_length=30, null=True, unique=True)),
                ('cbml', models.CharField(blank=True, max_length=20, null=True)),
                ('latitud', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitud', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('estrato', models.IntegerField(blank=True, choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5'), (6, '6')], null=True)),
                ('tratamiento_pot', models.CharField(blank=True, max_length=100, null=True)),
                ('uso_suelo', models.CharField(blank=True, max_length=100, null=True)),
                ('status', models.CharField(choices=[('active', 'Activo'), ('pending', 'Pendiente'), ('archived', 'Archivado')], default='active', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lotes', to='users.user', verbose_name='Propietario')),
            ],
            options={
                'verbose_name': 'Lote',
                'verbose_name_plural': 'Lotes',
                'ordering': ['-created_at'],
            },
        ),
    ]
"""
            try:
                with open(initial_migration, 'w') as f:
                    f.write(migration_content)
                print(f"✅ Se creó manualmente la migración inicial: {initial_migration}")
                return True
            except Exception as e:
                print(f"❌ Error al crear manualmente la migración inicial: {str(e)}")
                return False
        else:
            print("✅ Migración creada automáticamente.")
            return True
    
    except Exception as e:
        print(f"❌ Error inesperado al crear migración: {str(e)}")
        return False

def apply_migrations():
    """Aplica las migraciones"""
    print("\n===== APLICANDO MIGRACIONES =====")
    
    try:
        returncode, stdout, stderr = run_command("python manage.py migrate lotes")
        
        if returncode != 0:
            print("❌ Error al aplicar migraciones.")
            return False
        
        print("✅ Migraciones aplicadas correctamente.")
        return True
    
    except Exception as e:
        print(f"❌ Error inesperado al aplicar migraciones: {str(e)}")
        return False

def check_tables():
    """Verifica si las tablas existen en la base de datos"""
    print("\n===== VERIFICANDO TABLAS EN LA BASE DE DATOS =====")
    
    try:
        # Configurar Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        django.setup()
        
        # Importar configuración
        from django.conf import settings
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Verificar tabla lotes_lote
            cursor.execute(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %s)",
                ['lotes_lote']
            )
            exists = cursor.fetchone()[0]
            
            if exists:
                print("✅ La tabla 'lotes_lote' existe en la base de datos.")
                
                # Contar registros
                cursor.execute("SELECT COUNT(*) FROM lotes_lote")
                count = cursor.fetchone()[0]
                print(f"   La tabla contiene {count} registros.")
                
                return True
            else:
                print("❌ La tabla 'lotes_lote' NO existe en la base de datos.")
                return False
    
    except Exception as e:
        print(f"❌ Error al verificar tablas: {str(e)}")
        
        if "relation" in str(e) and "does not exist" in str(e):
            print("   Este error confirma que la tabla no existe.")
        
        return False

def main():
    """Función principal"""
    print("===== DIAGNÓSTICO DE LA APP LOTES =====")
    
    # Verificar si estamos en el directorio raíz del proyecto
    if not os.path.exists('manage.py'):
        print("❌ Este script debe ejecutarse desde el directorio raíz del proyecto Django.")
        sys.exit(1)
    
    # 1. Verificar si la app está en INSTALLED_APPS
    app_in_installed = check_installed_apps()
    
    # 2. Verificar carpeta de migraciones
    migrations_folder_ok = check_migrations_folder()
    
    # 3. Crear migración inicial si no existe
    migration_created = create_initial_migration()
    
    # 4. Aplicar migraciones
    migrations_applied = apply_migrations()
    
    # 5. Verificar tablas
    tables_exist = check_tables()
    
    # Resumen final
    print("\n===== RESUMEN DEL DIAGNÓSTICO =====")
    print(f"App en INSTALLED_APPS: {'✅' if app_in_installed else '❌'}")
    print(f"Carpeta de migraciones: {'✅' if migrations_folder_ok else '❌'}")
    print(f"Migración inicial: {'✅' if migration_created else '❌'}")
    print(f"Migraciones aplicadas: {'✅' if migrations_applied else '❌'}")
    print(f"Tablas en base de datos: {'✅' if tables_exist else '❌'}")
    
    if tables_exist:
        print("\n✅ ¡Todo parece estar correcto! La app 'lotes' está configurada correctamente.")
        print("   Prueba tu aplicación nuevamente para verificar si el error fue resuelto.")
    else:
        print("\n❌ Todavía hay problemas con la app 'lotes'.")
        print("   Intenta ejecutar este script nuevamente o sigue los siguientes pasos manualmente:")
        print("   1. Asegúrate de que 'apps.lotes' esté en INSTALLED_APPS")
        print("   2. Ejecuta: python manage.py makemigrations lotes")
        print("   3. Ejecuta: python manage.py migrate lotes")
        print("   4. Reinicia tu servidor Django")

if __name__ == "__main__":
    main()