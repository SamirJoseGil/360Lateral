"""
Script para crear datos de prueba: lotes y documentos
Crea lotes para el usuario propietario y les agrega documentos
"""
import os
import sys
from pathlib import Path
from decimal import Decimal
from io import BytesIO

# Configurar Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

try:
    import django
    django.setup()
except Exception as e:
    print(f"[ERROR] ❌ Error configurando Django: {e}")
    sys.exit(1)

from apps.users.models import User
from apps.lotes.models import Lote
from apps.documents.models import Document
from django.core.files.base import ContentFile
from django.utils import timezone
import random


def create_dummy_pdf():
    """
    Crea un archivo PDF dummy para pruebas
    """
    pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Documento de Prueba) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
410
%%EOF
"""
    return ContentFile(pdf_content, name='documento_prueba.pdf')


def create_test_lotes(owner):
    """
    Crear lotes de prueba para un propietario
    """
    print(f"\n[INFO] 📍 Creando lotes de prueba para {owner.email}...")
    
    lotes_data = [
        {
            'nombre': 'Lote El Poblado - Zona Residencial',
            'direccion': 'Carrera 43A #16-25, El Poblado',
            'area': Decimal('450.50'),
            'cbml': '05001010001234',
            'matricula': '174-12345',
            'codigo_catastral': '05001010012340001000',
            'barrio': 'El Poblado',
            'estrato': 6,
            'descripcion': 'Lote ubicado en zona exclusiva de El Poblado, con excelente ubicación cerca a centros comerciales y vías principales.',
            'clasificacion_suelo': 'Suelo Urbano',
            'uso_suelo': 'Residencial',
            'tratamiento_pot': 'Consolidación Nivel 1',
            'latitud': Decimal('6.2088'),
            'longitud': Decimal('-75.5683'),
        },
        {
            'nombre': 'Lote Laureles - Uso Mixto',
            'direccion': 'Circular 2 #70-45, Laureles',
            'area': Decimal('320.75'),
            'cbml': '05001020005678',
            'matricula': '174-54321',
            'codigo_catastral': '05001020056780002000',
            'barrio': 'Laureles',
            'estrato': 5,
            'descripcion': 'Lote en Laureles con potencial para desarrollo mixto (comercial y residencial).',
            'clasificacion_suelo': 'Suelo Urbano',
            'uso_suelo': 'Mixto',
            'tratamiento_pot': 'Consolidación Nivel 2',
            'latitud': Decimal('6.2453'),
            'longitud': Decimal('-75.5901'),
        },
        {
            'nombre': 'Lote Envigado - Desarrollo VIS',
            'direccion': 'Calle 35 Sur #42-15, Envigado',
            'area': Decimal('580.00'),
            'cbml': '05266010009012',
            'matricula': '266-98765',
            'codigo_catastral': '05266010090120003000',
            'barrio': 'Centro',
            'estrato': 3,
            'descripcion': 'Lote ideal para desarrollo de vivienda de interés social (VIS) en Envigado.',
            'clasificacion_suelo': 'Suelo de Expansión Urbana',
            'uso_suelo': 'Residencial',
            'tratamiento_pot': 'Desarrollo',
            'latitud': Decimal('6.1707'),
            'longitud': Decimal('-75.5828'),
        },
    ]
    
    created_lotes = []
    
    for i, lote_data in enumerate(lotes_data, 1):
        try:
            # Verificar si ya existe
            if Lote.objects.filter(cbml=lote_data['cbml']).exists():
                print(f"[INFO] ℹ️  Lote {lote_data['nombre']} ya existe, omitiendo...")
                lote = Lote.objects.get(cbml=lote_data['cbml'])
                created_lotes.append(lote)
                continue
            
            # Crear lote
            lote = Lote.objects.create(
                owner=owner,
                status='active',
                is_verified=True,
                **lote_data
            )
            
            created_lotes.append(lote)
            
            print(f"[SUCCESS] ✅ Lote {i}/{len(lotes_data)} creado: {lote.nombre}")
            print(f"           - CBML: {lote.cbml}")
            print(f"           - Área: {lote.area} m²")
            print(f"           - Barrio: {lote.barrio}")
            
        except Exception as e:
            print(f"[ERROR] ❌ Error creando lote {lote_data['nombre']}: {e}")
            continue
    
    print(f"\n[INFO] 📊 Total de lotes creados: {len(created_lotes)}")
    return created_lotes


def create_test_documents(lotes):
    """
    Crear documentos de prueba para los lotes
    """
    print(f"\n[INFO] 📄 Creando documentos de prueba...")
    
    # Tipos de documentos según el modelo
    document_types = [
        ('ctl', 'Certificado de Tradición y Libertad'),
        ('planos', 'Planos Arquitectónicos'),
        ('topografia', 'Levantamiento Topográfico'),
        ('escritura_publica', 'Escritura Pública'),
        ('avaluo_comercial', 'Avalúo Comercial'),
    ]
    
    total_created = 0
    
    for lote in lotes:
        print(f"\n[INFO] 📁 Creando documentos para: {lote.nombre}")
        
        # Crear 2-3 documentos por lote
        num_docs = random.randint(2, 3)
        selected_types = random.sample(document_types, num_docs)
        
        for doc_type, doc_label in selected_types:
            try:
                # Verificar si ya existe
                if Document.objects.filter(
                    lote=lote,
                    document_type=doc_type
                ).exists():
                    print(f"[INFO] ℹ️  Documento {doc_label} ya existe para {lote.nombre}, omitiendo...")
                    continue
                
                # Crear archivo PDF dummy
                pdf_file = create_dummy_pdf()
                
                # Título automático
                title = f"{doc_label} - {lote.nombre}"
                
                # Descripción
                description = f"Documento de prueba tipo {doc_label} para el lote {lote.nombre}"
                
                # Crear documento
                document = Document.objects.create(
                    user=lote.owner,
                    lote=lote,
                    document_type=doc_type,
                    title=title,
                    description=description,
                    file=pdf_file,
                    mime_type='application/pdf',
                    file_size=len(pdf_file.read()),
                    metadata={
                        'validation_status': 'pendiente',
                        'created_by_script': True,
                        'test_data': True
                    }
                )
                
                total_created += 1
                
                print(f"[SUCCESS] ✅ Documento creado: {doc_label}")
                
            except Exception as e:
                print(f"[ERROR] ❌ Error creando documento {doc_label}: {e}")
                continue
    
    print(f"\n[INFO] 📊 Total de documentos creados: {total_created}")


def create_admin_test_user():
    """
    Asegurar que existe el usuario admin de prueba
    """
    try:
        admin = User.objects.get(email='admin@lateral360.com')
        print(f"[INFO] ✅ Usuario admin ya existe: {admin.email}")
        return admin
    except User.DoesNotExist:
        print(f"[INFO] 📝 Creando usuario admin de prueba...")
        admin = User.objects.create_superuser(
            email='admin@lateral360.com',
            username='admin',
            password='admin123',
            first_name='Admin',
            last_name='Sistema',
            role='admin',
            department='desarrollo',
            permissions_scope='full'
        )
        admin.is_verified = True
        admin.save()
        print(f"[SUCCESS] ✅ Usuario admin creado: {admin.email}")
        return admin


def main():
    """
    Función principal
    """
    print("=" * 80)
    print("🚀 LATERAL 360° - CREAR DATOS DE PRUEBA")
    print("=" * 80)
    
    try:
        # 1. Verificar que existe el usuario propietario
        print(f"\n[STEP 1] 👤 Verificando usuario propietario...")
        try:
            owner = User.objects.get(email='propietario@lateral360.com')
            print(f"[SUCCESS] ✅ Usuario propietario encontrado: {owner.email}")
        except User.DoesNotExist:
            print(f"[ERROR] ❌ Usuario propietario no encontrado")
            print(f"[INFO] 💡 Ejecuta primero: python manage.py shell < scripts/create_additional_users.py")
            sys.exit(1)
        
        # 2. Asegurar que existe admin
        print(f"\n[STEP 2] 👑 Verificando usuario admin...")
        admin = create_admin_test_user()
        
        # 3. Crear lotes de prueba
        print(f"\n[STEP 3] 📍 Creando lotes de prueba...")
        lotes = create_test_lotes(owner)
        
        if not lotes:
            print(f"[ERROR] ❌ No se crearon lotes")
            sys.exit(1)
        
        # 4. Crear documentos de prueba
        print(f"\n[STEP 4] 📄 Creando documentos de prueba...")
        create_test_documents(lotes)
        
        # 5. Resumen final
        print("\n" + "=" * 80)
        print("✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE")
        print("=" * 80)
        
        print(f"\n📊 RESUMEN:")
        print(f"  👤 Propietario: {owner.email}")
        print(f"  👑 Admin: {admin.email}")
        print(f"  📍 Lotes creados: {len(lotes)}")
        
        # Contar documentos por lote
        for lote in lotes:
            doc_count = Document.objects.filter(lote=lote).count()
            print(f"     - {lote.nombre}: {doc_count} documentos")
        
        print(f"\n💡 CREDENCIALES DE PRUEBA:")
        print(f"  Propietario:")
        print(f"    Email: propietario@lateral360.com")
        print(f"    Password: propietario123")
        print(f"\n  Admin:")
        print(f"    Email: admin@lateral360.com")
        print(f"    Password: admin123")
        
        print("\n" + "=" * 80)
        print("⚠️  IMPORTANTE: Cambiar contraseñas en producción")
        print("=" * 80)
        
    except KeyboardInterrupt:
        print("\n[INFO] ⚠️  Script interrumpido por el usuario")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] ❌ Error inesperado: {e}")
        import traceback
        print(f"[DEBUG] Traceback:\n{traceback.format_exc()}")
        sys.exit(1)


if __name__ == "__main__":
    main()
