# Módulo de POT (Plan de Ordenamiento Territorial)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [URLs](#urls)
- [Tratamientos Urbanísticos](#tratamientos-urbanísticos)
- [Cálculos de Aprovechamiento](#cálculos-de-aprovechamiento)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **POT** gestiona la información del Plan de Ordenamiento Territorial de Medellín, incluyendo tratamientos urbanísticos, índices de construcción, ocupación, retiros, áreas mínimas y toda la normativa urbanística aplicable a los lotes.

### Características Principales

- 📐 **Tratamientos POT**: Consolidación, Desarrollo, Redesarrollo, Conservación
- 📊 **Índices Urbanísticos**: IC (Índice de Construcción), IO (Índice de Ocupación)
- 📏 **Retiros y Aislamientos**: Frontal, lateral, posterior
- 🏗️ **Áreas Mínimas**: Lotes y viviendas según tipo
- 🔢 **Cálculos Automáticos**: Aprovechamiento máximo, áreas construibles
- 📋 **Normativa Completa**: Artículos del POT, descripciones detalladas
- 🔄 **Integración con MapGIS**: Consulta automática de tratamientos

---

## Modelos

### `TratamientoPOT`

Modelo principal para tratamientos urbanísticos del POT de Medellín.

**Ubicación**: `apps/pot/models.py`

#### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | AutoField | ID secuencial |
| `codigo` | CharField(10) | Código único (CN1, CN2, CN3, CN4, RD, D, C) |
| `nombre` | CharField(200) | Nombre del tratamiento |
| `descripcion` | TextField | Descripción detallada |
| `articulo_pot` | CharField(50) | Artículo del POT |
| `indice_construccion_min` | Decimal(4,2) | IC mínimo |
| `indice_construccion_max` | Decimal(4,2) | IC máximo |
| `indice_ocupacion` | Decimal(3,2) | IO máximo |
| `altura_pisos_min` | Integer | Altura mínima en pisos |
| `altura_pisos_max` | Integer | Altura máxima en pisos |
| `altura_metros` | Decimal(5,2) | Altura en metros |
| `densidad_habitacional_max` | Integer | Densidad máxima (viv/ha) |
| `activo` | Boolean | Si está activo |
| `created_at` | DateTime | Fecha de creación |
| `updated_at` | DateTime | Última actualización |

#### Tratamientos Disponibles

- **CN1**: Consolidación Nivel 1
- **CN2**: Consolidación Nivel 2
- **CN3**: Consolidación Nivel 3
- **CN4**: Consolidación Nivel 4
- **RD**: Redesarrollo
- **D**: Desarrollo
- **C**: Conservación

#### Métodos Útiles

```python
# Obtener por código
tratamiento = TratamientoPOT.objects.get(codigo='CN2')

# Calcular área máxima constructible
area_maxima = tratamiento.calcular_area_maxima_construccion(area_lote=500)
# Retorna: 2000.0 (500 * IC de 4.0)

# Calcular área máxima por piso
area_piso = tratamiento.calcular_area_maxima_por_piso(area_lote=500)
# Retorna: 350.0 (500 * IO de 0.70)
```

---

### `FrenteMinimoPOT`

Frentes mínimos requeridos según uso y tratamiento.

**Ubicación**: models.py

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | AutoField | ID secuencial |
| `tratamiento` | FK(TratamientoPOT) | Tratamiento relacionado |
| `uso` | CharField(100) | Uso: residencial, comercial, industrial, mixto |
| `frente_minimo` | Decimal(5,2) | Frente mínimo en metros |
| `descripcion` | TextField | Descripción adicional |
| `articulo_pot` | CharField(50) | Artículo del POT |
| `activo` | Boolean | Si está activo |

#### Ejemplo

```python
FrenteMinimoPOT.objects.create(
    tratamiento=cn2,
    uso='residencial',
    frente_minimo=7.0,
    descripcion='Frente mínimo para vivienda',
    articulo_pot='Art. 142'
)
```

---

### `AreaMinimaLotePOT`

Áreas mínimas de lote según uso y tratamiento.

**Ubicación**: models.py

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | AutoField | ID secuencial |
| `tratamiento` | FK(TratamientoPOT) | Tratamiento relacionado |
| `uso` | CharField(100) | Uso del suelo |
| `area_minima` | Decimal(10,2) | Área mínima en m² |
| `descripcion` | TextField | Descripción adicional |
| `articulo_pot` | CharField(50) | Artículo del POT |
| `activo` | Boolean | Si está activo |

#### Ejemplo

```python
AreaMinimaLotePOT.objects.create(
    tratamiento=cn2,
    uso='residencial',
    area_minima=120.0,
    descripcion='Área mínima para lote residencial',
    articulo_pot='Art. 140'
)
```

---

### `AreaMinimaViviendaPOT`

Áreas mínimas de vivienda según tipo.

**Ubicación**: models.py

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | AutoField | ID secuencial |
| `tipo_vivienda` | CharField(100) | Tipo: unifamiliar, bifamiliar, multifamiliar |
| `area_minima_util` | Decimal(6,2) | Área útil mínima en m² |
| `area_minima_construida` | Decimal(6,2) | Área construida mínima en m² |
| `descripcion` | TextField | Descripción adicional |
| `articulo_pot` | CharField(50) | Artículo del POT |
| `incluye_vis` | Boolean | Si aplica para VIS |
| `activo` | Boolean | Si está activo |

#### Tipos de Vivienda

- `unifamiliar`: Vivienda Unifamiliar
- `bifamiliar`: Vivienda Bifamiliar
- `multifamiliar`: Vivienda Multifamiliar
- `vis`: Vivienda de Interés Social
- `vip`: Vivienda de Interés Prioritario

#### Ejemplo

```python
AreaMinimaViviendaPOT.objects.create(
    tipo_vivienda='unifamiliar',
    area_minima_util=45.0,
    area_minima_construida=50.0,
    descripcion='Área mínima para vivienda unifamiliar',
    articulo_pot='Art. 150',
    incluye_vis=False
)
```

---

## Serializers

### `TratamientoPOTListSerializer`

Serializer para lista de tratamientos.

**Ubicación**: serializers.py

#### Campos

```python
fields = [
    'id', 'codigo', 'nombre', 'descripcion',
    'indice_construccion_min', 'indice_construccion_max',
    'indice_ocupacion', 'altura_pisos_max',
    'densidad_habitacional_max'
]
```

---

### `TratamientoPOTDetailSerializer`

Serializer completo con relaciones.

**Ubicación**: serializers.py

#### Campos Adicionales

```python
fields = [
    # ...campos de lista...
    'frentes_minimos',  # Lista de frentes mínimos
    'areas_minimas_lote',  # Lista de áreas mínimas
    'articulo_pot', 'altura_metros',
    'created_at', 'updated_at'
]
```

#### Ejemplo de Respuesta

```json
{
  "id": 2,
  "codigo": "CN2",
  "nombre": "Consolidación Nivel 2",
  "descripcion": "Tratamiento para zonas con desarrollo medio...",
  "articulo_pot": "Art. 135",
  "indice_construccion_min": 2.5,
  "indice_construccion_max": 4.0,
  "indice_ocupacion": 0.70,
  "altura_pisos_min": 3,
  "altura_pisos_max": 5,
  "altura_metros": 15.0,
  "densidad_habitacional_max": 250,
  "frentes_minimos": [
    {
      "uso": "residencial",
      "frente_minimo": 7.0,
      "descripcion": "Frente mínimo para vivienda"
    }
  ],
  "areas_minimas_lote": [
    {
      "uso": "residencial",
      "area_minima": 120.0,
      "descripcion": "Área mínima para lote residencial"
    }
  ]
}
```

---

### `TratamientoPOTCreateUpdateSerializer`

Serializer para crear/actualizar tratamientos.

**Ubicación**: serializers.py

#### Validaciones

```python
def validate(self, attrs):
    # Validar que IC max >= IC min
    if attrs['indice_construccion_max'] < attrs['indice_construccion_min']:
        raise ValidationError({
            'indice_construccion_max': 'Debe ser >= IC mínimo'
        })
    
    # Validar altura en pisos
    if attrs['altura_pisos_max'] < attrs['altura_pisos_min']:
        raise ValidationError({
            'altura_pisos_max': 'Debe ser >= altura mínima'
        })
    
    return attrs
```

---

## Vistas (Views)

### `TratamientoPOTViewSet`

ViewSet para operaciones CRUD en tratamientos.

**Ubicación**: views.py

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/pot/tratamientos/` | Listar tratamientos | Authenticated |
| GET | `/api/pot/tratamientos/{id}/` | Detalle de tratamiento | Authenticated |
| POST | `/api/pot/tratamientos/` | Crear tratamiento | Admin |
| PATCH | `/api/pot/tratamientos/{id}/` | Actualizar tratamiento | Admin |
| DELETE | `/api/pot/tratamientos/{id}/` | Eliminar tratamiento | Admin |

---

### Vistas Funcionales

#### `listar_tratamientos_pot`

Lista tratamientos activos.

**Endpoint**: `GET /api/pot/tratamientos/list/`

**Permisos**: Authenticated

**Response**:

```json
{
  "success": true,
  "count": 7,
  "tratamientos": [
    {
      "id": 1,
      "codigo": "CN1",
      "nombre": "Consolidación Nivel 1",
      "indice_construccion_max": 3.0,
      "indice_ocupacion": 0.60
    }
  ]
}
```

---

#### `detalle_tratamiento_pot`

Obtiene detalle de un tratamiento por código.

**Endpoint**: `GET /api/pot/tratamientos/{codigo}/detail/`

**Permisos**: Authenticated

**Ejemplo Request**:

```bash
GET /api/pot/tratamientos/CN2/detail/
```

**Response**:

```json
{
  "success": true,
  "tratamiento": {
    "codigo": "CN2",
    "nombre": "Consolidación Nivel 2",
    "indice_construccion_max": 4.0,
    "indice_ocupacion": 0.70,
    "altura_pisos_max": 5,
    "densidad_habitacional_max": 250,
    "frentes_minimos": [...],
    "areas_minimas": [...]
  }
}
```

---

#### `calcular_aprovechamiento_pot`

Calcula aprovechamiento urbanístico para un lote.

**Endpoint**: `POST /api/pot/calcular-aprovechamiento/`

**Permisos**: Authenticated

**Request Body**:

```json
{
  "area_lote": 500,
  "tratamiento": "CN2",
  "uso_suelo": "residencial",
  "incluir_vis": false
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "area_lote": 500.0,
    "tratamiento": {
      "codigo": "CN2",
      "nombre": "Consolidación Nivel 2",
      "indice_construccion_max": 4.0,
      "indice_ocupacion": 0.70,
      "altura_pisos_max": 5
    },
    "calculos": {
      "area_maxima_construccion": 2000.0,
      "area_maxima_por_piso": 350.0,
      "numero_pisos_posible": 5,
      "area_libre_minima": 150.0,
      "porcentaje_ocupacion": 70.0,
      "densidad_habitacional": 250
    },
    "areas_minimas": {
      "frente_minimo": 7.0,
      "area_minima_lote": 120.0,
      "area_minima_vivienda": 45.0
    },
    "viabilidad": {
      "cumple_area_minima": true,
      "cumple_frente_minimo": true,
      "observaciones": "El lote cumple con todos los requisitos mínimos"
    }
  }
}
```

---

#### `consultar_normativa_por_cbml`

Consulta normativa POT aplicable a un predio por CBML.

**Endpoint**: `GET /api/pot/normativa/cbml/{cbml}/`

**Permisos**: Authenticated

**Descripción**: Integra con MapGIS para obtener tratamiento y luego consulta normativa completa.

**Ejemplo Request**:

```bash
GET /api/pot/normativa/cbml/01234567890/
```

**Response**:

```json
{
  "success": true,
  "data": {
    "cbml": "01234567890",
    "tratamiento_mapgis": "Consolidación Nivel 2",
    "tratamiento_pot": {
      "codigo": "CN2",
      "nombre": "Consolidación Nivel 2",
      "indice_construccion_max": 4.0,
      "indice_ocupacion": 0.70,
      "altura_pisos_max": 5
    },
    "normativa_aplicable": {
      "articulos_pot": ["Art. 135", "Art. 140", "Art. 142"],
      "frentes_minimos": [...],
      "areas_minimas": [...]
    }
  }
}
```

---

#### `obtener_tipos_vivienda`

Lista tipos de vivienda con áreas mínimas.

**Endpoint**: `GET /api/pot/tipos-vivienda/`

**Permisos**: Authenticated

**Response**:

```json
{
  "success": true,
  "count": 5,
  "tipos": [
    {
      "tipo": "unifamiliar",
      "label": "Vivienda Unifamiliar",
      "area_minima_util": 45.0,
      "area_minima_construida": 50.0,
      "incluye_vis": false
    },
    {
      "tipo": "vis",
      "label": "Vivienda de Interés Social",
      "area_minima_util": 35.0,
      "area_minima_construida": 42.0,
      "incluye_vis": true
    }
  ]
}
```

---

#### `importar_tratamientos_json`

Importa tratamientos desde JSON (solo admin).

**Endpoint**: `POST /api/pot/importar/`

**Permisos**: Admin

**Request Body**:

```json
{
  "tratamientos": [
    {
      "codigo": "CN1",
      "nombre": "Consolidación Nivel 1",
      "indice_construccion_max": 3.0,
      ...
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "message": "5 tratamientos importados exitosamente"
}
```

---

#### `health_check_pot`

Verifica estado del módulo POT.

**Endpoint**: `GET /api/pot/health/`

**Permisos**: AllowAny

**Response**:

```json
{
  "status": "ok",
  "service": "POT Module",
  "tratamientos_count": 7,
  "parametros_activos": 15
}
```

---

## Servicios (Services)

### `TratamientoPOTService`

Servicio para cálculos y consultas de tratamientos.

**Ubicación**: services.py

#### Métodos

##### `calcular_aprovechamiento(area_lote, tratamiento_codigo, uso_suelo, incluir_vis)`

Calcula aprovechamiento urbanístico completo.

**Parámetros**:
- `area_lote`: Decimal - Área del lote en m²
- `tratamiento_codigo`: String - Código del tratamiento (CN1, CN2, etc.)
- `uso_suelo`: String - Uso del suelo (residencial, comercial, etc.)
- `incluir_vis`: Boolean - Si incluye VIS

**Retorna**: Dict con cálculos completos

**Ejemplo**:

```python
from apps.pot.services import TratamientoPOTService

resultado = TratamientoPOTService.calcular_aprovechamiento(
    area_lote=500,
    tratamiento_codigo='CN2',
    uso_suelo='residencial',
    incluir_vis=False
)

print(f"Área máxima construcción: {resultado['area_maxima_construccion']}")
print(f"Número de pisos: {resultado['numero_pisos_posible']}")
print(f"Cumple requisitos: {resultado['viabilidad']['cumple_area_minima']}")
```

**Cálculos Incluidos**:

```python
{
    'area_lote': 500.0,
    'tratamiento': {...},
    'area_maxima_construccion': 2000.0,  # area_lote * IC
    'area_maxima_por_piso': 350.0,       # area_lote * IO
    'numero_pisos_posible': 5,           # altura_pisos_max
    'area_libre_minima': 150.0,          # area_lote * (1 - IO)
    'porcentaje_ocupacion': 70.0,        # IO * 100
    'densidad_habitacional': 250,
    'frente_minimo': 7.0,
    'area_minima_lote': 120.0,
    'viabilidad': {
        'cumple_area_minima': True,
        'cumple_frente_minimo': True,
        'observaciones': '...'
    }
}
```

---

##### `obtener_normativa_por_cbml(cbml)`

Obtiene normativa POT consultando MapGIS.

**Parámetros**:
- `cbml`: String - Código CBML (11 dígitos)

**Retorna**: Dict con tratamiento y normativa

**Ejemplo**:

```python
resultado = TratamientoPOTService.obtener_normativa_por_cbml('01234567890')

if resultado['success']:
    print(f"Tratamiento: {resultado['tratamiento_pot']['nombre']}")
    print(f"IC máximo: {resultado['tratamiento_pot']['indice_construccion_max']}")
```

---

##### `validar_viabilidad_constructiva(area_lote, frente, tratamiento_codigo, uso_suelo)`

Valida si un lote es viable para construcción.

**Parámetros**:
- `area_lote`: Decimal - Área en m²
- `frente`: Decimal - Frente del lote en metros
- `tratamiento_codigo`: String - Código tratamiento
- `uso_suelo`: String - Uso del suelo

**Retorna**: Dict con validación

**Ejemplo**:

```python
viabilidad = TratamientoPOTService.validar_viabilidad_constructiva(
    area_lote=500,
    frente=10.0,
    tratamiento_codigo='CN2',
    uso_suelo='residencial'
)

if viabilidad['es_viable']:
    print("✅ Lote viable para construcción")
else:
    print(f"❌ Restricciones: {viabilidad['restricciones']}")
```

**Response**:

```python
{
    'es_viable': True,
    'cumple_area_minima': True,
    'cumple_frente_minimo': True,
    'restricciones': [],
    'recomendaciones': [
        'Se recomienda considerar retiros obligatorios',
        'Verificar disponibilidad de servicios públicos'
    ]
}
```

---

## URLs

**Ubicación**: urls.py

```python
urlpatterns = [
    # ViewSet routes (router)
    path('tratamientos/', include(router.urls)),
    
    # Vistas funcionales
    path('tratamientos/list/', listar_tratamientos_pot, name='listar-tratamientos'),
    path('tratamientos/<str:codigo>/detail/', detalle_tratamiento_pot, name='detalle-tratamiento'),
    path('calcular-aprovechamiento/', calcular_aprovechamiento_pot, name='calcular-aprovechamiento'),
    path('normativa/cbml/<str:cbml>/', consultar_normativa_por_cbml, name='normativa-cbml'),
    path('tipos-vivienda/', obtener_tipos_vivienda, name='tipos-vivienda'),
    path('importar/', importar_tratamientos_json, name='importar-tratamientos'),
    path('health/', health_check_pot, name='health-pot'),
]
```

---

## Tratamientos Urbanísticos

### Consolidación Nivel 1 (CN1)

- **IC**: 2.0 - 3.0
- **IO**: 0.60
- **Altura**: 2-4 pisos
- **Densidad**: 150 viv/ha
- **Uso**: Predominantemente residencial

---

### Consolidación Nivel 2 (CN2)

- **IC**: 2.5 - 4.0
- **IO**: 0.70
- **Altura**: 3-5 pisos
- **Densidad**: 250 viv/ha
- **Uso**: Residencial, mixto

---

### Consolidación Nivel 3 (CN3)

- **IC**: 3.0 - 5.0
- **IO**: 0.70
- **Altura**: 4-7 pisos
- **Densidad**: 350 viv/ha
- **Uso**: Mixto

---

### Consolidación Nivel 4 (CN4)

- **IC**: 4.0 - 6.0
- **IO**: 0.80
- **Altura**: 5-10 pisos
- **Densidad**: 450 viv/ha
- **Uso**: Múltiple

---

### Redesarrollo (RD)

- **IC**: 5.0 - 8.0
- **IO**: 0.80
- **Altura**: 8-15 pisos
- **Densidad**: 600 viv/ha
- **Uso**: Múltiple, alta densidad

---

### Desarrollo (D)

- **IC**: 1.5 - 3.0
- **IO**: 0.50
- **Altura**: 2-4 pisos
- **Densidad**: 100 viv/ha
- **Uso**: Expansión urbana

---

### Conservación (C)

- **IC**: 1.0 - 2.0
- **IO**: 0.40
- **Altura**: 1-2 pisos
- **Densidad**: 50 viv/ha
- **Uso**: Preservación

---

## Cálculos de Aprovechamiento

### Fórmulas Básicas

#### Área Máxima de Construcción

```
Área Máxima Construcción = Área Lote × IC máximo
```

Ejemplo: 500 m² × 4.0 = **2000 m²**

---

#### Área Máxima por Piso

```
Área Máxima por Piso = Área Lote × IO
```

Ejemplo: 500 m² × 0.70 = **350 m²**

---

#### Número de Pisos Posible

```
Número Pisos = min(
    Área Máxima Construcción / Área Máxima por Piso,
    Altura Máxima en Pisos
)
```

Ejemplo: min(2000/350, 5) = min(5.7, 5) = **5 pisos**

---

#### Área Libre Mínima

```
Área Libre = Área Lote × (1 - IO)
```

Ejemplo: 500 × (1 - 0.70) = 500 × 0.30 = **150 m²**

---

### Ejemplo Completo de Cálculo

**Datos**:
- Área lote: 500 m²
- Tratamiento: CN2
- IC máximo: 4.0
- IO: 0.70
- Altura máxima: 5 pisos

**Cálculos**:

```python
# 1. Área máxima construcción
area_maxima = 500 × 4.0 = 2000 m²

# 2. Área máxima por piso
area_piso = 500 × 0.70 = 350 m²

# 3. Número de pisos
pisos = min(2000/350, 5) = 5 pisos

# 4. Área libre mínima
area_libre = 500 × 0.30 = 150 m²

# 5. Distribución por piso
# Piso 1-5: 350 m² c/u
# Total: 1750 m² (dejando margen)
```

---

## Ejemplos de Uso

### 1. Listar Tratamientos

```bash
GET /api/pot/tratamientos/list/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "success": true,
  "count": 7,
  "tratamientos": [
    {"codigo": "CN1", "nombre": "Consolidación Nivel 1"},
    {"codigo": "CN2", "nombre": "Consolidación Nivel 2"},
    ...
  ]
}
```

---

### 2. Calcular Aprovechamiento

```bash
POST /api/pot/calcular-aprovechamiento/
Authorization: Bearer {token}
Content-Type: application/json

{
  "area_lote": 500,
  "tratamiento": "CN2",
  "uso_suelo": "residencial",
  "incluir_vis": false
}
```

**Response**: Ver ejemplo en sección de vistas

---

### 3. Consultar Normativa por CBML

```bash
GET /api/pot/normativa/cbml/01234567890/
Authorization: Bearer {token}
```

**Response**: Tratamiento + normativa completa del lote

---

### 4. Uso desde Código Python

```python
from apps.pot.services import TratamientoPOTService

# Calcular aprovechamiento
resultado = TratamientoPOTService.calcular_aprovechamiento(
    area_lote=500,
    tratamiento_codigo='CN2',
    uso_suelo='residencial',
    incluir_vis=False
)

# Verificar viabilidad
viabilidad = TratamientoPOTService.validar_viabilidad_constructiva(
    area_lote=500,
    frente=10.0,
    tratamiento_codigo='CN2',
    uso_suelo='residencial'
)

if viabilidad['es_viable']:
    print(f"✅ Construcción viable")
    print(f"Área máxima: {resultado['area_maxima_construccion']} m²")
```

---

## Integración con Otros Módulos

### Integración con MapGIS

```python
# El módulo POT consulta MapGIS para obtener tratamientos
from apps.mapgis.services.mapgis_service import mapgis_service
from apps.pot.services import TratamientoPOTService

# 1. Consultar tratamiento en MapGIS
datos_mapgis = mapgis_service.consultar_lote_completo('01234567890')
tratamiento_mapgis = datos_mapgis['aprovechamiento_urbano']['tratamiento']

# 2. Buscar en BD local
tratamiento_pot = TratamientoPOT.objects.filter(
    nombre__icontains=tratamiento_mapgis
).first()

# 3. Calcular aprovechamiento
if tratamiento_pot:
    calculo = TratamientoPOTService.calcular_aprovechamiento(
        area_lote=500,
        tratamiento_codigo=tratamiento_pot.codigo,
        uso_suelo='residencial',
        incluir_vis=False
    )
```

---

### Integración con Análisis

```python
# El módulo de Análisis usa POT para cálculos
from apps.analisis.services import GeminiAnalysisService
from apps.pot.models import TratamientoPOT

# Al generar análisis con IA, se incluyen parámetros POT
tratamiento = TratamientoPOT.objects.get(codigo='CN2')

prompt = f"""
Tratamiento: {tratamiento.nombre}
IC máximo: {tratamiento.indice_construccion_max}
IO: {tratamiento.indice_ocupacion}
Altura máxima: {tratamiento.altura_pisos_max} pisos

Calcula el aprovechamiento máximo...
"""
```

---

## Admin de Django

### TratamientoPOTAdmin

**Características**:
- Lista con todos los índices y alturas
- Filtros por código y estado activo
- Búsqueda por nombre y código
- Inlines para frentes y áreas mínimas
- Acciones masivas (activar/desactivar)

---

## Troubleshooting

### Problema: Tratamiento no encontrado

**Causa**: Código de tratamiento incorrecto o tratamiento inactivo.

**Solución**: Verificar que el código sea correcto (CN1, CN2, CN3, CN4, RD, D, C).

---

### Problema: Cálculos incorrectos

**Causa**: Datos del tratamiento mal configurados.

**Solución**: Verificar índices y valores en el admin de Django.

---

### Problema: Integración con MapGIS falla

**Causa**: Nombre de tratamiento en MapGIS no coincide con BD local.

**Solución**: Actualizar mapeo de nombres en el servicio.

---

## Próximas Mejoras

- [ ] **Retiros Variables**: Por altura y ubicación
- [ ] **Casos Especiales POT**: Áreas específicas con normativa diferente
- [ ] **Simulador 3D**: Visualización de volúmenes edificables
- [ ] **Cálculo de Estacionamientos**: Según uso y área
- [ ] **Historial de Cambios POT**: Tracking de modificaciones normativas
- [ ] **API Pública**: Consulta de normativa para terceros

---