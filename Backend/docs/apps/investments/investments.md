# Módulo de Criterios de Inversión (Investment Criteria)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [URLs](#urls)
- [Permisos y Validaciones](#permisos-y-validaciones)
- [Sistema de Matching](#sistema-de-matching)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Criterios de Inversión** permite a los desarrolladores guardar y gestionar sus preferencias de búsqueda de lotes, facilitando la identificación automática de propiedades que cumplan con sus requisitos de inversión.

### Características Principales

- 🎯 **Criterios Personalizados**: Los desarrolladores pueden definir múltiples criterios de búsqueda
- 📊 **Filtros Avanzados**: Por área, presupuesto, ubicación, tratamiento urbanístico, estrato
- 🔔 **Sistema de Notificaciones**: Alertas cuando aparecen lotes que coinciden con los criterios
- 📈 **Puntuación de Coincidencia**: Score de 0-100 indicando qué tan bien coincide un lote
- 🔄 **Estados de Criterio**: Activo, inactivo, archivado
- 📍 **Búsqueda Geográfica**: Por zonas específicas de la ciudad

---

## Modelos

### `InvestmentCriteria`

Modelo principal para almacenar criterios de búsqueda de lotes.

**Ubicación**: `apps/investment_criteria/models.py`

#### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `developer` | FK(User) | Desarrollador propietario del criterio |
| `name` | CharField | Nombre descriptivo del criterio |
| `description` | TextField | Descripción detallada |
| `area_min` | Decimal | Área mínima del lote (m²) |
| `area_max` | Decimal | Área máxima del lote (m²) |
| `budget_min` | Decimal | Presupuesto mínimo (COP) |
| `budget_max` | Decimal | Presupuesto máximo (COP) |
| `zones` | JSONField | Lista de zonas/barrios de interés |
| `treatments` | JSONField | Tratamientos urbanísticos preferidos |
| `estratos` | JSONField | Estratos de interés |
| `uso_suelo_preferido` | JSONField | Usos de suelo preferidos |
| `status` | CharField | Estado: active, inactive, archived |
| `enable_notifications` | Boolean | Si recibe notificaciones de matches |
| `created_at` | DateTime | Fecha de creación |
| `updated_at` | DateTime | Última actualización |

#### Estados Disponibles

- **active**: Criterio activo, genera matches
- **inactive**: Criterio pausado temporalmente
- **archived**: Criterio archivado (no se puede reactivar)

#### Métodos Importantes

Validar rangos al guardar:

```python
criteria = InvestmentCriteria(
    name='Lotes residenciales El Poblado',
    area_min=200,
    area_max=500,
    budget_min=500000000,
    budget_max=1500000000
)
criteria.save()  # Valida automáticamente que max >= min
```

Obtener conteo de lotes que coinciden:

```python
count = criteria.get_matching_lotes_count()
print(f"Lotes que coinciden: {count}")
```

Propiedades útiles:

```python
criteria.is_active  # Boolean: si está activo
```

#### Validaciones Automáticas

Al guardar se valida:
- `area_max >= area_min`
- `budget_max >= budget_min`
- Lanza `ValueError` si las validaciones fallan

---

### `CriteriaMatch`

Modelo para registrar coincidencias entre criterios y lotes.

**Ubicación**: `apps/investment_criteria/models.py`

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `criteria` | FK(InvestmentCriteria) | Criterio relacionado |
| `lote` | FK(Lote) | Lote que coincide |
| `match_score` | Integer | Puntuación 0-100 |
| `notified` | Boolean | Si el desarrollador fue notificado |
| `created_at` | DateTime | Cuándo se detectó el match |

#### Características

- **Unique Together**: Un lote no puede tener múltiples matches con el mismo criterio
- **Ordenamiento**: Por `match_score` descendente y `-created_at`

---

## Serializers

### `InvestmentCriteriaSerializer`

Serializer completo para lectura de criterios.

**Ubicación**: `apps/investment_criteria/serializers.py`

#### Campos Incluidos

```python
fields = [
    'id', 'name', 'description', 
    'developer', 'developer_email', 'developer_name',
    'area_min', 'area_max', 
    'budget_min', 'budget_max',
    'zones', 'treatments', 'estratos', 'uso_suelo_preferido',
    'status', 'enable_notifications', 
    'matching_lotes_count',
    'created_at', 'updated_at', 'is_active'
]
```

#### Ejemplo de Respuesta

```json
{
  "id": "uuid",
  "name": "Lotes residenciales El Poblado",
  "description": "Busco lotes entre 200-500m² para proyecto VIS",
  "developer": "dev-uuid",
  "developer_email": "developer@example.com",
  "developer_name": "Carlos Desarrollos",
  "area_min": "200.00",
  "area_max": "500.00",
  "budget_min": "500000000.00",
  "budget_max": "1500000000.00",
  "zones": ["El Poblado", "Laureles", "Envigado"],
  "treatments": ["consolidacion_nivel_1", "consolidacion_nivel_2"],
  "estratos": [4, 5, 6],
  "uso_suelo_preferido": ["residencial"],
  "status": "active",
  "enable_notifications": true,
  "matching_lotes_count": 15,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "is_active": true
}
```

---

### `InvestmentCriteriaCreateSerializer`

Serializer para crear nuevos criterios.

**Ubicación**: `apps/investment_criteria/serializers.py`

#### Campos Requeridos

```python
fields = [
    'name',                    # Nombre del criterio (requerido)
    'description',             # Descripción (opcional)
    'area_min', 'area_max',   # Rangos de área (requeridos)
    'budget_min', 'budget_max', # Rangos de presupuesto (requeridos)
    'zones',                   # Lista de zonas (requerido)
    'treatments',              # Tratamientos preferidos (requerido)
    'estratos',               # Estratos de interés (requerido)
    'uso_suelo_preferido',    # Usos de suelo (requerido)
    'enable_notifications'    # Boolean (opcional, default: True)
]
```

#### Validaciones

Validaciones cruzadas automáticas:

```python
# Valida que area_max >= area_min
# Valida que budget_max >= budget_min
```

#### Ejemplo de Request

```json
{
  "name": "Lotes comerciales Laureles",
  "description": "Busco lotes comerciales en zona Laureles",
  "area_min": 300,
  "area_max": 800,
  "budget_min": 800000000,
  "budget_max": 2000000000,
  "zones": ["Laureles", "Estadio"],
  "treatments": ["consolidacion_nivel_2", "desarrollo"],
  "estratos": [5, 6],
  "uso_suelo_preferido": ["comercial", "mixto"],
  "enable_notifications": true
}
```

**Response Success (201)**:

```json
{
  "id": "nuevo-uuid",
  "name": "Lotes comerciales Laureles",
  "developer": "dev-uuid",
  "status": "active",
  "matching_lotes_count": 8,
  ...
}
```

---

### `CriteriaMatchSerializer`

Serializer para matches de criterios con lotes.

**Ubicación**: `apps/investment_criteria/serializers.py`

#### Campos

```python
fields = [
    'id',
    'criteria', 'criteria_name',
    'lote', 'lote_info',
    'match_score',
    'notified',
    'created_at'
]
```

#### Ejemplo de Respuesta

```json
{
  "id": "match-uuid",
  "criteria": "criteria-uuid",
  "criteria_name": "Lotes residenciales El Poblado",
  "lote": "lote-uuid",
  "lote_info": {
    "id": "lote-uuid",
    "nombre": "Lote Centro",
    "direccion": "Calle 50 #50-50",
    "area": 350.0,
    "barrio": "El Poblado",
    "estrato": 5
  },
  "match_score": 85,
  "notified": true,
  "created_at": "2024-01-15T12:00:00Z"
}
```

---

## Vistas (Views)

### `InvestmentCriteriaViewSet`

ViewSet principal para gestión de criterios.

**Ubicación**: `apps/investment_criteria/views.py`

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/investment-criteria/` | Listar criterios | Authenticated |
| POST | `/api/investment-criteria/` | Crear criterio | Developer |
| GET | `/api/investment-criteria/{id}/` | Detalle de criterio | Owner o Admin |
| PATCH | `/api/investment-criteria/{id}/` | Actualizar criterio | Owner o Admin |
| DELETE | `/api/investment-criteria/{id}/` | Eliminar criterio | Owner o Admin |
| GET | `/api/investment-criteria/my_criteria/` | Mis criterios activos | Developer |
| POST | `/api/investment-criteria/{id}/toggle_status/` | Activar/desactivar | Owner o Admin |
| GET | `/api/investment-criteria/{id}/matching_lotes/` | Lotes que coinciden | Owner o Admin |
| GET | `/api/investment-criteria/summary/` | Resumen de criterios | Authenticated |

---

#### GET /api/investment-criteria/ - Listar Criterios

**Permisos**: Authenticated

**Filtrado Automático**:
- **Admin**: Ve TODOS los criterios
- **Developer**: Solo sus propios criterios

**Query Params**:
- `status`: Filtrar por estado (active, inactive, archived)
- `search`: Buscar por nombre o descripción
- `ordering`: Ordenar (-created_at, name, updated_at)

**Ejemplo Request**:

```bash
GET /api/investment-criteria/?status=active&ordering=-created_at
```

**Ejemplo Response**:

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Lotes residenciales",
      "status": "active",
      "matching_lotes_count": 15,
      ...
    }
  ]
}
```

---

#### POST /api/investment-criteria/ - Crear Criterio

**Permisos**: Developer (solo desarrolladores)

**Request Body**:

```json
{
  "name": "Lotes industriales Norte",
  "description": "Busco lotes para proyecto logístico",
  "area_min": 1000,
  "area_max": 5000,
  "budget_min": 2000000000,
  "budget_max": 8000000000,
  "zones": ["Bello", "Copacabana", "Itagüí"],
  "treatments": ["desarrollo", "expansion"],
  "estratos": [3, 4],
  "uso_suelo_preferido": ["industrial", "logistico"],
  "enable_notifications": true
}
```

**Response Success (201)**:

```json
{
  "id": "nuevo-uuid",
  "name": "Lotes industriales Norte",
  "developer": "dev-uuid",
  "status": "active",
  "matching_lotes_count": 0,
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

**Asignación Automática**: El desarrollador se asigna automáticamente desde `request.user`

---

#### GET /api/investment-criteria/my_criteria/ - Mis Criterios Activos

**Permisos**: Developer

**Descripción**: Retorna solo criterios activos del desarrollador actual.

**Response**:

```json
[
  {
    "id": "uuid-1",
    "name": "Lotes residenciales",
    "status": "active",
    "matching_lotes_count": 12
  },
  {
    "id": "uuid-2",
    "name": "Lotes comerciales",
    "status": "active",
    "matching_lotes_count": 5
  }
]
```

---

#### POST /api/investment-criteria/{id}/toggle_status/ - Cambiar Estado

**Permisos**: Owner del criterio o Admin

**Descripción**: Alterna entre `active` e `inactive`.

**Request Body**: Vacío

**Response**:

```json
{
  "id": "uuid",
  "name": "Lotes residenciales",
  "status": "inactive",
  ...
}
```

---

#### GET /api/investment-criteria/{id}/matching_lotes/ - Lotes Coincidentes

**Permisos**: Owner del criterio o Admin

**Descripción**: Retorna lotes que cumplen con el criterio.

**Query Params**:
- `page`: Número de página (default: 1)
- `page_size`: Tamaño de página (default: 12)

**Filtros Aplicados**:
1. Lotes activos y verificados
2. Área entre `area_min` y `area_max`
3. Barrio en `zones` (si se especificó)
4. Estrato en `estratos` (si se especificó)

**Response**:

```json
{
  "count": 15,
  "results": [
    {
      "id": "lote-uuid",
      "nombre": "Lote Centro",
      "direccion": "Calle 50 #50-50",
      "area": 350.0,
      "barrio": "El Poblado",
      "estrato": 5,
      "valor": 1200000000,
      ...
    }
  ],
  "page": 1,
  "total_pages": 2
}
```

---

#### GET /api/investment-criteria/summary/ - Resumen

**Permisos**: Authenticated

**Descripción**: 
- **Admin**: Resumen global de todos los criterios
- **Developer**: Resumen de sus propios criterios

**Response**:

```json
{
  "total": 10,
  "active": 7,
  "inactive": 3
}
```

---

## URLs

**Ubicación**: `apps/investment_criteria/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvestmentCriteriaViewSet

app_name = 'investment_criteria'

router = DefaultRouter()
router.register(r'', InvestmentCriteriaViewSet, basename='criteria')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Endpoints generados**:
- `GET /api/investment-criteria/`
- `POST /api/investment-criteria/`
- `GET /api/investment-criteria/{id}/`
- `PATCH /api/investment-criteria/{id}/`
- `DELETE /api/investment-criteria/{id}/`
- `GET /api/investment-criteria/my_criteria/`
- `POST /api/investment-criteria/{id}/toggle_status/`
- `GET /api/investment-criteria/{id}/matching_lotes/`
- `GET /api/investment-criteria/summary/`

---

## Permisos y Validaciones

### Permisos por Rol

| Acción | Owner | Developer | Admin |
|--------|-------|-----------|-------|
| **Crear criterio** | ❌ | ✅ | ✅ |
| **Ver criterios** | ❌ | ✅ Solo suyos | ✅ Todos |
| **Editar criterio** | ❌ | ✅ Solo suyos | ✅ Todos |
| **Eliminar criterio** | ❌ | ✅ Solo suyos | ✅ Todos |
| **Ver lotes coincidentes** | ❌ | ✅ Solo suyos | ✅ Todos |
| **Ver resumen** | ❌ | ✅ | ✅ |

### Validaciones Automáticas

#### En Serializer

```python
def validate(self, attrs):
    # Validar rango de área
    if attrs['area_max'] < attrs['area_min']:
        raise ValidationError({
            'area_max': 'El área máxima debe ser >= área mínima'
        })
    
    # Validar rango de presupuesto
    if attrs['budget_max'] < attrs['budget_min']:
        raise ValidationError({
            'budget_max': 'El presupuesto máximo debe ser >= presupuesto mínimo'
        })
    
    return attrs
```

#### En Modelo

```python
def save(self, *args, **kwargs):
    # Validar rangos antes de guardar
    if self.area_max < self.area_min:
        raise ValueError("Área máxima debe ser >= área mínima")
    
    if self.budget_max < self.budget_min:
        raise ValueError("Presupuesto máximo debe ser >= presupuesto mínimo")
    
    super().save(*args, **kwargs)
```

---

## Sistema de Matching

### Algoritmo de Coincidencia

El sistema compara lotes contra criterios activos usando los siguientes pasos:

#### 1. Filtros Obligatorios

```python
# Lotes deben cumplir:
- status = 'active'
- is_verified = True
- area >= criteria.area_min
- area <= criteria.area_max
```

#### 2. Filtros Opcionales

Si el criterio especifica `zones`:

```python
barrio IN zones  # Case-insensitive
```

Si el criterio especifica `estratos`:

```python
estrato IN estratos
```

#### 3. Cálculo de Score

```python
match_score = 0

# Por área (30 puntos)
if area entre area_min y area_max:
    match_score += 30

# Por zona (30 puntos)
if barrio in zones:
    match_score += 30

# Por estrato (20 puntos)
if estrato in estratos:
    match_score += 20

# Por uso de suelo (20 puntos)
if uso_suelo in uso_suelo_preferido:
    match_score += 20

# Score final: 0-100
```

### Crear Match Manualmente

```python
from apps.investment_criteria.models import CriteriaMatch

match = CriteriaMatch.objects.create(
    criteria=criteria,
    lote=lote,
    match_score=85,
    notified=False
)
```

### Obtener Matches de un Criterio

```python
matches = criteria.matches.filter(
    match_score__gte=70
).order_by('-match_score')

for match in matches:
    print(f"Lote: {match.lote.nombre}, Score: {match.match_score}")
```

---

## Ejemplos de Uso

### 1. Desarrollador Crea Criterio

```bash
POST /api/investment-criteria/
Authorization: Bearer {developer_token}
Content-Type: application/json

{
  "name": "Lotes VIS Medellín",
  "description": "Busco lotes para proyecto VIS",
  "area_min": 200,
  "area_max": 600,
  "budget_min": 400000000,
  "budget_max": 1200000000,
  "zones": ["Bello", "Aranjuez", "Castilla"],
  "treatments": ["consolidacion_nivel_1", "mejoramiento_integral"],
  "estratos": [2, 3],
  "uso_suelo_preferido": ["residencial"],
  "enable_notifications": true
}
```

**Response**:

```json
{
  "id": "nuevo-uuid",
  "name": "Lotes VIS Medellín",
  "status": "active",
  "matching_lotes_count": 23,
  ...
}
```

---

### 2. Ver Lotes que Coinciden

```bash
GET /api/investment-criteria/{criteria_id}/matching_lotes/?page=1&page_size=10
Authorization: Bearer {developer_token}
```

**Response**:

```json
{
  "count": 23,
  "results": [
    {
      "id": "lote-uuid",
      "nombre": "Lote Bello Norte",
      "direccion": "Carrera 50 #100-20",
      "area": 450.0,
      "barrio": "Bello",
      "estrato": 3,
      "uso_suelo": "residencial",
      "valor": 800000000
    }
  ],
  "page": 1,
  "total_pages": 3
}
```

---

### 3. Desactivar Criterio Temporalmente

```bash
POST /api/investment-criteria/{id}/toggle_status/
Authorization: Bearer {developer_token}
```

**Response**:

```json
{
  "id": "uuid",
  "status": "inactive",
  ...
}
```

---

### 4. Ver Resumen de Criterios

```bash
GET /api/investment-criteria/summary/
Authorization: Bearer {developer_token}
```

**Response**:

```json
{
  "total": 5,
  "active": 3,
  "inactive": 2
}
```

---

### 5. Obtener Mis Criterios Activos

```bash
GET /api/investment-criteria/my_criteria/
Authorization: Bearer {developer_token}
```

**Response**:

```json
[
  {
    "id": "uuid-1",
    "name": "Lotes VIS",
    "matching_lotes_count": 23
  },
  {
    "id": "uuid-2",
    "name": "Lotes Comerciales",
    "matching_lotes_count": 8
  }
]
```

---

### 6. Actualizar Criterio

```bash
PATCH /api/investment-criteria/{id}/
Authorization: Bearer {developer_token}
Content-Type: application/json

{
  "area_max": 800,
  "zones": ["Bello", "Aranjuez", "Castilla", "Manrique"]
}
```

---

## Estructura de Carpetas

