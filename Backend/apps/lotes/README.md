# Lotes Module - Lateral 360°

## Descripción

Módulo principal para la gestión de lotes urbanos en la plataforma Lateral 360°. Maneja el registro, búsqueda, análisis urbanístico y gestión completa de lotes en la ciudad de Medellín.

## Características

- Registro y gestión de lotes urbanos
- Búsqueda avanzada por CBML, matrícula inmobiliaria y dirección
- Integración con MapGIS de Medellín
- Análisis urbanístico automatizado
- Cálculo de potencial constructivo
- Gestión de documentos asociados
- Historial de cambios y auditoría

## Estructura

```
lotes/
├── __init__.py
├── apps.py              # Configuración de la app
├── models.py            # Modelos Lote, LoteDocument, LoteHistory
├── serializers.py       # Serializadores para API
├── views.py             # Vistas de API
├── urls.py              # Rutas de la API
├── permissions.py       # Permisos personalizados
├── services/            # Lógica de negocio
│   ├── mapgis.py       # Integración MapGIS
│   ├── urbanistic.py   # Análisis urbanístico
│   └── calculations.py # Cálculos
├── utils.py             # Utilidades
└── README.md            # Esta documentación
```

## Modelos

### Lote

Modelo principal para lotes urbanos.

**Campos principales:**
- `id`: UUIDField (Primary Key)
- `cbml`: CharField (Código Base Municipal de Lote, único)
- `matricula`: CharField (Matrícula inmobiliaria)
- `direccion`: CharField (Dirección física)
- `owner`: ForeignKey (Usuario propietario)
- `area`: DecimalField (Área en m²)
- `area_construida`: DecimalField (Área construida existente)
- `frente`: DecimalField (Frente del lote en metros)
- `fondo`: DecimalField (Fondo del lote en metros)
- `ubicacion`: PointField (Coordenadas geográficas)
- `barrio`: CharField
- `comuna`: IntegerField
- `estrato`: IntegerField
- `status`: CharField (active, inactive, sold, in_negotiation)
- `created_at`: DateTimeField
- `updated_at`: DateTimeField

**Campos urbanísticos:**
- `tratamiento_urbanistico`: CharField
- `uso_suelo`: CharField
- `altura_maxima`: DecimalField
- `indice_ocupacion`: DecimalField
- `indice_construccion`: DecimalField
- `aislamientos`: JSONField
- `retiros`: JSONField

**Campos de valoración:**
- `avaluo_catastral`: DecimalField
- `valor_comercial`: DecimalField
- `valor_m2`: DecimalField

**Métodos:**
```python
def calcular_potencial_constructivo(self) -> dict:
    """Calcula el potencial constructivo del lote"""
    
def obtener_normativa(self) -> dict:
    """Obtiene normativa urbanística aplicable"""

def generar_reporte_analisis(self) -> dict:
    """Genera reporte completo de análisis"""

@property
def esta_disponible(self) -> bool:
    """Verifica si el lote está disponible"""
```

### LoteDocument

Documentos asociados a un lote.

**Campos:**
- `id`: AutoField
- `lote`: ForeignKey (Lote)
- `tipo`: CharField (escritura, cedula_catastral, plano, foto, otro)
- `archivo`: FileField
- `descripcion`: TextField
- `uploaded_by`: ForeignKey (User)
- `uploaded_at`: DateTimeField

### LoteHistory

Historial de cambios de un lote.

**Campos:**
- `id`: AutoField
- `lote`: ForeignKey (Lote)
- `campo_modificado`: CharField
- `valor_anterior`: TextField
- `valor_nuevo`: TextField
- `modificado_por`: ForeignKey (User)
- `fecha_modificacion`: DateTimeField
- `motivo`: TextField

## API Endpoints

### 1. List/Create Lotes

Lista lotes del usuario o crea uno nuevo.

**Endpoint:** `GET/POST /api/lotes/`

**GET Response (200 OK):**
```json
{
    "count": 10,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": "uuid",
            "cbml": "01010010010010",
            "matricula": "123-456789",
            "direccion": "Carrera 43A #1-50",
            "area": 500.00,
            "barrio": "El Poblado",
            "status": "active",
            "owner": {
                "id": "uuid",
                "email": "owner@example.com",
                "name": "John Doe"
            }
        }
    ]
}
```

**POST Request:**
```json
{
    "cbml": "01010010010010",
    "matricula": "123-456789",
    "direccion": "Carrera 43A #1-50",
    "area": 500.00,
    "barrio": "El Poblado",
    "comuna": 14,
    "estrato": 6
}
```

### 2. Lote Detail

Obtiene, actualiza o elimina un lote específico.

**Endpoint:** `GET/PUT/DELETE /api/lotes/{uuid}/`

**GET Response (200 OK):**
```json
{
    "id": "uuid",
    "cbml": "01010010010010",
    "matricula": "123-456789",
    "direccion": "Carrera 43A #1-50",
    "area": 500.00,
    "area_construida": 300.00,
    "frente": 10.00,
    "fondo": 50.00,
    "barrio": "El Poblado",
    "comuna": 14,
    "estrato": 6,
    "status": "active",
    "tratamiento_urbanistico": "consolidacion_nivel_1",
    "uso_suelo": "residencial",
    "altura_maxima": 30.00,
    "indice_ocupacion": 0.70,
    "indice_construccion": 3.50,
    "avaluo_catastral": 500000000,
    "valor_comercial": 800000000,
    "owner": {
        "id": "uuid",
        "email": "owner@example.com",
        "full_name": "John Doe"
    },
    "ubicacion": {
        "type": "Point",
        "coordinates": [-75.5636, 6.2476]
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
}
```

### 3. Búsqueda por CBML

Busca un lote en MapGIS usando el CBML.

**Endpoint:** `POST /api/lotes/public/cbml/`

**Request:**
```json
{
    "cbml": "01010010010010"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "cbml": "01010010010010",
        "direccion": "Carrera 43A #1-50",
        "area": 500.00,
        "barrio": "El Poblado",
        "comuna": "14",
        "tratamiento": "Consolidación Nivel 1",
        "uso_suelo": "Residencial",
        "geometria": {
            "type": "Polygon",
            "coordinates": [...]
        }
    }
}
```

### 4. Búsqueda por Matrícula

Busca un lote por matrícula inmobiliaria.

**Endpoint:** `POST /api/lotes/public/matricula/`

**Request:**
```json
{
    "matricula": "123-456789"
}
```

### 5. Búsqueda por Dirección

Busca lotes por dirección.

**Endpoint:** `POST /api/lotes/public/direccion/`

**Request:**
```json
{
    "direccion": "Carrera 43A"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "count": 5,
        "results": [
            {
                "cbml": "01010010010010",
                "direccion": "Carrera 43A #1-50",
                "area": 500.00
            }
        ]
    }
}
```

### 6. Análisis Urbanístico

Genera análisis urbanístico completo del lote.

**Endpoint:** `GET /api/lotes/{uuid}/analisis/`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "lote_id": "uuid",
        "cbml": "01010010010010",
        "potencial_constructivo": {
            "area_maxima_construccion": 1750.00,
            "pisos_maximos": 5,
            "area_construible_piso": 350.00,
            "area_vendible_estimada": 1400.00
        },
        "normativa": {
            "tratamiento": "Consolidación Nivel 1",
            "uso_principal": "Residencial",
            "usos_compatibles": ["Comercial", "Institucional"],
            "altura_maxima": 30.00,
            "indice_ocupacion": 0.70,
            "indice_construccion": 3.50,
            "retiros": {
                "frontal": 5.00,
                "lateral": 3.00,
                "posterior": 3.00
            }
        },
        "valoracion": {
            "avaluo_catastral": 500000000,
            "valor_comercial_estimado": 800000000,
            "valor_m2": 1600000,
            "potencial_venta": 2240000000
        }
    }
}
```

### 7. Documentos del Lote

Gestiona documentos asociados al lote.

**Endpoints:**
- `GET /api/lotes/{uuid}/documentos/` - Lista documentos
- `POST /api/lotes/{uuid}/documentos/` - Sube documento
- `GET /api/lotes/{uuid}/documentos/{id}/` - Descarga documento
- `DELETE /api/lotes/{uuid}/documentos/{id}/` - Elimina documento

### 8. Historial del Lote

Obtiene historial de cambios del lote.

**Endpoint:** `GET /api/lotes/{uuid}/historial/`

**Response (200 OK):**
```json
{
    "count": 10,
    "results": [
        {
            "id": 1,
            "campo_modificado": "valor_comercial",
            "valor_anterior": "750000000",
            "valor_nuevo": "800000000",
            "modificado_por": "admin@example.com",
            "fecha_modificacion": "2024-01-15T10:30:00Z",
            "motivo": "Actualización de mercado"
        }
    ]
}
```

## Servicios

### MapGISService

Servicio para integración con MapGIS de Medellín.

**Métodos principales:**

```python
class MapGISService:
    @staticmethod
    def buscar_por_cbml(cbml: str) -> dict:
        """Busca información del lote en MapGIS por CBML"""
        
    @staticmethod
    def buscar_por_matricula(matricula: str) -> dict:
        """Busca información del lote por matrícula"""
        
    @staticmethod
    def buscar_por_direccion(direccion: str) -> list:
        """Busca lotes por dirección"""
        
    @staticmethod
    def obtener_normativa(cbml: str) -> dict:
        """Obtiene normativa urbanística del lote"""
```

### UrbanisticAnalysisService

Servicio para análisis urbanístico.

**Métodos principales:**

```python
class UrbanisticAnalysisService:
    @staticmethod
    def analizar_lote(lote: Lote) -> dict:
        """Realiza análisis urbanístico completo"""
        
    @staticmethod
    def calcular_potencial(lote: Lote) -> dict:
        """Calcula potencial constructivo"""
        
    @staticmethod
    def validar_normativa(lote: Lote) -> dict:
        """Valida cumplimiento de normativa"""
        
    @staticmethod
    def generar_reporte(lote: Lote) -> bytes:
        """Genera reporte PDF de análisis"""
```

### CalculationService

Servicio para cálculos urbanísticos y financieros.

**Métodos principales:**

```python
class CalculationService:
    @staticmethod
    def calcular_area_construible(
        area_lote: float,
        indice_ocupacion: float,
        indice_construccion: float
    ) -> dict:
        """Calcula área construible"""
        
    @staticmethod
    def estimar_costos_construccion(area: float, tipo: str) -> dict:
        """Estima costos de construcción"""
        
    @staticmethod
    def calcular_viabilidad_financiera(lote: Lote) -> dict:
        """Calcula viabilidad financiera del proyecto"""
```

## Permisos

### IsOwnerOrReadOnly

Permite lectura a todos, modificación solo al propietario.

```python
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user
```

### CanManageLotes

Control de acceso según el rol del usuario.

```python
class CanManageLotes(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_admin:
            return True
        if request.user.is_owner:
            return request.method in ['GET', 'POST', 'PUT', 'PATCH']
        if request.user.is_developer:
            return request.method == 'GET'
        return False
```

## Validaciones

### Validación de CBML

```python
def validate_cbml(cbml: str) -> bool:
    """
    Valida formato de CBML según MapGIS Medellín
    Formato: 11 dígitos numéricos
    """
    if not cbml or len(cbml) != 11:
        return False
    if not cbml.isdigit():
        return False
    return True
```

**Formato CBML**: Exactamente **11 dígitos** numéricos  
**Ejemplo válido**: `05001000000`  
**Ejemplo inválido**: `0500100000` (10 dígitos), `050010000001` (12 dígitos)

### Validación de Matrícula

```python
def validate_matricula(matricula: str) -> bool:
    """
    Valida formato de matrícula inmobiliaria
    Formato: XXX-XXXXXX
    """
    import re
    pattern = r'^\d{3}-\d{6}$'
    return bool(re.match(pattern, matricula))
```

## Integración con MapGIS

El módulo se integra con MapGIS Medellín para obtener información catastral:
- **CBML**: 11 dígitos numéricos (ej: `05001000000`)
- **Fuente**: MapGIS Alcaldía de Medellín
