# Guía para crear un lote en 360Lateral

## Información requerida para crear un lote

Para crear un nuevo lote en el sistema, necesitarás la siguiente información:

### Campos obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | Texto | Nombre o identificador del lote |
| `cbml` | Texto | Código CBML del predio (Código de Bien de Medellín) |

### Campos opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `direccion` | Texto | Dirección física del lote |
| `area` | Decimal | Área del terreno en metros cuadrados (m²) |
| `descripcion` | Texto largo | Descripción detallada del lote |
| `matricula` | Texto | Número de matrícula inmobiliaria |
| `barrio` | Texto | Barrio donde se ubica el lote |
| `estrato` | Entero | Estrato socioeconómico (1-6) |

### Campos que se generan automáticamente

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `usuario` | Relación | Usuario propietario del lote (se toma del usuario autenticado) |
| `fecha_creacion` | Fecha/Hora | Fecha de creación del registro |
| `fecha_actualizacion` | Fecha/Hora | Fecha de última actualización |
| `estado` | Texto | Estado actual del lote (por defecto: 'activo') |

## Métodos para crear un lote

Existen dos formas principales de crear un lote en el sistema:

### 1. A través de la API

Puedes crear un lote enviando una petición POST a `/api/lotes/lotes/create/` con los siguientes datos en formato JSON:

```json
{
  "nombre": "Mi Lote",
  "cbml": "14220250006",
  "direccion": "Calle 50 #45-67",
  "area": 428.95,
  "descripcion": "Lote ubicado en zona céntrica",
  "matricula": "12345-67890",
  "barrio": "El Poblado",
  "estrato": 5
}
```

#### Respuesta exitosa (201 Created)

```json
{
  "id": 123,
  "mensaje": "Lote creado exitosamente"
}
```

### 2. Usando la función automática de MapGIS

La forma más sencilla de crear un lote con datos oficiales es usando la función automática que obtiene la información directamente de MapGIS:

1. Envía una petición POST a `/api/lotes/lotes/create-from-mapgis/` con los siguientes datos:

```json
{
  "cbml": "14220250006",
  "nombre": "Mi Lote desde MapGIS" // Opcional, si no se proporciona se genera automáticamente
}
```

2. El sistema:
   - Consultará automáticamente los datos del predio en MapGIS
   - Creará el lote con toda la información disponible (área, clasificación, etc.)
   - Almacenará todos los datos completos de MapGIS en el campo `metadatos`

#### Respuesta exitosa (201 Created)

```json
{
  "id": 123,
  "mensaje": "Lote creado exitosamente con datos de MapGIS",
  "lote": {
    "id": 123,
    "nombre": "Mi Lote desde MapGIS",
    "cbml": "14220250006",
    "area": 428.95,
    "direccion": "Calle 50 #45-67",
    "clasificacion_suelo": "Urbano",
    "fecha_creacion": "2023-06-15"
    // ...otros datos del lote
  }
}
```

### 3. Usando el servicio de MapGIS manualmente

También puedes crear un lote en dos pasos si necesitas revisar los datos antes de crearlos:

1. Primero, consulta la información del predio usando el CBML:
   - Envía una petición POST a `/api/lotes/scrap/cbml/` con `{"cbml": "14220250006"}`

2. Con la información obtenida, crea el lote usando la API de creación:
   - Extrae los datos relevantes de la respuesta de MapGIS
   - Usa esos datos para crear el lote como se describe en el método 1

## Recomendaciones y buenas prácticas

1. **Validación del CBML**: Asegúrate de que el CBML sea válido antes de crear el lote. Puedes usar el endpoint `/api/lotes/scrap/cbml/` para verificarlo.

2. **Área del lote**: Si obtienes esta información desde MapGIS, el área ya vendrá en metros cuadrados. De lo contrario, asegúrate de ingresar el área en la unidad correcta.

3. **Barrio y estrato**: Estos datos pueden obtenerse automáticamente desde MapGIS en algunos casos, pero también puedes ingresarlos manualmente.

4. **Matrícula inmobiliaria**: Este dato es importante para futuros trámites legales, recomendamos incluirlo si está disponible.

## Búsqueda avanzada de lotes

Puedes buscar lotes usando múltiples criterios de filtrado:

Envía una petición GET a `/api/lotes/lotes/search/` con los parámetros que desees:

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `nombre` | Búsqueda por nombre (parcial) | `nombre=casa` |
| `cbml` | Búsqueda por CBML (exacta) | `cbml=14220250006` |
| `direccion` | Búsqueda por dirección (parcial) | `direccion=calle 50` |
| `barrio` | Búsqueda por barrio (parcial) | `barrio=poblado` |
| `estrato` | Filtro por estrato (exacto) | `estrato=5` |
| `area_min` | Área mínima en m² | `area_min=200` |
| `area_max` | Área máxima en m² | `area_max=500` |
| `estado` | Estado del lote | `estado=activo` |
| `fecha_desde` | Fecha creación desde (YYYY-MM-DD) | `fecha_desde=2023-01-01` |
| `fecha_hasta` | Fecha creación hasta (YYYY-MM-DD) | `fecha_hasta=2023-06-30` |
| `orden` | Campo para ordenar resultados | `orden=-fecha_creacion` |
| `page` | Número de página | `page=2` |
| `page_size` | Tamaño de página (máx 100) | `page_size=20` |

Ejemplo de URL completa:
```
/api/lotes/lotes/search/?area_min=200&estrato=5&orden=-area&page=1&page_size=10
```

## Información sobre tratamientos urbanísticos

Una vez creado el lote, puedes consultar su tratamiento urbanístico según el POT:

- Envía una petición GET a `/api/lotes/tratamientos/por-cbml/?cbml=14220250006`

Esta información te dará detalles sobre el aprovechamiento permitido del terreno, densidad habitacional máxima, altura normativa, etc.

## Errores comunes

| Código | Descripción | Solución |
|--------|-------------|----------|
| 400 | CBML inválido | Verifica el formato del CBML (debe ser numérico, generalmente 11 dígitos) |
| 404 | No se encontraron datos para el CBML | Confirma que el CBML existe en el sistema catastral |
| 403 | No autorizado | Verifica tu autenticación y permisos |
| 500 | Error interno del servidor | Contacta al soporte técnico |