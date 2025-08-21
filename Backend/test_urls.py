#!/usr/bin/env python
"""
Script para probar las URLs y ver qué está pasando
"""

import os
import sys
from pathlib import Path

def main():
    """Probar URLs de Django"""
    print("🔍 Probando URLs de Django...")
    
    BASE_DIR = Path(__file__).resolve().parent
    sys.path.insert(0, str(BASE_DIR))
    
    os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
    
    import django
    django.setup()
    
    from django.urls import reverse
    from django.conf import settings
    
    try:
        # Probar importar las URLs principales
        from config.urls import urlpatterns as main_urls
        print(f"✅ URLs principales cargadas: {len(main_urls)} patrones")
        
        for pattern in main_urls:
            print(f"  📄 {pattern.pattern}")
        
        # Probar importar las URLs de app
        from app.urls import urlpatterns as app_urls
        print(f"✅ URLs de app cargadas: {len(app_urls)} patrones")
        
        for pattern in app_urls:
            print(f"  📄 {pattern.pattern}")
        
        # Probar resolver algunas URLs
        test_urls = [
            'app:auth-login',
            'app:auth-register', 
            'app:auth-me',
            'app:token-refresh',
        ]
        
        print(f"\n🧪 Probando resolución de URLs...")
        for url_name in test_urls:
            try:
                url = reverse(url_name)
                print(f"✅ {url_name} -> {url}")
            except Exception as e:
                print(f"❌ {url_name} -> Error: {e}")
        
        # También probar URLs simples
        simple_test_urls = [
            'health-check',
        ]
        
        print(f"\n🧪 Probando URLs simples...")
        for url_name in simple_test_urls:
            try:
                url = reverse(url_name)
                print(f"✅ {url_name} -> {url}")
            except Exception as e:
                print(f"❌ {url_name} -> Error: {e}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()