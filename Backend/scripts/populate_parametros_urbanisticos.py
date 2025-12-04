"""
Script para poblar parámetros urbanísticos del POT de Medellín
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.analisis.models import ParametroUrbanistico

def crear_parametros():
    """Crear parámetros urbanísticos iniciales"""
    
    parametros = [
        # ✅ Áreas Mínimas Construidas (Artículo 370)
        {
            'categoria': 'area_minima',
            'nombre': 'Áreas Mínimas de Vivienda según POT',
            'articulo_pot': 'Artículo 370',
            'descripcion': '''
            Área mínima construida de vivienda según número de alcobas.
            
            TODAS LAS TIPOLOGÍAS:
            - Vivienda de 1 alcoba (apartaestudio): 30 m²
            - Vivienda de 2 alcobas: 45 m²
            
            VIVIENDA DE 3 ALCOBAS:
            - VIP: 54 m²
            - VIS y NO VIS: 60 m²
            
            VIVIENDA DE 4 ALCOBAS:
            - VIP: 72 m² (solo en desarrollo progresivo)
            - VIS y NO VIS: 80 m²
            
            NOTA: La diferencia en áreas para viviendas VIP de 3 y 4 alcobas respecto a 
            las viviendas VIS y NO VIS, obedece a razones de tipo económico, ya que la 
            tipo VIP al ser objeto de subsidio familiar de vivienda (SFV), según Decreto 
            Nacional 075 de 2013, no podrá superar 70 SMLMV.
            ''',
            'datos': {
                'apartaestudio': {'area_minima': 30, 'alcobas': 1},
                '2_alcobas': {'area_minima': 45, 'alcobas': 2},
                '3_alcobas_vip': {'area_minima': 54, 'alcobas': 3, 'tipo': 'VIP'},
                '3_alcobas_vis_no_vis': {'area_minima': 60, 'alcobas': 3, 'tipo': 'VIS/NO VIS'},
                '4_alcobas_vip': {'area_minima': 72, 'alcobas': 4, 'tipo': 'VIP', 'nota': 'Solo desarrollo progresivo'},
                '4_alcobas_vis_no_vis': {'area_minima': 80, 'alcobas': 4, 'tipo': 'VIS/NO VIS'},
                'smmlv_vip_maximo': 70
            },
            'orden': 1,
            'activo': True
        },
        
        # ✅ Índices Urbanísticos Generales
        {
            'categoria': 'indices',
            'nombre': 'Índices de Ocupación y Construcción',
            'articulo_pot': 'Artículo 350',
            'descripcion': '''
            Índices urbanísticos que definen el aprovechamiento del lote:
            
            - ÍNDICE DE OCUPACIÓN (IO): Porcentaje del área del lote que puede ser ocupada por edificación
            - ÍNDICE DE CONSTRUCCIÓN (IC): Número de veces que se puede construir sobre el área del lote
            
            Estos índices varían según el tratamiento urbanístico del predio.
            ''',
            'datos': {
                'definiciones': {
                    'io': 'Índice de Ocupación - Área ocupable/Área del lote',
                    'ic': 'Índice de Construcción - Área construible/Área del lote'
                },
                'ejemplo': {
                    'lote_100m2_io_0.7_ic_3.0': {
                        'area_lote': 100,
                        'io': 0.7,
                        'ic': 3.0,
                        'area_ocupable': 70,
                        'area_maxima_construir': 300
                    }
                }
            },
            'orden': 2,
            'activo': True
        },
        
        # ✅ Retiros Obligatorios
        {
            'categoria': 'retiros',
            'nombre': 'Retiros Obligatorios',
            'articulo_pot': 'Artículo 360',
            'descripcion': '''
            Retiros mínimos obligatorios desde los linderos del predio:
            
            - RETIRO FRONTAL: Distancia desde el paramento hasta la edificación
            - RETIRO LATERAL: Distancia desde lindero lateral hasta la edificación
            - RETIRO POSTERIOR: Distancia desde lindero posterior hasta la edificación
            
            Los retiros varían según el tratamiento y la altura de la edificación.
            ''',
            'datos': {
                'tipos': {
                    'frontal': 'Desde el paramento o línea de construcción',
                    'lateral': 'Desde el lindero lateral del predio',
                    'posterior': 'Desde el lindero posterior del predio'
                },
                'minimos_generales': {
                    'frontal': 3.0,
                    'lateral': 1.5,
                    'posterior': 3.0
                },
                'unidad': 'metros'
            },
            'orden': 3,
            'activo': True
        },
        
        # ✅ Estacionamientos
        {
            'categoria': 'estacionamientos',
            'nombre': 'Requisitos de Estacionamientos',
            'articulo_pot': 'Artículo 380',
            'descripcion': '''
            Número mínimo de estacionamientos por vivienda según tipo:
            
            - VIVIENDA VIS/VIP: 0.5 estacionamientos por unidad (1 por cada 2 viviendas)
            - VIVIENDA NO VIS: 1.0 estacionamiento por unidad mínimo
            
            Dimensiones mínimas:
            - Paralelos: 2.40m x 5.00m
            - Perpendiculares: 2.40m x 5.00m
            ''',
            'datos': {
                'vis_vip': {
                    'ratio': 0.5,
                    'descripcion': '1 estacionamiento por cada 2 viviendas'
                },
                'no_vis': {
                    'ratio': 1.0,
                    'descripcion': 'Mínimo 1 estacionamiento por vivienda'
                },
                'dimensiones': {
                    'paralelo': {'ancho': 2.4, 'largo': 5.0},
                    'perpendicular': {'ancho': 2.4, 'largo': 5.0}
                },
                'unidad': 'metros'
            },
            'orden': 4,
            'activo': True
        },
        
        # ✅ Cesiones Obligatorias
        {
            'categoria': 'cesiones',
            'nombre': 'Cesiones Obligatorias',
            'articulo_pot': 'Artículo 390',
            'descripcion': '''
            Porcentaje del área útil del predio que debe cederse al municipio para:
            
            - Espacio público
            - Equipamientos comunales
            - Vías locales
            
            El porcentaje varía según el tratamiento urbanístico.
            Generalmente entre 15% y 25% del área útil.
            ''',
            'datos': {
                'minimo_general': 15,
                'maximo_general': 25,
                'unidad': 'porcentaje',
                'distribucion_tipica': {
                    'espacio_publico': 10,
                    'equipamiento': 5,
                    'vias': 5
                }
            },
            'orden': 5,
            'activo': True
        },
        
        # ✅ Alturas Máximas
        {
            'categoria': 'alturas',
            'nombre': 'Alturas Máximas Permitidas',
            'articulo_pot': 'Artículo 365',
            'descripcion': '''
            Altura máxima de edificación permitida:
            
            Se define en número de pisos o en metros, según el tratamiento urbanístico.
            
            Consideraciones:
            - Altura promedio de piso: 2.60m a 3.00m
            - Primer piso puede tener mayor altura (hasta 4.50m en comercio)
            - Cubierta y áticos no cuentan si cumplen requisitos
            ''',
            'datos': {
                'altura_piso_promedio': 2.8,
                'altura_primer_piso_comercial': 4.5,
                'altura_primer_piso_residencial': 3.0,
                'unidad': 'metros',
                'notas': [
                    'La altura se mide desde el nivel promedio del lote hasta la cubierta',
                    'Áticos y cubiertas no cuentan si cumplen con retiros adicionales'
                ]
            },
            'orden': 6,
            'activo': True
        }
    ]
    
    print("=" * 80)
    print("CREANDO PARÁMETROS URBANÍSTICOS DEL POT DE MEDELLÍN")
    print("=" * 80)
    
    for param_data in parametros:
        parametro, created = ParametroUrbanistico.objects.get_or_create(
            categoria=param_data['categoria'],
            nombre=param_data['nombre'],
            defaults=param_data
        )
        
        if created:
            print(f"✅ Creado: {parametro.nombre}")
        else:
            # Actualizar si ya existe
            for key, value in param_data.items():
                setattr(parametro, key, value)
            parametro.save()
            print(f"♻️  Actualizado: {parametro.nombre}")
    
    print("\n" + "=" * 80)
    print(f"✅ PROCESO COMPLETO: {len(parametros)} parámetros procesados")
    print("=" * 80)

if __name__ == '__main__':
    crear_parametros()
