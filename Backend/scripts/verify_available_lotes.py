"""
Script para verificar lotes disponibles para developers
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.lotes.models import Lote
from django.contrib.auth import get_user_model

User = get_user_model()

def main():
    print("=" * 70)
    print("🔍 VERIFICACIÓN DE LOTES DISPONIBLES PARA DEVELOPERS")
    print("=" * 70)
    
    # Contar todos los lotes
    total_lotes = Lote.objects.count()
    print(f"\n📊 Total de lotes en el sistema: {total_lotes}")
    
    # Lotes verificados y activos
    available = Lote.objects.filter(is_verified=True, estado='active')
    available_count = available.count()
    print(f"✅ Lotes verificados y activos: {available_count}")
    
    # Lotes por estado
    print("\n📋 Distribución por estado:")
    for estado_value, estado_label in Lote.ESTADO_CHOICES:
        count = Lote.objects.filter(estado=estado_value).count()
        print(f"   {estado_label}: {count}")
    
    # Verificación
    print("\n🔍 Estado de verificación:")
    verified = Lote.objects.filter(is_verified=True).count()
    unverified = Lote.objects.filter(is_verified=False).count()
    print(f"   Verificados: {verified}")
    print(f"   Sin verificar: {unverified}")
    
    # Si no hay lotes disponibles
    if available_count == 0:
        print("\n⚠️  NO HAY LOTES DISPONIBLES PARA DEVELOPERS")
        print("\nAcciones recomendadas:")
        print("   1. Verificar lotes existentes:")
        print("      python scripts/verify_lotes_batch.py")
        print("\n   2. O crear lotes de prueba:")
        print("      python scripts/create_test_lotes.py")
    else:
        print(f"\n✅ HAY {available_count} LOTES DISPONIBLES")
        print("\nPrimeros 5 lotes disponibles:")
        for lote in available[:5]:
            print(f"   - ID: {lote.id}, {lote.nombre}, CBML: {lote.cbml}")

if __name__ == "__main__":
    main()
