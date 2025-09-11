# Documentación de Endpoints - Módulo Documents

## Resumen General
El módulo `documents` gestiona la subida, almacenamiento, validación y descarga de documentos en el sistema Lateral 360°. Permite a los usuarios subir archivos relacionados con sus lotes y a los administradores validar estos documentos.

## Endpoints Principales

### 1. Gestión de Documentos (CRUD)

#### `GET /api/documents/documents/`
- **Descripción**: Listar documentos del usuario o todos (si es admin)
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `document_type`: Filtrar por tipo de documento
  - `lote`: Filtrar por ID de lote
  - `ordering`: Ordenamiento (default: -created_at)
  - `limit`, `offset`: Paginación
- **Respuesta**:
```json
{
  "count": 25,
  "next": "http://api/documents/documents/?limit=20&offset=20",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Plano arquitectónico principal",
      "description": "Plano detallado del proyecto",
      "document_type": "plano",
      "file": "/media/documents/2024/01/15/abc123.pdf",
      "file_url": "http://domain.com/media/documents/2024/01/15/abc123.pdf",
      "file_name": "plano_principal.pdf",
      "user": 5,
      "user_name": "Juan Pérez",
      "lote": 10,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "file_size": 2048576,
      "mime_type": "application/pdf",
      "tags": ["principal", "arquitectura"],
      "metadata": {
        "validation_status": "pendiente"
      },
      "is_active": true
    }
  ]
}
```

#### `POST /api/documents/documents/`
- **Descripción**: Crear un nuevo documento
- **Permisos**: Usuario autenticado
- **Content-Type**: `multipart/form-data`
- **Body**:
```json
{
  "title": "Título del documento",
  "description": "Descripción opcional",
  "file": "archivo.pdf",
  "document_type": "general|plano|contrato|licencia|factura|otro",
  "lote": 10,
  "tags": ["tag1", "tag2"],
  "metadata": {"campo_extra": "valor"}
}
```
- **Respuesta**: Objeto documento creado (201)

#### `GET /api/documents/documents/{id}/`
- **Descripción**: Obtener detalles de un documento específico
- **Permisos**: Propietario del documento o Admin
- **Respuesta**: Objeto documento completo

#### `PUT/PATCH /api/documents/documents/{id}/`
- **Descripción**: Actualizar un documento
- **Permisos**: Propietario del documento o Admin
- **Body**: Campos a actualizar

#### `DELETE /api/documents/documents/{id}/`
- **Descripción**: Eliminar un documento
- **Permisos**: Propietario del documento o Admin
- **Respuesta**: 204 No Content

### 2. Acciones Específicas de Documentos

#### `POST /api/documents/documents/upload/`
- **Descripción**: Endpoint específico para subir documentos (alias más intuitivo)
- **Permisos**: Usuario autenticado
- **Body**: Igual que POST /documents/
- **Respuesta**: Documento creado con detalles completos

#### `GET /api/documents/documents/{id}/download/`
- **Descripción**: Obtener información de descarga de un documento
- **Permisos**: Propietario del documento o Admin
- **Respuesta**:
```json
{
  "download_url": "http://domain.com/media/documents/2024/01/15/abc123.pdf",
  "file_name": "documento_original.pdf",
  "file_size": 2048576,
  "mime_type": "application/pdf"
}
```

#### `POST /api/documents/documents/{id}/archive/`
- **Descripción**: Archivar un documento (marcar como inactivo)
- **Permisos**: Propietario del documento o Admin
- **Respuesta**:
```json
{
  "message": "Documento archivado correctamente"
}
```

#### `GET /api/documents/documents/types/`
- **Descripción**: Obtener tipos de documento disponibles
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
[
  {"value": "general", "label": "General"},
  {"value": "plano", "label": "Plano"},
  {"value": "contrato", "label": "Contrato"},
  {"value": "licencia", "label": "Licencia"},
  {"value": "factura", "label": "Factura"},
  {"value": "otro", "label": "Otro"}
]
```

### 3. Consultas por Usuario y Lote

#### `GET /api/documents/user/`
- **Descripción**: Obtener todos los documentos del usuario actual
- **Permisos**: Usuario autenticado
- **Respuesta**: Lista de documentos del usuario

#### `GET /api/documents/lote/{lote_id}/`
- **Descripción**: Obtener documentos asociados a un lote específico
- **Permisos**: Propietario del lote o Admin
- **Respuesta**: Lista de documentos del lote

### 4. Sistema de Validación de Documentos

#### `GET /api/documents/validation/summary/`
- **Descripción**: Obtener resumen de documentos por estado de validación
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "total": 150,
  "pendientes": 25,
  "validados": 100,
  "rechazados": 25
}
```

#### `GET /api/documents/validation/list/`
- **Descripción**: Listar documentos filtrados por estado de validación
- **Permisos**: Usuario autenticado
- **Parámetros de consulta**:
  - `status`: pendiente|validado|rechazado
  - `page`: Número de página
  - `page_size`: Tamaño de página
- **Respuesta**:
```json
{
  "results": [
    {
      "id": 1,
      "nombre": "Plano arquitectónico",
      "tipo": "plano",
      "estado": "pendiente",
      "fecha_subida": "2024-01-15T10:30:00Z",
      "solicitante": "Juan Pérez"
    }
  ],
  "total": 25,
  "page": 1,
  "page_size": 10,
  "total_pages": 3
}
```

#### `GET /api/documents/validation/{id}/`
- **Descripción**: Obtener detalles de validación de un documento
- **Permisos**: Usuario autenticado
- **Respuesta**:
```json
{
  "id": 1,
  "title": "Plano arquitectónico",
  "file": "/media/documents/...",
  "document_type": "plano",
  "tipo_documento": "plano",
  "created_at": "2024-01-15T10:30:00Z",
  "estado_validacion": "pendiente",
  "validacion_fecha": null,
  "validacion_comentarios": null,
  "lote": 10,
  "lote_nombre": "Lote 10",
  "user": 5,
  "solicitante_nombre": "Juan Pérez",
  "metadata": {
    "validation_status": "pendiente"
  }
}
```

#### `PUT/PATCH /api/documents/validation/{id}/`
- **Descripción**: Actualizar información de validación de un documento
- **Permisos**: Usuario autenticado
- **Body**: Campos de validación a actualizar

#### `DELETE /api/documents/validation/{id}/`
- **Descripción**: Eliminar un documento desde el panel de validación
- **Permisos**: Usuario autenticado
- **Respuesta**: 204 No Content con mensaje de confirmación

#### `POST /api/documents/validation/{document_id}/action/`
- **Descripción**: Realizar acción de validación en un documento
- **Permisos**: Usuario autenticado (típicamente admin)
- **Body**:
```json
{
  "action": "validar|rechazar",
  "comments": "Comentarios opcionales sobre la validación"
}
```
- **Respuesta**:
```json
{
  "detail": "Documento validado correctamente",
  "document": {
    // Objeto documento actualizado
  }
}
```

## Tipos de Documentos Soportados

| Tipo | Descripción | Extensiones Típicas |
|------|-------------|-------------------|
| `general` | Documentos generales | PDF, DOC, DOCX |
| `plano` | Planos arquitectónicos | PDF, DWG, DXF |
| `contrato` | Contratos y acuerdos | PDF, DOC, DOCX |
| `licencia` | Licencias y permisos | PDF, JPG, PNG |
| `factura` | Facturas y comprobantes | PDF, XLS, XLSX |
| `otro` | Otros tipos de documento | Cualquier formato soportado |

## Formatos de Archivo Soportados

### Documentos
- **PDF**: .pdf
- **Word**: .doc, .docx
- **Excel**: .xls, .xlsx
- **Texto**: .txt

### Imágenes
- **JPEG**: .jpg, .jpeg
- **PNG**: .png

### CAD
- **AutoCAD**: .dwg, .dxf

### Comprimidos
- **ZIP**: .zip
- **RAR**: .rar
- **7Z**: .7z

## Restricciones y Validaciones

### Tamaño de Archivo
- **Máximo**: 50 MB por archivo
- **Validación**: Se valida al subir el archivo

### Nombre de Archivo
- **Máximo**: 100 caracteres
- **Caracteres prohibidos**: `/ \ : * ? " < > |`

### Validaciones de Seguridad
- Verificación de extensión de archivo
- Validación de tipo MIME
- Escaneo básico de contenido malicioso

## Estados de Validación

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `pendiente` | Documento recién subido, esperando validación | Validar, Rechazar |
| `validado` | Documento aprobado por administrador | Ver, Descargar |
| `rechazado` | Documento rechazado con comentarios | Ver comentarios, Re-subir |

## Características Técnicas

### Almacenamiento
- **Estructura**: `/media/documents/YYYY/MM/DD/uuid.ext`
- **Backup**: Archivos se mantienen físicamente aunque se marquen como inactivos
- **Cleanup**: Tarea periódica para eliminar archivos huérfanos

### Metadata
- **Campo JSON**: Almacena información de validación y metadatos personalizados
- **Validación**: `validation_status`, `validation_date`, `validation_comments`
- **Extensible**: Permite campos adicionales según necesidades

### Permisos
- **Propietarios**: CRUD completo en sus documentos
- **Administradores**: CRUD en todos los documentos + validación
- **Filtrado automático**: Usuarios ven solo sus documentos

### Performance
- **Lazy loading**: Archivos se cargan solo cuando se necesitan
- **Caching**: URLs de descarga se cachean por 10 minutos
- **Optimización**: Consultas optimizadas con select_related

## Códigos de Estado HTTP

- **200 OK**: Consulta exitosa
- **201 Created**: Documento creado exitosamente
- **204 No Content**: Eliminación exitosa
- **400 Bad Request**: Datos inválidos (archivo muy grande, tipo no soportado)
- **401 Unauthorized**: Usuario no autenticado
- **403 Forbidden**: Sin permisos para acceder al documento
- **404 Not Found**: Documento no encontrado
- **413 Payload Too Large**: Archivo excede límite de tamaño
- **415 Unsupported Media Type**: Tipo de archivo no soportado

## Ejemplos de Uso

### Subir un documento
```javascript
const formData = new FormData();
formData.append('title', 'Mi documento');
formData.append('file', fileInput.files[0]);
formData.append('document_type', 'plano');
formData.append('lote', '10');

fetch('/api/documents/documents/upload/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
})
```

### Validar un documento
```javascript
fetch('/api/documents/validation/123/action/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'validar',
    comments: 'Documento aprobado correctamente'
  })
})
```

### Obtener documentos por tipo
```javascript
const documents = await fetch('/api/documents/documents/?document_type=plano')
  .then(res => res.json())
```

### Filtrar documentos pendientes
```javascript
const pending = await fetch('/api/documents/validation/list/?status=pendiente&page=1&page_size=10')
  .then(res => res.json())
```

## Integración con Frontend

### Upload Component
```javascript
// Ejemplo de componente React para subida
const DocumentUpload = ({ loteId }) => {
  const handleUpload = async (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    formData.append('document_type', metadata.type);
    formData.append('lote', loteId);
    
    const response = await fetch('/api/documents/documents/upload/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    return response.json();
  };
};
```

### Validation Dashboard
```javascript
// Panel de validación para administradores
const ValidationDashboard = () => {
  const [summary, setSummary] = useState({});
  const [documents, setDocuments] = useState([]);
  
  useEffect(() => {
    // Cargar resumen
    fetch('/api/documents/validation/summary/')
      .then(res => res.json())
      .then(setSummary);
      
    // Cargar documentos pendientes
    fetch('/api/documents/validation/list/?status=pendiente')
      .then(res => res.json())
      .then(data => setDocuments(data.results));
  }, []);
};
```