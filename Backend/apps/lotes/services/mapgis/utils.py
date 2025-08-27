"""
Utilidades para el servicio MapGIS.
Contiene funciones y clases para procesar los datos de MapGIS.
"""

import re
from typing import Dict, Any, List, Optional, Union

class MapGISDataParser:
    """
    Parser para datos de MapGIS.
    Proporciona métodos para extraer y estructurar información de las respuestas de la API.
    """
    
    def extract_area_lote(self, data: Dict[str, Any]) -> Optional[Dict[str, Union[str, float]]]:
        """
        Extrae el área del lote de los datos recibidos.
        
        Args:
            data: Respuesta de la consulta de área de lote
            
        Returns:
            Dict con área de lote como string y como float, o None
        """
        if not data.get('resultados') or not data['resultados'][0]:
            return None
            
        primer_resultado = data['resultados'][0]
        if not isinstance(primer_resultado, list) or not primer_resultado:
            return None
            
        for item in primer_resultado:
            nombre = item.get('nombre')
            valor = item.get('valor')
            
            if nombre == 'Área de lote' and valor:
                resultado = {'area_texto': valor}
                try:
                    # Extraer solo el número del área (quita unidades y convierte ',' a '.')
                    area_num = float(re.sub(r'[^\d.]', '', valor.replace(',', '.')))
                    resultado['area_m2'] = area_num
                except (ValueError, AttributeError):
                    resultado['area_m2'] = None
                return resultado
                
        return None

    def extract_clasificacion_suelo(self, data: Dict[str, Any]) -> Optional[str]:
        """
        Extrae la clasificación del suelo de los datos recibidos.
        
        Args:
            data: Respuesta de la consulta de clasificación del suelo
            
        Returns:
            String con la clasificación o None
        """
        if not data.get('resultados') or not data['resultados'][0]:
            return None
            
        primer_resultado = data['resultados'][0]
        if not isinstance(primer_resultado, list) or not primer_resultado:
            return None
            
        for item in primer_resultado:
            nombre = item.get('nombre')
            valor = item.get('valor')
            
            if nombre == 'Clasificación del suelo' and valor:
                return valor
                
        return None

    def extract_uso_suelo(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrae información de uso del suelo de los datos recibidos.
        
        Args:
            data: Respuesta de la consulta de usos generales
            
        Returns:
            Dict con información de uso del suelo
        """
        resultado = {
            'categoria_uso': None,
            'subcategoria_uso': None,
            'porcentaje': None
        }
        
        if not data.get('resultados') or not data['resultados'][0]:
            return resultado
            
        primer_resultado = data['resultados'][0]
        if not isinstance(primer_resultado, list) or not primer_resultado:
            return resultado
            
        for item in primer_resultado:
            nombre = item.get('nombre')
            valor = item.get('valor')
            
            if nombre == 'Categoría de uso':
                resultado['categoria_uso'] = valor
            elif nombre == 'Subcategoría de uso':
                resultado['subcategoria_uso'] = valor
            elif nombre == 'Porcentaje':
                try:
                    resultado['porcentaje'] = float(valor)
                except (ValueError, TypeError):
                    resultado['porcentaje'] = valor
                
        return resultado

    def extract_aprovechamiento(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrae información de aprovechamiento urbano de los datos recibidos.
        
        Args:
            data: Respuesta de la consulta de aprovechamientos urbanos
            
        Returns:
            Dict con información de aprovechamiento
        """
        resultado = {
            'tratamiento': None,
            'densidad_habitacional_max': None,
            'altura_normativa': None
        }
        
        if not data.get('resultados') or not data['resultados'][0]:
            return resultado
            
        primer_resultado = data['resultados'][0]
        if not isinstance(primer_resultado, list) or not primer_resultado:
            return resultado
            
        for item in primer_resultado:
            nombre = item.get('nombre')
            valor = item.get('valor')
            
            if nombre == 'Tratamiento':
                resultado['tratamiento'] = valor
            elif nombre == 'Dens habit max (Viv/ha)':
                try:
                    if valor != 'No Aplica':
                        resultado['densidad_habitacional_max'] = float(valor)
                    else:
                        resultado['densidad_habitacional_max'] = valor
                except (ValueError, TypeError):
                    resultado['densidad_habitacional_max'] = valor
            elif nombre == 'Altura normativa':
                resultado['altura_normativa'] = valor
                
        return resultado

    def extract_restricciones(self, data_amenaza: Dict[str, Any], data_rios: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrae información de restricciones ambientales de los datos recibidos.
        
        Args:
            data_amenaza: Respuesta de la consulta de amenazas y riesgos
            data_rios: Respuesta de la consulta de retiros a ríos y quebradas
            
        Returns:
            Dict con información de restricciones
        """
        resultado = {
            'amenaza_riesgo': None,
            'retiros_rios': 'Sin restricciones por retiros'
        }
        
        # Extraer amenaza y riesgo
        if data_amenaza.get('resultados') and data_amenaza['resultados'][0]:
            primer_resultado = data_amenaza['resultados'][0]
            if isinstance(primer_resultado, list) and primer_resultado:
                for item in primer_resultado:
                    nombre = item.get('nombre')
                    valor = item.get('valor')
                    
                    if nombre == 'Condiciones de riesgo y RNM' and valor:
                        resultado['amenaza_riesgo'] = valor
        
        # Extraer retiros a ríos y quebradas
        if data_rios.get('resultados') and data_rios['resultados'][0]:
            primer_resultado = data_rios['resultados'][0]
            if isinstance(primer_resultado, list) and primer_resultado:
                for item in primer_resultado:
                    nombre = item.get('nombre')
                    valor = item.get('valor')
                    
                    if nombre == 'Restric por retiro a quebrada' and valor:
                        resultado['retiros_rios'] = valor
                
        return resultado