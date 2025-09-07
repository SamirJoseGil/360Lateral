"""
Script para crear específicamente migraciones para la app 'lotes'.
"""
import os
import sys
import subprocess

def run_command(command):
    """Ejecuta un comando y muestra su salida"""
    print(f"Ejecutando: {command}")
    process = subprocess.Popen(
        command,
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate()
    
    if stdout:
        print("Salida:")
        print(stdout)
    
    if stderr:
        print("Errores:")
        print(stderr)
    
    return process.returncode

def main():
    """Función principal"""
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('manage.py'):
        print("Error: Este script debe ejecutarse desde el directorio raíz del proyecto Django.")
        sys.exit(1)
    
    # 1. Verificar que la app 'lotes' está en INSTALLED_APPS
    print("\n===== VERIFICANDO APPS INSTALADAS =====")
    verification_result = run_command('python manage.py shell -c "from django.conf import settings; print(\'lotes\' in [app.split(\'.\')[-1] for app in settings.INSTALLED_APPS])"')
    
    # 2. Ejecutar makemigrations específico para la app lotes
    print("\n===== GENERANDO MIGRACIONES DE LOTES =====")
    if run_command('python manage.py makemigrations lotes') != 0:
        print("Error al generar migraciones para 'lotes'.")
        sys.exit(1)
    
    # 3. Mostrar las migraciones pendientes
    print("\n===== MIGRACIONES PENDIENTES =====")
    run_command('python manage.py showmigrations lotes')
    
    # 4. Aplicar migraciones de lotes
    print("\n===== APLICANDO MIGRACIONES DE LOTES =====")
    if run_command('python manage.py migrate lotes') != 0:
        print("Error al aplicar migraciones para 'lotes'.")
        sys.exit(1)
    
    print("\n✅ Proceso completado. Las tablas de lotes deberían estar creadas ahora.")
    print("Prueba tu aplicación nuevamente para verificar si el error fue resuelto.")

if __name__ == "__main__":
    main()