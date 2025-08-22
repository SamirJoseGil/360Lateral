"""
Security settings for Lateral 360° project.
These settings are shared across environments but can be overridden.
"""

import os

# =============================================================================
# SECURITY HEADERS
# =============================================================================

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# CORS settings base (will be overridden in development/production)
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# =============================================================================
# CSRF PROTECTION
# =============================================================================

CSRF_COOKIE_SECURE = not os.environ.get('DEBUG', 'True').lower() == 'true'
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not os.environ.get('DEBUG', 'True').lower() == 'true'
SESSION_COOKIE_HTTPONLY = True

# =============================================================================
# RATE LIMITING SETTINGS
# =============================================================================

# Rate limiting settings
LOGIN_RATE_LIMIT_IP = int(os.environ.get('LOGIN_RATE_LIMIT_IP', 5))
REGISTRATION_RATE_LIMIT = int(os.environ.get('REGISTRATION_RATE_LIMIT', 3))
ACCOUNT_LOCKOUT_ATTEMPTS = int(os.environ.get('ACCOUNT_LOCKOUT_ATTEMPTS', 5))
ACCOUNT_LOCKOUT_TIME = int(os.environ.get('ACCOUNT_LOCKOUT_TIME', 1800))

# =============================================================================
# SESSION & COOKIE SECURITY
# =============================================================================

# Session security
SESSION_COOKIE_AGE = int(os.environ.get('SESSION_COOKIE_AGE', 3600))  # 1 hour
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'  # Changed from 'Strict' for better compatibility
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# CSRF Protection
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'  # Changed from 'Strict' for better compatibility
CSRF_TRUSTED_ORIGINS = os.environ.get(
    'CSRF_TRUSTED_ORIGINS', 
    'http://localhost:3000,http://localhost:8002'
).split(',')

# =============================================================================
# CORS SECURITY
# =============================================================================

# CORS Headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# =============================================================================
# RATE LIMITING CONFIGURATION
# =============================================================================

# API Rate Limiting
API_RATE_LIMIT = {
    'LOGIN_ATTEMPTS': int(os.environ.get('LOGIN_RATE_LIMIT_IP', 5)),
    'REGISTRATION_ATTEMPTS': int(os.environ.get('REGISTRATION_RATE_LIMIT', 3)),
    'GENERAL_REQUESTS': int(os.environ.get('API_RATE_LIMIT_GENERAL', 1000)),
    'MAPGIS_REQUESTS': int(os.environ.get('MAPGIS_RATE_LIMIT', 100)),
}

# Rate limit periods (in seconds)
RATE_LIMIT_PERIODS = {
    'LOGIN': int(os.environ.get('LOGIN_RATE_LIMIT_PERIOD', 900)),  # 15 minutes
    'REGISTRATION': int(os.environ.get('REGISTRATION_RATE_LIMIT_PERIOD', 3600)),  # 1 hour
    'GENERAL': int(os.environ.get('API_RATE_LIMIT_PERIOD', 3600)),  # 1 hour
}

# =============================================================================
# FILE SECURITY
# =============================================================================

# File upload security
ALLOWED_DOCUMENT_TYPES = os.environ.get(
    'ALLOWED_DOCUMENT_TYPES',
    'pdf,doc,docx,jpg,jpeg,png,xlsx,xls'
).split(',')

# File size limits
MAX_UPLOAD_SIZE = int(os.environ.get('MAX_UPLOAD_SIZE', 10 * 1024 * 1024))  # 10MB

# File validation settings
FILE_UPLOAD_VIRUS_SCAN = os.environ.get('FILE_UPLOAD_VIRUS_SCAN', 'False').lower() == 'true'
FILE_UPLOAD_QUARANTINE_DIR = os.environ.get('FILE_UPLOAD_QUARANTINE_DIR', '/tmp/quarantine')

# =============================================================================
# AUTHENTICATION SECURITY
# =============================================================================

# Account lockout settings
ACCOUNT_LOCKOUT_ENABLED = True
ACCOUNT_LOCKOUT_ATTEMPTS = int(os.environ.get('ACCOUNT_LOCKOUT_ATTEMPTS', 5))
ACCOUNT_LOCKOUT_TIME = int(os.environ.get('ACCOUNT_LOCKOUT_TIME', 1800))  # 30 minutes

# Password security
PASSWORD_MIN_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = True
PASSWORD_REQUIRE_LOWERCASE = True
PASSWORD_REQUIRE_NUMBERS = True
PASSWORD_REQUIRE_SYMBOLS = True

# =============================================================================
# API SECURITY
# =============================================================================

# API versioning
API_VERSION = os.environ.get('API_VERSION', 'v1')

# Request validation
REQUEST_MAX_SIZE = int(os.environ.get('REQUEST_MAX_SIZE', 50 * 1024 * 1024))  # 50MB
REQUEST_TIMEOUT = int(os.environ.get('REQUEST_TIMEOUT', 30))  # 30 seconds

# =============================================================================
# EXTERNAL SERVICES SECURITY
# =============================================================================

# MapGIS security settings
MAPGIS_MAX_REQUESTS_PER_MINUTE = int(os.environ.get('MAPGIS_MAX_REQUESTS_PER_MINUTE', 60))
MAPGIS_REQUEST_TIMEOUT = int(os.environ.get('MAPGIS_REQUEST_TIMEOUT', 30))

# Third-party API keys (should be in environment)
MAPGIS_API_KEY = os.environ.get('MAPGIS_API_KEY')
GEOMEDELLIN_API_KEY = os.environ.get('GEOMEDELLIN_API_KEY')
POT_API_KEY = os.environ.get('POT_API_KEY')