# 📋 NUEVA FASE EN ROADMAP - SCRAPING MAPGIS Y ANÁLISIS DE LOTES

## 🎯 **FASE 7: SCRAPING MAPGIS Y ANÁLISIS DE FAVORITOS** (NUEVA)

**Objetivo:** Re-implementar el scraping de MapGIS Medellín para permitir que los desarrolladores analicen lotes favoritos con información actualizada del POT.

**Prioridad:** ALTA  
**Complejidad:** ALTA  
**Tiempo Estimado:** 2-3 semanas  
**Dependencias:** Fase 3 (Perfil Developer) y Fase 4 (Favoritos)

---

### 📊 **Descripción General**

Re-implementar el sistema de scraping a MapGIS Medellín que extrae información urbanística actualizada **exclusivamente por CBML**. Los desarrolladores podrán analizar sus lotes favoritos obteniendo:

- ✅ Restricciones ambientales (amenaza/riesgo, retiros a ríos, estructura ecológica)
- ✅ Clasificación del suelo (urbano/rural)
- ✅ Área del lote (m²)
- ✅ Uso del suelo (categorías y subcategorías)
- ✅ Aprovechamiento urbano (tratamiento, densidad, índices, alturas)
- ✅ Casos POT específicos
- ✅ Geometría del lote

---

### 🏗️ **BACKEND - Scraping MapGIS**

#### **7.1. Módulo de Servicios MapGIS** (1 semana)

**Archivos a crear:**
```
Backend/apps/mapgis/
├── __init__.py
├── models.py                    # Modelos de cache de datos
├── serializers.py               # Serializers para respuestas
├── urls.py                      # Endpoints de consulta
├── views.py                     # ViewSets y vistas
└── services/
    ├── __init__.py
    ├── base_service.py          # Utilidades comunes
    ├── mapgis_core.py           # Sesión HTTP, configuración
    ├── mapgis_extractors.py     # Extractores de datos (HTML/JSON)
    ├── mapgis_processors.py     # Procesadores especializados
    ├── mapgis_queries.py        # Consultas específicas
    └── mapgis_service.py        # Servicio principal integrado
```

**Tareas:**

- [x] ✅ **`base_service.py`** - Clase base con utilidades comunes (timestamps, limpieza, respuestas)
- [ ] **`mapgis_core.py`** - Gestión de sesión HTTP, headers, cookies, health checks
- [ ] **`mapgis_extractors.py`** - Extracción de datos desde HTML y JSON (regex, parsing)
- [ ] **`mapgis_processors.py`** - Procesamiento de uso suelo, aprovechamiento, clasificación
- [ ] **`mapgis_queries.py`** - Consultas específicas:
  - Área del lote (`SQL_CONSULTA_LOTE`)
  - Clasificación suelo (`SQL_CONSULTA_CLASIFICACIONSUELO`)
  - Usos generales (`SQL_CONSULTA_USOSGENERALES`)
  - Aprovechamiento urbano (`SQL_CONSULTA_APROVECHAMIENTOSURBANOS`)
  - Restricción amenaza/riesgo (`SQL_CONSULTA_RESTRICCIONAMENAZARIESGO`)
  - Restricción ríos/quebradas (`SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS`)
  - Estructura ecológica (servicio MapServer)
  - Casos POT (`consultarCasosPot.hyg`)
  - Geometría lote (`consultarLotes.hyg`)
- [ ] **`mapgis_service.py`** - Orquestador principal que integra todas las consultas

#### **7.2. Modelos y Cache** (2 días)

```python
# apps/mapgis/models.py
class MapGISCache(models.Model):
    """Cache de consultas a MapGIS"""
    cbml = models.CharField(max_length=14, unique=True, db_index=True)
    data = models.JSONField()
    consulted_at = models.DateTimeField(auto_now=True)
    expiry_date = models.DateTimeField()
    is_valid = models.BooleanField(default=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['cbml', 'is_valid']),
            models.Index(fields=['expiry_date']),
        ]
```

**Tareas:**
- [ ] Crear modelo `MapGISCache` con índices
- [ ] Migración de base de datos
- [ ] Serializer `MapGISCacheSerializer`
- [ ] Sistema de expiración (24 horas por defecto)
- [ ] Método de limpieza de cache antiguo

#### **7.3. Endpoints API** (3 días)

```python
# apps/mapgis/urls.py
urlpatterns = [
    path('consulta/cbml/<str:cbml>/', ConsultaCBMLView.as_view()),
    path('consulta/restricciones/<str:cbml>/', RestriccionesView.as_view()),
    path('health/', MapGISHealthView.as_view()),
    path('cache/clear/', ClearCacheView.as_view()),
]
```

**Endpoints:**

1. **`GET /api/mapgis/consulta/cbml/<cbml>/`**
   - Consulta completa por CBML
   - Cache: 24 horas
   - Response: Datos completos del lote

2. **`GET /api/mapgis/consulta/restricciones/<cbml>/`**
   - Solo restricciones ambientales
   - Cache: 24 horas
   - Response: Restricciones específicas

3. **`GET /api/mapgis/health/`**
   - Health check del servicio
   - No auth required
   - Response: Estado del scraper

4. **`POST /api/mapgis/cache/clear/`** (Admin only)
   - Limpia cache de MapGIS
   - Requiere permisos admin

**Tareas:**
- [ ] Implementar `ConsultaCBMLView` (consulta completa)
- [ ] Implementar `RestriccionesView` (solo restricciones)
- [ ] Implementar `MapGISHealthView` (health check)
- [ ] Implementar `ClearCacheView` (limpieza cache)
- [ ] Rate limiting (5 req/min por usuario)
- [ ] Logging detallado de operaciones
- [ ] Manejo de errores y timeouts

#### **7.4. Tests Backend** (2 días)

**Tareas:**
- [ ] Tests unitarios de extractores
- [ ] Tests unitarios de procesadores
- [ ] Tests de integración con MapGIS (mock)
- [ ] Tests de cache
- [ ] Tests de endpoints
- [ ] Coverage mínimo 80%

---

### 🎨 **FRONTEND - Vista de Análisis**

#### **7.5. Servicio Frontend** (2 días)

```typescript
// app/services/mapgis.server.ts
export async function consultarMapGIS(request: Request, cbml: string)
export async function consultarRestricciones(request: Request, cbml: string)
export async function mapgisHealthCheck(request: Request)
```

**Tareas:**
- [ ] Crear `mapgis.server.ts`
- [ ] Implementar `consultarMapGIS()`
- [ ] Implementar `consultarRestricciones()`
- [ ] Implementar `mapgisHealthCheck()`
- [ ] Manejo de errores y loading states
- [ ] Cache en frontend (session storage)

#### **7.6. Componentes de Análisis** (3 días)

**Componentes:**

1. **`<MapGISAnalysis />`** - Componente principal de análisis
2. **`<RestriccionesCard />`** - Card de restricciones ambientales
3. **`<AprovechamientoCard />`** - Card de aprovechamiento urbano
4. **`<UsoSueloCard />`** - Card de uso del suelo
5. **`<AreaClasificacionCard />`** - Área y clasificación
6. **`<GeometriaMap />`** - Mapa con geometría del lote

```tsx
// app/components/MapGISAnalysis.tsx
interface MapGISAnalysisProps {
  cbml: string;
  loteName: string;
  loteAddress: string;
}

export function MapGISAnalysis({ cbml, loteName, loteAddress }: MapGISAnalysisProps) {
  // Component implementation
}
```

**Tareas:**
- [ ] Crear componente `MapGISAnalysis`
- [ ] Crear `RestriccionesCard` con iconos visuales
- [ ] Crear `AprovechamientoCard` con métricas
- [ ] Crear `UsoSueloCard` con categorías
- [ ] Crear `AreaClasificacionCard`
- [ ] Crear `GeometriaMap` con Leaflet
- [ ] Loading states y skeletons
- [ ] Error handling visual
- [ ] Responsive design

#### **7.7. Nueva Ruta de Análisis** (2 días)

```typescript
// app/routes/developer.favorites.$id.analyze.tsx
export async function loader({ request, params }: LoaderFunctionArgs)
export default function AnalyzeFavoriteLot()
```

**Ruta:** `/developer/favorites/{loteId}/analyze`

**Tareas:**
- [ ] Crear ruta `developer.favorites.$id.analyze.tsx`
- [ ] Loader que obtiene lote y consulta MapGIS
- [ ] Integrar componentes de análisis
- [ ] Botón "Analizar con MapGIS" en favoritos
- [ ] Breadcrumbs de navegación
- [ ] Exportar análisis a PDF (futuro)

#### **7.8. Mejoras en Lista de Favoritos** (1 día)

**Tareas:**
- [ ] Botón "Analizar" en cada lote favorito
- [ ] Badge indicador si tiene CBML válido
- [ ] Link directo a análisis
- [ ] Tooltip explicativo

---

### 🔒 **SEGURIDAD Y OPTIMIZACIÓN**

#### **7.9. Rate Limiting y Cache** (1 día)

**Tareas:**
- [ ] Rate limiting: 5 consultas/minuto por usuario
- [ ] Rate limiting global: 50 consultas/hora
- [ ] Cache Redis de resultados (24 horas)
- [ ] Cache de sesión HTTP (30 minutos)
- [ ] Retry automático con backoff exponencial
- [ ] Circuit breaker para fallos consecutivos

#### **7.10. Monitoreo y Logs** (1 día)

**Tareas:**
- [ ] Logging estructurado de todas las consultas
- [ ] Métricas de éxito/fallo
- [ ] Alertas si tasa de error > 30%
- [ ] Dashboard de estadísticas de uso
- [ ] Tracking de CBMLs más consultados

---

### 📝 **DOCUMENTACIÓN**

#### **7.11. Documentación Técnica** (1 día)

**Tareas:**
- [ ] Documentar arquitectura del scraper
- [ ] Documentar endpoints API
- [ ] Documentar estructura de respuestas
- [ ] Guía de troubleshooting
- [ ] Ejemplos de uso en Postman
- [ ] README del módulo MapGIS

---

### 🧪 **TESTING E INTEGRACIÓN**

#### **7.12. Testing Integral** (2 días)

**Tareas:**
- [ ] Tests E2E de flujo completo
- [ ] Tests de carga (50 usuarios concurrentes)
- [ ] Tests de timeout y reconexión
- [ ] Tests de cache hit/miss
- [ ] Tests de rate limiting
- [ ] Tests de fallback cuando MapGIS está offline

---

### 🚀 **DEPLOYMENT**

#### **7.13. Deploy y Configuración** (1 día)

**Tareas:**
- [ ] Variables de entorno en producción
- [ ] Configurar timeouts apropiados
- [ ] Configurar Redis para cache
- [ ] Health checks en monitoreo
- [ ] Documentar proceso de deploy
- [ ] Plan de rollback

---

## 📊 **CRONOGRAMA DETALLADO**

| Semana | Días | Tareas |
|--------|------|--------|
| **Semana 1** | 1-2 | Backend: Servicios core (base, extractors, processors) |
| | 3-4 | Backend: Queries específicas (área, clasificación, usos) |
| | 5 | Backend: Queries de restricciones y estructura ecológica |
| **Semana 2** | 1-2 | Backend: Servicio integrador + Modelos/Cache |
| | 3-4 | Backend: Endpoints API + Rate limiting |
| | 5 | Backend: Tests unitarios |
| **Semana 3** | 1 | Frontend: Servicio mapgis.server.ts |
| | 2-3 | Frontend: Componentes de análisis |
| | 4 | Frontend: Nueva ruta + Integración favoritos |
| | 5 | Testing integral + Deploy |

---

## 🎯 **CRITERIOS DE ÉXITO**

- ✅ Scraping funcional por CBML con tasa de éxito > 70%
- ✅ Cache efectivo (hit ratio > 60%)
- ✅ Tiempo de respuesta < 5 segundos
- ✅ Rate limiting funcionando correctamente
- ✅ UI de análisis clara y responsive
- ✅ Documentación completa
- ✅ Tests con coverage > 80%
- ✅ Fallback elegante cuando MapGIS está offline

---

## 🔄 **DEPENDENCIAS TÉCNICAS**

**Backend:**
- `requests` - HTTP requests
- `beautifulsoup4` o `lxml` - HTML parsing (si es necesario)
- `redis` - Cache de consultas

**Frontend:**
- `leaflet` + `react-leaflet` - Mapas con geometría
- Componentes de análisis reutilizables

---

## ⚠️ **RIESGOS Y MITIGACIONES**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| MapGIS cambia estructura | Media | Alto | Sistema de fallback + monitoreo activo |
| Rate limiting de MapGIS | Baja | Medio | Cache agresivo + retry con backoff |
| Datos incompletos | Media | Bajo | Validación + mensajes claros al usuario |
| Performance lento | Media | Medio | Cache Redis + consultas asíncronas |

---

## 📋 **CHECKLIST FINAL**

Antes de marcar como completa:

- [ ] Scraping funciona con CBML real
- [ ] Cache implementado y funcionando
- [ ] Rate limiting activo
- [ ] Todos los tests pasan
- [ ] Documentación completa
- [ ] UI de análisis funcional y responsive
- [ ] Health checks configurados
- [ ] Logging detallado activo
- [ ] Deploy exitoso en staging
- [ ] Aprobación de QA

---

## 📈 **MÉTRICAS DE ÉXITO**

Al finalizar la fase, deberías tener:

- 📊 **Backend**: 8 endpoints funcionales
- 🎨 **Frontend**: 6 componentes nuevos
- 🧪 **Tests**: > 80% coverage
- 📝 **Documentación**: Completa y actualizada
- 🚀 **Performance**: < 5s por consulta
- 💾 **Cache**: > 60% hit ratio
- ⚡ **Disponibilidad**: > 95% uptime

---

**Estado:** 🟡 **PENDIENTE DE INICIO**  
**Asignado a:** Backend Team + Frontend Team  
**Fecha inicio estimada:** Semana 13  
**Fecha fin estimada:** Semana 15-16  

---

*Esta fase se agregará al roadmap.md como **Fase 7** después de completar la Fase 6 (Performance y Seguridad).*