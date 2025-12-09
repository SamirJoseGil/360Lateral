# Módulo de Lotes

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [Signals](#signals)
- [URLs](#urls)
- [Permisos y Validaciones](#permisos-y-validaciones)
- [Estados del Lote](#estados-del-lote)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Lotes** gestiona la información de terrenos disponibles para desarrollo inmobiliario en el sistema Lateral 360°. Permite a propietarios registrar sus lotes y a desarrolladores explorar opciones de inversión.

### Características Principales

- 🏗️ **Registro de Lotes**: Propietarios pueden registrar sus terrenos
- 📍 **Información Catastral**: CBML, matrícula, código catastral
- 🗺️ **Geolocalización**: Coordenadas, barrio, ciudad, estrato
- 📊 **Información Urbanística**: Clasificación de suelo, uso, tratamiento POT
- 💰 **Información Comercial**: Valor, forma de pago, comisionistas
- ✅ **Sistema de Verificación**: Aprobación por administradores
- ⭐ **Favoritos**: Desarrolladores pueden guardar lotes de interés
- 🔍 **Búsqueda Avanzada**: Filtros por múltiples criterios
- 📄 **Documentos Asociados**: CTL, planos, escrituras, etc.

---

## Modelos

### `Lote`

Modelo principal para representar un terreno.

**Ubicación**: `apps/lotes/models.py`

#### Campos Principales

##### Campos Esenciales (Obligatorios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `nombre` | CharField(200) | Nombre identificativo del lote |
| `direccion` | CharField(500) | Dirección completa |
| `area` | Decimal(12,2) | Área en metros cuadrados |
| `owner` | FK(User) | Propietario del lote |

##### Campos Importantes (Opcionales)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cbml` | CharField(11) | Código catastral MapGIS (11 dígitos) |
| `matricula` | CharField(50) | Matrícula inmobiliaria |
| `codigo_catastral` | CharField(100) | Código catastral |
| `descripcion` | TextField | Descripción detallada |
| `ciudad` | CharField(100) | Ciudad donde se ubica |
| `barrio` | CharField(100) | Barrio |
| `estrato` | Integer | Estrato socioeconómico (1-6) |

##### Campos Automáticos/Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `latitud` | Decimal(10,8) | Coordenada de latitud |
| `longitud` | Decimal(11,8) | Coordenada de longitud |
| `clasificacion_suelo` | CharField(100) | Clasificación según POT |
| `uso_suelo` | CharField(100) | Uso permitido |
| `tratamiento_pot` | CharField(100) | Tratamiento urbanístico |

##### Campos Comerciales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `valor` | Decimal(15,2) | Valor comercial del lote (COP) |
| `forma_pago` | CharField | contado, financiado, permuta, mixto |
| `es_comisionista` | Boolean | Si lo registra un comisionista |
| `carta_autorizacion` | FileField | Carta de autorización (requerida para comisionistas) |

##### Campos de Sistema

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `status` | CharField | pending, active, rejected, archived |
| `is_verified` | Boolean | Si está verificado por admin |
| `rejection_reason` | TextField | Motivo de rechazo |
| `verified_at` | DateTime | Fecha de verificación |
| `verified_by` | FK(User) | Usuario que verificó |
| `rejected_at` | DateTime | Fecha de rechazo |
| `rejected_by` | FK(User) | Usuario que rechazó |
| `created_at` | DateTime | Fecha de creación |
| `updated_at` | DateTime | Última actualización |
| `metadatos` | JSONField | Información adicional |

##### Relación con Desarrolladores

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `desarrolladores` | ManyToMany(User) | Desarrolladores con acceso al lote |

#### Estados del Lote

```python
STATUS_CHOICES = [
    ('pending', 'Pendiente de Revisión'),
    ('active', 'Activo y Verificado'),
    ('rejected', 'Rechazado'),
    ('archived', 'Archivado'),
]
```

#### Métodos Importantes

##### Gestión de Estado

Verificar y activar lote:

```python
lote.verify(verified_by=admin_user)
# - Cambia status a 'active'
# - Marca is_verified = True
# - Registra verified_at y verified_by
# - Limpia datos de rechazo previos
```

Rechazar lote:

```python
lote.reject(
    reason='Falta información catastral',
    rejected_by=admin_user
)
# - Cambia status a 'rejected'
# - Marca is_verified = False
# - Guarda rejection_reason, rejected_at, rejected_by
```

Archivar lote (soft delete):

```python
lote.soft_delete()
# - Cambia status a 'archived'
# - Mantiene is_verified sin cambios
```

Reactivar lote archivado:

```python
lote.reactivate()
# - Si fue verificado: vuelve a 'active'
# - Si no fue verificado: vuelve a 'pending'
```

##### Propiedades Útiles

```python
lote.can_be_shown  # Boolean: Solo si está active y verificado
lote.can_be_edited  # Boolean: Si puede editarse (pending o active)
lote.is_rejected   # Boolean: Si está rechazado
lote.is_archived   # Boolean: Si está archivado
lote.is_pending    # Boolean: Si está pendiente
lote.is_active     # Boolean: Si está activo y verificado
```

#### Validaciones Automáticas

En el método `clean()`:

```python
def clean(self):
    # Validar nombre no vacío
    if not self.nombre or not self.nombre.strip():
        raise ValidationError({'nombre': 'El nombre del lote es requerido'})
    
    # Validar dirección no vacía
    if not self.direccion or not self.direccion.strip():
        raise ValidationError({'direccion': 'La dirección es requerida'})
    
    # Validar área positiva
    if self.area is not None and self.area <= 0:
        raise ValidationError({'area': 'El área debe ser mayor a 0'})
    
    # Validar estrato (1-6)
    if self.estrato is not None and (self.estrato < 1 or self.estrato > 6):
        raise ValidationError({'estrato': 'El estrato debe estar entre 1 y 6'})
    
    # Validar CBML (11 dígitos)
    if self.cbml:
        if len(self.cbml) != 11:
            raise ValidationError({'cbml': 'El CBML debe tener 11 dígitos'})
        if not self.cbml.isdigit():
            raise ValidationError({'cbml': 'El CBML debe contener solo números'})
```

---

### `LoteDocument`

Documentos asociados a un lote.

**Ubicación**: models.py

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | AutoField | ID secuencial |
| `lote` | FK(Lote) | Lote relacionado |
| `tipo` | CharField | escritura, cedula_catastral, plano, foto, etc. |
| `titulo` | CharField(255) | Título del documento |
| `descripcion` | TextField | Descripción (opcional) |
| `archivo` | FileField | Archivo del documento |
| `uploaded_by` | FK(User) | Usuario que subió |
| `uploaded_at` | DateTime | Fecha de subida |

#### Tipos de Documento

- `escritura`: Escritura Pública
- `cedula_catastral`: Cédula Catastral
- `plano`: Plano
- `foto`: Fotografía
- `levantamiento`: Levantamiento Topográfico
- `certificado`: Certificado
- `otro`: Otro

---

### `LoteHistory`

Historial de cambios para auditoría.

**Ubicación**: models.py

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `lote` | FK(Lote) | Lote relacionado |
| `action` | CharField | created, updated, verified, rejected, deleted |
| `campo_modificado` | CharField(100) | Campo que cambió |
| `valor_anterior` | TextField | Valor antes del cambio |
| `valor_nuevo` | TextField | Valor después del cambio |
| `modificado_por` | FK(User) | Usuario que hizo el cambio |
| `fecha_modificacion` | DateTime | Cuándo ocurrió |
| `motivo` | TextField | Motivo del cambio (opcional) |

---

### `Favorite`

Lotes favoritos de los usuarios.

**Ubicación**: models.py

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user` | FK(User) | Usuario |
| `lote` | FK(Lote) | Lote favorito |
| `notas` | TextField | Notas personales |
| `created_at` | DateTime | Cuándo se agregó |

**Unique Together**: `(user, lote)` - Un usuario no puede tener el mismo lote dos veces como favorito

---

### `Tratamiento`

Tratamientos urbanísticos del POT.

**Ubicación**: models.py

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `codigo` | CharField(10) | Código único del tratamiento |
| `nombre` | CharField(100) | Nombre del tratamiento |
| `descripcion` | TextField | Descripción detallada |
| `indice_ocupacion` | Decimal(3,2) | Índice de ocupación |
| `indice_construccion` | Decimal(4,2) | Índice de construcción |
| `altura_maxima` | Integer | Altura máxima en metros |
| `retiro_frontal` | Decimal(5,2) | Retiro frontal en metros |
| `retiro_lateral` | Decimal(5,2) | Retiro lateral en metros |
| `retiro_posterior` | Decimal(5,2) | Retiro posterior en metros |
| `activo` | Boolean | Si está activo |

---

## Serializers

### `LoteSerializer`

Serializer completo para lectura de lotes.

**Ubicación**: serializers.py

#### Campos Incluidos

```python
fields = [
    'id', 'owner', 'owner_name',
    'nombre', 'cbml', 'direccion', 'ciudad', 'barrio', 'estrato', 'area',
    'matricula', 'codigo_catastral',
    'latitud', 'longitud',
    'tratamiento_pot', 'uso_suelo', 'clasificacion_suelo',
    'descripcion',
    'valor', 'forma_pago', 'es_comisionista',
    'status', 'is_verified',
    'created_at', 'updated_at',
    'desarrolladores_info'  # Lista de desarrolladores con acceso
]
```

#### Validaciones

Validar CBML (11 dígitos):

```python
def validate_cbml(self, value):
    if value and len(value) != 11:
        raise ValidationError("El CBML debe tener 11 dígitos")
    if value and not value.isdigit():
        raise ValidationError("El CBML debe contener solo números")
    return value
```

Validar área positiva:

```python
def validate_area(self, value):
    if value is not None and value <= 0:
        raise ValidationError("El área debe ser un número positivo")
    return value
```

Validar estrato (1-6):

```python
def validate_estrato(self, value):
    if value is not None and (value < 1 or value > 6):
        raise ValidationError("El estrato debe estar entre 1 y 6")
    return value
```

Validar carta de autorización para comisionistas:

```python
def validate(self, data):
    es_comisionista = data.get('es_comisionista', False)
    carta_autorizacion = data.get('carta_autorizacion')
    
    if es_comisionista and not carta_autorizacion:
        raise ValidationError({
            'carta_autorizacion': 'La carta de autorización es obligatoria para comisionistas'
        })
    
    return data
```

---

### `LoteCreateSerializer`

Serializer para crear lotes (formulario de registro).

**Ubicación**: serializers.py

#### Campos Requeridos

- `nombre`: Nombre del lote
- `direccion`: Dirección completa

#### Campos Opcionales

- `cbml`, `matricula`, `codigo_catastral`
- `ciudad`, `barrio`, `estrato`, `area`
- `latitud`, `longitud`
- `tratamiento_pot`, `uso_suelo`, `clasificacion_suelo`
- `descripcion`
- `valor`, `forma_pago`, `es_comisionista`, `carta_autorizacion`
- `metadatos`

#### Asignación Automática

El `owner` se asigna automáticamente desde `request.user`:

```python
def create(self, validated_data):
    request = self.context.get('request')
    if request and hasattr(request, 'user'):
        validated_data['owner'] = request.user
    
    return super().create(validated_data)
```

---

### `FavoriteSerializer`

Serializer para gestión de favoritos.

**Ubicación**: serializers.py

#### Campos

```python
fields = ['id', 'user', 'lote', 'lote_details', 'user_email', 'notas', 'created_at']
read_only_fields = ['id', 'user', 'created_at', 'lote_details', 'user_email']
```

#### Validaciones

Verificar que el lote esté disponible:

```python
def validate_lote(self, value):
    if value.status not in ['active', 'pending']:
        raise ValidationError("El lote no está disponible")
    
    # Para developers, verificar que esté verificado
    request = self.context.get('request')
    if request and request.user.role == 'developer':
        if not value.is_verified or value.status != 'active':
            raise ValidationError("El lote no está disponible para desarrolladores")
    
    return value
```

---

### `LoteDesarrolladoresSerializer`

Serializer para gestionar desarrolladores de un lote.

**Ubicación**: serializers.py

#### Campos

```python
desarrollador_id = serializers.UUIDField(required=True)
```

#### Validación

Verificar que el usuario sea desarrollador:

```python
def validate_desarrollador_id(self, value):
    try:
        desarrollador = User.objects.get(id=value)
        
        if desarrollador.role != 'developer':
            raise ValidationError("El usuario no es un desarrollador")
        
        return value
        
    except User.DoesNotExist:
        raise ValidationError("Desarrollador no encontrado")
```

---

## Vistas (Views)

### `LoteListCreateView`

Lista y crea lotes según permisos.

**Ubicación**: views.py

#### Endpoint

```
GET  /api/lotes/      # Listar lotes
POST /api/lotes/      # Crear lote
```

#### Permisos

- **Authenticated**: Todos los usuarios autenticados

#### Filtrado por Rol

```python
def get_queryset(self):
    user = self.request.user
    
    if user.is_admin:
        return Lote.objects.all()  # Admin ve todos
    elif user.is_owner:
        return Lote.objects.filter(owner=user)  # Owner solo sus lotes
    elif user.is_developer:
        return Lote.objects.filter(status='active', is_verified=True)  # Developer solo activos
    
    return Lote.objects.none()
```

#### Query Params (GET)

- `search`: Buscar por CBML, matrícula, dirección, barrio, nombre
- `ordering`: Ordenar (-created_at, area, status)
- Filtros: Ver `LoteFilter` para más opciones

#### Ejemplo Request (POST)

```json
{
  "nombre": "Lote Residencial Centro",
  "direccion": "Calle 50 #50-50",
  "ciudad": "Medellín",
  "barrio": "El Poblado",
  "area": 500,
  "estrato": 5,
  "cbml": "01234567890",
  "valor": 1500000000,
  "forma_pago": "financiado",
  "es_comisionista": false
}
```

**Response Success (201)**:

```json
{
  "id": "uuid",
  "nombre": "Lote Residencial Centro",
  "status": "pending",
  "is_verified": false,
  "owner": "owner-uuid",
  "owner_name": "Juan Pérez",
  ...
}
```

---

### `LoteDetailView`

Detalle, actualización y eliminación de lote.

**Ubicación**: views.py

#### Endpoints

```
GET    /api/lotes/{uuid}/     # Obtener detalle
PATCH  /api/lotes/{uuid}/     # Actualizar
DELETE /api/lotes/{uuid}/     # Archivar (soft delete)
```

#### Permisos

- **IsAuthenticated** + **IsOwnerOrAdmin**

#### Soft Delete

Al eliminar un lote, se archiva en lugar de eliminarse:

```python
def perform_destroy(self, instance):
    instance.status = 'archived'
    instance.save()
    logger.info(f"Lote archivado: {instance.id}")
```

---

### `AvailableLotesView`

Lista lotes disponibles para desarrolladores.

**Ubicación**: views.py

#### Endpoint

```
GET /api/lotes/available/
```

#### Permisos

- **Authenticated**

#### Filtros Aplicados Automáticamente

```python
queryset = Lote.objects.filter(
    status='active',
    is_verified=True
).select_related('owner')
```

#### Query Params

- `ciudad`: Filtrar por ciudad
- `uso_suelo`: Filtrar por uso de suelo
- `area_min`: Área mínima
- `area_max`: Área máxima
- `estrato`: Filtrar por estrato
- `barrio`: Filtrar por barrio
- `match_profile`: true/false - Aplicar filtros del perfil del developer

#### Ejemplo Request

```bash
GET /api/lotes/available/?ciudad=Medellín&estrato=5&area_min=300&area_max=800
```

**Response**:

```json
{
  "success": true,
  "count": 15,
  "lotes": [
    {
      "id": "uuid",
      "nombre": "Lote Centro",
      "direccion": "Calle 50 #50-50",
      "area": 500.0,
      "barrio": "El Poblado",
      "estrato": 5,
      ...
    }
  ]
}
```

---

### `FavoriteViewSet`

Gestión de favoritos de lotes.

**Ubicación**: views.py

#### Endpoints

```
GET    /api/lotes/favorites/           # Listar favoritos
POST   /api/lotes/favorites/           # Agregar favorito
DELETE /api/lotes/favorites/{id}/      # Eliminar favorito
GET    /api/lotes/favorites/check/     # Verificar si es favorito
```

#### Ejemplo: Agregar Favorito

**Request**:

```json
{
  "lote": "lote-uuid",
  "notas": "Interesante para proyecto VIS"
}
```

**Response (201)**:

```json
{
  "success": true,
  "message": "Lote agregado a favoritos",
  "data": {
    "id": "favorite-uuid",
    "lote": "lote-uuid",
    "user": "user-uuid",
    "notas": "Interesante para proyecto VIS",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Ejemplo: Verificar si es Favorito

**Request**:

```bash
GET /api/lotes/favorites/check/?lote_id=uuid
```

**Response**:

```json
{
  "success": true,
  "is_favorite": true
}
```

---

### Vistas de Verificación (Admin)

#### `LoteVerificationView`

Verificar, rechazar, archivar o reactivar lotes.

**Ubicación**: views.py

**Endpoint**: `POST /api/lotes/{uuid}/verify/`

**Permisos**: IsAuthenticated + IsAdminUser

**Request Body**:

```json
{
  "action": "verify",  // verify | reject | archive | reactivate
  "reason": "Motivo del rechazo"  // Requerido solo para reject
}
```

**Acciones Disponibles**:

1. **verify**: Verifica y activa el lote

```json
{
  "action": "verify"
}
```

2. **reject**: Rechaza el lote con motivo

```json
{
  "action": "reject",
  "reason": "Falta información catastral completa"
}
```

3. **archive**: Archiva el lote

```json
{
  "action": "archive"
}
```

4. **reactivate**: Reactiva un lote archivado

```json
{
  "action": "reactivate"
}
```

**Response Success**:

```json
{
  "success": true,
  "message": "Lote Lote Centro verificado y activado",
  "data": {
    "id": "uuid",
    "status": "active",
    "is_verified": true,
    "verified_at": "2024-01-15T15:00:00Z",
    ...
  }
}
```

---

#### `LotePendingVerificationListView`

Lista lotes pendientes de verificación.

**Endpoint**: `GET /api/lotes/pending-verification/`

**Permisos**: IsAuthenticated + IsAdminUser

**Response**:

```json
[
  {
    "id": "uuid",
    "nombre": "Lote Pendiente 1",
    "status": "pending",
    "is_verified": false,
    "created_at": "2024-01-15T10:00:00Z",
    ...
  }
]
```

---

### Vistas de Gestión de Desarrolladores

#### `manage_lote_developers`

Agregar o remover desarrolladores de un lote.

**Endpoint**: `/api/lotes/{lote_id}/developers/manage/`

**Métodos**: POST (agregar), DELETE (remover)

**Permisos**: Owner del lote o Admin

**Request Body**:

```json
{
  "desarrollador_id": "developer-uuid"
}
```

**Response (POST)**:

```json
{
  "success": true,
  "message": "Desarrollador developer@example.com agregado exitosamente",
  "desarrolladores": [
    {
      "id": "uuid",
      "email": "developer@example.com",
      "nombre": "Carlos Desarrollos"
    }
  ]
}
```

---

#### `list_lote_developers`

Listar desarrolladores de un lote.

**Endpoint**: `GET /api/lotes/{lote_id}/developers/`

**Permisos**: Owner del lote o Admin

**Response**:

```json
{
  "success": true,
  "desarrolladores": [
    {
      "id": "uuid",
      "email": "developer@example.com",
      "nombre": "Carlos Desarrollos",
      "developer_type": "constructora",
      "legal_name": "Constructora ABC S.A.S."
    }
  ],
  "count": 1
}
```

---

#### `list_available_developers`

Listar todos los desarrolladores activos.

**Endpoint**: `GET /api/lotes/available-developers/`

**Permisos**: Owner o Admin

**Response**:

```json
{
  "success": true,
  "desarrolladores": [
    {
      "id": "uuid",
      "email": "developer@example.com",
      "nombre": "Carlos Desarrollos",
      "legal_name": "Constructora ABC S.A.S.",
      "developer_type": "constructora",
      "person_type": "juridica"
    }
  ],
  "count": 10
}
```

---

### Vistas Auxiliares

#### `LoteAnalysisView`

Obtener análisis urbanístico de un lote.

**Endpoint**: `GET /api/lotes/{uuid}/analysis/`

**Permisos**: Owner del lote o Admin

**Response**:

```json
{
  "success": true,
  "data": {
    "lote_id": "uuid",
    "cbml": "01234567890",
    "area": 500.0,
    "ubicacion": {
      "direccion": "Calle 50 #50-50",
      "barrio": "El Poblado",
      "estrato": 5
    },
    "normativa": {
      "clasificacion_suelo": "Urbano",
      "uso_suelo": "Residencial",
      "tratamiento_pot": "Consolidación Nivel 2"
    },
    "estado": {
      "status": "active",
      "is_verified": true
    }
  }
}
```

---

#### `listar_tratamientos`

Lista tratamientos urbanísticos disponibles.

**Endpoint**: `GET /api/lotes/tratamientos/`

**Permisos**: AllowAny

**Response**:

```json
{
  "success": true,
  "count": 8,
  "tratamientos": [
    {
      "id": 1,
      "codigo": "CN1",
      "nombre": "Consolidación Nivel 1",
      "descripcion": "Tratamiento para zonas consolidadas...",
      "indice_ocupacion": 0.70,
      "indice_construccion": 3.0
    }
  ]
}
```

---

#### `user_lote_stats`

Estadísticas de lotes por usuario.

**Endpoint**: `GET /api/lotes/stats/user/{user_id}/`

**Permisos**: Owner del usuario o Admin

**Response**:

```json
{
  "user_id": "user-uuid",
  "user_name": "Juan Pérez",
  "total_lotes": 5,
  "total_area": 2500.0,
  "por_estado": {
    "activos": 3,
    "pendientes": 1,
    "archivados": 1
  }
}
```

---

## Servicios (Services)

### `LotesService`

Lógica de negocio para lotes.

**Ubicación**: services.py

#### Métodos

##### `buscar_lotes(filtros)`

Busca lotes según filtros.

```python
filtros = {
    'area_min': 300,
    'area_max': 800,
    'barrio': 'El Poblado',
    'estrato': 5
}

lotes = LotesService.buscar_lotes(filtros)
```

##### `validar_para_publicacion(lote)`

Valida que un lote puede ser publicado.

```python
es_valido, errores = LotesService.validar_para_publicacion(lote)

if not es_valido:
    print(f"Errores: {errores}")
```

---

### `TratamientosService`

Cálculos de tratamientos urbanísticos.

**Ubicación**: services.py

#### Métodos

##### `calcular_aprovechamiento(area_lote, tratamiento_codigo)`

Calcula aprovechamiento urbanístico.

```python
resultado = TratamientosService.calcular_aprovechamiento(
    area_lote=500,
    tratamiento_codigo='CN2'
)

print(f"Área máxima construcción: {resultado['area_maxima_construccion']}")
print(f"Área máxima por piso: {resultado['area_maxima_por_piso']}")
```

**Response**:

```python
{
    'area_lote': 500,
    'tratamiento': {
        'codigo': 'CN2',
        'nombre': 'Consolidación Nivel 2'
    },
    'area_maxima_construccion': 2000.0,  # 500 * IC(4.0)
    'area_maxima_por_piso': 350.0        # 500 * IO(0.70)
}
```

---

## Signals

### `notificar_lote_match`

Notifica a developers cuando un lote coincide con su perfil.

**Ubicación**: signals.py

**Trigger**: `post_save` en modelo `Lote`

**Funcionalidad**:

1. Solo para lotes nuevos o recién verificados
2. Busca developers con perfil completo
3. Calcula matches por:
   - Ciudad de interés
   - Uso de suelo preferido
   - Modelo de pago
4. Crea notificación para cada developer con match

**Ejemplo de Match**:

```python
# Developer tiene perfil:
developer.ciudades_interes = ['Medellín', 'Envigado']
developer.usos_preferidos = ['residencial', 'mixto']

# Lote nuevo:
lote.barrio = 'El Poblado'  # Medellín
lote.uso_suelo = 'Residencial'

# ✅ Match encontrado: ciudad + uso de suelo
# → Se envía notificación al developer
```

---

## URLs

**Ubicación**: urls.py

```
/api/lotes/
├── GET, POST                           # Listar y crear lotes
├── {uuid}/
│   ├── GET                            # Detalle
│   ├── PATCH                          # Actualizar
│   ├── DELETE                         # Archivar
│   ├── analysis/                      # Análisis urbanístico
│   ├── verify/                        # Verificar/rechazar (admin)
│   └── developers/
│       ├── GET                        # Listar developers del lote
│       └── manage/                    # Agregar/remover developers
├── available/                         # Lotes disponibles
├── pending-verification/              # Pendientes (admin)
├── tratamientos/                      # Tratamientos urbanísticos
├── stats/user/{user_id}/             # Estadísticas por usuario
├── available-developers/              # Developers disponibles
└── favorites/                         # Gestión de favoritos
    ├── GET, POST                      # Listar y crear
    ├── {id}/                          # Detalle y eliminar
    └── check/                         # Verificar si es favorito
```

---

## Permisos y Validaciones

### Permisos por Rol

| Acción | Owner | Developer | Admin |
|--------|-------|-----------|-------|
| **Crear lote** | ✅ | ❌ | ✅ |
| **Ver sus lotes** | ✅ | - | ✅ Todos |
| **Ver lotes activos** | - | ✅ | ✅ |
| **Editar lote** | ✅ Solo suyos | ❌ | ✅ Todos |
| **Archivar lote** | ✅ Solo suyos | ❌ | ✅ Todos |
| **Verificar lote** | ❌ | ❌ | ✅ |
| **Rechazar lote** | ❌ | ❌ | ✅ |
| **Gestionar developers** | ✅ Solo suyos | ❌ | ✅ Todos |
| **Agregar a favoritos** | ✅ | ✅ | ✅ |

### Validaciones de CBML

El CBML debe tener exactamente **11 dígitos** (formato MapGIS Medellín):

```python
# Válido
cbml = "01234567890"  # 11 dígitos

# Inválido
cbml = "012345678901234"  # 14 dígitos (antiguo formato)
```

**Validación con Regex**:

```python
validators=[
    RegexValidator(
        regex=r'^\d{11}$',
        message='El CBML debe tener exactamente 11 dígitos numéricos'
    )
]
```

---

## Estados del Lote

### Flujo de Estados

```
┌──────────┐
│ PENDING  │ ← Estado inicial al crear
└────┬─────┘
     │
     ├─ verify() ──────► ┌────────┐
     │                    │ ACTIVE │ (is_verified=True)
     │                    └────────┘
     │
     └─ reject() ──────► ┌──────────┐
                          │ REJECTED │ (is_verified=False)
                          └──────────┘

Cualquier estado:
     soft_delete() ────► ┌──────────┐
                          │ ARCHIVED │
                          └────┬─────┘
                               │
                               └─ reactivate() ──► PENDING o ACTIVE
```

### Descripción de Estados

#### `pending` (Pendiente)

- Estado inicial cuando se crea un lote
- Espera aprobación de administrador
- `is_verified = False`
- No visible para developers

#### `active` (Activo)

- Lote verificado y aprobado por admin
- `is_verified = True`
- Visible para developers
- Puede recibir análisis

#### `rejected` (Rechazado)

- Lote rechazado por admin con motivo
- `is_verified = False`
- No visible para developers
- `rejection_reason` contiene el motivo

#### `archived` (Archivado)

- Lote archivado (soft delete)
- No visible para nadie excepto owner y admin
- Puede ser reactivado

---

## Ejemplos de Uso

### 1. Propietario Registra Lote

**Request**:

```bash
POST /api/lotes/
Authorization: Bearer {owner_token}
Content-Type: application/json

{
  "nombre": "Lote Residencial El Poblado",
  "direccion": "Carrera 43A #10-50",
  "ciudad": "Medellín",
  "barrio": "El Poblado",
  "area": 450,
  "estrato": 5,
  "cbml": "01234567890",
  "valor": 1800000000,
  "forma_pago": "financiado",
  "descripcion": "Lote ubicado en zona residencial premium"
}
```

**Response (201)**:

```json
{
  "id": "nuevo-uuid",
  "nombre": "Lote Residencial El Poblado",
  "status": "pending",
  "is_verified": false,
  "owner": "owner-uuid",
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

---

### 2. Admin Verifica Lote

**Request**:

```bash
POST /api/lotes/{lote_id}/verify/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "verify"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Lote Lote Residencial El Poblado verificado y activado",
  "data": {
    "id": "lote-uuid",
    "status": "active",
    "is_verified": true,
    "verified_at": "2024-01-15T11:00:00Z",
    "verified_by": "admin-uuid"
  }
}
```

---

### 3. Developer Busca Lotes Disponibles

**Request**:

```bash
GET /api/lotes/available/?ciudad=Medellín&estrato=5&area_min=400&area_max=600
Authorization: Bearer {developer_token}
```

**Response (200)**:

```json
{
  "success": true,
  "count": 8,
  "lotes": [
    {
      "id": "lote-uuid",
      "nombre": "Lote Residencial El Poblado",
      "direccion": "Carrera 43A #10-50",
      "area": 450.0,
      "barrio": "El Poblado",
      "estrato": 5,
      "valor": 1800000000,
      "status": "active",
      "is_verified": true
    }
  ]
}
```

---

### 4. Developer Agrega Lote a Favoritos

**Request**:

```bash
POST /api/lotes/favorites/
Authorization: Bearer {developer_token}
Content-Type: application/json

{
  "lote": "lote-uuid",
  "notas": "Excelente ubicación para proyecto VIS"
}
```

**Response (201)**:

```json
{
  "success": true,
  "message": "Lote agregado a favoritos",
  "data": {
    "id": "favorite-uuid",
    "lote": "lote-uuid",
    "notas": "Excelente ubicación para proyecto VIS",
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

---

### 5. Propietario Asigna Desarrollador a Lote

**Request**:

```bash
POST /api/lotes/{lote_id}/developers/manage/
Authorization: Bearer {owner_token}
Content-Type: application/json

{
  "desarrollador_id": "developer-uuid"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Desarrollador developer@example.com agregado exitosamente",
  "desarrolladores": [
    {
      "id": "developer-uuid",
      "email": "developer@example.com",
      "nombre": "Carlos Desarrollos"
    }
  ]
}
```

---

### 6. Admin Rechaza Lote

**Request**:

```bash
POST /api/lotes/{lote_id}/verify/
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "action": "reject",
  "reason": "Falta información catastral completa. Por favor, adjunta el CBML y la matrícula inmobiliaria."
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Lote Lote Incompleto rechazado",
  "data": {
    "id": "lote-uuid",
    "status": "rejected",
    "is_verified": false,
    "rejection_reason": "Falta información catastral completa...",
    "rejected_at": "2024-01-15T11:30:00Z",
    "rejected_by": "admin-uuid"
  }
}
```

---

## Filtros Disponibles

### `LoteFilter`

**Ubicación**: filters.py

#### Filtros de Texto

- `nombre`: Buscar por nombre (contiene)
- `direccion`: Buscar por dirección (contiene)
- `barrio`: Buscar por barrio (contiene)
- `cbml`: Buscar por CBML (contiene)
- `matricula`: Buscar por matrícula (contiene)

#### Filtros Numéricos

- `area_min`: Área mínima
- `area_max`: Área máxima
- `estrato`: Estrato exacto

#### Filtros de Estado

- `status`: Estado del lote
- `is_verified`: Si está verificado

#### Filtros de Clasificación

- `clasificacion_suelo`: Clasificación (contiene)
- `uso_suelo`: Uso de suelo (contiene)
- `tratamiento_pot`: Tratamiento POT (contiene)

#### Filtros de Fecha

- `created_after`: Creados después de fecha
- `created_before`: Creados antes de fecha

---

## Índices de Base de Datos

Para mejorar el performance, el modelo `Lote` tiene índices en:

```python
indexes = [
    models.Index(fields=['owner', 'status']),
    models.Index(fields=['status', 'is_verified']),
    models.Index(fields=['created_at']),
    models.Index(fields=['cbml']),
    models.Index(fields=['uso_suelo']),
    models.Index(fields=['tratamiento_pot']),
]
```

---

## Troubleshooting

### Problema: "El CBML debe tener 11 dígitos"

**Causa**: El CBML proporcionado no tiene exactamente 11 dígitos.

**Solución**: Verificar que el CBML sea válido para MapGIS Medellín (formato de 11 dígitos).

---

### Problema: "Solo puedes editar tus propios lotes"

**Causa**: Usuario intenta editar un lote que no le pertenece.

**Solución**: Verificar que `lote.owner == request.user` o que el usuario sea admin.

---

### Problema: "La carta de autorización es obligatoria para comisionistas"

**Causa**: Se marcó `es_comisionista=true` pero no se adjuntó la carta.

**Solución**: Subir archivo de carta de autorización del propietario.

---

## Próximas Mejoras

- [ ] **Integración con MapGIS**: Consulta automática de datos catastrales
- [ ] **Cálculo Automático de Valor**: Según zona, área, estrato
- [ ] **Alertas de Precio**: Notificar cuando baje el precio
- [ ] **Comparador de Lotes**: Comparar múltiples lotes lado a lado
- [ ] **Vista de Mapa**: Visualización geográfica de lotes
- [ ] **Recomendaciones IA**: Sugerencias personalizadas para developers
- [ ] **Historial de Precios**: Tracking de cambios en el valor

---