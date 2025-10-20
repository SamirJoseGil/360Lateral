# Servicios de API - Documentación

Esta carpeta contiene todos los servicios que interactúan con el backend de 360Lateral.

## 📋 Índice de Servicios

1. [auth.server.ts](#authservertss) - Autenticación
2. [users.server.ts](#usersserverts) - Gestión de Usuarios
3. [lotes.server.ts](#lotesserverts) - Gestión de Lotes
4. [documents.server.ts](#documentsserverts) - Gestión de Documentos
5. [pot.server.ts](#potserverts) - Plan de Ordenamiento Territorial
6. [mapgis.server.ts](#mapgisserverts) - Integración MapGIS
7. [stats.server.ts](#statsserverts) - Estadísticas y Métricas
8. [common.server.ts](#commonserverts) - Servicios Comunes

## 🔐 auth.server.ts

Servicio de autenticación y gestión de contraseñas.

### Funciones Principales

#### `changePassword(request, passwordData)`
Cambia la contraseña del usuario autenticado.

```typescript
const result = await changePassword(request, {
  current_password: "oldPassword123",
  new_password: "newPassword456"
});

// Returns: { success: boolean, message: string, headers: Headers }
```

#### `requestPasswordReset(email)`
Solicita un reset de contraseña por email.

```typescript
const result = await requestPasswordReset("user@example.com");

// Returns: { success: boolean, message: string }
```

#### `confirmPasswordReset(token, password, passwordConfirm)`
Confirma el reset de contraseña con el token recibido.

```typescript
const result = await confirmPasswordReset(
  "reset-token-123",
  "newPassword456",
  "newPassword456"
);

// Returns: { success: boolean, message: string }
```

#### `logoutUser(request, refreshToken?)`
Cierra la sesión del usuario.

```typescript
const result = await logoutUser(request, refreshToken);

// Returns: { success: boolean, message: string, headers: Headers }
```

### Utilidades

#### `validatePassword(password)`
Valida que una contraseña cumpla los requisitos de seguridad.

```typescript
const errors = validatePassword("weak");
// Returns: string[] con mensajes de error

// Requisitos:
// - Mínimo 8 caracteres
// - Al menos una mayúscula
// - Al menos una minúscula
// - Al menos un número
```

---

## 👥 users.server.ts

Servicio de gestión de usuarios del sistema.

### Tipos

```typescript
type User = {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "owner" | "developer";
  status?: "active" | "inactive" | "pending";
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  role_fields?: UserProfile;
};

type UsersResponse = {
  users: User[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};
```

### Funciones CRUD

#### `getUsers(request, options)`
Obtiene lista de usuarios con paginación y filtros.

```typescript
const { users, headers } = await getUsers(request, {
  page: 1,
  limit: 10,
  search: "john",
  role: "owner",
  status: "active"
});

// Returns: { users: UsersResponse, headers: Headers }
```

#### `getUserById(request, userId)`
Obtiene detalles de un usuario específico.

```typescript
const { user, headers } = await getUserById(request, "user-id-123");

// Returns: { user: User, headers: Headers }
```

#### `createUser(request, userData)`
Crea un nuevo usuario (admin only).

```typescript
const { user, headers } = await createUser(request, {
  email: "newuser@example.com",
  username: "newuser",
  first_name: "John",
  last_name: "Doe",
  role: "owner",
  password: "SecurePass123"
});

// Returns: { user: User, headers: Headers }
```

#### `updateUser(request, userId, userData)`
Actualiza un usuario existente.

```typescript
const { user, headers } = await updateUser(request, "user-id-123", {
  first_name: "Jane",
  is_active: true
});

// Returns: { user: User, headers: Headers }
```

#### `deleteUser(request, userId)`
Elimina un usuario.

```typescript
const { success, headers } = await deleteUser(request, "user-id-123");

// Returns: { success: boolean, headers: Headers }
```

### Funciones Especializadas

#### `getCurrentUser(request)`
Obtiene el perfil del usuario autenticado.

```typescript
const { user, headers } = await getCurrentUser(request);

// Returns: { user: User, headers: Headers }
```

#### `updateCurrentUserProfile(request, userData)`
Actualiza el perfil del usuario autenticado.

```typescript
const { success, message, user, headers } = await updateCurrentUserProfile(request, {
  first_name: "Jane",
  phone: "+123456789",
  company: "My Company"
});
```

#### `getAllUsers(request, searchQuery?)`
Obtiene todos los usuarios (admin only).

```typescript
const { users, headers } = await getAllUsers(request, "search term");

// Returns: { users: User[], headers: Headers }
```

### Solicitudes de Usuario

#### `getUserRequests(request, filters?)`
Obtiene solicitudes del usuario.

```typescript
const { requests, headers } = await getUserRequests(request, {
  type: "access",
  status: "pending",
  search: "project"
});
```

#### `createUserRequest(request, requestData)`
Crea una nueva solicitud.

```typescript
const { request, headers } = await createUserRequest(request, {
  request_type: "developer",
  title: "Access to project X",
  description: "Need access to...",
  reference_id: "project-123"
});
```

---

## 🏘️ lotes.server.ts

Servicio de gestión de lotes inmobiliarios.

### Tipos

```typescript
interface Lote {
  id?: number;
  nombre: string;
  cbml: string;
  direccion: string;
  area?: number;
  matricula?: string;
  barrio?: string;
  estrato?: number;
  tratamiento_pot?: string;
  uso_suelo?: string;
  status?: string;
  is_verified?: boolean;
  is_favorite?: boolean;
  // ...más campos
}
```

### Funciones de Consulta

#### `getMisLotes(request, searchQuery?)`
Obtiene lotes del usuario autenticado.

```typescript
const { lotes, count, headers } = await getMisLotes(request, "search term");

// Returns: { lotes: Lote[], count: number, headers: Headers }
```

#### `getAllLotes(request, filters?)`
Obtiene todos los lotes (admin only).

```typescript
const { lotes, count, headers } = await getAllLotes(request, {
  search: "barrio",
  ordering: "-created_at",
  limit: 20,
  offset: 0
});
```

#### `getLoteById(request, loteId)`
Obtiene detalles de un lote específico.

```typescript
const { lote, headers } = await getLoteById(request, "lote-id-123");

// Returns: { lote: Lote, headers: Headers }
```

#### `searchLotes(request, filters)`
Búsqueda avanzada de lotes.

```typescript
const { lotes, count, headers } = await searchLotes(request, {
  search: "Laureles",
  area_min: 100,
  area_max: 500,
  estrato: 3,
  barrio: "Laureles",
  uso_suelo: "Residencial",
  ordering: "area"
});
```

### Funciones CRUD

#### `createLote(request, loteData)`
Crea un nuevo lote.

```typescript
const { lote, headers } = await createLote(request, {
  nombre: "Mi Lote",
  cbml: "01-01-0001-0001-000",
  direccion: "Calle 123 #45-67",
  area: 250,
  barrio: "Laureles"
});
```

#### `updateLote(request, loteId, data)`
Actualiza un lote existente.

```typescript
const { lote, headers } = await updateLote(request, "lote-id-123", {
  nombre: "Nuevo Nombre",
  area: 300
});
```

#### `deleteLote(request, loteId)`
Elimina un lote.

```typescript
const { success, headers } = await deleteLote(request, "lote-id-123");
```

### Integración con MapGIS

#### `createLoteFromMapGIS(request, loteData)`
Crea lote con datos automáticos de MapGIS.

```typescript
const { success, lote, message, headers } = await createLoteFromMapGIS(request, {
  cbml: "01-01-0001-0001-000",
  matricula: "123-456",
  nombre: "Lote Automático",
  direccion: "Calle 123",
  descripcion: "Lote con datos de MapGIS"
});
```

#### `suggestLoteFromMapGis(request, cbml)`
Obtiene sugerencia de lote basada en datos de MapGIS.

```typescript
const { suggestion, mapgis_data, headers } = await suggestLoteFromMapGis(
  request,
  "01-01-0001-0001-000"
);
```

### Administración (Admin Only)

#### `verifyLote(request, loteId)`
Verifica un lote pendiente.

```typescript
const { data, headers } = await verifyLote(request, "lote-id-123");
```

#### `rejectLote(request, loteId, reason)`
Rechaza un lote pendiente.

```typescript
const { data, headers } = await rejectLote(
  request,
  "lote-id-123",
  "Información incompleta"
);
```

#### `archiveLote(request, loteId)`
Archiva un lote.

```typescript
const { data, headers } = await archiveLote(request, "lote-id-123");
```

#### `getPendingLotes(request)`
Obtiene lotes pendientes de verificación.

```typescript
const { lotes, count, headers } = await getPendingLotes(request);
```

### Favoritos

#### `toggleLoteFavorite(request, loteId)`
Agrega o remueve lote de favoritos.

```typescript
const { success, isFavorite, message, headers } = await toggleLoteFavorite(
  request,
  123
);
```

#### `getFavoriteLotes(request)`
Obtiene lotes favoritos del usuario.

```typescript
const { favorites, count, headers } = await getFavoriteLotes(request);
```

### POT Integration

#### `getTratamientosPOT(request)`
Obtiene tratamientos POT disponibles.

```typescript
const { tratamientos, headers } = await getTratamientosPOT(request);
```

#### `calcularAprovechamiento(request, data)`
Calcula aprovechamiento urbanístico.

```typescript
const { calculo, headers } = await calcularAprovechamiento(request, {
  codigo_tratamiento: "CN1",
  area_lote: 250,
  tipologia: "unifamiliar"
});
```

---

## 📄 documents.server.ts

Servicio de gestión de documentos.

### Tipos

```typescript
interface Document {
  id: number;
  title: string;
  description?: string;
  document_type: string;
  file: string;
  file_url: string;
  file_name: string;
  lote?: number;
  user: number;
  created_at: string;
  is_active: boolean;
}
```

### Funciones Principales

#### `uploadDocument(request, formData)`
Sube un documento al servidor.

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("title", "Certificado de Tradición");
formData.append("document_type", "ctl");
formData.append("lote", "123");

const { document, headers } = await uploadDocument(request, formData);
```

#### `getLoteDocuments(request, loteId)`
Obtiene documentos de un lote específico.

```typescript
const { documents, count, headers } = await getLoteDocuments(
  request,
  "lote-id-123"
);
```

#### `getUserDocuments(request, filters?)`
Obtiene documentos del usuario autenticado.

```typescript
const { documents, count, headers } = await getUserDocuments(request, {
  document_type: "ctl",
  search: "certificado",
  ordering: "-created_at",
  limit: 10
});
```

#### `getAllDocuments(request, filters?)`
Obtiene todos los documentos (admin only).

```typescript
const { documents, count, headers } = await getAllDocuments(request, {
  document_type: "planos",
  lote: "lote-id-123",
  search: "arquitectonico"
});
```

#### `deleteDocument(request, documentId)`
Elimina un documento.

```typescript
const { success, headers } = await deleteDocument(request, "doc-id-123");
```

### Validación de Documentos (Admin)

#### `getValidationSummary(request)`
Obtiene resumen de documentos por validar.

```typescript
const { validationSummary, headers } = await getValidationSummary(request);
```

#### `getValidationDocuments(request, filters?)`
Obtiene documentos para validación.

```typescript
const { documents, pagination, headers } = await getValidationDocuments(request, {
  estado: "pendiente",
  tipo: "ctl",
  fecha_desde: "2024-01-01"
});
```

#### `performDocumentAction(request, documentId, action, comentarios?)`
Valida o rechaza un documento.

```typescript
const { result, headers } = await performDocumentAction(
  request,
  "doc-id-123",
  "validar",
  "Documento aprobado"
);

// O rechazar
const { result, headers } = await performDocumentAction(
  request,
  "doc-id-123",
  "rechazar",
  "Información ilegible"
);
```

---

## 📐 pot.server.ts

Servicio de Plan de Ordenamiento Territorial.

### Tipos

```typescript
type TratamientoPOT = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  indice_ocupacion: string;
  indice_construccion: string;
  altura_maxima: number;
  activo: boolean;
};

type CalculoAprovechamiento = {
  success: boolean;
  tratamiento: {
    codigo: string;
    nombre: string;
    indice_ocupacion: number;
    indice_construccion: number;
  };
  calculos: {
    area_lote: number;
    area_ocupada_maxima: number;
    area_construible_maxima: number;
  };
};
```

### Funciones de Consulta

#### `getTratamientosPOT(request, filters?)`
Lista tratamientos POT con paginación.

```typescript
const { tratamientos, count, headers } = await getTratamientosPOT(request, {
  page: 1,
  page_size: 10
});
```

#### `getTratamientosActivosPOT(request)`
Lista solo tratamientos activos.

```typescript
const { tratamientos, count, headers } = await getTratamientosActivosPOT(request);
```

#### `getTratamientoPOTById(request, id)`
Obtiene detalle de un tratamiento.

```typescript
const { tratamiento, headers } = await getTratamientoPOTById(request, 1);
```

#### `getTratamientoPOTByCodigo(request, codigo)`
Obtiene tratamiento por código.

```typescript
const { tratamiento, headers } = await getTratamientoPOTByCodigo(request, "CN1");
```

### Normativa y Cálculos

#### `getNormativaPorCBML(request, cbml)`
Obtiene normativa POT por CBML.

```typescript
const { normativa, headers } = await getNormativaPorCBML(
  request,
  "01-01-0001-0001-000"
);

// Returns información completa de normativa del lote
```

#### `calcularAprovechamiento(request, data)`
Calcula aprovechamiento urbanístico.

```typescript
const { calculo, headers } = await calcularAprovechamiento(request, {
  codigo_tratamiento: "CN1",
  area_lote: 250,
  tipologia: "unifamiliar"
});

// Returns: áreas máximas ocupadas y construibles
```

### Administración (Admin Only)

#### `createTratamientoPOT(request, tratamientoData)`
Crea nuevo tratamiento POT.

```typescript
const { tratamiento, headers } = await createTratamientoPOT(request, {
  codigo: "CN1",
  nombre: "Consolidación Nivel 1",
  descripcion: "...",
  indice_ocupacion: "0.70",
  indice_construccion: "2.10",
  altura_maxima: 6
});
```

#### `importarTratamientosPOT(request, tratamientosData)`
Importa tratamientos desde JSON.

```typescript
const { result, headers } = await importarTratamientosPOT(request, {
  // JSON con múltiples tratamientos
});

// Returns: { creados: number, actualizados: number }
```

---

## 🗺️ mapgis.server.ts

Servicio de integración con MapGIS (catastro).

### Tipos

```typescript
interface MapGisResponseDetalle {
  success: boolean;
  encontrado: boolean;
  data?: {
    cbml?: string;
    matricula?: string;
    direccion?: string;
    area?: number;
    clasificacion_suelo?: string;
    uso_suelo?: string;
    tratamiento_pot?: string;
  };
  message?: string;
}
```

### Funciones de Consulta

#### `consultarPorMatricula(request, matricula)`
Busca lote por matrícula inmobiliaria.

```typescript
const result = await consultarPorMatricula(request, "123-456");

// Returns: MapGisResponseDetalle con datos catastrales
```

#### `consultarPorCBML(request, cbml)`
Busca lote por código CBML.

```typescript
const result = await consultarPorCBML(request, "01-01-0001-0001-000");

// Returns: MapGisResponseDetalle con datos catastrales
```

#### `consultarPorDireccion(request, direccion)`
Busca lotes por dirección.

```typescript
const result = await consultarPorDireccion(request, "Calle 123 #45-67");

// Returns: MapGisResponseSearch con lista de resultados
```

### Notas Importantes

- Estos endpoints son **públicos** (no requieren autenticación)
- Los datos provienen directamente del sistema catastral
- La respuesta puede variar según disponibilidad del servicio MapGIS

---

## 📊 stats.server.ts

Servicio de estadísticas y métricas del sistema.

### Tipos

```typescript
interface DashboardStats {
  users: { total: number };
  lotes: {
    total: number;
    activos: number;
    inactivos: number;
  };
  documentos: {
    total: number;
    pendientes: number;
    aceptados: number;
  };
  summary: {
    total_usuarios: number;
    proyectos_activos: number;
    pendientes_validacion: number;
  };
}
```

### Funciones de Dashboard

#### `getDashboardStats(request, days?)`
Obtiene estadísticas generales del dashboard.

```typescript
const { dashboardStats, headers } = await getDashboardStats(request, 30);

// Returns: estadísticas completas del sistema
```

#### `getDashboardSummary(request)`
Obtiene resumen ejecutivo.

```typescript
const { dashboardSummary, headers } = await getDashboardSummary(request);
```

### Eventos

#### `recordEvent(request, eventData)`
Registra un evento estadístico.

```typescript
await recordEvent(request, {
  type: 'view',
  name: 'page_view',
  value: { page: '/admin/lotes' }
});

// NOTA: Actualmente deshabilitado temporalmente
```

#### `getEventsDashboard(request, days?)`
Obtiene dashboard de eventos.

```typescript
const { eventsDashboard, headers } = await getEventsDashboard(request, 30);
```

#### `getDailyEvents(request, days?)`
Obtiene eventos diarios.

```typescript
const { dailyEvents, headers } = await getDailyEvents(request, 30);
```

### Gráficos

#### `getAllChartData(request)`
Obtiene todos los datos para gráficos.

```typescript
const { chartData, headers } = await getAllChartData(request);

// Returns: datos para múltiples gráficos
```

#### `getLotesSummary(request)`
Resumen de lotes para gráficos.

```typescript
const { lotesSummary, headers } = await getLotesSummary(request);
```

#### `getDocumentsByMonth(request, year?)`
Documentos agrupados por mes.

```typescript
const { documentsByMonth, headers } = await getDocumentsByMonth(request, 2024);
```

---

## 🔧 common.server.ts

Servicios comunes del sistema.

### Health Checks

#### `getSystemHealth(request?)`
Health check completo del sistema.

```typescript
const { health, headers } = await getSystemHealth(request);

// Returns: {
//   status: "healthy" | "unhealthy",
//   timestamp: string,
//   services: {
//     database: { status, message },
//     cache: { status, message }
//   }
// }
```

#### `getSimpleHealth()`
Health check simple para load balancers.

```typescript
const { health, headers } = await getSimpleHealth();

// Returns: { status: "healthy", service: "lateral360-backend" }
```

#### `getDatabaseHealth()`
Estado de la base de datos.

```typescript
const { health, headers } = await getDatabaseHealth();
```

#### `getCacheHealth()`
Estado del sistema de caché.

```typescript
const { health, headers } = await getCacheHealth();
```

### Información del Sistema

#### `getVersionInfo()`
Información de versión del sistema.

```typescript
const { version, headers } = await getVersionInfo();

// Returns: {
//   version: "1.0.0",
//   django_version: "4.2",
//   python_version: "3.11",
//   apps: [...],
//   environment: "production"
// }
```

#### `getSystemStatus()`
Estado general del sistema.

```typescript
const { status, headers } = await getSystemStatus();
```

### Debug

#### `getCorsDebugInfo(request)`
Información de debug de CORS.

```typescript
const { debug, headers } = await getCorsDebugInfo(request);

// Útil para troubleshooting de CORS
```

#### `getComprehensiveHealth(request?)`
Health check comprehensivo para dashboard.

```typescript
const {
  systemHealth,
  databaseHealth,
  cacheHealth,
  versionInfo,
  systemStatus,
  headers
} = await getComprehensiveHealth(request);
```

---

## 🔑 Convenciones de Uso

### Manejo de Headers

Todos los servicios retornan headers que deben ser propagados:

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const { data, headers } = await getSomeData(request);
  
  return json({ data }, { headers });
}
```

### Manejo de Errores

```typescript
try {
  const result = await someService(request);
  return json({ result });
} catch (error) {
  console.error("[Service] Error description:", error);
  
  if (error instanceof Response) {
    throw error; // Re-throw Remix responses (redirects, etc.)
  }
  
  return json(
    { error: "User-friendly message" },
    { status: 500 }
  );
}
```

### Logging

Usar prefijos consistentes:

```typescript
console.log("[Auth] User logged in");
console.error("[Lotes] Error fetching lote:", error);
console.warn("[Documents] File size exceeds limit");
```

---

## 📝 Notas Adicionales

### Autenticación

- Todos los servicios `*.server.ts` deben ejecutarse en el servidor
- Usan `fetchWithAuth` para incluir tokens automáticamente
- Manejan refresh de tokens automáticamente

### Variables de Entorno

Los servicios usan `API_URL` de `~/utils/env.server.ts`:

```typescript
import { API_URL, logApiUrl } from "~/utils/env.server";

logApiUrl("contextName"); // Para debug
```

### Cache

El caché de usuario está centralizado en `auth.server.ts`:

```typescript
import { clearUserCache } from "~/utils/auth.server";

// Limpiar al logout o cambio de datos
clearUserCache(token);
```

---

Para más información, consultar:
- [Documentación Principal](../README.md)
- [Utilidades](../utils/README.md)
- [API Backend](../../Backend/README.md)
