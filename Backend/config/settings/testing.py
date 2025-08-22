"""
Testing settings for Lateral 360° project.
"""

from .base import *
from .security import *

# =============================================================================
# TESTING OVERRIDES
# =============================================================================

# Security settings for testing
SECRET_KEY = 'django-test-secret-key-not-for-production'
DEBUG = False  # Testing should be done with DEBUG=False
ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# =============================================================================
# TEST DATABASE
# =============================================================================

# Use in-memory SQLite for faster tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# =============================================================================
# CACHE FOR TESTING
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# =============================================================================
# EMAIL FOR TESTING
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# =============================================================================
# LOGGING FOR TESTING
# =============================================================================

# Disable logging during tests
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['null'],
        },
    }
}

# =============================================================================
# PASSWORD VALIDATION FOR TESTING
# =============================================================================

# Disable password validation for testing
AUTH_PASSWORD_VALIDATORS = []

# =============================================================================
# SECURITY FOR TESTING
# =============================================================================

# Disable CSRF for API testing
REST_FRAMEWORK.update({
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
})
