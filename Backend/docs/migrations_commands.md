"""
Comandos de migración para los nuevos campos de usuario
"""

# Ejecuta estos comandos en tu terminal:

# 1. Crear la migración
python manage.py makemigrations users

# 2. Aplicar la migración  
python manage.py migrate users

# 3. (Opcional) Verificar que todo esté bien
python manage.py check