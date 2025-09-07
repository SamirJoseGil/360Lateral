# Lateral 360° API Endpoints Summary

Este documento proporciona un resumen completo de todos los endpoints disponibles en la API de Lateral 360°.

## Tabla de Contenidos
- [Autenticación](#autenticación)
- [Usuarios](#usuarios)
- [Lotes](#lotes)
- [POT (Plan de Ordenamiento Territorial)](#pot-plan-de-ordenamiento-territorial)
- [Documentos](#documentos)
- [Estadísticas](#estadísticas)
- [Health Check](#health-check)
- [Common](#common)

## Autenticación
**Base URL**: `/api/auth/`

Endpoints para registro, autenticación y gestión de sesiones de usuarios.

### Gestión de Cuentas
- **`POST /api/auth/register/`** - Registro de nuevos usuarios
  - **Requiere**: `email`, `username`, `password`, `password_confirm`
  - **Opcional**: `first_name`, `last_name`, `phone_number`
  - **Devuelve**: Detalles del usuario creado y token JWT
  - **Códigos**: `201 Created`, `400 Bad Request`

- **`POST /api/auth/login/`** - Iniciar sesión
  - **Requiere**: `username` (o `email`) y `password`
  - **Devuelve**: Token JWT (`access` y `refresh`) y datos básicos del usuario
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`POST /api/auth/logout/`** - Cerrar sesión
  - **Requiere**: Token JWT válido en el encabezado `Authorization`
  - **Devuelve**: Mensaje de confirmación
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`POST /api/auth/token/refresh/`** - Refrescar token JWT
  - **Requiere**: Token `refresh` válido
  - **Devuelve**: Nuevo token `access`
  - **Códigos**: `200 OK`, `401 Unauthorized`

### Gestión de Contraseñas
- **`POST /api/auth/change-password/`** - Cambiar contraseña
  - **Requiere**: `old_password`, `new_password`, `new_password_confirm` y autenticación
  - **Devuelve**: Mensaje de éxito
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`

- **`POST /api/auth/password-reset/`** - Solicitar restablecimiento de contraseña
  - **Requiere**: `email`
  - **Devuelve**: Confirmación de envío de correo
  - **Códigos**: `200 OK`, `400 Bad Request`

- **`POST /api/auth/password-reset/confirm/`** - Confirmar restablecimiento de contraseña
  - **Requiere**: `token`, `uid`, `new_password`, `new_password_confirm`
  - **Devuelve**: Confirmación de cambio
  - **Códigos**: `200 OK`, `400 Bad Request`

### Seguridad
- **`GET /api/auth/csrf/`** - Obtener token CSRF
  - **Requiere**: Nada
  - **Devuelve**: Token CSRF para formularios
  - **Códigos**: `200 OK`

## Usuarios
**Base URL**: `/api/users/`

Endpoints para la gestión de usuarios y perfiles.

### Gestión de Usuarios
- **`GET /api/users/`** - Listar todos los usuarios
  - **Requiere**: Autenticación con permisos de administrador
  - **Parámetros**: Opcionalmente `page`, `page_size` para paginación
  - **Devuelve**: Lista paginada de usuarios con datos básicos
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`POST /api/users/`** - Crear un nuevo usuario
  - **Requiere**: Autenticación con permisos de administrador
  - **Datos**: `email`, `username`, `password`, `role`
  - **Opcional**: `first_name`, `last_name`, `phone_number`, `is_active`, `profile_data`
  - **Devuelve**: Datos del usuario creado
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/users/<id>/`** - Ver detalles de un usuario específico
  - **Requiere**: Autenticación (propietario del perfil o administrador)
  - **Devuelve**: Datos completos del usuario incluyendo perfil
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`GET /api/users/me/`** - Obtener información del usuario actual
  - **Requiere**: Autenticación
  - **Devuelve**: Datos completos del usuario autenticado incluyendo perfil y permisos
  - **Códigos**: `200 OK`, `401 Unauthorized`

### Solicitudes de Usuario
- **`GET /api/users/requests/`** - Listar todas las solicitudes de usuario
  - **Requiere**: Autenticación con permisos de administrador
  - **Parámetros**: `status`, `type`, `page`, `page_size` (opcionales)
  - **Devuelve**: Lista paginada de solicitudes
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`POST /api/users/requests/`** - Crear una nueva solicitud
  - **Requiere**: Autenticación (opcional dependiendo del tipo de solicitud)
  - **Datos**: `type`, `description`, `data` (JSON con los detalles específicos de la solicitud)
  - **Devuelve**: Datos de la solicitud creada incluyendo ID y estado
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized` (para ciertos tipos)

- **`GET /api/users/requests/<id>/`** - Ver detalles de una solicitud
  - **Requiere**: Autenticación (creador de la solicitud o administrador)
  - **Devuelve**: Datos completos de la solicitud incluyendo estado y comentarios
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`PUT /api/users/requests/<id>/`** - Actualizar una solicitud
  - **Requiere**: Autenticación (creador de la solicitud o administrador)
  - **Datos**: Todos los campos requeridos de la solicitud
  - **Devuelve**: Datos actualizados de la solicitud
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`PATCH /api/users/requests/<id>/`** - Actualizar parcialmente una solicitud
  - **Requiere**: Autenticación (creador de la solicitud o administrador)
  - **Datos**: Solo los campos que se quieren actualizar
  - **Devuelve**: Datos actualizados de la solicitud
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`DELETE /api/users/requests/<id>/`** - Eliminar una solicitud
  - **Requiere**: Autenticación (administrador o creador en algunos casos)
  - **Devuelve**: `204 No Content` sin cuerpo de respuesta
  - **Códigos**: `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## Lotes
**Base URL**: `/api/lotes/`

### Gestión de Lotes
- **`GET /api/lotes/`** - Listar todos los lotes
  - **Requiere**: Autenticación
  - **Parámetros**: `page`, `page_size`, `ordering`, `search` (opcionales)
  - **Devuelve**: Lista paginada de lotes con datos básicos
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`GET /api/lotes/<id>/`** - Detalles de un lote específico
  - **Requiere**: Autenticación (propietario o con permisos)
  - **Devuelve**: Datos completos del lote incluyendo coordenadas, área, restricciones
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`POST /api/lotes/create/`** - Crear un nuevo lote
  - **Requiere**: Autenticación
  - **Datos**: `nombre`, `direccion`, `ciudad`, `departamento`, `area`, `tipo` (opcional: `descripcion`, `coordenadas`, `matricula`, `cbml`, etc.)
  - **Devuelve**: Datos completos del lote creado con ID
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized`

- **`POST /api/lotes/create-from-mapgis/`** - Crear un lote desde MapGIS
  - **Requiere**: Autenticación
  - **Datos**: `cbml` o `matricula` (uno de los dos obligatorio)
  - **Devuelve**: Datos completos del lote creado con información obtenida de MapGIS
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found` (si no se encuentra en MapGIS)

- **`GET /api/lotes/search/`** - Buscar lotes
  - **Requiere**: Autenticación
  - **Parámetros**: `q` (query general), `cbml`, `matricula`, `direccion`, `ciudad`, etc.
  - **Devuelve**: Lista de lotes que coinciden con criterios de búsqueda
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`PUT /api/lotes/<id>/update/`** - Actualizar un lote
  - **Requiere**: Autenticación (propietario o admin)
  - **Datos**: Todos los campos del lote a actualizar
  - **Devuelve**: Datos actualizados del lote
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`DELETE /api/lotes/<id>/delete/`** - Eliminar un lote
  - **Requiere**: Autenticación (propietario o admin)
  - **Devuelve**: `204 No Content` sin cuerpo de respuesta
  - **Códigos**: `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Lotes por Usuario
- **`GET /api/lotes/mis-lotes/`** - Ver lotes del usuario actual
  - **Requiere**: Autenticación
  - **Parámetros**: `page`, `page_size`, `ordering` (opcionales)
  - **Devuelve**: Lista paginada de lotes asociados al usuario actual
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`GET /api/lotes/usuario/<user_id>/`** - Ver lotes de un usuario específico
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `page`, `page_size` (opcionales)
  - **Devuelve**: Lista paginada de lotes asociados al usuario especificado
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`GET /api/lotes/usuario/<user_id>/stats/`** - Estadísticas de lotes de un usuario
  - **Requiere**: Autenticación (propio usuario o admin)
  - **Devuelve**: Estadísticas generales: conteo total, área total, distribución por tipos, etc.
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### MapGIS
- **`POST /api/lotes/scrap/cbml/`** - Consultar lote por CBML
  - **Requiere**: Autenticación
  - **Datos**: `comuna`, `barrio`, `manzana`, `lote` (formato CBML)
  - **Devuelve**: Datos del lote obtenidos de MapGIS
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

- **`POST /api/lotes/scrap/matricula/`** - Consultar lote por matrícula
  - **Requiere**: Autenticación
  - **Datos**: `matricula` (número de matrícula inmobiliaria)
  - **Devuelve**: Datos del lote obtenidos de MapGIS
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

- **`POST /api/lotes/scrap/direccion/`** - Consultar lote por dirección
  - **Requiere**: Autenticación
  - **Datos**: `direccion` (dirección completa del predio)
  - **Devuelve**: Lista de posibles coincidencias con datos de MapGIS
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

- **`POST /api/lotes/consultar/restricciones/`** - Consultar restricciones completas
  - **Requiere**: Autenticación
  - **Datos**: `cbml` o `matricula` o `id_lote`
  - **Devuelve**: Restricciones urbanísticas, ambientales y legales del predio
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

- **`GET /api/lotes/health/mapgis/`** - Verificar estado de conexión con MapGIS
  - **Requiere**: Autenticación (admin para detalles completos)
  - **Devuelve**: Estado de la conexión y diagnósticos
  - **Códigos**: `200 OK`, `503 Service Unavailable`

### Endpoints Públicos MapGIS
- **`POST /api/lotes/public/cbml/`** - Consulta pública por CBML
  - **Requiere**: Nada (acceso público)
  - **Datos**: `comuna`, `barrio`, `manzana`, `lote` (formato CBML)
  - **Devuelve**: Datos básicos del lote obtenidos de MapGIS
  - **Códigos**: `200 OK`, `400 Bad Request`, `404 Not Found`

- **`POST /api/lotes/public/matricula/`** - Consulta pública por matrícula
  - **Requiere**: Nada (acceso público)
  - **Datos**: `matricula` (número de matrícula inmobiliaria)
  - **Devuelve**: Datos básicos del lote obtenidos de MapGIS
  - **Códigos**: `200 OK`, `400 Bad Request`, `404 Not Found`

- **`POST /api/lotes/public/direccion/`** - Consulta pública por dirección
  - **Requiere**: Nada (acceso público)
  - **Datos**: `direccion` (dirección completa del predio)
  - **Devuelve**: Lista de posibles coincidencias con datos básicos de MapGIS
  - **Códigos**: `200 OK`, `400 Bad Request`, `404 Not Found`

### Tratamientos Urbanísticos
- **`GET /api/lotes/tratamientos/`** - Listar todos los tratamientos
  - **Requiere**: Autenticación
  - **Devuelve**: Lista de tratamientos urbanísticos disponibles
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`GET /api/lotes/tratamientos/por-cbml/`** - Obtener tratamiento por CBML
  - **Requiere**: Autenticación
  - **Parámetros**: `comuna`, `barrio`, `manzana`, `lote` o `cbml` (formato completo)
  - **Devuelve**: Tratamiento urbanístico aplicable al CBML
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

- **`POST /api/lotes/tratamientos/actualizar/`** - Actualizar tratamientos
  - **Requiere**: Autenticación con permisos de administrador
  - **Datos**: Opcional: `source` (fuente de los datos)
  - **Devuelve**: Resumen del proceso de actualización
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

### Favoritos
- **`GET /api/lotes/favorites/`** - Listar lotes favoritos
  - **Requiere**: Autenticación
  - **Parámetros**: `page`, `page_size` (opcionales)
  - **Devuelve**: Lista paginada de lotes favoritos del usuario
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`POST /api/lotes/favorites/`** - Agregar lote a favoritos
  - **Requiere**: Autenticación
  - **Datos**: `lote` (ID del lote a agregar a favoritos)
  - **Devuelve**: Objeto de favorito creado con ID
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

- **`GET /api/lotes/favorites/<id>/`** - Obtener lote favorito específico
  - **Requiere**: Autenticación (propietario del favorito)
  - **Devuelve**: Detalles del favorito y del lote
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`DELETE /api/lotes/favorites/<id>/`** - Eliminar lote de favoritos
  - **Requiere**: Autenticación (propietario del favorito)
  - **Devuelve**: `204 No Content` sin cuerpo de respuesta
  - **Códigos**: `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## POT (Plan de Ordenamiento Territorial)
**Base URL**: `/api/pot/`

### Tratamientos POT
- **`GET /api/pot/tratamientos/`** - Listar todos los tratamientos del POT
  - **Requiere**: Autenticación
  - **Parámetros**: `page`, `page_size`, `search`, `ordering` (opcionales)
  - **Devuelve**: Lista paginada de tratamientos POT con sus detalles
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`GET /api/pot/tratamientos/<id>/`** - Ver detalles de un tratamiento específico
  - **Requiere**: Autenticación
  - **Devuelve**: Datos completos del tratamiento POT incluyendo normativa y restricciones
  - **Códigos**: `200 OK`, `401 Unauthorized`, `404 Not Found`

- **`POST /api/pot/tratamientos/`** - Crear un nuevo tratamiento
  - **Requiere**: Autenticación con permisos administrativos
  - **Datos**: `codigo`, `nombre`, `descripcion`, `normas`, `aprovechamiento`, etc.
  - **Devuelve**: Datos del tratamiento creado con ID
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

- **`PUT /api/pot/tratamientos/<id>/`** - Actualizar un tratamiento
  - **Requiere**: Autenticación con permisos administrativos
  - **Datos**: Todos los campos del tratamiento a actualizar
  - **Devuelve**: Datos actualizados del tratamiento
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`DELETE /api/pot/tratamientos/<id>/`** - Eliminar un tratamiento
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: `204 No Content` sin cuerpo de respuesta
  - **Códigos**: `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Consultas POT
- **`GET /api/pot/lista/`** - Listar todos los tratamientos
  - **Requiere**: Autenticación
  - **Parámetros**: `formato` (para definir formato de respuesta, opcional)
  - **Devuelve**: Lista completa de tratamientos POT (no paginada)
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`GET /api/pot/detalle/<codigo>/`** - Ver detalles de un tratamiento por código
  - **Requiere**: Autenticación
  - **Devuelve**: Datos completos del tratamiento incluyendo normativa, restricciones y cálculos
  - **Códigos**: `200 OK`, `401 Unauthorized`, `404 Not Found`

- **`POST /api/pot/importar/`** - Importar tratamientos desde JSON
  - **Requiere**: Autenticación con permisos administrativos
  - **Datos**: Archivo JSON con tratamientos a importar o campo `data` con JSON
  - **Devuelve**: Resumen del proceso de importación (tratamientos creados, actualizados, errores)
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

- **`POST /api/pot/crear/`** - Crear un tratamiento
  - **Requiere**: Autenticación con permisos administrativos
  - **Datos**: `codigo`, `nombre`, `descripcion`, `tipo`, `normas_aplicables`, `restricciones`, etc.
  - **Devuelve**: Datos del tratamiento creado con ID y timestamp
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/pot/normativa/cbml/`** - Consultar normativa por CBML
  - **Requiere**: Autenticación
  - **Parámetros**: `cbml` o campos separados: `comuna`, `barrio`, `manzana`, `lote`
  - **Devuelve**: Normativa aplicable al predio según POT, con cálculos urbanísticos
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

## Documentos
**Base URL**: `/api/documents/`

### Gestión de Documentos
- **`GET /api/documents/documents/`** - Listar todos los documentos
  - **Requiere**: Autenticación
  - **Parámetros**: `page`, `page_size`, `ordering`, `search`, `type`, `status` (opcionales)
  - **Devuelve**: Lista paginada de documentos con metadatos
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`POST /api/documents/documents/`** - Crear un nuevo documento
  - **Requiere**: Autenticación
  - **Datos**: Archivo del documento (`file`), `title`, `type`, `lote` (ID del lote asociado)
  - **Opcional**: `description`, `tags`, `metadata` (JSON)
  - **Devuelve**: Datos del documento creado con URL de acceso
  - **Códigos**: `201 Created`, `400 Bad Request`, `401 Unauthorized`

- **`GET /api/documents/documents/<id>/`** - Ver detalles de un documento específico
  - **Requiere**: Autenticación (propietario o con permisos)
  - **Devuelve**: Datos completos del documento incluyendo metadatos y URL de descarga
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`PUT /api/documents/documents/<id>/`** - Actualizar un documento
  - **Requiere**: Autenticación (propietario o admin)
  - **Datos**: Todos los campos del documento y opcionalmente nuevo archivo (`file`)
  - **Devuelve**: Datos actualizados del documento
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`PATCH /api/documents/documents/<id>/`** - Actualizar parcialmente un documento
  - **Requiere**: Autenticación (propietario o admin)
  - **Datos**: Solo los campos que se quieren actualizar
  - **Devuelve**: Datos actualizados del documento
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`DELETE /api/documents/documents/<id>/`** - Eliminar un documento
  - **Requiere**: Autenticación (propietario o admin)
  - **Devuelve**: `204 No Content` sin cuerpo de respuesta
  - **Códigos**: `204 No Content`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Documentos por Usuario/Lote
- **`GET /api/documents/user/`** - Obtener documentos del usuario actual
  - **Requiere**: Autenticación
  - **Parámetros**: `page`, `page_size`, `type`, `date_from`, `date_to` (opcionales)
  - **Devuelve**: Lista paginada de documentos del usuario autenticado
  - **Códigos**: `200 OK`, `401 Unauthorized`

- **`GET /api/documents/lote/<lote_id>/`** - Obtener documentos de un lote específico
  - **Requiere**: Autenticación (propietario del lote o con permisos)
  - **Parámetros**: `page`, `page_size`, `type` (opcionales)
  - **Devuelve**: Lista paginada de documentos asociados al lote
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

### Validación de Documentos
- **`GET /api/documents/validation/summary/`** - Resumen de validación de documentos
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: Resumen estadístico de validaciones (pendientes, aprobadas, rechazadas)
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/documents/validation/list/`** - Listar validaciones de documentos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `status`, `page`, `page_size` (opcionales)
  - **Devuelve**: Lista paginada de documentos pendientes de validación
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/documents/validation/recent/`** - Documentos recientes
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `limit` (opcional, por defecto 10)
  - **Devuelve**: Lista de documentos recientes con su estado de validación
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/documents/validation/<id>/`** - Detalles de validación de un documento
  - **Requiere**: Autenticación (propietario o con permisos administrativos)
  - **Devuelve**: Detalles completos del documento y su historial de validación
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`POST /api/documents/validation/<document_id>/action/`** - Ejecutar acción de validación
  - **Requiere**: Autenticación con permisos administrativos
  - **Datos**: `action` ('approve', 'reject', 'request_changes'), `comments` (opcional)
  - **Devuelve**: Resultado de la acción y estado actualizado
  - **Códigos**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## Estadísticas
**Base URL**: `/api/stats/`

### Dashboard
- **`GET /api/stats/dashboard/`** - Estadísticas generales del dashboard
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: Panel completo de estadísticas del sistema incluyendo resúmenes de todas las entidades
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/dashboard/summary/`** - Resumen del dashboard
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: Datos resumidos para una vista rápida: conteos totales, actividad reciente
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/dashboard/users/`** - Estadísticas de usuarios
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `period` ('day', 'week', 'month', 'year', opcional)
  - **Devuelve**: Estadísticas detalladas de usuarios: registros, actividad, roles
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/dashboard/lotes/`** - Estadísticas de lotes
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `period` ('day', 'week', 'month', 'year', opcional)
  - **Devuelve**: Estadísticas detalladas de lotes: creación, tipos, áreas, ubicaciones
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/dashboard/documentos/`** - Estadísticas de documentos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `period` ('day', 'week', 'month', 'year', opcional)
  - **Devuelve**: Estadísticas detalladas de documentos: subidas, tipos, validaciones
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/dashboard/recent-activity/`** - Actividad reciente
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `limit` (cantidad de eventos, opcional), `type` (tipo de evento, opcional)
  - **Devuelve**: Lista cronológica de eventos recientes en el sistema
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/dashboard/events/table/`** - Tabla de eventos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `page`, `page_size`, `date_from`, `date_to`, `type` (opcionales)
  - **Devuelve**: Lista paginada de eventos con detalles completos
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/dashboard/events/distribution/`** - Distribución de eventos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `period` ('day', 'week', 'month', 'year', opcional)
  - **Devuelve**: Datos agrupados de eventos por tipo, origen o usuario
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

### Gráficos
- **`GET /api/stats/charts/`** - Gráficos del dashboard
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: Conjunto de datos para gráficos principales del dashboard
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/charts/lotes-summary/`** - Resumen de lotes
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `period` (opcional)
  - **Devuelve**: Datos para gráficos de lotes: distribución por tipo, tamaño, zona
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/charts/documents-count/`** - Conteo de documentos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `group_by` ('type', 'status', 'user', opcional)
  - **Devuelve**: Datos agrupados para gráficos de conteo de documentos
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/charts/documents-by-month/`** - Documentos por mes
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `year` (opcional, por defecto año actual)
  - **Devuelve**: Serie temporal de documentos agrupados por mes
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/charts/event-distribution/`** - Distribución de eventos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `type` (opcional para filtrar por tipo)
  - **Devuelve**: Datos para gráficos de distribución de eventos
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

### Eventos
- **`GET /api/stats/events/`** - Listar todos los eventos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `page`, `page_size`, `ordering`, `type`, `date_from`, `date_to` (opcionales)
  - **Devuelve**: Lista paginada de eventos del sistema
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/events/<id>/`** - Ver detalles de un evento específico
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: Datos completos de un evento incluyendo metadatos y contexto
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

- **`GET /api/stats/events/dashboard/`** - Dashboard de eventos
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: Resumen de eventos para panel de control
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/events/counts/`** - Conteo de eventos
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `group_by` ('type', 'user', 'action', opcional)
  - **Devuelve**: Conteo de eventos agrupados según el parámetro
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/events/daily/`** - Eventos diarios
  - **Requiere**: Autenticación con permisos administrativos
  - **Parámetros**: `days` (cantidad de días, opcional), `type` (opcional)
  - **Devuelve**: Serie temporal de eventos por día
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

- **`GET /api/stats/events/types/`** - Distribución de tipos de eventos
  - **Requiere**: Autenticación con permisos administrativos
  - **Devuelve**: Conteo y porcentaje de eventos por tipo
  - **Códigos**: `200 OK`, `401 Unauthorized`, `403 Forbidden`

## Health Check
**Base URL**: `/health/`

### Verificación de Estado
- **`GET /health/`** - Verificación básica de estado de la aplicación
  - **Requiere**: Nada (acceso público)
  - **Devuelve**: Estado general del sistema: `{"status": "ok"}` o error
  - **Códigos**: `200 OK`, `503 Service Unavailable`

- **`GET /health/database/`** - Verificación de conexión a la base de datos
  - **Requiere**: Nada (acceso público, puede limitarse por IP en producción)
  - **Devuelve**: Estado de la conexión a la base de datos y latencia
  - **Códigos**: `200 OK`, `500 Internal Server Error`, `503 Service Unavailable`

- **`GET /health/dependencies/`** - Verificación de dependencias externas
  - **Requiere**: Nada (acceso público, puede limitarse por IP en producción)
  - **Devuelve**: Estado de conexiones a servicios externos como MapGIS, AWS, etc.
  - **Códigos**: `200 OK`, `207 Multi-Status` (algunos servicios fallando), `503 Service Unavailable`

## Common
**Base URL**: `/api/common/`

### Debug y Diagnóstico
- **`GET /api/common/cors-debug/`** - Diagnóstico de configuración CORS
  - **Requiere**: Nada (acceso público)
  - **Devuelve**: Información sobre cabeceras CORS y configuración actual
  - **Códigos**: `200 OK`

---

*Este documento fue generado automáticamente basado en las configuraciones de URLs del proyecto.*