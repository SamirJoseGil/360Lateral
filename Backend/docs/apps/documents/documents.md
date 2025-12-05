# Módulo de Documentos (Documents)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [URLs](#urls)
- [Permisos y Validaciones](#permisos-y-validaciones)
- [Validación de Documentos](#validación-de-documentos)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Documentos** gestiona la carga, almacenamiento, validación y descarga de documentos relacionados con lotes en el sistema Lateral 360°.

### Características Principales

- 📤 **Carga de Archivos**: Soporte para múltiples tipos de documentos (PDF, imágenes, planos, etc.)
- 🔍 **Validación Automática**: Sistema de validación de documentos por administradores
- 📁 **Organización por Tipo**: Documentos clasificados según categoría (CTL, planos, escrituras, etc.)
- 🏠 **Asociación con Lotes**: Cada documento puede estar vinculado a un lote específico
- 💾 **Almacenamiento Seguro**: Archivos organizados por fecha y tipo en el servidor
- ✅ **Estados de Validación**: Pendiente, Validado, Rechazado
- 📊 **Gestión Agrupada**: Vista de documentos agrupados por lote para administradores

---

## Modelos

### `Document`

Modelo principal para gestión de documentos.

**Ubicación**: apps/documents/models.py

#### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| title | CharField | Título del documento (opcional, se genera automáticamente) |
| description | TextField | Descripción detallada |
| file | FileField | Archivo del documento (máx 10MB) |
| document_type | CharField | Tipo: ctl, planos, escritura_publica, etc. |
| user | FK(User) | Usuario que subió el documento |
| lote | FK(Lote) | Lote asociado (opcional) |
| file_size | PositiveIntegerField | Tamaño en bytes |
| mime_type | CharField | Tipo MIME del archivo |
| tags | JSONField | Etiquetas para búsqueda |
| metadata | JSONField | Metadatos adicionales (incluye validation_status) |
| is_active | BooleanField | Si el documento está activo |
| validated_at | DateTimeField | Fecha de validación |
| validated_by | FK(User) | Usuario que validó |
| created_at | DateTimeField | Fecha de creación |
| updated_at | DateTimeField | Última actualización |

#### Tipos de Documento Disponibles

- ctl: Certificado de Tradición y Libertad
- planos: Planos Arquitectónicos
- topografia: Levantamiento Topográfico
- licencia_construccion: Licencia de Construcción
- escritura_publica: Escritura Pública
- certificado_libertad: Certificado de Libertad
- avaluo_comercial: Avalúo Comercial
- estudio_suelos: Estudio de Suelos
- otros: Otros Documentos

#### Estados de Validación

- pendiente: Pendiente de Validación
- validado: Validado por administrador
- rechazado: Rechazado con motivo

#### Métodos Importantes

Validar documento:

    document.validate_document(
        validated_by=admin_user,
        comments='Documento correcto'
    )

Rechazar documento:

    document.reject_document(
        reason='Falta información',
        rejected_by=admin_user
    )

Archivar documento (soft delete):

    document.soft_delete()

Reactivar documento archivado:

    document.reactivate()

Propiedades útiles:

    document.validation_status  # 'pendiente', 'validado', 'rechazado'
    document.is_validated  # Boolean
    document.is_rejected  # Boolean
    document.is_pending  # Boolean
    document.file_extension  # '.pdf', '.jpg', etc.
    document.get_size_display()  # '2.5 MB'

#### Generación Automática de Título

Si no se proporciona un título, se genera automáticamente:

Sin lote:

    "Certificado de Tradición y Libertad - 2024-01-15"

Con lote:

    "Certificado de Tradición y Libertad - Lote Centro"

---

## Serializers

### `DocumentSerializer`

Serializer completo para lectura de documentos.

**Ubicación**: apps/documents/serializers.py

#### Campos Incluidos

- Campos básicos: id, title, description, document_type
- Archivo: file, file_url, file_name, download_url
- Relaciones: user, user_name, lote, lote_info
- Metadatos: file_size, size_display, mime_type, tags, metadata
- Validación: validation_status, validation_status_display, is_validated, is_rejected, is_pending, rejection_reason
- Auditoría: created_at, updated_at, validated_at, validated_by

#### Ejemplo de Respuesta

    {
      "id": "uuid",
      "title": "CTL - Lote Centro",
      "description": "Certificado actualizado",
      "document_type": "ctl",
      "file_url": "http://localhost:8000/media/documents/ctl/2024/01/15/abc123.pdf",
      "file_name": "abc123.pdf",
      "user": "user-uuid",
      "user_name": "Juan Pérez",
      "lote": "lote-uuid",
      "lote_info": {
        "id": "lote-uuid",
        "nombre": "Lote Centro",
        "direccion": "Calle 50 #50-50"
      },
      "file_size": 2621440,
      "size_display": "2.50 MB",
      "mime_type": "application/pdf",
      "validation_status": "validado",
      "validation_status_display": "Validado",
      "is_validated": true,
      "validated_at": "2024-01-15T15:00:00Z",
      "created_at": "2024-01-15T10:00:00Z"
    }

---

### `DocumentUploadSerializer`

Serializer para subir documentos.

**Ubicación**: apps/documents/serializers.py

#### Campos Requeridos

- file: Archivo (requerido)
- document_type: Tipo de documento (requerido)

#### Campos Opcionales

- title: Título (se genera automáticamente si no se proporciona)
- description: Descripción
- lote: UUID del lote
- tags: Lista de etiquetas

#### Validaciones Automáticas

Tamaño máximo: 10MB por defecto

Extensiones permitidas: .pdf (configurable en settings)

MIME type verificado

#### Ejemplo de Request

Usando FormData en JavaScript:

    const formData = new FormData();
    formData.append('file', fileObject);
    formData.append('document_type', 'ctl');
    formData.append('lote', 'lote-uuid');
    formData.append('description', 'Certificado actualizado');

---

### `DocumentValidationSerializer`

Serializer para validación de documentos (administradores).

**Ubicación**: apps/documents/serializers.py

#### Campos Incluidos

Información completa del documento más campos de validación específicos.

---

### `DocumentValidateActionSerializer`

Serializer para acciones de validación/rechazo.

**Ubicación**: apps/documents/serializers.py

#### Campos

- action: 'validar' o 'rechazar' (requerido)
- comments: Comentarios (requerido para rechazo)

#### Ejemplo de Request

Validar:

    {
      "action": "validar",
      "comments": "Documento correcto"
    }

Rechazar:

    {
      "action": "rechazar",
      "comments": "Falta firma del propietario"
    }

---

## Vistas (Views)

### `DocumentViewSet`

ViewSet principal para operaciones CRUD.

**Ubicación**: apps/documents/views.py

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/documents/documents/ | Listar documentos | Authenticated |
| POST | /api/documents/documents/ | Subir documento | Authenticated |
| GET | /api/documents/documents/{id}/ | Detalle de documento | Owner o Admin |
| PATCH | /api/documents/documents/{id}/ | Actualizar documento | Owner o Admin |
| DELETE | /api/documents/documents/{id}/ | Archivar documento | Owner o Admin |
| POST | /api/documents/documents/upload/ | Endpoint específico de carga | Authenticated |
| GET | /api/documents/documents/{id}/download/ | URL de descarga | Owner o Admin |
| POST | /api/documents/documents/{id}/archive/ | Archivar manualmente | Owner o Admin |
| POST | /api/documents/documents/{id}/restore/ | Restaurar archivado | Owner o Admin |
| GET | /api/documents/documents/types/ | Tipos disponibles | Authenticated |

---

#### GET /api/documents/documents/ - Listar Documentos

**Permisos**: Authenticated

**Query Params**:
- document_type: Filtrar por tipo
- lote: Filtrar por UUID de lote
- validation_status: Filtrar por estado de validación
- ordering: Ordenar (-created_at por defecto)

**Filtrado Automático**:
- Usuarios normales: Solo ven sus propios documentos
- Administradores: Ven todos los documentos

**Ejemplo Request**:

    GET /api/documents/documents/?document_type=ctl&ordering=-created_at

**Ejemplo Response**:

    {
      "count": 15,
      "next": null,
      "previous": null,
      "results": [
        {
          "id": "uuid",
          "title": "CTL - Lote Centro",
          "document_type": "ctl",
          "file_url": "http://localhost:8000/media/...",
          "validation_status": "validado",
          ...
        }
      ]
    }

---

#### POST /api/documents/documents/ - Subir Documento

**Permisos**: Authenticated

**Content-Type**: multipart/form-data

**Request Body (FormData)**:
- file: Archivo (requerido)
- document_type: Tipo (requerido)
- title: Título (opcional)
- description: Descripción (opcional)
- lote: UUID del lote (opcional)

**Ejemplo con curl**:

    curl -X POST http://localhost:8000/api/documents/documents/ \
      -H "Authorization: Bearer {token}" \
      -F "file=@document.pdf" \
      -F "document_type=ctl" \
      -F "lote=lote-uuid"

**Response Success (201)**:

    {
      "id": "nuevo-uuid",
      "title": "CTL - Lote Centro",
      "file_url": "http://localhost:8000/media/...",
      "validation_status": "pendiente",
      ...
    }

**Response Error (400)**:

    {
      "file": ["El archivo es demasiado grande. Máximo: 10MB"]
    }

---

#### GET /api/documents/documents/{id}/download/ - Obtener URL de Descarga

**Permisos**: Owner o Admin

**Response**:

    {
      "success": true,
      "download_url": "http://localhost:8000/media/documents/...",
      "file_name": "documento.pdf",
      "file_size": 2621440,
      "mime_type": "application/pdf"
    }

---

### Vistas de Validación (Administradores)

#### `DocumentValidationSummaryView`

Obtener resumen de documentos por estado.

**Endpoint**: GET /api/documents/validation/summary/

**Permisos**: Authenticated

**Response**:

    {
      "total": 50,
      "pendientes": 15,
      "validados": 30,
      "rechazados": 5
    }

---

#### `DocumentValidationListView`

Listar documentos con filtro de validación.

**Endpoint**: GET /api/documents/validation/list/

**Permisos**: Authenticated

**Query Params**:
- status: Filtrar por estado (pendiente, validado, rechazado)
- page: Número de página
- page_size: Tamaño de página (default: 10)

**Response**:

    {
      "results": [...],
      "total": 15,
      "page": 1,
      "page_size": 10,
      "total_pages": 2
    }

---

#### `DocumentValidationGroupedView`

Obtener documentos agrupados por lote (administradores).

**Endpoint**: GET /api/documents/validation/grouped/

**Permisos**: Admin

**Query Params**:
- status: Filtrar por estado
- page: Número de página
- page_size: Tamaño de página

**Response**:

    {
      "lotes": [
        {
          "lote_id": "uuid",
          "lote_nombre": "Lote Centro",
          "lote_direccion": "Calle 50 #50-50",
          "lote_status": "active",
          "documentos": [...],
          "total_documentos": 5,
          "pendientes": 2,
          "validados": 2,
          "rechazados": 1
        }
      ],
      "total": 10,
      "page": 1,
      "total_pages": 1
    }

---

#### `DocumentValidateActionView`

Validar o rechazar un documento.

**Endpoint**: POST /api/documents/validation/{document_id}/action/

**Permisos**: Admin

**Request Body (Validar)**:

    {
      "action": "validar",
      "comments": "Documento correcto y completo"
    }

**Request Body (Rechazar)**:

    {
      "action": "rechazar",
      "comments": "Falta firma del notario"
    }

**Response Success**:

    {
      "success": true,
      "message": "Documento validado correctamente",
      "document": {...}
    }

**Prevención de Duplicados**:
- No permite validar un documento ya validado
- No permite rechazar un documento ya rechazado
- Usa transacciones atómicas

---

### Vistas Auxiliares

#### `user_documents`

Obtener documentos del usuario actual.

**Endpoint**: GET /api/documents/user/

**Permisos**: Authenticated

---

#### `lote_documents`

Obtener documentos de un lote específico.

**Endpoint**: GET /api/documents/lote/{lote_id}/

**Permisos**: Owner del lote o Admin

**Response**:

    [
      {
        "id": "uuid",
        "title": "CTL - Lote Centro",
        "document_type": "ctl",
        ...
      }
    ]

---

## Servicios (Services)

### `DocumentValidationService`

Servicio para gestión de validación de documentos.

**Ubicación**: apps/documents/services.py

#### Métodos Principales

##### get_documents_by_status(status, page, page_size)

Obtener documentos filtrados por estado.

Parámetros:
- status: 'pendiente', 'validado', 'rechazado' o None
- page: Número de página
- page_size: Tamaño de página

Retorna: Tupla (documentos, total)

---

##### validate_document(document_id, status, comments, validated_by)

Validar o rechazar un documento.

Parámetros:
- document_id: UUID del documento
- status: 'validado' o 'rechazado'
- comments: Comentarios (opcional para validado, requerido para rechazado)
- validated_by: Usuario que valida

Retorna: Tupla (documento, éxito, mensaje)

Ejemplo:

    document, success, message = DocumentValidationService.validate_document(
        document_id='uuid',
        status='validado',
        comments='Documento correcto',
        validated_by=admin_user
    )

---

##### get_validation_summary()

Obtener resumen de documentos por estado.

Retorna:

    {
        'total': 50,
        'pendientes': 15,
        'validados': 30,
        'rechazados': 5
    }

---

##### get_documents_grouped_by_lote(status, page, page_size)

Obtener documentos agrupados por lote.

Retorna estructura con lotes y sus documentos ordenados por fecha.

---

## URLs

**Ubicación**: apps/documents/urls.py

Estructura de URLs:

    /api/documents/
    ├── documents/              # DocumentViewSet
    │   ├── GET, POST          # Listar y crear
    │   ├── {id}/
    │   │   ├── GET            # Detalle
    │   │   ├── PATCH          # Actualizar
    │   │   ├── DELETE         # Archivar
    │   │   ├── download/      # URL de descarga
    │   │   ├── archive/       # Archivar manual
    │   │   └── restore/       # Restaurar
    │   ├── upload/            # Endpoint específico de carga
    │   └── types/             # Tipos disponibles
    ├── user/                  # Documentos del usuario
    ├── lote/{lote_id}/        # Documentos de un lote
    └── validation/            # Vistas de validación
        ├── summary/           # Resumen
        ├── list/              # Lista filtrada
        ├── grouped/           # Agrupados por lote
        ├── {pk}/              # Detalle
        └── {document_id}/action/  # Validar/rechazar

---

## Permisos y Validaciones

### Permisos por Rol

| Acción | Owner | Developer | Admin |
|--------|-------|-----------|-------|
| Subir documento | ✅ Solo sus lotes | ✅ Cualquier lote | ✅ Todos |
| Ver documento | ✅ Solo suyos | ✅ Solo suyos | ✅ Todos |
| Editar documento | ✅ Solo suyos | ✅ Solo suyos | ✅ Todos |
| Eliminar documento | ✅ Solo suyos | ✅ Solo suyos | ✅ Todos |
| Validar documento | ❌ | ❌ | ✅ |
| Rechazar documento | ❌ | ❌ | ✅ |
| Ver validación agrupada | ❌ | ❌ | ✅ |

### Validaciones de Archivo

#### Tamaño Máximo

Default: 10MB (configurable en settings.FILE_UPLOAD_MAX_MEMORY_SIZE)

#### Extensiones Permitidas

Default: .pdf (configurable en settings.ALLOWED_DOCUMENT_EXTENSIONS)

Ejemplos de extensiones:
- .pdf
- .doc, .docx
- .jpg, .jpeg, .png
- .dwg, .dxf (planos)
- .xlsx, .xls
- .zip, .rar

#### MIME Type

Se verifica y almacena automáticamente.

---

## Validación de Documentos

### Estados de Validación

#### Pendiente

Estado inicial cuando se sube un documento.

Color en admin: Amarillo

#### Validado

Documento aprobado por administrador.

Color en admin: Verde

Campos adicionales:
- validated_at: Fecha de validación
- validated_by: Usuario que validó
- metadata.validation_comments: Comentarios

#### Rechazado

Documento rechazado con motivo.

Color en admin: Rojo

Campos adicionales:
- metadata.rejection_reason: Motivo del rechazo
- metadata.rejected_by: Usuario que rechazó

### Flujo de Validación

1. Usuario sube documento → Estado: pendiente
2. Admin ve documento en lista de validación
3. Admin puede:
   - Validar: Cambia a validado + comentarios opcionales
   - Rechazar: Cambia a rechazado + motivo obligatorio
4. Usuario es notificado del resultado

### Prevención de Duplicados

El sistema usa transacciones atómicas y select_for_update para evitar validaciones duplicadas concurrentes.

---

## Ejemplos de Uso

### 1. Subir Documento (Frontend)

Con FormData en JavaScript:

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('document_type', 'ctl');
    formData.append('lote', loteId);
    formData.append('description', 'CTL actualizado');
    
    fetch('http://localhost:8000/api/documents/documents/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    })
    .then(response => response.json())
    .then(data => console.log('Documento subido:', data));

---

### 2. Listar Documentos de un Lote

    GET /api/documents/lote/{lote_id}/
    Authorization: Bearer {token}

Respuesta:

    [
      {
        "id": "uuid",
        "title": "CTL - Lote Centro",
        "document_type": "ctl",
        "file_url": "http://localhost:8000/media/...",
        "validation_status": "validado",
        "size_display": "2.5 MB"
      }
    ]

---

### 3. Validar Documento (Admin)

    POST /api/documents/validation/{document_id}/action/
    Authorization: Bearer {admin_token}
    Content-Type: application/json
    
    {
      "action": "validar",
      "comments": "Documento completo y correcto"
    }

---

### 4. Obtener Resumen de Validación

    GET /api/documents/validation/summary/
    Authorization: Bearer {token}

Respuesta:

    {
      "total": 50,
      "pendientes": 15,
      "validados": 30,
      "rechazados": 5
    }

---

### 5. Ver Documentos Agrupados por Lote (Admin)

    GET /api/documents/validation/grouped/?page=1&page_size=10
    Authorization: Bearer {admin_token}

Respuesta:

    {
      "lotes": [
        {
          "lote_id": "uuid",
          "lote_nombre": "Lote Centro",
          "documentos": [
            {
              "id": "doc-uuid",
              "title": "CTL",
              "validation_status": "pendiente"
            }
          ],
          "total_documentos": 5,
          "pendientes": 2
        }
      ],
      "total": 10,
      "page": 1
    }

---

### 6. Descargar Documento

    GET /api/documents/documents/{document_id}/download/
    Authorization: Bearer {token}

Respuesta:

    {
      "success": true,
      "download_url": "http://localhost:8000/media/documents/.../file.pdf",
      "file_name": "document.pdf",
      "file_size": 2621440
    }

Luego usar la download_url para descargar el archivo.

---

## Configuración en Settings

### Archivos

    # Tamaño máximo de archivo (10MB)
    FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
    
    # Extensiones permitidas
    ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']
    
    # Tipos MIME permitidos (opcional)
    ALLOWED_DOCUMENT_TYPES = ['application/pdf']

### Media Files

    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

---

## Estructura de Carpetas

Documentos se organizan automáticamente:

    media/
    └── documents/
        ├── ctl/
        │   └── 2024/
        │       └── 01/
        │           └── 15/
        │               └── {uuid}.pdf
        ├── planos/
        │   └── 2024/...
        └── otros/
            └── 2024/...

---

## Admin de Django

El admin incluye:

- Vista mejorada con badges de estado
- Filtros por tipo y estado de validación
- Búsqueda por título, usuario y lote
- Preview de imágenes
- Links a usuario y lote relacionados
- Información de tamaño legible

---

## Validadores Personalizados

**Ubicación**: apps/documents/validators.py

### validate_file_extension(value)

Valida extensión del archivo.

### validate_file_size(value)

Valida tamaño máximo (50MB).

### validate_file_name(value)

Valida longitud y caracteres del nombre.

---

## Utilidades

### build_external_file_url(file_field, request)

**Ubicación**: apps/documents/utils.py

Construye URL externa accesible desde el navegador.

Maneja correctamente Docker vs desarrollo local.

---

## Troubleshooting

### Problema: "El archivo es demasiado grande"

**Causa**: Archivo excede FILE_UPLOAD_MAX_MEMORY_SIZE.

**Solución**: Reducir tamaño del archivo o aumentar límite en settings.

---

### Problema: "Extensión no permitida"

**Causa**: Tipo de archivo no está en ALLOWED_DOCUMENT_EXTENSIONS.

**Solución**: Agregar extensión a la configuración o convertir archivo.

---

### Problema: URL de descarga no funciona

**Causa**: MEDIA_URL no configurado correctamente.

**Solución**: Verificar configuración de MEDIA_URL y MEDIA_ROOT en settings y urls.py.

---

## Próximas Mejoras

- [ ] Soporte para almacenamiento en S3
- [ ] Generación de thumbnails para imágenes
- [ ] Versionado de documentos
- [ ] OCR para extraer texto de PDFs
- [ ] Firma digital de documentos
- [ ] Compresión automática de archivos grandes

---

**Última actualización**: 2024-01-15
