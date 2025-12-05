"""
Modelos para análisis urbanístico
"""
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid
import logging

logger = logging.getLogger(__name__)


class AnalisisUrbanistico(models.Model):
    """
    Solicitud de análisis urbanístico de un lote
    """
    TIPO_ANALISIS_CHOICES = [
        ('maximo_potencial', 'Máximo Potencial'),
        ('factibilidad', 'Factibilidad'),
        ('normativa', 'Análisis Normativo'),
        ('financiero', 'Análisis Financiero'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completado', 'Completado'),
        ('rechazado', 'Rechazado'),
    ]
    
    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relaciones
    lote = models.ForeignKey(
        'lotes.Lote',
        on_delete=models.CASCADE,
        related_name='analisis',
        verbose_name='Lote'
    )
    solicitante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='analisis_solicitados',
        verbose_name='Solicitante'
    )
    analista = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analisis_realizados',
        verbose_name='Analista Asignado'
    )
    
    # Información del análisis
    tipo_analisis = models.CharField(
        max_length=50,
        choices=TIPO_ANALISIS_CHOICES,
        verbose_name='Tipo de Análisis',
        db_index=True
    )
    incluir_vis = models.BooleanField(
        default=False,
        verbose_name='Incluir VIS'
    )
    comentarios_solicitante = models.TextField(
        blank=True,
        null=True,
        verbose_name='Comentarios del Solicitante'
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='pendiente',
        verbose_name='Estado',
        db_index=True
    )
    
    # Resultados del análisis
    resultados = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Resultados del Análisis',
        help_text='Contiene los datos calculados del análisis'
    )
    observaciones_analista = models.TextField(
        blank=True,
        null=True,
        verbose_name='Observaciones del Analista'
    )
    archivo_informe = models.FileField(
        upload_to='analisis/informes/',
        blank=True,
        null=True,
        verbose_name='Archivo del Informe'
    )
    
    # Fechas
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Solicitud')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última Actualización')
    fecha_inicio_proceso = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha Inicio Proceso'
    )
    fecha_completado = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Completado'
    )
    
    # Metadatos
    metadatos = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Metadatos Adicionales'
    )
    
    class Meta:
        verbose_name = 'Análisis Urbanístico'
        verbose_name_plural = 'Análisis Urbanísticos'
        ordering = ['-created_at']
        db_table = 'analisis_urbanistico'
        indexes = [
            models.Index(fields=['lote', '-created_at']),
            models.Index(fields=['solicitante', '-created_at']),
            models.Index(fields=['estado', '-created_at']),
            models.Index(fields=['tipo_analisis', 'estado']),
        ]
    
    def __str__(self):
        return f"{self.get_tipo_analisis_display()} - {self.lote.nombre} ({self.get_estado_display()})"
    
    def clean(self):
        """Validaciones del modelo"""
        super().clean()
        
        # ✅ SIMPLIFICADO: Solo validar que propietarios analicen sus lotes
        if self.lote and self.solicitante:
            user = self.solicitante
            
            # Propietarios solo pueden solicitar análisis de sus lotes
            if user.role == 'owner':
                if self.lote.owner != user:
                    raise ValidationError({
                        'lote': 'Solo puedes solicitar análisis para tus propios lotes'
                    })
            
            # ✅ ELIMINADO: Validaciones de desarrollador
            # Desarrolladores pueden analizar CUALQUIER lote
            
            # Admins pueden analizar cualquier lote (sin restricciones)
    
    def save(self, *args, **kwargs):
        """Override save para logging y actualizar fechas"""
        # ✅ CORREGIDO: Solo verificar estado anterior si el objeto YA existe en BD
        if self.pk:
            try:
                old = AnalisisUrbanistico.objects.get(pk=self.pk)
                if old.estado != 'en_proceso' and self.estado == 'en_proceso':
                    self.fecha_inicio_proceso = timezone.now()
                
                if old.estado != 'completado' and self.estado == 'completado':
                    self.fecha_completado = timezone.now()
            except AnalisisUrbanistico.DoesNotExist:
                # El objeto fue eliminado, continuar con el guardado
                pass
        
        super().save(*args, **kwargs)
        
        logger.info(
            f"Análisis {self.id} - Lote: {self.lote.nombre} - "
            f"Estado: {self.estado} - Solicitante: {self.solicitante.email}"
        )
    
    # Métodos útiles
    def iniciar_proceso(self, analista):
        """Iniciar el proceso de análisis"""
        self.estado = 'en_proceso'
        self.analista = analista
        self.fecha_inicio_proceso = timezone.now()
        self.save()
        logger.info(f"Análisis {self.id} iniciado por {analista.email}")
    
    def completar(self, resultados, observaciones=None, archivo=None):
        """Completar el análisis"""
        self.estado = 'completado'
        self.resultados = resultados
        if observaciones:
            self.observaciones_analista = observaciones
        if archivo:
            self.archivo_informe = archivo
        self.fecha_completado = timezone.now()
        self.save()
        logger.info(f"Análisis {self.id} completado")
    
    def rechazar(self, motivo):
        """Rechazar la solicitud"""
        self.estado = 'rechazado'
        self.observaciones_analista = motivo
        self.save()
        logger.info(f"Análisis {self.id} rechazado: {motivo}")
    
    @property
    def tiempo_procesamiento(self):
        """Calcula el tiempo de procesamiento"""
        if self.fecha_completado and self.fecha_inicio_proceso:
            return self.fecha_completado - self.fecha_inicio_proceso
        return None
    
    @property
    def esta_pendiente(self):
        return self.estado == 'pendiente'
    
    @property
    def esta_en_proceso(self):
        return self.estado == 'en_proceso'
    
    @property
    def esta_completado(self):
        return self.estado == 'completado'


class ParametroUrbanistico(models.Model):
    """
    Parámetros urbanísticos del POT para IA
    """
    CATEGORIA_CHOICES = [
        ('area_minima', 'Área Mínima Construida'),
        ('indices', 'Índices Urbanísticos'),
        ('retiros', 'Retiros'),
        ('alturas', 'Alturas Máximas'),
        ('estacionamientos', 'Estacionamientos'),
        ('cesiones', 'Cesiones Obligatorias'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Categoría y descripción
    categoria = models.CharField(
        max_length=50,
        choices=CATEGORIA_CHOICES,
        db_index=True,
        verbose_name='Categoría'
    )
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Parámetro'
    )
    descripcion = models.TextField(
        verbose_name='Descripción Detallada',
        help_text='Descripción completa del parámetro para la IA'
    )
    
    # Datos estructurados
    datos = models.JSONField(
        default=dict,
        verbose_name='Datos del Parámetro',
        help_text='Estructura JSON con los valores del parámetro'
    )
    
    # Artículo POT
    articulo_pot = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Artículo POT'
    )
    
    # Metadatos
    activo = models.BooleanField(default=True, verbose_name='Activo')
    orden = models.IntegerField(default=0, verbose_name='Orden')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Parámetro Urbanístico'
        verbose_name_plural = 'Parámetros Urbanísticos'
        ordering = ['categoria', 'orden', 'nombre']
        db_table = 'analisis_parametro_urbanistico'
    
    def __str__(self):
        return f"{self.get_categoria_display()} - {self.nombre}"


class RespuestaIA(models.Model):
    """
    Respuestas generadas por IA para análisis
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    analisis = models.ForeignKey(
        AnalisisUrbanistico,
        on_delete=models.CASCADE,
        related_name='respuestas_ia',
        verbose_name='Análisis'
    )
    
    # Prompt y respuesta
    prompt = models.TextField(verbose_name='Prompt Enviado')
    respuesta = models.TextField(verbose_name='Respuesta de la IA')
    
    # Metadatos de la IA
    modelo_ia = models.CharField(
        max_length=100,
        default='gemini-pro',
        verbose_name='Modelo de IA'
    )
    tokens_usados = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Tokens Usados'
    )
    tiempo_respuesta = models.FloatField(
        null=True,
        blank=True,
        verbose_name='Tiempo de Respuesta (segundos)'
    )
    
    # Validación manual
    revisado_por = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='respuestas_ia_revisadas',
        verbose_name='Revisado Por'
    )
    aprobado = models.BooleanField(
        default=False,
        verbose_name='Aprobado por Admin'
    )
    notas_revision = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas de Revisión'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Respuesta IA'
        verbose_name_plural = 'Respuestas IA'
        ordering = ['-created_at']
        db_table = 'analisis_respuesta_ia'
    
    def __str__(self):
        return f"IA - {self.analisis.tipo_analisis} - {self.created_at.strftime('%Y-%m-%d')}"
