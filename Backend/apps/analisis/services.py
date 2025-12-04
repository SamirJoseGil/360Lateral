"""
Servicios para análisis urbanístico con IA
"""
import google.generativeai as genai
from django.conf import settings
import logging
import time
from decimal import Decimal

logger = logging.getLogger(__name__)


class GeminiAnalysisService:
    """
    Servicio para generar análisis urbanístico con Gemini AI
    """
    
    def __init__(self):
        """Inicializar Gemini con API key"""
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            raise ValueError("GEMINI_API_KEY no configurada en settings")
        
        genai.configure(api_key=api_key)
        
        # ✅ CORREGIDO: Usar modelo actualizado
        try:
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            logger.info("🤖 Modelo Gemini inicializado: gemini-2.5-flash")
        except Exception as e:
            logger.warning(f"⚠️ Error con gemini-2.5-flash, intentando gemini-2.5-pro: {e}")
            try:
                self.model = genai.GenerativeModel('gemini-2.5-pro')
                logger.info("🤖 Modelo Gemini inicializado: gemini-2.5-pro")
            except Exception as e2:
                logger.error(f"❌ No se pudo inicializar ningún modelo de Gemini: {e2}")
                raise ValueError(f"No se pudo inicializar Gemini. Error: {e2}")
    
    @staticmethod
    def construir_prompt(analisis):
        """
        Construir prompt estructurado para Gemini
        """
        from .models import ParametroUrbanistico
        
        lote = analisis.lote
        
        # Obtener parámetros activos
        parametros = ParametroUrbanistico.objects.filter(activo=True).order_by('categoria', 'orden')
        
        # Construir contexto de parámetros
        contexto_parametros = []
        for param in parametros:
            contexto_parametros.append(
                f"## {param.get_categoria_display()} - {param.nombre}\n"
                f"{param.descripcion}\n"
                f"Artículo: {param.articulo_pot or 'N/A'}\n"
                f"Datos: {param.datos}\n"
            )
        
        prompt = f"""
Eres un experto urbanista especializado en análisis de aprovechamiento urbanístico en Medellín, Colombia.

# INFORMACIÓN DEL LOTE
- CBML: {lote.cbml or 'N/A'}
- Dirección: {lote.direccion}
- Área: {float(lote.area) if lote.area else 'N/A'} m²
- Barrio: {lote.barrio or 'N/A'}
- Estrato: {lote.estrato or 'N/A'}
- Clasificación del suelo: {lote.clasificacion_suelo or 'N/A'}
- Uso del suelo: {lote.uso_suelo or 'N/A'}
- Tratamiento POT: {lote.tratamiento_pot or 'N/A'}

# TIPO DE ANÁLISIS SOLICITADO
{analisis.get_tipo_analisis_display()}

{"# INCLUYE VIS (Vivienda de Interés Social)" if analisis.incluir_vis else "# NO incluye VIS"}

# COMENTARIOS DEL SOLICITANTE
{analisis.comentarios_solicitante or 'Sin comentarios adicionales'}

# PARÁMETROS URBANÍSTICOS DEL POT DE MEDELLÍN
{chr(10).join(contexto_parametros)}

# INSTRUCCIONES
Por favor, realiza un análisis urbanístico detallado considerando:

1. **VIABILIDAD NORMATIVA**: Verifica si el lote cumple con los requisitos mínimos del POT
2. **APROVECHAMIENTO MÁXIMO**: Calcula el potencial constructivo según índices
3. **RESTRICCIONES**: Identifica limitaciones por retiros, alturas, cesiones
4. **ÁREAS MÍNIMAS**: Valida cumplimiento de áreas mínimas para vivienda
5. **RECOMENDACIONES**: Sugiere el mejor aprovechamiento del lote
6. **COSTOS ESTIMADOS**: Indica costos aproximados de construcción

Si es VIS, considera específicamente:
- Áreas mínimas para VIS según cantidad de alcobas
- Requisitos especiales para VIS
- Subsidios y beneficios aplicables

Estructura tu respuesta en secciones claras con títulos y bullets.
Usa datos numéricos específicos cuando calcules aprovechamiento.
Sé preciso, profesional y cita artículos del POT cuando aplique.
"""
        
        return prompt
    
    def generar_analisis(self, analisis):
        """
        Generar análisis con Gemini y guardar respuesta
        
        Args:
            analisis: Instancia de AnalisisUrbanistico
            
        Returns:
            RespuestaIA: Respuesta generada
        """
        from .models import RespuestaIA
        
        try:
            logger.info(f"🤖 Generando análisis con IA para {analisis.id}")
            
            # Construir prompt
            prompt = self.construir_prompt(analisis)
            
            # ✅ NUEVO: Configuración de generación con parámetros optimizados
            generation_config = genai.GenerationConfig(
                temperature=0.7,
                top_p=0.95,
                top_k=40,
                max_output_tokens=8192,
            )
            
            # ✅ CRÍTICO: Safety settings con nombres correctos
            safety_settings = {
                genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            }
            
            # Generar respuesta
            start_time = time.time()
            
            # ✅ MEJORADO: Usar generate_content con configuración correcta
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=safety_settings
            )
            
            tiempo_respuesta = time.time() - start_time
            
            # Extraer respuesta
            respuesta_texto = response.text
            
            # ✅ MEJORADO: Contar tokens reales si están disponibles
            tokens_usados = 0
            if hasattr(response, 'usage_metadata'):
                tokens_usados = (
                    response.usage_metadata.prompt_token_count + 
                    response.usage_metadata.candidates_token_count
                )
            else:
                # Estimación si no hay metadata
                tokens_usados = len(prompt.split()) + len(respuesta_texto.split())
            
            # ✅ MEJORADO: Detectar modelo usado
            modelo_usado = 'gemini-2.5-flash'
            if hasattr(self.model, '_model_name'):
                modelo_usado = self.model._model_name
            
            # Guardar en BD
            respuesta_ia = RespuestaIA.objects.create(
                analisis=analisis,
                prompt=prompt,
                respuesta=respuesta_texto,
                modelo_ia=modelo_usado,
                tokens_usados=tokens_usados,
                tiempo_respuesta=tiempo_respuesta
            )
            
            logger.info(
                f"✅ Análisis IA generado en {tiempo_respuesta:.2f}s "
                f"({tokens_usados} tokens) con {modelo_usado}"
            )
            
            return respuesta_ia
            
        except Exception as e:
            logger.error(f"❌ Error generando análisis IA: {str(e)}")
            raise
    
    def regenerar_analisis(self, respuesta_ia, notas_adicionales=None):
        """
        Regenerar análisis con notas adicionales del admin
        """
        analisis = respuesta_ia.analisis
        
        # Agregar notas al prompt original
        prompt_mejorado = respuesta_ia.prompt
        
        if notas_adicionales:
            prompt_mejorado += f"\n\n# NOTAS ADICIONALES DEL ADMINISTRADOR\n{notas_adicionales}\n"
        
        try:
            # ✅ CRÍTICO: Safety settings correctos
            safety_settings = {
                genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            }
            
            start_time = time.time()
            response = self.model.generate_content(
                prompt_mejorado,
                safety_settings=safety_settings
            )
            tiempo_respuesta = time.time() - start_time
            
            # Actualizar respuesta existente
            respuesta_ia.prompt = prompt_mejorado
            respuesta_ia.respuesta = response.text
            respuesta_ia.tiempo_respuesta = tiempo_respuesta
            respuesta_ia.aprobado = False  # Reset aprobación
            respuesta_ia.save()
            
            logger.info(f"✅ Análisis IA regenerado para {analisis.id}")
            
            return respuesta_ia
            
        except Exception as e:
            logger.error(f"❌ Error regenerando análisis: {str(e)}")
            raise
