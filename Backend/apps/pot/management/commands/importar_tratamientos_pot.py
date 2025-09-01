"""
Comando para importar datos iniciales de tratamientos POT desde un JSON.
"""
import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db import transaction

from apps.pot.models import TratamientoPOT, FrenteMinimoPOT, AreaMinimaLotePOT, AreaMinimaViviendaPOT


class Command(BaseCommand):
    help = 'Importa los datos de tratamientos POT desde un archivo JSON'

    def add_arguments(self, parser):
        parser.add_argument(
            'json_file',
            nargs='?',
            type=str,
            help='Ruta al archivo JSON con los datos (opcional)',
            default=None
        )

    @transaction.atomic
    def handle(self, *args, **options):
        try:
            json_file = options['json_file']
            
            # Si no se proporciona un archivo, usar los datos de ejemplo
            if not json_file:
                data = self.get_sample_data()
            else:
                # Verificar que el archivo existe
                if not os.path.exists(json_file):
                    raise CommandError(f"El archivo {json_file} no existe")
                
                # Cargar datos del archivo
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            
            # Procesar los datos
            tratamientos_creados = 0
            tratamientos_actualizados = 0
            
            for nombre, detalles in data.items():
                # Determinar código según el nombre
                codigo = None
                if "Consolidación Nivel 1" in nombre:
                    codigo = "CN1"
                elif "Consolidación Nivel 2" in nombre:
                    codigo = "CN2"
                elif "Consolidación Nivel 3" in nombre:
                    codigo = "CN3"
                elif "Consolidación Nivel 4" in nombre:
                    codigo = "CN4"
                elif "Redesarrollo" in nombre:
                    codigo = "RD"
                elif "Desarrollo" in nombre:
                    codigo = "D"
                elif "Conservación" in nombre:
                    codigo = "C"
                else:
                    codigo = nombre[:3].upper()  # Primeras 3 letras en mayúscula
                
                self.stdout.write(f"Procesando tratamiento: {nombre} (Código: {codigo})")
                
                # Crear o actualizar el tratamiento
                tratamiento, created = TratamientoPOT.objects.update_or_create(
                    codigo=codigo,
                    defaults={
                        'nombre': nombre,
                        'descripcion': detalles.get('descripcion', ''),
                        'indice_ocupacion': detalles.get('indice_ocupacion'),
                        'indice_construccion': detalles.get('indice_construccion'),
                        'altura_maxima': detalles.get('altura_maxima'),
                        'retiro_frontal': detalles.get('retiro_frontal'),
                        'retiro_lateral': detalles.get('retiro_lateral'),
                        'retiro_posterior': detalles.get('retiro_posterior'),
                    }
                )
                
                if created:
                    tratamientos_creados += 1
                else:
                    tratamientos_actualizados += 1
                
                # Procesar frentes mínimos
                if 'frente_minimo' in detalles and isinstance(detalles['frente_minimo'], dict):
                    for tipo_vivienda, frente in detalles['frente_minimo'].items():
                        FrenteMinimoPOT.objects.update_or_create(
                            tratamiento=tratamiento,
                            tipo_vivienda=tipo_vivienda,
                            defaults={'frente_minimo': frente}
                        )
                
                # Procesar áreas mínimas de lote
                if 'area_minima_lote' in detalles and isinstance(detalles['area_minima_lote'], dict):
                    for tipo_vivienda, area in detalles['area_minima_lote'].items():
                        AreaMinimaLotePOT.objects.update_or_create(
                            tratamiento=tratamiento,
                            tipo_vivienda=tipo_vivienda,
                            defaults={'area_minima': area}
                        )
                
                # Procesar áreas mínimas de vivienda
                if 'area_minima_vivienda' in detalles and isinstance(detalles['area_minima_vivienda'], dict):
                    for tipo_vivienda, area in detalles['area_minima_vivienda'].items():
                        AreaMinimaViviendaPOT.objects.update_or_create(
                            tratamiento=tratamiento,
                            tipo_vivienda=tipo_vivienda,
                            defaults={'area_minima': area}
                        )
            
            self.stdout.write(self.style.SUCCESS(
                f'Importación completada exitosamente: {tratamientos_creados} tratamientos creados, '
                f'{tratamientos_actualizados} tratamientos actualizados.'
            ))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error durante la importación: {str(e)}'))
            raise CommandError(f'Error durante la importación: {str(e)}')
    
    def get_sample_data(self):
        """
        Retorna los datos de ejemplo de tratamientos POT
        """
        return {
            "Consolidación Nivel 1": {
                "descripcion": "Áreas consolidadas de buena calidad urbanística",
                "frente_minimo": {
                    "unifamiliar": 7,
                    "bifamiliar_pisos_diferentes": 7,
                    "bifamiliar_mismo_piso": 10,
                    "trifamiliar": 7,
                    "multifamiliar": 10
                },
                "area_minima_lote": {
                    "unifamiliar": 84,
                    "bifamiliar_pisos_diferentes": 84,
                    "bifamiliar_mismo_piso": 120,
                    "trifamiliar": 120,
                    "multifamiliar": 200
                },
                "area_minima_vivienda": {
                    "1_alcoba": 35,
                    "2_alcobas": 50,
                    "3_alcobas_vip": 60,
                    "3_alcobas_vis": 70,
                    "4_alcobas_vip": 80,
                    "4_alcobas_vis": 90
                },
                "indice_ocupacion": 0.7,
                "indice_construccion": 2.5,
                "altura_maxima": 4,
                "retiro_frontal": 3,
                "retiro_lateral": 3,
                "retiro_posterior": 3
            },
            "Consolidación Nivel 2": {
                "descripcion": "Áreas consolidadas de calidad urbanística media",
                "frente_minimo": {
                    "unifamiliar": 6,
                    "bifamiliar_pisos_diferentes": 6,
                    "bifamiliar_mismo_piso": 9,
                    "trifamiliar": 6,
                    "multifamiliar": 9
                },
                "area_minima_lote": {
                    "unifamiliar": 72,
                    "bifamiliar_pisos_diferentes": 72,
                    "bifamiliar_mismo_piso": 108,
                    "trifamiliar": 108,
                    "multifamiliar": 180
                },
                "area_minima_vivienda": {
                    "1_alcoba": 32,
                    "2_alcobas": 47,
                    "3_alcobas_vip": 57,
                    "3_alcobas_vis": 65,
                    "4_alcobas_vip": 75,
                    "4_alcobas_vis": 85
                },
                "indice_ocupacion": 0.75,
                "indice_construccion": 2.8,
                "altura_maxima": 4,
                "retiro_frontal": 2,
                "retiro_lateral": 2,
                "retiro_posterior": 2
            },
            "Consolidación Nivel 3": {
                "descripcion": "Áreas consolidadas que requieren mejoramiento",
                "frente_minimo": {
                    "unifamiliar": 6,
                    "bifamiliar_pisos_diferentes": 6,
                    "bifamiliar_mismo_piso": 9,
                    "trifamiliar": 6,
                    "multifamiliar": 8
                },
                "area_minima_lote": {
                    "unifamiliar": 60,
                    "bifamiliar_pisos_diferentes": 60,
                    "bifamiliar_mismo_piso": 90,
                    "trifamiliar": 90,
                    "multifamiliar": 150
                },
                "area_minima_vivienda": {
                    "1_alcoba": 30,
                    "2_alcobas": 45,
                    "3_alcobas_vip": 54,
                    "3_alcobas_vis": 62,
                    "4_alcobas_vip": 72,
                    "4_alcobas_vis": 82
                },
                "indice_ocupacion": 0.8,
                "indice_construccion": 3.0,
                "altura_maxima": 4,
                "retiro_frontal": 2,
                "retiro_lateral": 1.5,
                "retiro_posterior": 2
            },
            "Consolidación Nivel 4": {
                "descripcion": "Áreas que requieren mejoramiento integral",
                "frente_minimo": {
                    "unifamiliar": 6,
                    "bifamiliar_pisos_diferentes": 6,
                    "bifamiliar_mismo_piso": 9,
                    "trifamiliar": 6,
                    "multifamiliar": 8
                },
                "area_minima_lote": {
                    "unifamiliar": 60,
                    "bifamiliar_pisos_diferentes": 60,
                    "bifamiliar_mismo_piso": 72,
                    "trifamiliar": 72,
                    "multifamiliar": 120
                },
                "area_minima_vivienda": {
                    "1_alcoba": 30,
                    "2_alcobas": 45,
                    "3_alcobas_vip": 54,
                    "3_alcobas_vis": 60,
                    "4_alcobas_vip": 72,
                    "4_alcobas_vis": 80
                },
                "indice_ocupacion": 0.85,
                "indice_construccion": 3.2,
                "altura_maxima": 4,
                "retiro_frontal": 1,
                "retiro_lateral": 1,
                "retiro_posterior": 1.5
            },
            "Redesarrollo": {
                "descripcion": "Áreas para transformación y densificación",
                "frente_minimo": {
                    "unifamiliar": 7,
                    "bifamiliar_pisos_diferentes": 7,
                    "bifamiliar_mismo_piso": 10,
                    "trifamiliar": 7,
                    "multifamiliar": 12
                },
                "area_minima_lote": {
                    "unifamiliar": 84,
                    "bifamiliar_pisos_diferentes": 84,
                    "bifamiliar_mismo_piso": 120,
                    "trifamiliar": 120,
                    "multifamiliar": 300
                },
                "area_minima_vivienda": {
                    "1_alcoba": 35,
                    "2_alcobas": 50,
                    "3_alcobas_vip": 60,
                    "3_alcobas_vis": 70,
                    "4_alcobas_vip": 80,
                    "4_alcobas_vis": 90
                },
                "indice_ocupacion": 0.6,
                "indice_construccion": 4.0,
                "altura_maxima": 8,
                "retiro_frontal": 3,
                "retiro_lateral": 3,
                "retiro_posterior": 3
            },
            "Desarrollo": {
                "descripcion": "Áreas de expansión urbana",
                "frente_minimo": {
                    "unifamiliar": 7,
                    "bifamiliar_pisos_diferentes": 7,
                    "bifamiliar_mismo_piso": 10,
                    "trifamiliar": 7,
                    "multifamiliar": 10
                },
                "area_minima_lote": {
                    "unifamiliar": 84,
                    "bifamiliar_pisos_diferentes": 84,
                    "bifamiliar_mismo_piso": 120,
                    "trifamiliar": 120,
                    "multifamiliar": 200
                },
                "area_minima_vivienda": {
                    "1_alcoba": 35,
                    "2_alcobas": 50,
                    "3_alcobas_vip": 60,
                    "3_alcobas_vis": 70,
                    "4_alcobas_vip": 80,
                    "4_alcobas_vis": 90
                },
                "indice_ocupacion": 0.65,
                "indice_construccion": 2.0,
                "altura_maxima": 3,
                "retiro_frontal": 5,
                "retiro_lateral": 3,
                "retiro_posterior": 5
            },
            "Conservación": {
                "descripcion": "Áreas de conservación histórica y patrimonial",
                "frente_minimo": {
                    "unifamiliar": 8,
                    "bifamiliar_pisos_diferentes": 8,
                    "bifamiliar_mismo_piso": 12,
                    "trifamiliar": 8,
                    "multifamiliar": 15
                },
                "area_minima_lote": {
                    "unifamiliar": 120,
                    "bifamiliar_pisos_diferentes": 120,
                    "bifamiliar_mismo_piso": 180,
                    "trifamiliar": 180,
                    "multifamiliar": 400
                },
                "area_minima_vivienda": {
                    "1_alcoba": 40,
                    "2_alcobas": 60,
                    "3_alcobas_vip": 75,
                    "3_alcobas_vis": 85,
                    "4_alcobas_vip": 100,
                    "4_alcobas_vis": 110
                },
                "indice_ocupacion": 0.5,
                "indice_construccion": 1.5,
                "altura_maxima": 2,
                "retiro_frontal": 5,
                "retiro_lateral": 5,
                "retiro_posterior": 5
            }
        }