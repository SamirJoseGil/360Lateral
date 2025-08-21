# Frontend/app/routes - Nueva Estructura y Descripción de Archivos

## _index.tsx
Dashboard principal. Renderiza la vista inicial según el rol.

## error.tsx
Página global de error.

## notfound.tsx
Página 404 para rutas no encontradas.

---

### auth/
- **login.tsx:** Formulario de login.
- **register.tsx:** Formulario de registro.
- **logout.tsx:** Cierre de sesión.

### profile/
- **_index.tsx:** Página de perfil de usuario.

### favorites/
- **_index.tsx:** Lista de favoritos del usuario.
- **share.tsx:** Compartir listas de favoritos.

### search/
- **_index.tsx:** Búsqueda avanzada de lotes.
- **map.tsx:** Resultados en formato mapa.
- **list.tsx:** Resultados en formato lista.

### lotes/
- **_index.tsx:** Listado de lotes.
- **new.tsx:** Crear nuevo lote.
- **$id.tsx:** Detalle de lote.
- **$id/edit.tsx:** Editar lote.
- **$id/gallery.tsx:** Galería de imágenes del lote.
- **$id/documents.tsx:** Documentos asociados al lote.
- **$id/history.tsx:** Historial de cambios/transacciones.
- **$id/favoritos.tsx:** Favoritos de ese lote.
- **$id/tipologias.tsx:** Tipologías viables.
- **$id/potencial.tsx:** Potencial constructivo.
- **$id/financiero.tsx:** Estimación financiera.
- **$id/restricciones.tsx:** Restricciones ambientales/normativas.

### documents/
- **_index.tsx:** Listado de documentos.
- **upload.tsx:** Subir nuevo documento.
- **$id.tsx:** Detalle de documento.
- **$id/edit.tsx:** Editar documento.

### stats/
- **_index.tsx:** Dashboard de estadísticas.
- **analytics.tsx:** Visualización avanzada de analytics.
- **reports.tsx:** Historial y descarga de reportes.

### admin/
- **_index.tsx:** Panel de administración.
- **users.tsx:** Gestión de usuarios.
- **lotes.tsx:** Gestión de lotes.
- **reports.tsx:** Reportes del sistema.
- **settings.tsx:** Configuración avanzada.
- **notifications.tsx:** Notificaciones del sistema.
- **audit.tsx:** Auditoría y logs.
- **health.tsx:** Health checks y estado del sistema.

### scrapinfo/
- **_index.tsx:** Página de debug y testing para MapGIS.

---

> **Nota:** Elimina archivos que no estén en esta estructura y actualiza los imports en los componentes para reflejar la nueva ubicación.
## documents.edit.$id.tsx
Formulario para editar metadatos de un documento.

## stats.analytics.tsx
Página de visualización avanzada de analytics y reportes.

## stats.reports.tsx
Historial y descarga de reportes generados.

## favorites.share.tsx
Funcionalidad para compartir listas de favoritos.

## search.map.tsx
Vista de resultados de búsqueda en formato mapa.

## search.list.tsx
Vista de resultados de búsqueda en formato lista.

## lotes.tipologias.tsx
Visualización de tipologías viables para un lote.

## lotes.potencial.tsx
Calculadora de potencial constructivo para un lote.

## lotes.financiero.tsx
Estimación financiera y costos de desarrollo para un lote.

## lotes.restricciones.tsx
Visualización de restricciones ambientales y normativas para un lote.

## lotes.gallery.$id.tsx
Galería de imágenes asociadas a un lote.

## lotes.documents.$id.tsx
Listado de documentos asociados a un lote específico.

## lotes.history.$id.tsx
Historial de cambios y transacciones de un lote.

## lotes.favoritos.$id.tsx
Gestión de favoritos para un lote específico.

## admin.settings.tsx
Configuración avanzada del sistema desde el panel admin.

## admin.notifications.tsx
Gestión y visualización de notificaciones del sistema.

## admin.audit.tsx
Panel de auditoría y logs de acceso.

## admin.health.tsx
Página de health checks y estado del sistema.

---

> **Nota:** Si algún archivo no existe, ignóralo en la reestructuración. Esta lista sirve como referencia para identificar y reorganizar rutas y componentes.
