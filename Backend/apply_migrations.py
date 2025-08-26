"""
Script para generar y aplicar migraciones a la base de datos.
Útil cuando aparecen errores como "no existe la relación «lotes_lote»".
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
    
    # 1. Ejecutar makemigrations para generar las migraciones pendientes
    print("\n===== GENERANDO MIGRACIONES =====")
    if run_command('python manage.py makemigrations') != 0:
        print("Error al generar migraciones.")
        sys.exit(1)
    
    # 2. Mostrar las migraciones pendientes
    print("\n===== MIGRACIONES PENDIENTES =====")
    run_command('python manage.py showmigrations')
    
    # 3. Aplicar migraciones
    print("\n===== APLICANDO MIGRACIONES =====")
    if run_command('python manage.py migrate') != 0:
        print("Error al aplicar migraciones.")
        sys.exit(1)
    
    # 4. Verificar el estado final de las migraciones
    print("\n===== ESTADO FINAL DE MIGRACIONES =====")
    run_command('python manage.py showmigrations')
    
    print("\n✅ Proceso completado. Las tablas deberían estar creadas ahora.")
    print("Prueba tu aplicación nuevamente para verificar si el error fue resuelto.")

if __name__ == "__main__":
    main()