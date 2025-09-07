"""
Script para instalar django-filter si no está presente.
"""
import subprocess
import sys

def install_django_filter():
    """Instala django-filter si no está presente"""
    try:
        import django_filters
        print("django-filter ya está instalado.")
    except ImportError:
        print("Instalando django-filter...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'django-filter'])
            print("django-filter instalado correctamente.")
        except subprocess.CalledProcessError as e:
            print(f"Error al instalar django-filter: {e}")
            sys.exit(1)

if __name__ == "__main__":
    install_django_filter()