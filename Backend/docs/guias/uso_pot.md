# Guía de uso - Aplicación Plan de Ordenamiento Territorial (POT)

Esta guía explica cómo utilizar la aplicación POT para gestionar y consultar los tratamientos urbanísticos del Plan de Ordenamiento Territorial.

## 1. Importación de datos iniciales

Para importar los datos iniciales de tratamientos POT, ejecuta el siguiente comando:

```bash
python manage.py importar_tratamientos_pot
```

Si deseas importar desde un archivo JSON específico:

```bash
python manage.py importar_tratamientos_pot /ruta/al/archivo.json
```

## 2. Consulta de tratamientos

### 2.1 Listar todos los tratamientos

Para obtener una lista de todos los tratamientos POT disponibles:

**Endpoint:** `GET /api/pot/tratamientos/lista/`

**Respuesta:**
```json
{
  "count": 7,
  "results": [
    {
      "id": 1,
      "codigo": "CN1",
      "nombre": "Consolidación Nivel 1",
      "descripcion": "Áreas consolidadas de buena calidad urbanística",
      "indice_ocupacion": 0.7,
      "indice_construccion": 2.5,
      "altura_maxima": 4,
      "activo": true
    },
    // ... otros tratamientos
  ]
}
```

### 2.2 Consultar un tratamiento específico

Para obtener detalles completos de un tratamiento por su código:

**Endpoint:** `GET /api/pot/tratamientos/detalle/CN1/`

**Respuesta:**
```json
{
  "id": 1,
  "codigo": "CN1",
  "nombre": "Consolidación Nivel 1",
  "descripcion": "Áreas consolidadas de buena calidad urbanística",
  "indice_ocupacion": 0.7,
  "indice_construccion": 2.5,
  "altura_maxima": 4,
  "retiro_frontal": 3.0,
  "retiro_lateral": 3.0,
  "retiro_posterior": 3.0,
  "frentes_minimos": [
    {
      "id": 1,
      "tipo_vivienda": "unifamiliar",
      "tipo_vivienda_display": "Unifamiliar",
      "frente_minimo": 7.0
    },
    // ... otros frentes mínimos
  ],
  "areas_minimas_lote": [
    // ... áreas mínimas de lote
  ],
  "areas_minimas_vivienda": [
    // ... áreas mínimas de vivienda
  ],
  "metadatos": {},
  "fecha_creacion": "2023-06-20T10:15:30Z",
  "fecha_actualizacion": "2023-06-20T10:15:30Z",
  "activo": true
}
```

### 2.3 Consultar tratamiento aplicable a un predio por CBML

Para obtener el tratamiento POT aplicable a un predio específico por su CBML:

**Endpoint:** `GET /api/pot/normativa/cbml/?cbml=14220250006`

**Respuesta:**
```json
{
  "cbml": "14220250006",
  "tratamiento": {
    "id": 1,
    "codigo": "CN1",
    "nombre": "Consolidación Nivel 1",
    // ... detalles completos del tratamiento
  }
}
```

## 3. Gestión de tratamientos (requiere permisos de administrador)

### 3.1 Crear un nuevo tratamiento

**Endpoint:** `POST /api/pot/tratamientos/crear/`

**Payload:**
```json
{
  "codigo": "CN5",
  "nombre": "Consolidación Nivel 5",
  "descripcion": "Áreas de consolidación especial",
  "indice_ocupacion": 0.65,
  "indice_construccion": 2.2,
  "altura_maxima": 5,
  "retiro_frontal": 3.5,
  "retiro_lateral": 2.0,
  "retiro_posterior": 3.0,
  "frentes_minimos": [
    {
      "tipo_vivienda": "unifamiliar",
      "frente_minimo": 7.5
    },
    // ... otros frentes mínimos
  ],
  "areas_minimas_lote": [
    // ... áreas mínimas de lote
  ],
  "areas_minimas_vivienda": [
    // ... áreas mínimas de vivienda
  ]
}
```

### 3.2 Importar tratamientos desde JSON

**Endpoint:** `POST /api/pot/tratamientos/importar/`

**Payload:** Objeto JSON con estructura de tratamientos

## 4. API REST completa

La aplicación proporciona una API REST completa para tratamientos POT:

- `GET /api/pot/tratamientos/`: Listar todos los tratamientos
- `POST /api/pot/tratamientos/`: Crear un nuevo tratamiento
- `GET /api/pot/tratamientos/{id}/`: Detalle de un tratamiento
- `PUT /api/pot/tratamientos/{id}/`: Actualizar un tratamiento
- `PATCH /api/pot/tratamientos/{id}/`: Actualización parcial
- `DELETE /api/pot/tratamientos/{id}/`: Eliminar un tratamiento

## 5. Integración con otras aplicaciones

La aplicación POT está integrada con la aplicación de lotes para:

1. Determinar el tratamiento aplicable a un predio específico
2. Proporcionar normas urbanísticas para los proyectos de construcción

Puedes acceder a estos datos a través de los endpoints mencionados anteriormente o mediante el servicio `TratamientoService` en la aplicación de lotes.