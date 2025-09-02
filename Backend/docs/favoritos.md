# Guía de Uso: Sistema de Favoritos

## Introducción

El sistema de favoritos de 360Lateral permite a los usuarios guardar lotes de interés para acceder a ellos fácilmente en el futuro. Esta guía explica cómo utilizar las APIs para gestionar los lotes favoritos.

## Endpoints Disponibles

### Listar Favoritos del Usuario Actual

```
GET /api/lotes/favorites/
```

#### Respuesta Exitosa (200 OK)

```json
[
  {
    "id": 1,
    "lote_id": 42,
    "lote_detail": {
      "id": 42,
      "name": "Lote Ejemplo",
      "address": "Calle Principal 123",
      "area": 500.5
      // Otros campos del lote
    },
    "created_at": "2023-12-01T14:30:00Z",
    "notes": "Me interesa por su ubicación"
  }
]
```

### Añadir un Lote a Favoritos

```
POST /api/lotes/favorites/
Content-Type: application/json
```

#### Datos Requeridos

```json
{
  "lote_id": 42,
  "notes": "Notas opcionales sobre este favorito"
}
```

#### Respuesta Exitosa (201 Created)

```json
{
  "id": 1,
  "lote_id": 42,
  "lote_detail": {
    "id": 42,
    "name": "Lote Ejemplo",
    // Otros detalles del lote
  },
  "created_at": "2023-12-01T14:30:00Z",
  "notes": "Notas opcionales sobre este favorito"
}
```

### Eliminar un Favorito

```
DELETE /api/lotes/favorites/{id}/
```

#### Respuesta Exitosa (204 No Content)

### Actualizar Notas de un Favorito

```
PATCH /api/lotes/favorites/{id}/
Content-Type: application/json
```

#### Datos

```json
{
  "notes": "Nuevas notas actualizadas"
}
```

### Alternar Estado de Favorito (Toggle)

Este endpoint permite añadir o eliminar un favorito en una sola operación.

```
POST /api/lotes/favorites/toggle/
Content-Type: application/json
```

#### Datos Requeridos

```json
{
  "lote_id": 42
}
```

#### Respuesta Si Se Añade (201 Created)

```json
{
  "id": 1,
  "lote_id": 42,
  "lote_detail": {
    // Detalles del lote
  },
  "created_at": "2023-12-01T14:30:00Z",
  "notes": null
}
```

#### Respuesta Si Se Elimina (200 OK)

```json
{
  "detail": "Lote eliminado de favoritos."
}
```

### Verificar Estado de Favorito

```
GET /api/lotes/favorites/check/?lote_id=42
```

#### Respuesta (200 OK)

```json
{
  "is_favorite": true
}
```

## Integración con Detalles de Lote

Al obtener los detalles de un lote, se incluye automáticamente un campo `is_favorite` que indica si el lote está en favoritos del usuario actual:

```
GET /api/lotes/42/
```

```json
{
  "id": 42,
  "name": "Lote Ejemplo",
  // Otros campos del lote
  "is_favorite": true
}
```

## Ejemplos de Uso con JavaScript/Axios

### Listar Favoritos

```javascript
const getFavorites = async () => {
  const response = await axios.get('api/lotes/favorites/');
  return response.data;
};
```

### Añadir a Favoritos

```javascript
const addToFavorites = async (loteId, notes = '') => {
  const response = await axios.post('api/lotes/favorites/', {
    lote_id: loteId,
    notes: notes
  });
  return response.data;
};
```

### Eliminar de Favoritos

```javascript
const removeFromFavorites = async (favoriteId) => {
  await axios.delete(`api/lotes/favorites/${favoriteId}/`);
};
```

### Alternar Favorito (Toggle)

```javascript
const toggleFavorite = async (loteId) => {
  const response = await axios.post('api/lotes/favorites/toggle/', {
    lote_id: loteId
  });
  return response.data;
};
```

## Notas

- Todos los endpoints requieren autenticación.
- Un usuario solo puede ver y gestionar sus propios favoritos.
- Si intentas añadir un lote que ya está en favoritos, recibirás un error 400 Bad Request.