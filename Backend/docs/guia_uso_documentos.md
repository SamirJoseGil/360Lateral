# Guía de Uso: Módulo de Documentos

## Introducción

El módulo de Documentos de 360Lateral permite gestionar archivos asociados a lotes. Esta guía detalla los pasos para utilizar las diferentes funcionalidades de este módulo mediante la API REST.

## Tabla de contenidos

1. [Requisitos previos](#requisitos-previos)
2. [Subir documentos](#subir-documentos)
3. [Listar documentos](#listar-documentos)
4. [Obtener un documento específico](#obtener-un-documento-específico)
5. [Actualizar documentos](#actualizar-documentos)
6. [Eliminar documentos](#eliminar-documentos)
7. [Archivar documentos](#archivar-documentos)
8. [Descargar documentos](#descargar-documentos)
9. [Filtrar documentos](#filtrar-documentos)
10. [Gestión de documentos por lote](#gestión-de-documentos-por-lote)
11. [Problemas comunes y soluciones](#problemas-comunes-y-soluciones)

## Requisitos previos

Para utilizar la API de Documentos, necesitas:

- Tener una cuenta válida en la plataforma
- Obtener un token de autenticación JWT
- Incluir el token en el encabezado de todas las peticiones:
  ```
  Authorization: Bearer {tu_token_jwt}
  ```

## Subir documentos

### Endpoint básico para subir documentos

```
POST /api/documents/
Content-Type: multipart/form-data
```

### Datos requeridos

- `title` (texto): Título descriptivo del documento
- `file` (archivo): El archivo a subir (max. 50MB)

### Datos opcionales

- `description` (texto): Descripción detallada del documento
- `document_type` (texto): Tipo de documento (valores: 'general', 'plano', 'contrato', 'licencia', 'factura', 'otro')
- `lote` (número): ID del lote al que pertenece el documento
- `tags` (array): Lista de etiquetas en formato JSON
- `metadata` (objeto): Metadatos adicionales en formato JSON

### Ejemplo de solicitud usando curl

```bash
curl -X POST \
  -H "Authorization: Bearer {tu_token_jwt}" \
  -F "title=Plano de lote" \
  -F "description=Plano detallado con medidas del lote" \
  -F "document_type=plano" \
  -F "lote=5" \
  -F "file=@ruta_local/plano.pdf" \
  -F "tags=[\"plano\", \"medidas\"]" \
  http://api.360lateral.com/api/documents/
```

### Endpoint alternativo

También puedes usar el endpoint específico para subir:

```
POST /api/documents/upload/
```

Con los mismos campos que el endpoint principal.

### Extensiones de archivo permitidas

- Documentos: `.pdf`, `.doc`, `.docx`, `.txt`
- Hojas de cálculo: `.xls`, `.xlsx`
- Imágenes: `.jpg`, `.jpeg`, `.png`
- Planos: `.dwg`, `.dxf`
- Archivos comprimidos: `.zip`, `.rar`, `.7z`

### Respuesta exitosa (código 201 Created)

```json
{
  "id": 1,
  "title": "Plano de lote",
  "description": "Plano detallado con medidas del lote",
  "document_type": "plano",
  "file": "/media/documents/2023/11/15/a1b2c3d4.pdf",
  "file_url": "http://api.360lateral.com/media/documents/2023/11/15/a1b2c3d4.pdf",
  "file_name": "a1b2c3d4.pdf",
  "user": 1,
  "user_name": "Juan Pérez",
  "lote": 5,
  "created_at": "2023-11-15T10:30:00Z",
  "updated_at": "2023-11-15T10:30:00Z",
  "file_size": 1548576,
  "mime_type": "application/pdf",
  "tags": ["plano", "medidas"],
  "metadata": {},
  "is_active": true
}
```

## Listar documentos

### Endpoint para listar todos los documentos

```
GET /api/documents/
```

Los usuarios normales solo verán sus propios documentos, mientras que los administradores verán todos los documentos.

### Parámetros de consulta

- `document_type`: Filtrar por tipo de documento
- `lote`: Filtrar por ID de lote
- `ordering`: Ordenar resultados (ej: `-created_at`, `title`)

### Ejemplo de solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/documents/?document_type=plano&ordering=-created_at"
```

### Respuesta exitosa (código 200 OK)

```json
[
  {
    "id": 2,
    "title": "Plano actualizado",
    "file_url": "http://api.360lateral.com/media/documents/2023/11/16/e5f6g7h8.pdf",
    "document_type": "plano",
    "created_at": "2023-11-16T14:20:00Z",
    ...
  },
  {
    "id": 1,
    "title": "Plano inicial",
    "file_url": "http://api.360lateral.com/media/documents/2023/11/15/a1b2c3d4.pdf",
    "document_type": "plano",
    "created_at": "2023-11-15T10:30:00Z",
    ...
  }
]
```

## Obtener un documento específico

### Endpoint para obtener detalles de un documento

```
GET /api/documents/{id}/
```

### Ejemplo de solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/documents/1/"
```

### Respuesta exitosa (código 200 OK)

```json
{
  "id": 1,
  "title": "Plano inicial",
  "description": "Plano detallado con medidas del lote",
  "document_type": "plano",
  "file": "/media/documents/2023/11/15/a1b2c3d4.pdf",
  "file_url": "http://api.360lateral.com/media/documents/2023/11/15/a1b2c3d4.pdf",
  "file_name": "a1b2c3d4.pdf",
  "user": 1,
  "user_name": "Juan Pérez",
  "lote": 5,
  "created_at": "2023-11-15T10:30:00Z",
  "updated_at": "2023-11-15T10:30:00Z",
  "file_size": 1548576,
  "mime_type": "application/pdf",
  "tags": ["plano", "medidas"],
  "metadata": {},
  "is_active": true
}
```

## Actualizar documentos

### Endpoint para actualización completa

```
PUT /api/documents/{id}/
Content-Type: multipart/form-data
```

Debes incluir todos los campos requeridos, incluso si no han cambiado.

### Endpoint para actualización parcial

```
PATCH /api/documents/{id}/
Content-Type: multipart/form-data
```

Sólo incluye los campos que deseas actualizar.

### Ejemplo de solicitud para actualización parcial

```bash
curl -X PATCH \
  -H "Authorization: Bearer {tu_token_jwt}" \
  -F "title=Plano actualizado" \
  -F "description=Versión actualizada del plano con correcciones" \
  "http://api.360lateral.com/api/documents/1/"
```

### Respuesta exitosa (código 200 OK)

```json
{
  "id": 1,
  "title": "Plano actualizado",
  "description": "Versión actualizada del plano con correcciones",
  ...
}
```

## Eliminar documentos

### Endpoint para eliminar un documento

```
DELETE /api/documents/{id}/
```

Esta acción es permanente y no se puede deshacer.

### Ejemplo de solicitud

```bash
curl -X DELETE \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/documents/1/"
```

### Respuesta exitosa (código 204 No Content)

La solicitud exitosa no devuelve contenido.

## Archivar documentos

Como alternativa a la eliminación, puedes archivar documentos (soft delete).

### Endpoint para archivar

```
POST /api/documents/{id}/archive/
```

### Ejemplo de solicitud

```bash
curl -X POST \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/documents/1/archive/"
```

### Respuesta exitosa (código 200 OK)

```json
{
  "message": "Documento archivado correctamente"
}
```

## Descargar documentos

### Endpoint para obtener la URL de descarga

```
GET /api/documents/{id}/download/
```

### Ejemplo de solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/documents/1/download/"
```

### Respuesta exitosa (código 200 OK)

```json
{
  "download_url": "http://api.360lateral.com/media/documents/2023/11/15/a1b2c3d4.pdf",
  "file_name": "a1b2c3d4.pdf",
  "file_size": 1548576,
  "mime_type": "application/pdf"
}
```

## Filtrar documentos

### Listar documentos del usuario actual

```
GET /api/documents/user/
```

### Ejemplo de solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/documents/user/"
```

## Gestión de documentos por lote

### Listar documentos de un lote específico

```
GET /api/documents/lote/{lote_id}/
```

### Ejemplo de solicitud

```bash
curl -X GET \
  -H "Authorization: Bearer {tu_token_jwt}" \
  "http://api.360lateral.com/api/documents/lote/5/"
```

## Problemas comunes y soluciones

### El archivo es demasiado grande

**Problema**: Error 413 Request Entity Too Large

**Solución**: Reduce el tamaño del archivo a menos de 50MB o comprime el archivo.

### Formato de archivo no compatible

**Problema**: Error 400 Bad Request con mensaje sobre extensión no permitida

**Solución**: Verifica que estás usando una de las extensiones permitidas (.pdf, .doc, .jpg, etc.).

### No puedes acceder a un documento

**Problema**: Error 403 Forbidden o 404 Not Found

**Solución**: Verifica que el documento te pertenece o que tienes los permisos necesarios.

### Error al subir desde dispositivos móviles

**Problema**: La subida desde móviles falla

**Solución**: Asegúrate de que la conexión es estable y que estás usando la última versión de la aplicación.

---

Para cualquier problema adicional, contacta al soporte técnico en: soporte@360lateral.com