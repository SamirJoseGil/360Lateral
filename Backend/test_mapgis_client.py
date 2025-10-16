"""
Script de prueba para verificar MapGISClient
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

print("=" * 70)
print("🔍 PRUEBA DE MapGISClient")
print("=" * 70)

# Importar después de setup
from apps.lotes.services.mapgis.client import MapGISClient
from apps.lotes.services.mapgis_service import MapGISService

print("\n1️⃣ Probando MapGISClient directamente...")
try:
    client = MapGISClient()
    print(f"✅ Cliente creado")
    print(f"✅ base_url: {client.base_url}")
    print(f"✅ timeout: {client.timeout}")
    print(f"✅ session: {client.session}")
    print(f"✅ session_initialized: {client.session_initialized}")
except Exception as e:
    print(f"❌ Error creando cliente: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n2️⃣ Probando MapGISService...")
try:
    service = MapGISService()
    print(f"✅ Servicio creado")
    print(f"✅ Cliente tiene base_url: {hasattr(service.client, 'base_url')}")
    if hasattr(service.client, 'base_url'):
        print(f"✅ base_url: {service.client.base_url}")
except Exception as e:
    print(f"❌ Error creando servicio: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n3️⃣ Probando búsqueda por matrícula...")
try:
    service = MapGISService()
    resultado = service.buscar_por_matricula("00174838")
    print(f"✅ Búsqueda completada")
    print(f"   Encontrado: {resultado.get('encontrado')}")
    print(f"   CBML obtenido: {resultado.get('cbml_obtenido')}")
    if resultado.get('data'):
        print(f"   CBML: {resultado['data'].get('cbml')}")
except Exception as e:
    print(f"❌ Error en búsqueda: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("FIN DE PRUEBAS")
print("=" * 70)
