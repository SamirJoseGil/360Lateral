# Generated manually to truncate CBML to 11 digits BEFORE schema change

from django.db import migrations

def truncate_cbml_forward(apps, schema_editor):
    """Truncar CBMLs existentes a 11 dígitos ANTES de cambiar el schema"""
    Lote = apps.get_model('lotes', 'Lote')
    
    lotes_with_cbml = Lote.objects.exclude(cbml__isnull=True).exclude(cbml='')
    
    count_truncated = 0
    count_cleaned = 0
    count_nulled = 0
    
    for lote in lotes_with_cbml:
        old_cbml = lote.cbml
        
        # Si tiene más de 11 caracteres, truncar
        if len(lote.cbml) > 11:
            lote.cbml = lote.cbml[:11]
            count_truncated += 1
            print(f"✂️ Truncado CBML {old_cbml} → {lote.cbml} (Lote ID: {lote.id})")
        
        # Si tiene caracteres no numéricos, intentar limpiar
        elif not lote.cbml.isdigit():
            cleaned = ''.join(filter(str.isdigit, lote.cbml))[:11]
            
            if len(cleaned) == 11:
                lote.cbml = cleaned
                count_cleaned += 1
                print(f"🧹 Limpiado CBML {old_cbml} → {lote.cbml} (Lote ID: {lote.id})")
            elif len(cleaned) < 11 and len(cleaned) > 0:
                # Rellenar con ceros a la izquierda
                lote.cbml = cleaned.zfill(11)
                count_cleaned += 1
                print(f"🔢 Rellenado CBML {old_cbml} → {lote.cbml} (Lote ID: {lote.id})")
            else:
                # No se puede arreglar, anular
                lote.cbml = None
                count_nulled += 1
                print(f"❌ CBML inválido anulado: {old_cbml} (Lote ID: {lote.id})")
        
        # Si tiene menos de 11 caracteres pero es numérico, rellenar
        elif len(lote.cbml) < 11:
            lote.cbml = lote.cbml.zfill(11)
            count_cleaned += 1
            print(f"🔢 Rellenado CBML {old_cbml} → {lote.cbml} (Lote ID: {lote.id})")
        
        lote.save(update_fields=['cbml'])
    
    print(f"\n✅ Migración de datos completada:")
    print(f"   - {count_truncated} CBMLs truncados")
    print(f"   - {count_cleaned} CBMLs limpiados/rellenados")
    print(f"   - {count_nulled} CBMLs anulados (inválidos)")
    print(f"   - Total procesados: {count_truncated + count_cleaned + count_nulled}")

def truncate_cbml_reverse(apps, schema_editor):
    """No hay forma de revertir el truncamiento"""
    print("⚠️ No se puede revertir el truncamiento de CBMLs")
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('lotes', '0006_alter_lote_carta_autorizacion_alter_lote_ciudad_and_more'),  # ✅ CRÍTICO: Cambiar a 0006
    ]

    operations = [
        migrations.RunPython(truncate_cbml_forward, truncate_cbml_reverse),
    ]
