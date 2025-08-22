"""
ASGI config for Lateral 360° project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

# Usar desarrollo por defecto, producción solo si se especifica explícitamente
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

application = get_asgi_application()
