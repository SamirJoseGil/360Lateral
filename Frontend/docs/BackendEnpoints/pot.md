# ENDPOINTS API - MÓDULO POT

Documentación completa de todos los endpoints disponibles en el módulo POT (Plan de Ordenamiento Territorial).

## 🔗 Base URL
```
http://localhost:8000/api/pot/
```

## 🏛️ CRUD DE TRATAMIENTOS

### 📋 Listar Tratamientos
```
GET /api/pot/tratamientos/
```
**Descripción**: Lista todos los tratamientos POT con paginación
**Autenticación**: Requerida
**Parámetros**: 
- `page` (opcional): Número de página
- `page_size` (opcional): Elementos por página

**Respuesta**:
```json
{
  "count": 7,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "codigo": "CN1",
      "nombre": "Consolidación Nivel 1",
      "descripcion": "Tratamiento de consolidación de baja densidad",
      "indice_ocupacion": "0.70",
      "indice_construccion": "1.0",
      "altura_maxima": 3,
      "activo": true
    }
  ]
}
```

### 🔍 Detalle de Tratamiento
```
GET /api/pot/tratamientos/{id}/
```
**Descripción**: Obtiene detalles completos de un tratamiento incluyendo normativas
**Autenticación**: Requerida
**Parámetros**: 
- `id`: ID del tratamiento

**Respuesta**:
```json
{
  "id": 1,
  "codigo": "CN1",
  "nombre": "Consolidación Nivel 1",
  "descripcion": "Tratamiento de consolidación de baja densidad",
  "indice_ocupacion": "0.70",
  "indice_construccion": "1.0",
  "altura_maxima": 3,
  "retiro_frontal": "3.0",
  "retiro_lateral": "1.5",
  "retiro_posterior": "3.0",
  "frentes_minimos": [
    {
      "id": 1,
      "tipo_vivienda": "unifamiliar",
      "tipo_vivienda_display": "Unifamiliar",
      "frente_minimo": "7.00"
    }
  ],
  "areas_minimas_lote": [
    {
      "id": 1,
      "tipo_vivienda": "unifamiliar",
      "tipo_vivienda_display": "Unifamiliar", 
      "area_minima": "72.00"
    }
  ],
  "areas_minimas_vivienda": [
    {
      "id": 1,
      "tipo_vivienda": "1_alcoba",
      "tipo_vivienda_display": "1 Alcoba",
      "area_minima": "35.00"
    }
  ],
  "metadatos": {},
  "fecha_creacion": "2024-01-15T10:30:00Z",
  "fecha_actualizacion": "2024-01-15T10:30:00Z",
  "activo": true
}
```

### ➕ Crear Tratamiento
```
POST /api/pot/tratamientos/
```
**Descripción**: Crea un nuevo tratamiento POT
**Autenticación**: Requerida (Solo administradores)
**Body**:
```json
{
  "codigo": "CN5",
  "nombre": "Consolidación Nivel 5",
  "descripcion": "Nuevo tratamiento de alta densidad",
  "indice_ocupacion": "0.80",
  "indice_construccion": "2.5",
  "altura_maxima": 8,
  "retiro_frontal": "5.0",
  "retiro_lateral": "3.0", 
  "retiro_posterior": "5.0",
  "activo": true
}
```

### ✏️ Actualizar Tratamiento
```
PUT /api/pot/tratamientos/{id}/
PATCH /api/pot/tratamientos/{id}/
```
**Descripción**: Actualiza un tratamiento existente
**Autenticación**: Requerida (Solo administradores)

### 🗑️ Eliminar Tratamiento
```
DELETE /api/pot/tratamientos/{id}/
```
**Descripción**: Elimina un tratamiento POT
**Autenticación**: Requerida (Solo administradores)

## 📋 CONSULTAS ESPECÍFICAS

### 📋 Listar Tratamientos Activos
```
GET /api/pot/lista/
```
**Descripción**: Lista solo los tratamientos POT activos (simplificado)
**Autenticación**: Requerida

**Respuesta**:
```json
{
  "count": 7,
  "results": [
    {
      "id": 1,
      "codigo": "CN1",
      "nombre": "Consolidación Nivel 1",
      "descripcion": "Tratamiento de consolidación de baja densidad",
      "indice_ocupacion": "0.70",
      "indice_construccion": "1.0",
      "altura_maxima": 3,
      "activo": true
    }
  ]
}
```

### 🔍 Detalle por Código
```
GET /api/pot/detalle/{codigo}/
```
**Descripción**: Obtiene detalles de un tratamiento por su código POT
**Autenticación**: Requerida
**Parámetros**: 
- `codigo`: Código del tratamiento (CN1, CN2, RD, D, C)

**Ejemplo**:
```
GET /api/pot/detalle/CN1/
```

### 🗺️ Normativa por CBML
```
GET /api/pot/normativa/cbml/?cbml={cbml}
```
**Descripción**: Consulta la normativa POT aplicable a un predio por su CBML
**Autenticación**: Requerida
**Parámetros**: 
- `cbml`: Código CBML del predio

**Ejemplo**:
```
GET /api/pot/normativa/cbml/?cbml=01030201200010007000000000
```

**Respuesta**:
```json
{
  "cbml": "01030201200010007000000000",
  "tratamiento_encontrado": "Consolidación Nivel 1",
  "codigo_tratamiento": "CN1",
  "normativa": {
    "id": 1,
    "codigo": "CN1",
    "nombre": "Consolidación Nivel 1",
    "descripcion": "Tratamiento de consolidación de baja densidad",
    "indice_ocupacion": "0.70",
    "indice_construccion": "1.0",
    "altura_maxima": 3,
    "retiro_frontal": "3.0",
    "retiro_lateral": "1.5",
    "retiro_posterior": "3.0",
    "frentes_minimos": [...],
    "areas_minimas_lote": [...],
    "areas_minimas_vivienda": [...]
  },
  "datos_mapgis": {
    "area_lote_m2": 120.5,
    "clasificacion_suelo": "Urbano",
    "aprovechamiento_urbano": {
      "tratamiento": "Consolidación Nivel 1",
      "densidad_habitacional_max": 180,
      "altura_normativa": 3
    }
  }
}
```

### 📊 Calcular Aprovechamiento
```
POST /api/pot/aprovechamiento/calcular/
```
**Descripción**: Calcula el aprovechamiento urbanístico para un lote específico
**Autenticación**: Requerida
**Body**:
```json
{
  "codigo_tratamiento": "CN1",
  "area_lote": 120.5,
  "tipologia": "multifamiliar"
}
```

**Respuesta**:
```json
{
  "success": true,
  "tratamiento": {
    "codigo": "CN1",
    "nombre": "Consolidación Nivel 1",
    "indice_ocupacion": 0.7,
    "indice_construccion": 1.0,
    "altura_maxima": 3
  },
  "calculos": {
    "area_lote": 120.5,
    "area_ocupada_maxima": 84.35,
    "area_construible_maxima": 120.5,
    "tipologia": "multifamiliar"
  }
}
```

## 🔧 ADMINISTRACIÓN

### 📥 Importar Tratamientos
```
POST /api/pot/importar/
```
**Descripción**: Importa tratamientos POT desde un JSON estructurado
**Autenticación**: Requerida (Solo administradores)
**Body**:
```json
{
  "Consolidación Nivel 1": {
    "descripcion": "Tratamiento de consolidación de baja densidad",
    "indice_ocupacion": 0.7,
    "indice_construccion": 1.0,
    "altura_maxima": 3,
    "retiro_frontal": 3.0,
    "retiro_lateral": 1.5,
    "retiro_posterior": 3.0,
    "frente_minimo": {
      "unifamiliar": 7.0,
      "multifamiliar": 10.0
    },
    "area_minima_lote": {
      "unifamiliar": 72.0,
      "multifamiliar": 150.0
    },
    "area_minima_vivienda": {
      "1_alcoba": 35.0,
      "2_alcobas": 45.0,
      "3_alcobas_vis": 58.0
    }
  }
}
```

**Respuesta**:
```json
{
  "mensaje": "Importación completada exitosamente",
  "creados": 3,
  "actualizados": 4
}
```

### ➕ Crear Tratamiento Completo
```
POST /api/pot/crear/
```
**Descripción**: Crea un tratamiento POT con todas sus normativas específicas
**Autenticación**: Requerida (Solo administradores)
**Body**:
```json
{
  "codigo": "CN5",
  "nombre": "Consolidación Nivel 5",
  "descripcion": "Nuevo tratamiento",
  "indice_ocupacion": "0.80",
  "indice_construccion": "2.5",
  "altura_maxima": 8,
  "frentes_minimos": [
    {
      "tipo_vivienda": "unifamiliar",
      "frente_minimo": "8.0"
    }
  ],
  "areas_minimas_lote": [
    {
      "tipo_vivienda": "unifamiliar", 
      "area_minima": "80.0"
    }
  ],
  "areas_minimas_vivienda": [
    {
      "tipo_vivienda": "1_alcoba",
      "area_minima": "40.0"
    }
  ]
}
```

## 🏠 UTILIDADES

### 🏠 Tipos de Vivienda
```
GET /api/pot/tipos-vivienda/
```
**Descripción**: Obtiene todos los tipos de vivienda disponibles en el sistema
**Autenticación**: Requerida

**Respuesta**:
```json
{
  "tipos_frente_minimo": [
    {
      "codigo": "unifamiliar",
      "nombre": "Unifamiliar"
    },
    {
      "codigo": "bifamiliar_pisos_diferentes",
      "nombre": "Bifamiliar en pisos diferentes"
    },
    {
      "codigo": "bifamiliar_mismo_piso", 
      "nombre": "Bifamiliar en el mismo piso"
    },
    {
      "codigo": "trifamiliar",
      "nombre": "Trifamiliar"
    },
    {
      "codigo": "multifamiliar",
      "nombre": "Multifamiliar"
    }
  ],
  "tipos_area_lote": [
    // Mismos tipos que frente_minimo
  ],
  "tipos_area_vivienda": [
    {
      "codigo": "1_alcoba",
      "nombre": "1 Alcoba"
    },
    {
      "codigo": "2_alcobas",
      "nombre": "2 Alcobas"
    },
    {
      "codigo": "3_alcobas_vip",
      "nombre": "3 Alcobas VIP"
    },
    {
      "codigo": "3_alcobas_vis",
      "nombre": "3 Alcobas VIS"
    },
    {
      "codigo": "4_alcobas_vip",
      "nombre": "4 Alcobas VIP"
    },
    {
      "codigo": "4_alcobas_vis",
      "nombre": "4 Alcobas VIS"
    }
  ]
}
```

### 🩺 Health Check
```
GET /api/pot/health/
```
**Descripción**: Verifica el estado del módulo POT y sus dependencias
**Autenticación**: Requerida

**Respuesta**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "total_tratamientos": 7,
    "tratamientos_activos": 7,
    "conexion": "ok"
  },
  "pot_service": {
    "disponible": true,
    "tratamientos_disponibles": 7
  }
}
```

## 🚨 CÓDIGOS DE ERROR

### 400 - Bad Request
- Datos de entrada inválidos
- Parámetros requeridos faltantes
- Formato JSON incorrecto

### 401 - Unauthorized  
- Token de autenticación faltante o inválido

### 403 - Forbidden
- Usuario sin permisos de administrador para operaciones de escritura

### 404 - Not Found
- Tratamiento no encontrado
- CBML sin información en MapGIS
- Endpoint no existe

### 500 - Internal Server Error
- Error en base de datos
- Error en servicio MapGIS
- Error interno del servidor

## 📝 NOTAS DE USO

### 🔐 Autenticación
Todos los endpoints requieren autenticación JWT:
```
Authorization: Bearer {token}
```

### 👑 Permisos de Administrador
Los siguientes endpoints requieren permisos de administrador:
- POST /api/pot/tratamientos/
- PUT/PATCH /api/pot/tratamientos/{id}/
- DELETE /api/pot/tratamientos/{id}/
- POST /api/pot/importar/
- POST /api/pot/crear/

### 🗺️ Integración MapGIS
El endpoint `/normativa/cbml/` integra con MapGIS para obtener información del predio y determinar el tratamiento aplicable. Si MapGIS no está disponible, retorna error 500.

### 📊 Paginación
Los listados utilizan paginación estándar de Django REST Framework:
- `page`: Número de página (defecto: 1)
- `page_size`: Elementos por página (defecto: 20)

### 🏗️ Códigos de Tratamiento
- **CN1-CN4**: Consolidación Nivel 1-4
- **RD**: Redesarrollo  
- **D**: Desarrollo
- **C**: Conservación