# Módulo de MapGIS Scraper

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Modelos](#modelos)
- [Servicios](#servicios)
- [Vistas (Views)](#vistas-views)
- [Serializers](#serializers)
- [URLs](#urls)
- [Sistema de Cache](#sistema-de-cache)
- [Consultas Disponibles](#consultas-disponibles)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **MapGIS Scraper** integra el sistema Lateral 360° con el portal MapGIS de la Alcaldía de Medellín, permitiendo la consulta automática de información catastral y urbanística de lotes mediante su CBML (Código Base Manzana Lote).

### Características Principales

- 🗺️ **Integración con MapGIS**: Consulta directa al sistema oficial de Medellín
- 📊 **Múltiples Consultas**: Clasificación de suelo, usos, aprovechamientos, restricciones
- 💾 **Sistema de Cache**: Almacenamiento temporal de consultas (24 horas)
- 🔄 **Gestión de Sesión**: Manejo automático de cookies y headers
- ⚡ **Optimizado**: Consultas paralelas y retry automático
- 🔍 **Validación de CBML**: Soporte para formato de 11 dígitos

---

## Arquitectura

### Estructura de Capas

Searched codebase for "Perfecto, sigamos con el de mapgis #file:mapgis.md #codebase ", 14 results

Voy a crear la documentación completa del módulo de MapGIS.

# Módulo de MapGIS Scraper

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura](#arquitectura)
- [Modelos](#modelos)
- [Servicios](#servicios)
- [Vistas (Views)](#vistas-views)
- [Serializers](#serializers)
- [URLs](#urls)
- [Sistema de Cache](#sistema-de-cache)
- [Consultas Disponibles](#consultas-disponibles)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **MapGIS Scraper** integra el sistema Lateral 360° con el portal MapGIS de la Alcaldía de Medellín, permitiendo la consulta automática de información catastral y urbanística de lotes mediante su CBML (Código Base Manzana Lote).

### Características Principales

- 🗺️ **Integración con MapGIS**: Consulta directa al sistema oficial de Medellín
- 📊 **Múltiples Consultas**: Clasificación de suelo, usos, aprovechamientos, restricciones
- 💾 **Sistema de Cache**: Almacenamiento temporal de consultas (24 horas)
- 🔄 **Gestión de Sesión**: Manejo automático de cookies y headers
- ⚡ **Optimizado**: Consultas paralelas y retry automático
- 🔍 **Validación de CBML**: Soporte para formato de 11 dígitos

---

## Arquitectura

### Estructura de Capas

```
┌─────────────────────────────────────┐
│         Frontend / API              │
│    (Solicita consulta de CBML)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      MapGIS Views (views.py)        │
│   - consulta_cbml()                 │
│   - health_check()                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MapGISService (mapgis_service.py) │
│   - consultar_lote_completo()       │
│   - consultar_por_matricula()       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    MapGISCore (mapgis_core.py)      │
│   - inicializar_sesion()            │
│   - consultar_datos_completos()     │
│   - buscar_por_cbml()               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   MapGISQueries (mapgis_queries.py) │
│   - consultar_clasificacion_suelo() │
│   - consultar_usos_generales()      │
│   - consultar_aprovechamientos()    │
│   - consultar_restricciones()       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Portal MapGIS Medellín        │
│   (www.medellin.gov.co/mapgis)      │
└─────────────────────────────────────┘
```

### Componentes Principales

#### 1. **MapGISCore**
- Gestión de sesión HTTP
- Configuración de headers
- Aceptación de términos
- Consultas base

#### 2. **MapGISQueries**
- Consultas específicas por tipo
- Procesamiento de respuestas
- Manejo de timeouts y retries

#### 3. **MapGISService**
- Orquestación de consultas
- Consolidación de datos
- Interfaz simplificada para vistas

#### 4. **MapGISProcessors**
- Procesamiento de datos específicos
- Formateo de respuestas
- Extracción de información

#### 5. **MapGISExtractors**
- Extracción de datos de HTML
- Parsing de JSON
- Limpieza de valores

---

## Modelos

### `MapGISCache`

Modelo para almacenar consultas en cache.

**Ubicación**: `apps/mapgis/models.py`

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cbml` | CharField(11) | CBML único (11 dígitos) |
| `data` | JSONField | Información completa del lote |
| `consulted_at` | DateTimeField | Fecha de consulta |
| `expiry_date` | DateTimeField | Fecha de expiración (24h) |
| `is_valid` | BooleanField | Si el cache es válido |
| `hit_count` | IntegerField | Número de veces usado |

#### Métodos

```python
# Verificar si expiró
if cache_entry.is_expired():
    print("Cache expirado")

# Invalidar cache
cache_entry.invalidate()

# Incrementar contador
cache_entry.increment_hit()

# Limpiar registros expirados (método de clase)
MapGISCache.cleanup_expired()
```

#### Índices

```python
indexes = [
    models.Index(fields=['cbml', 'is_valid']),
    models.Index(fields=['expiry_date']),
    models.Index(fields=['consulted_at']),
]
```

---

## Servicios

### MapGISCore

Servicio principal para gestión de sesión y consultas base.

**Ubicación**: mapgis_core.py

#### Configuración

```python
BASE_URL = "https://www.medellin.gov.co"

ENDPOINTS = {
    'validar_sesion': f'{BASE_URL}/mapgis_seg/ValidarSessionMapgis.do',
    'buscar_cbml': f'{BASE_URL}/site_consulta_pot/buscarFichaCBML.hyg',
    'buscar_matricula': f'{BASE_URL}/site_consulta_pot/buscarFichaMat.hyg',
    'consultas': f'{BASE_URL}/site_consulta_pot/consultas.hyg',
}
```

#### Métodos Principales

##### `inicializar_sesion()`

Inicializa sesión con MapGIS (acepta términos).

```python
core = MapGISCore()
if core.inicializar_sesion():
    print("Sesión inicializada correctamente")
```

**Qué hace**:
1. POST a `ValidarSessionMapgis.do` con `acepta_terminos=true`
2. Almacena cookies de sesión
3. Configura headers correctos
4. Retorna `True` si exitoso

---

##### `buscar_por_cbml(cbml)`

Busca un lote por CBML.

```python
resultado = core.buscar_por_cbml('01234567890')
if resultado:
    print(f"CBML: {resultado['cbml']}")
    print(f"Dirección: {resultado.get('direccion')}")
```

**Retorna**: `Dict` con datos del lote o `None`

---

##### `consultar_datos_completos(cbml)`

Consulta TODAS las capas de información.

```python
datos = core.consultar_datos_completos('01234567890')

if datos.get('error'):
    print(f"Error: {datos['mensaje']}")
else:
    print(f"Clasificación: {datos['clasificacion_suelo']}")
    print(f"Usos: {datos['usos_generales']}")
    print(f"Aprovechamientos: {datos['aprovechamientos_urbanos']}")
```

**Retorna**:

```python
{
    'cbml': '01234567890',
    'clasificacion_suelo': 'Urbano',
    'usos_generales': [
        {
            'categoria_uso': 'Residencial',
            'subcategoria_uso': 'Vivienda Unifamiliar',
            'porcentaje': '100%'
        }
    ],
    'aprovechamientos_urbanos': [
        {
            'tratamiento': 'Consolidación Nivel 2',
            'codigo_tratamiento': 'CN2',
            'densidad_habitacional_max': '250',
            'indice_construccion_max': '4.0',
            'altura_normativa': '5 pisos'
        }
    ],
    'restriccion_amenaza_riesgo': 'Sin restricciones',
    'restriccion_retiros_rios': 'Sin restricciones'
}
```

---

##### `consultar_clasificacion_suelo(cbml)`

Consulta clasificación del suelo (Urbano/Rural).

```python
clasificacion = core.consultar_clasificacion_suelo('01234567890')
# Retorna: "Urbano" o "Rural"
```

---

##### `consultar_usos_generales(cbml)`

Consulta usos del suelo.

```python
usos = core.consultar_usos_generales('01234567890')
# Retorna lista de usos con porcentajes
```

---

##### `consultar_aprovechamientos_urbanos(cbml)`

Consulta tratamientos y aprovechamientos.

```python
aprovechamientos = core.consultar_aprovechamientos_urbanos('01234567890')
# Retorna lista con IC, IO, densidades, etc.
```

---

##### `consultar_restriccion_amenaza(cbml)`

Consulta restricciones por amenaza/riesgo.

```python
restriccion = core.consultar_restriccion_amenaza('01234567890')
# Retorna: "Sin restricciones" o descripción
```

---

##### `consultar_restriccion_rios(cbml)`

Consulta retiros obligatorios por ríos/quebradas.

```python
retiros = core.consultar_restriccion_rios('01234567890')
# Retorna: "Sin restricciones" o medidas
```

---

##### `health_check()`

Verifica estado del servicio.

```python
health = core.health_check()
print(f"Status: {health['status']}")
print(f"Session: {health['session_initialized']}")
```

---

### MapGISQueries

Consultas específicas a endpoints de MapGIS.

**Ubicación**: mapgis_queries.py

#### Estructura

```python
class MapGISQueries:
    def __init__(self, core_service):
        self.core = core_service
    
    def consultar_area_lote(self, cbml):
        # Consulta área del lote
        pass
    
    def consultar_clasificacion_suelo(self, cbml):
        # Consulta clasificación
        pass
```

#### Métodos Disponibles

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `consultar_area_lote()` | Área del lote en m² | Dict con área |
| `consultar_clasificacion_suelo()` | Urbano/Rural | String |
| `consultar_usos_generales()` | Usos permitidos | List[Dict] |
| `consultar_aprovechamientos_urbanos()` | IC, IO, densidades | List[Dict] |
| `consultar_restriccion_amenaza()` | Riesgos | String |
| `consultar_restriccion_rios()` | Retiros obligatorios | String |
| `consultar_casos_pot()` | Casos especiales POT | Dict |
| `consultar_geometria_lote()` | Coordenadas | Dict |

---

### MapGISService

Servicio orquestador (interfaz principal).

**Ubicación**: mapgis_service.py

#### Uso

```python
from apps.mapgis.services.mapgis_service import mapgis_service

# Consulta completa
resultado = mapgis_service.consultar_lote_completo('01234567890')

if resultado.get('success'):
    datos = resultado['data']
    print(f"Clasificación: {datos['clasificacion_suelo']}")
    print(f"Uso: {datos['uso_suelo']}")
else:
    print(f"Error: {resultado['error']}")
```

#### Métodos

##### `consultar_lote_completo(cbml, use_cache=True)`

Consulta completa con cache opcional.

**Parámetros**:
- `cbml`: Código CBML (11 dígitos)
- `use_cache`: Si usar cache (default: True)

**Retorna**:

```python
{
    'success': True,
    'data': {
        'cbml': '01234567890',
        'clasificacion_suelo': 'Urbano',
        'es_urbano': True,
        'uso_suelo': {
            'categoria_uso': 'Residencial',
            'subcategoria_uso': 'Vivienda Unifamiliar',
            'codigo_subcategoria': 'VU',
            'porcentaje': '100%'
        },
        'aprovechamiento_urbano': {
            'tratamiento': 'Consolidación Nivel 2',
            'codigo_tratamiento': 'CN2',
            'densidad_habitacional_max': '250',
            'indice_construccion_max': '4.0',
            'altura_normativa': '5 pisos',
            'identificador': 'CN2-001'
        },
        'restricciones_ambientales': {
            'amenaza_riesgo': 'Sin restricciones',
            'retiros_rios': 'Sin restricciones'
        },
        'fuente': 'MapGIS Medellín',
        'fecha_consulta': '2024-01-15T10:00:00Z'
    }
}
```

---

##### `consultar_por_matricula(matricula)`

Busca por matrícula inmobiliaria.

```python
resultado = mapgis_service.consultar_por_matricula('174838')

if resultado.get('success'):
    cbml = resultado['data']['cbml']
    print(f"CBML encontrado: {cbml}")
```

**Flujo**:
1. Busca matrícula en MapGIS
2. Obtiene CBML asociado
3. Consulta datos completos del CBML
4. Retorna información completa

---

### MapGISProcessors

Procesadores de datos específicos.

**Ubicación**: mapgis_processors.py

#### Métodos

##### `procesar_datos_uso_suelo(resultados)`

Procesa datos de uso del suelo.

```python
uso_data = MapGISProcessors.procesar_datos_uso_suelo(resultados)
# Retorna: {'categoria_uso': ..., 'subcategoria_uso': ..., 'porcentaje': ...}
```

---

##### `procesar_datos_aprovechamiento(resultados)`

Procesa datos de aprovechamiento urbano.

```python
aprov_data = MapGISProcessors.procesar_datos_aprovechamiento(resultados)
# Retorna: {'tratamiento': ..., 'densidad_habitacional_max': ..., 'ic_max': ...}
```

---

##### `consolidar_datos_completos(resultado_base, consultas_adicionales)`

Consolida todas las consultas en una estructura única.

```python
datos_completos = MapGISProcessors.consolidar_datos_completos(
    resultado_base,
    consultas_adicionales
)
```

---

### MapGISExtractors

Extractores de datos de diferentes formatos.

**Ubicación**: mapgis_extractors.py

#### Métodos

##### `extraer_datos_html(html_content)`

Extrae datos del HTML de MapGIS usando regex.

```python
datos = MapGISExtractors.extraer_datos_html(html_response)
# Retorna: {'direccion': ..., 'barrio': ..., 'estrato': ...}
```

---

##### `procesar_respuesta_json(data, valor, search_type)`

Procesa respuesta JSON.

```python
resultado = MapGISExtractors.procesar_respuesta_json(
    data=json_data,
    valor='01234567890',
    search_type='cbml'
)
```

---

##### `extraer_valor_numerico_area(area_texto)`

Extrae número del texto de área.

```python
area = MapGISExtractors.extraer_valor_numerico_area("428.95 m²")
# Retorna: 428.95
```

---

## Vistas (Views)

### `consulta_cbml`

Endpoint principal para consulta por CBML.

**Ubicación**: views.py

#### Endpoint

```
GET /api/mapgis/consulta/cbml/{cbml}/
```

#### Permisos

- **Authenticated**
- **Rate Limit**: 5 requests por minuto por usuario

#### Validaciones

```python
# CBML debe tener 11 dígitos
if len(cbml) != 11:
    return Response({
        'error': 'CBML inválido. Debe tener exactamente 11 dígitos numéricos.'
    }, status=400)

# Solo números
if not cbml.isdigit():
    return Response({
        'error': 'CBML inválido. Debe contener solo dígitos.'
    }, status=400)
```

#### Ejemplo Request

```bash
GET /api/mapgis/consulta/cbml/01234567890/
Authorization: Bearer {token}
```

#### Ejemplo Response Success

```json
{
  "cbml": "01234567890",
  "clasificacion_suelo": "Urbano",
  "es_urbano": true,
  "uso_suelo": {
    "categoria_uso": "Residencial",
    "subcategoria_uso": "Vivienda Unifamiliar",
    "codigo_subcategoria": "VU",
    "porcentaje": "100%"
  },
  "aprovechamiento_urbano": {
    "tratamiento": "Consolidación Nivel 2",
    "codigo_tratamiento": "CN2",
    "densidad_habitacional_max": "250",
    "indice_construccion_max": "4.0",
    "altura_normativa": "5 pisos"
  },
  "restricciones_ambientales": {
    "amenaza_riesgo": "Sin restricciones",
    "retiros_rios": "Sin restricciones"
  },
  "fuente": "MapGIS Medellín",
  "fecha_consulta": "2024-01-15T10:00:00Z"
}
```

#### Ejemplo Response Error (404)

```json
{
  "error": "Lote no encontrado en MapGIS",
  "cbml": "01234567890",
  "mensaje": "No se pudieron obtener datos para este CBML. El lote no existe o no tiene información disponible en MapGIS de Medellín."
}
```

---

### `health_check`

Verifica estado del servicio MapGIS.

**Ubicación**: views.py

#### Endpoint

```
GET /api/mapgis/health/
```

#### Permisos

- **AllowAny** (público)

#### Response

```json
{
  "status": "online",
  "service": "MapGIS Scraper",
  "version": "1.0.0",
  "message": "Servicio disponible",
  "implementation": "real",
  "cbml_format": "11 dígitos numéricos"
}
```

---

## Serializers

### `MapGISDataSerializer`

Serializer para datos completos.

**Ubicación**: serializers.py

#### Campos

```python
cbml = serializers.CharField(max_length=11)
area_lote = serializers.CharField(required=False)
area_lote_m2 = serializers.FloatField(required=False)
clasificacion_suelo = serializers.CharField(required=False)
es_urbano = serializers.BooleanField(required=False)
uso_suelo = serializers.DictField(required=False)
aprovechamiento_urbano = serializers.DictField(required=False)
restricciones_ambientales = serializers.DictField(required=False)
casos_pot = serializers.JSONField(required=False)
geometria = serializers.JSONField(required=False)
fuente = serializers.CharField(default='MapGIS Medellín')
fecha_consulta = serializers.CharField()
```

---

### `MapGISCacheSerializer`

Serializer para cache.

```python
cbml = serializers.CharField(max_length=11)
data = serializers.JSONField()
consulted_at = serializers.DateTimeField()
expiry_date = serializers.DateTimeField()
is_valid = serializers.BooleanField()
hit_count = serializers.IntegerField()
```

---

## URLs

**Ubicación**: urls.py

```python
urlpatterns = [
    # Consulta completa por CBML
    path('consulta/cbml/<str:cbml>/', views.consulta_cbml, name='consulta_cbml'),
    
    # Health check (público)
    path('health/', views.health_check, name='health'),
]
```

**Rutas disponibles**:
- `GET /api/mapgis/consulta/cbml/{cbml}/`
- `GET /api/mapgis/health/`

---

## Sistema de Cache

### Funcionamiento

1. **Primera consulta**: Se consulta MapGIS y se guarda en BD
2. **Consultas posteriores**: Si no ha expirado (24h), se retorna del cache
3. **Expiración**: Después de 24 horas, se marca como `is_valid=False`
4. **Limpieza**: Tarea periódica elimina registros expirados

### Uso Manual

```python
from apps.mapgis.models import MapGISCache

# Verificar si existe en cache
cache_entry = MapGISCache.objects.filter(
    cbml='01234567890',
    is_valid=True
).first()

if cache_entry and not cache_entry.is_expired():
    # Usar datos del cache
    datos = cache_entry.data
    cache_entry.increment_hit()
else:
    # Consultar MapGIS
    datos = mapgis_service.consultar_lote_completo('01234567890')
```

### Invalidar Cache

```python
# Invalidar cache específico
cache_entry = MapGISCache.objects.get(cbml='01234567890')
cache_entry.invalidate()

# Limpiar todos los expirados
MapGISCache.cleanup_expired()
```

---

## Consultas Disponibles

### 1. Clasificación del Suelo

**Endpoint MapGIS**: `SQL_CONSULTA_CLASIFICACIONSUELO`

**Campos**: `Clasificación del suelo`

**Resultado**: `"Urbano"` o `"Rural"`

---

### 2. Usos Generales

**Endpoint MapGIS**: `SQL_CONSULTA_USOSGENERALES`

**Campos**: `Categoría de uso, Subcategoría de uso, COD_SUBCAT_USO, porcentaje`

**Resultado**:
```python
[
    {
        'categoria_uso': 'Residencial',
        'subcategoria_uso': 'Vivienda Unifamiliar',
        'codigo_subcategoria': 'VU',
        'porcentaje': '100%'
    }
]
```

---

### 3. Aprovechamientos Urbanos

**Endpoint MapGIS**: `SQL_CONSULTA_APROVECHAMIENTOSURBANOS`

**Campos**: `TRATAMIENTO, Dens habit max, IC max, Altura normativa, IDENTIFICADOR`

**Resultado**:
```python
[
    {
        'tratamiento': 'Consolidación Nivel 2',
        'codigo_tratamiento': 'CN2',
        'densidad_habitacional_max': '250',
        'indice_construccion_max': '4.0',
        'altura_normativa': '5 pisos'
    }
]
```

---

### 4. Restricción Amenaza/Riesgo

**Endpoint MapGIS**: `SQL_CONSULTA_RESTRICCIONAMENAZARIESGO`

**Campos**: `Condiciones de riesgo y RNM`

**Resultado**: `"Sin restricciones"` o descripción

---

### 5. Restricción Ríos/Quebradas

**Endpoint MapGIS**: `SQL_CONSULTA_RESTRICCIONRIOSQUEBRADAS`

**Campos**: `Restric por retiro a quebrada`

**Resultado**: `"Sin restricciones"` o medidas en metros

---

## Ejemplos de Uso

### 1. Consulta Básica

```python
from apps.mapgis.services.mapgis_service import mapgis_service

# Consultar lote
resultado = mapgis_service.consultar_lote_completo('01234567890')

if resultado.get('success'):
    datos = resultado['data']
    
    print(f"CBML: {datos['cbml']}")
    print(f"Clasificación: {datos['clasificacion_suelo']}")
    
    if datos.get('uso_suelo'):
        print(f"Uso: {datos['uso_suelo']['categoria_uso']}")
    
    if datos.get('aprovechamiento_urbano'):
        aprov = datos['aprovechamiento_urbano']
        print(f"Tratamiento: {aprov['tratamiento']}")
        print(f"IC máximo: {aprov['indice_construccion_max']}")
else:
    print(f"Error: {resultado['mensaje']}")
```

---

### 2. Consulta desde Vista

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.mapgis.services.mapgis_service import mapgis_service

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_info_mapgis(request, cbml):
    resultado = mapgis_service.consultar_lote_completo(cbml)
    
    if resultado.get('success'):
        return Response(resultado['data'])
    else:
        return Response({
            'error': resultado.get('mensaje', 'Error desconocido')
        }, status=404)
```

---

### 3. Integración con Modelo Lote

```python
from apps.lotes.models import Lote
from apps.mapgis.services.mapgis_service import mapgis_service

# Al crear/actualizar lote, consultar MapGIS
lote = Lote.objects.get(cbml='01234567890')

resultado = mapgis_service.consultar_lote_completo(lote.cbml)

if resultado.get('success'):
    datos = resultado['data']
    
    # Actualizar campos del lote
    lote.clasificacion_suelo = datos['clasificacion_suelo']
    
    if datos.get('uso_suelo'):
        lote.uso_suelo = datos['uso_suelo']['categoria_uso']
    
    if datos.get('aprovechamiento_urbano'):
        lote.tratamiento_pot = datos['aprovechamiento_urbano']['tratamiento']
    
    lote.save()
```

---

### 4. Consulta con Cache Manual

```python
from apps.mapgis.models import MapGISCache
from apps.mapgis.services.mapgis_service import mapgis_service
from django.utils import timezone

cbml = '01234567890'

# Intentar obtener del cache
cache_entry = MapGISCache.objects.filter(
    cbml=cbml,
    is_valid=True
).first()

if cache_entry and not cache_entry.is_expired():
    # Usar cache
    datos = cache_entry.data
    cache_entry.increment_hit()
    print(f"✅ Datos obtenidos del cache (hits: {cache_entry.hit_count})")
else:
    # Consultar MapGIS
    resultado = mapgis_service.consultar_lote_completo(cbml, use_cache=False)
    
    if resultado.get('success'):
        datos = resultado['data']
        
        # Guardar en cache
        MapGISCache.objects.update_or_create(
            cbml=cbml,
            defaults={
                'data': datos,
                'consulted_at': timezone.now(),
                'expiry_date': timezone.now() + timedelta(hours=24),
                'is_valid': True
            }
        )
        print("✅ Datos consultados y guardados en cache")
```

---

## Admin de Django

### MapGISCacheAdmin

**Ubicación**: admin.py

#### Características

- **Lista**: CBML, fecha consulta, expiración, estado, hits, área
- **Filtros**: Por estado válido, fecha consulta, fecha expiración
- **Búsqueda**: Por CBML y datos
- **Preview**: Vista previa JSON de datos completos
- **Acciones**:
  - Invalidar cache seleccionado
  - Marcar para actualizar
- **Badges**: Indicadores visuales de estado (válido, expirado, inválido)

---

## Troubleshooting

### Problema: "CBML inválido. Debe tener exactamente 11 dígitos"

**Causa**: El CBML no tiene 11 dígitos.

**Solución**: MapGIS Medellín usa formato de 11 dígitos. Verificar el CBML correcto.

---

### Problema: "Lote no encontrado en MapGIS"

**Causa**: El lote no existe en el sistema MapGIS o no tiene información disponible.

**Solución**: 
- Verificar que el CBML sea correcto
- Consultar directamente en el portal MapGIS
- El lote puede ser muy nuevo o estar en proceso de actualización

---

### Problema: "Error al consultar MapGIS"

**Causa**: Problemas de conectividad o el servicio MapGIS está caído.

**Solución**:
- Verificar conectividad a internet
- Verificar que MapGIS esté disponible: `GET /api/mapgis/health/`
- Intentar más tarde si el servicio está en mantenimiento

---

### Problema: Cache desactualizado

**Causa**: Los datos en cache tienen más de 24 horas.

**Solución**:
```python
# Invalidar cache manualmente
cache_entry = MapGISCache.objects.get(cbml='01234567890')
cache_entry.invalidate()

# O limpiar todos los expirados
MapGISCache.cleanup_expired()
```

---

## Configuración

### Variables de Entorno

```bash
# No requiere configuración especial
# MapGIS es un servicio público
```

### Settings

```python
# Timeout para requests (segundos)
MAPGIS_TIMEOUT = 30

# Cache TTL (horas)
MAPGIS_CACHE_TTL = 24

# Retry automático
MAPGIS_MAX_RETRIES = 2
```

---

## Rate Limiting

```python
# Configurado en views.py
@ratelimit(key='user', rate='5/m', method='GET')
def consulta_cbml(request, cbml):
    # 5 consultas por minuto por usuario
    pass
```

---

## Logging

```python
import logging

logger = logging.getLogger(__name__)

# Logs importantes:
logger.info("[MapGIS] Consulta CBML: {cbml}")
logger.info("[MapGIS] ✅ Consulta exitosa")
logger.warning("[MapGIS] ⚠️ No se encontró información")
logger.error("[MapGIS] ❌ Error: {error}")
```

---

## Próximas Mejoras

- [ ] **Consulta por Matrícula**: Implementar búsqueda por matrícula inmobiliaria
- [ ] **Consulta por Dirección**: Búsqueda fuzzy por dirección
- [ ] **Geometría del Lote**: Obtener coordenadas del polígono
- [ ] **Casos POT**: Consulta de casos especiales del POT
- [ ] **Cache Distribuido**: Mover cache a Redis
- [ ] **Webhooks**: Notificaciones cuando cambien datos en MapGIS
- [ ] **Histórico**: Guardar cambios históricos de lotes

---

**Última actualización**: 2024-01-15


Made changes.