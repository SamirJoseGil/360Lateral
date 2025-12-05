# 🔧 Documentación de Services

Esta carpeta contiene servicios del lado del servidor (`.server.ts`) que encapsulan la lógica de comunicación con el backend API de Django. Todos estos servicios se ejecutan exclusivamente en el servidor de Remix.

---

## 📑 Índice de Servicios

1. [admin.server.ts](#adminserverts) - Servicios administrativos
2. [auth.server.ts](#authserverts) - Autenticación y sesión
3. [common.server.ts](#commonserverts) - Tipos comunes y health checks
4. [documents.server.ts](#documentsserverts) - Gestión de documentos
5. [investment.server.ts](#investmentserverts) - Perfiles de inversión
6. [lotes.server.ts](#lotesserverts) - Gestión de lotes
7. [notifications.server.ts](#notificationsserverts) - Sistema de notificaciones
8. [pot.server.ts](#potserverts) - Normativa POT (Plan de Ordenamiento Territorial)
9. [users.server.ts](#usersserverts) - Gestión de usuarios

---

## 🔐 Conceptos Generales

### Patrón de Comunicación

Todos los servicios siguen un patrón consistente:

```typescript
export async function serviceName(request: Request, ...params) {
    try {
        // 1. Usar fetchWithAuth para autenticación automática
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/endpoint/`,
            options
        );

        // 2. Validar respuesta
        if (!res.ok) {
            throw new Error(`Error: ${res.status}`);
        }

        // 3. Parsear datos
        const data = await res.json();

        // 4. Retornar con headers para cookies actualizadas
        return {
            data,
            headers: setCookieHeaders
        };
    } catch (error) {
        console.error("[Service] Error:", error);
        throw error;
    }
}
```

### Variables de Entorno

```typescript
// Todas las URLs se obtienen de variables de entorno
const API_URL = process.env.API_URL || "http://localhost:8000";
```

### Manejo de Errores

Los servicios implementan:
- ✅ Try-catch para capturar excepciones
- ✅ Logging detallado con `console.log` y `console.error`
- ✅ Propagación de errores para que las rutas los manejen
- ✅ Fallbacks cuando es apropiado

---

# 📋 Servicios Detallados

## admin.server.ts

**Propósito:** Servicios exclusivos para administradores.

### Características
- Gestión completa de usuarios
- Gestión de lotes con permisos elevados
- Estadísticas del sistema
- Acciones administrativas (verificar, rechazar, archivar)

### Funciones Principales

#### `getAdminStats(request: Request)`

Obtiene estadísticas globales del sistema.

```typescript
const stats = await getAdminStats(request);
// Retorna: { lotes, usuarios, solicitudes, documentos }
```

**Endpoint:** `GET /api/admin/stats/`

---

## auth.server.ts

**Propósito:** Gestión de autenticación, sesión y tokens JWT.

### Características
- Login/Logout
- Registro de usuarios
- Refresh de tokens automático
- Gestión de cookies HTTP-only
- Recuperación de contraseña

### Funciones Principales

#### `login(email: string, password: string, remember: boolean)`

Autentica usuario y guarda tokens en cookies.

```typescript
const { user, headers } = await login(email, password, true);
// Retorna: usuario + headers con cookies Set-Cookie
```

**Flujo:**
1. POST `/api/auth/login/` con credenciales
2. Recibe `{ access, refresh, user }`
3. Guarda tokens en cookies con `serialize()`
4. Retorna headers para aplicar en la respuesta

**Cookies creadas:**
- `access`: Token JWT (1 hora de vida)
- `refresh`: Token de refresco (7 días si remember=true, 1 día si no)

#### `logout(request: Request)`

Invalida tokens y limpia cookies.

```typescript
const headers = await logout(request);
// Retorna: headers con cookies vacías (maxAge: 0)
```

#### `register(userData: RegisterData)`

Crea nuevo usuario en el sistema.

```typescript
const { user, headers } = await register({
    email: "user@example.com",
    password: "SecurePass123",
    first_name: "John",
    last_name: "Doe",
    role: "owner"
});
```

**Validaciones automáticas:**
- Email único
- Formato de email válido
- Contraseña fuerte (min. 8 caracteres)
- Role válido (NO permite crear admins desde registro)

#### `getUser(request: Request)`

Obtiene usuario desde cookies sin lanzar error si no existe.

```typescript
const user = await getUser(request);
if (!user) {
    // Redirigir a login
}
```

#### `requireUser(request: Request)`

Obtiene usuario y lanza redirect si no está autenticado.

```typescript
const user = await requireUser(request); // Garantizado no-null
```

#### `fetchWithAuth(request: Request, url: string, options?)`

Función wrapper que agrega autenticación automática a fetch.

```typescript
const { res, setCookieHeaders } = await fetchWithAuth(
    request,
    `${API_URL}/api/endpoint/`,
    { method: 'POST', body: JSON.stringify(data) }
);
```

**Características:**
- ✅ Agrega token de acceso automáticamente
- ✅ Detecta token expirado (401)
- ✅ Refresca token automáticamente si es necesario
- ✅ Retorna headers actualizados para cookies
- ✅ Maneja FormData correctamente (no agrega Content-Type)

**Flujo de refresh automático:**
```typescript
1. Request con access token
2. Backend retorna 401 (token expirado)
3. fetchWithAuth detecta 401
4. Llama a refreshAccessToken() con refresh token
5. Obtiene nuevo access token
6. Reintenta request original con nuevo token
7. Retorna respuesta + headers con cookies actualizadas
```

#### `commitAuthCookies(tokens, remember)`

Serializa tokens en headers de cookies.

```typescript
const headers = await commitAuthCookies(
    { access: "...", refresh: "..." },
    true // remember me
);
```

---

## common.server.ts

**Propósito:** Tipos compartidos y funciones comunes.

### Tipos Exportados

#### `HealthCheckResponse`

```typescript
type HealthCheckResponse = {
    status: "healthy" | "unhealthy" | "warning";
    timestamp: string;
    services?: {
        database: {
            status: "healthy" | "unhealthy";
            message: string;
        };
        cache?: {
            status: "healthy" | "unhealthy";
            message: string;
        };
    };
    system?: {
        memory: {
            total: number;
            available: number;
            percent: number;
            status: "healthy" | "warning" | "unhealthy";
        };
    };
    response_time_ms?: number;
};
```

#### `VersionInfoResponse`

```typescript
type VersionInfoResponse = {
    version: string;
    django_version: string;
    python_version: string;
    apps: string[];
    environment: string;
};
```

---

## documents.server.ts

**Propósito:** Gestión completa de documentos y validaciones.

### Tipos de Documentos

```typescript
type DocumentType = 
    | "ctl"                      // Certificado de Tradición y Libertad
    | "planos"                   // Planos Arquitectónicos
    | "topografia"               // Levantamiento Topográfico
    | "licencia_construccion"    // Licencia de Construcción
    | "escritura_publica"        // Escritura Pública
    | "certificado_libertad"     // Certificado de Libertad
    | "avaluo_comercial"         // Avalúo Comercial
    | "estudio_suelos"           // Estudio de Suelos
    | "otros";                   // Otros Documentos
```

### Funciones Principales

#### `uploadDocument(request, documentData)`

Sube documento usando FormData (multipart/form-data).

```typescript
const result = await uploadDocument(request, {
    document_type: "ctl",
    title: "CTL Lote 123",
    description: "Certificado actualizado",
    file: File, // Objeto File del navegador
    lote: "uuid-del-lote"
});
```

**⚠️ IMPORTANTE:**
- Usa `FormData` NO `JSON.stringify()`
- No establecer `Content-Type` manualmente
- El navegador establece boundary automáticamente

#### `getLoteDocuments(request, loteId)`

Obtiene todos los documentos de un lote específico.

```typescript
const { documents } = await getLoteDocuments(request, loteId);
```

#### `getUserDocuments(request)`

Obtiene documentos del usuario autenticado actual.

#### `deleteDocument(request, documentId)`

Elimina documento (solo propietario o admin).

#### `getValidationSummary(request)`

Resumen de documentos pendientes de validación (admin only).

```typescript
const { validationSummary } = await getValidationSummary(request);
// Retorna: { pendientes, validados, rechazados, total }
```

#### `getValidationDocuments(request, options)`

Lista paginada de documentos para validación.

```typescript
const { documents, pagination } = await getValidationDocuments(request, {
    page: 1,
    page_size: 10,
    status: 'pendiente'
});
```

**✅ CORRECCIÓN IMPORTANTE:**
```typescript
// Mapea URLs de Docker a localhost
let fileUrl = doc.file_url || doc.file;

if (fileUrl && (fileUrl.includes('backend:8000') || fileUrl.includes('lateral360_backend'))) {
    fileUrl = fileUrl.replace(/https?:\/\/[^\/]+/, 'http://localhost:8000');
}
```

#### `performDocumentAction(request, documentId, action, comments)`

Valida o rechaza documento (admin only).

```typescript
await performDocumentAction(request, docId, 'validar', '');
// o
await performDocumentAction(request, docId, 'rechazar', 'Motivo del rechazo');
```

**Acciones:**
- `validar`: Aprueba documento
- `rechazar`: Rechaza con comentarios obligatorios

#### `getValidationDocumentsGrouped(request, options)`

Obtiene documentos agrupados por lote.

```typescript
const { lotes, pagination } = await getValidationDocumentsGrouped(request);
// Retorna: Array de lotes con sus documentos anidados
```

---

## investment.server.ts

**Propósito:** Gestión de perfiles de inversión para developers.

### Tipos

```typescript
type PerfilInversion = {
    ciudades_interes: string[];
    usos_preferidos: string[];
    modelos_pago: string[];
    volumen_ventas_min: string | null;
    ticket_inversion_min: string | null;
    perfil_completo: boolean;
    perfil_completo_porcentaje: number;
};
```

### Funciones Principales

#### `getPerfilInversion(request)`

Obtiene perfil de inversión del developer autenticado.

```typescript
const { perfil } = await getPerfilInversion(request);
```

**⚠️ CORRECCIÓN:**
```typescript
// Backend puede devolver el perfil directamente O en un objeto
const perfil = data.perfil || data;
```

#### `updatePerfilInversion(request, data)`

Actualiza criterios de inversión.

```typescript
const result = await updatePerfilInversion(request, {
    ciudades_interes: ["Bogotá", "Medellín"],
    usos_preferidos: ["residencial", "comercial"],
    modelos_pago: ["contado", "financiado"],
    volumen_ventas_min: "100",
    ticket_inversion_min: "500000000"
});
```

---

## lotes.server.ts

**Propósito:** Gestión completa de lotes y favoritos.

### Tipos

```typescript
interface Lote {
    id: string;
    nombre: string;
    direccion: string;
    area?: number;
    
    // Identificación
    cbml?: string;
    matricula?: string;
    codigo_catastral?: string;
    
    // Ubicación
    ciudad?: string;
    barrio?: string;
    estrato?: number;
    latitud?: number;
    longitud?: number;
    
    // Características
    uso_suelo?: string;
    clasificacion_suelo?: string;
    tratamiento_pot?: string;
    descripcion?: string;
    
    // Comerciales
    valor?: number;
    forma_pago?: 'contado' | 'financiado' | 'permuta' | 'mixto';
    es_comisionista?: boolean;
    carta_autorizacion?: string;
    
    // Estado
    status: 'pending' | 'active' | 'rejected' | 'archived';
    is_verified: boolean;
    rejection_reason?: string;
    
    // Metadatos
    owner?: string;
    owner_name?: string;
    created_at: string;
    updated_at: string;
}
```

### Funciones Principales

#### `getMisLotes(request, searchQuery?)`

Obtiene lotes del usuario autenticado (owner).

```typescript
const { lotes, count, headers } = await getMisLotes(request, "búsqueda");
```

**Fallback automático:**
- Si endpoint `/api/lotes/` no existe → llama `getAllLotes()`
- Maneja diferentes estructuras de respuesta del backend

#### `getAllLotes(request, filters?)`

Lista todos los lotes (admin only).

```typescript
const { lotes, count } = await getAllLotes(request, {
    search: "búsqueda",
    ordering: '-created_at',
    limit: 20,
    offset: 0
});
```

**✅ Mapeo de campos:**
```typescript
// Mapea nombres de campos frontend → backend
const fieldMapping = {
    'created_at': 'fecha_creacion',
    '-created_at': '-fecha_creacion',
    'updated_at': 'fecha_actualizacion',
    '-updated_at': '-fecha_actualizacion',
};
```

#### `searchLotes(request, filters)`

Búsqueda avanzada con filtros múltiples.

```typescript
const { lotes, count } = await searchLotes(request, {
    search: "texto",
    area_min: 100,
    area_max: 500,
    estrato: 3,
    barrio: "Chapinero",
    uso_suelo: "residencial",
    tratamiento_pot: "CN1",
    ordering: 'area'
});
```

#### `getLoteById(request, loteId)`

Obtiene lote específico por ID.

```typescript
const { lote, headers } = await getLoteById(request, loteId);
```

**Validaciones:**
- 403: No tienes permisos (solo lotes verificados y activos para developers)
- 404: Lote no existe

#### `createLote(request, loteData)`

Crea nuevo lote usando FormData.

```typescript
const { lote, headers } = await createLote(request, {
    nombre: "Lote Ejemplo",
    direccion: "Calle 123",
    ciudad: "Bogotá",
    area: 250,
    // ... más campos
    
    // ✅ NUEVO: Archivo de carta de autorización
    carta_autorizacion: File // Si es comisionista
});
```

**⚠️ IMPORTANTE:**
- Usa `FormData` para soportar archivos
- No establecer `Content-Type` manualmente

#### `createLoteFromMapGIS(request, loteData)`

Crea lote con datos automáticos desde MapGIS.

#### `suggestLoteFromMapGis(request, cbml)`

Obtiene sugerencia de lote desde MapGIS.

```typescript
const { suggestion, mapgis_data } = await suggestLoteFromMapGis(request, cbml);
```

#### `verifyLote(request, loteId)`

Verifica lote (admin only).

#### `rejectLote(request, loteId, reason)`

Rechaza lote con motivo (admin only).

```typescript
await rejectLote(request, loteId, "Motivo del rechazo");
```

#### `archiveLote(request, loteId)`

Archiva lote (admin only).

#### `reactivateLote(request, loteId)`

Reactiva lote archivado/rechazado (admin only).

#### `updateLote(request, loteId, data)`

Actualiza lote existente.

```typescript
const { lote } = await updateLote(request, loteId, {
    nombre: "Nuevo Nombre",
    area: 300
});
```

#### `deleteLote(request, loteId)`

Elimina lote permanentemente.

### Favoritos

#### `addLoteToFavorites(request, loteId, notas?)`

Agrega lote a favoritos (developer only).

```typescript
await addLoteToFavorites(request, loteId, "Interesante para proyecto X");
```

**✅ Usa UUID como string:**
```typescript
body: JSON.stringify({ 
    lote: loteId,  // UUID como string
    notas: notas || ''
})
```

#### `removeLoteFromFavorites(request, loteId)`

Remueve lote de favoritos.

#### `checkIfFavorite(request, loteId)`

Verifica si lote es favorito.

```typescript
const { is_favorite } = await checkIfFavorite(request, loteId);
```

#### `toggleLoteFavorite(request, loteId)`

Toggle favorito (agregar o remover).

```typescript
const { isFavorite, message } = await toggleLoteFavorite(request, loteId);
```

#### `getFavoriteLotes(request)`

Obtiene todos los lotes favoritos del usuario.

```typescript
const { favorites, count } = await getFavoriteLotes(request);
```

### Disponibles para Developers

#### `getAvailableLotes(request, filters?)`

Obtiene lotes verificados y activos (developers).

```typescript
const { lotes, count } = await getAvailableLotes(request, {
    search: "búsqueda",
    area_min: 100,
    area_max: 500,
    estrato: 3
});
```

**Fallback automático:**
- Si endpoint `/available/` no existe → filtra en cliente

---

## notifications.server.ts

**Propósito:** Sistema de notificaciones en tiempo real.

### Tipos

```typescript
type Notification = {
    id: string;
    type: string;
    type_display: string;
    title: string;
    message: string;
    priority: string;
    priority_display: string;
    is_read: boolean;
    action_url?: string;
    created_at: string;
    time_ago: string;
    data?: any;
};
```

### Funciones Principales

#### `getNotifications(request, options?)`

Obtiene notificaciones con paginación.

```typescript
const notifications = await getNotifications(request, {
    page: 1,
    page_size: 10,
    is_read: false // Solo no leídas
});
```

#### `getUnreadCount(request)`

Obtiene contador de notificaciones no leídas.

```typescript
const count = await getUnreadCount(request);
```

#### `markAsRead(request, notificationId)`

Marca notificación como leída.

```typescript
const success = await markAsRead(request, notifId);
```

#### `markAllAsRead(request)`

Marca todas las notificaciones como leídas.

```typescript
const marked = await markAllAsRead(request);
```

#### `getRecentNotifications(request)`

Obtiene últimas 10 notificaciones.

```typescript
const recent = await getRecentNotifications(request);
```

---

## pot.server.ts

**Propósito:** Gestión de normativa POT (Plan de Ordenamiento Territorial).

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
    retiro_frontal?: string;
    retiro_lateral?: string;
    retiro_posterior?: string;
    frentes_minimos?: FrenteMinimo[];
    areas_minimas_lote?: AreaMinimaLote[];
    areas_minimas_vivienda?: AreaMinimaVivienda[];
    metadatos?: Record<string, any>;
    activo: boolean;
};

type NormativaPorCBML = {
    cbml: string;
    tratamiento_encontrado: string;
    codigo_tratamiento: string;
    normativa: TratamientoPOT;
    datos_mapgis: {
        area_lote_m2: number;
        clasificacion_suelo: string;
        aprovechamiento_urbano: {
            tratamiento: string;
            densidad_habitacional_max: number;
            altura_normativa: number;
        };
    };
};
```

### Funciones Principales

#### `getTratamientosPOT(request, filters?)`

Lista todos los tratamientos POT con paginación.

```typescript
const { tratamientos, count } = await getTratamientosPOT(request, {
    page: 1,
    page_size: 20
});
```

#### `getTratamientosActivosPOT(request)`

Lista solo tratamientos activos (simplificado).

```typescript
const { tratamientos } = await getTratamientosActivosPOT(request);
```

#### `getTratamientoPOTById(request, id)`

Obtiene detalle completo de tratamiento por ID.

#### `getTratamientoPOTByCodigo(request, codigo)`

Obtiene tratamiento por código (ej: "CN1").

```typescript
const { tratamiento } = await getTratamientoPOTByCodigo(request, "CN1");
```

#### `getNormativaPorCBML(request, cbml)`

Obtiene normativa POT completa para un CBML.

```typescript
const { normativa } = await getNormativaPorCBML(request, "AABBC123456");
```

**Manejo de no encontrado:**
```typescript
if (res.status === 404) {
    return {
        normativa: {
            cbml,
            tratamiento_encontrado: "No encontrado",
            codigo_tratamiento: "",
            normativa: {} as TratamientoPOT,
            datos_mapgis: { /* vacío */ }
        }
    };
}
```

#### `calcularAprovechamiento(request, data)`

Calcula aprovechamiento urbanístico.

```typescript
const { calculo } = await calcularAprovechamiento(request, {
    codigo_tratamiento: "CN1",
    area_lote: 250,
    tipologia: "VIS"
});
```

**Retorna:**
```typescript
{
    tratamiento: {
        codigo: "CN1",
        nombre: "...",
        indice_ocupacion: 0.6,
        indice_construccion: 2.0,
        altura_maxima: 5
    },
    calculos: {
        area_lote: 250,
        area_ocupada_maxima: 150,      // 250 * 0.6
        area_construible_maxima: 500,  // 250 * 2.0
        tipologia: "VIS"
    }
}
```

#### `getTiposVivienda(request)`

Obtiene tipos de vivienda disponibles.

```typescript
const { tipos } = await getTiposVivienda(request);
// { tipos_frente_minimo, tipos_area_lote, tipos_area_vivienda }
```

### Funciones Administrativas

#### `createTratamientoPOT(request, tratamientoData)` (Admin)

Crea nuevo tratamiento POT.

#### `updateTratamientoPOT(request, id, tratamientoData)` (Admin)

Actualiza tratamiento existente.

#### `deleteTratamientoPOT(request, id)` (Admin)

Elimina tratamiento POT.

#### `importarTratamientosPOT(request, tratamientosData)` (Admin)

Importa múltiples tratamientos desde JSON.

```typescript
const { result } = await importarTratamientosPOT(request, jsonData);
// result: { creados, actualizados, errores }
```

#### `createTratamientoCompletoPOT(request, tratamientoCompleto)` (Admin)

Crea tratamiento con todas las normativas anidadas.

---

## users.server.ts

**Propósito:** Gestión completa de usuarios y perfiles.

### Tipos

```typescript
type User = {
    id: string;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    phone?: string;
    company?: string;
    role: "admin" | "owner" | "developer";
    status?: "active" | "inactive" | "pending";
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_login?: string;
    role_fields?: UserProfile;
};

type UserProfile = {
    role_fields?: {
        // Owner
        document_type?: string;
        document_number?: string;
        address?: string;
        id_verification_file?: string;
        lots_count?: number;
        
        // Developer
        company_name?: string;
        company_nit?: string;
        position?: string;
        experience_years?: number;
        portfolio_url?: string;
        focus_area?: string;
        
        // Admin
        department?: string;
        permissions_scope?: string;
    };
};
```

### Funciones Principales

#### `getUsers(request, options)`

Lista usuarios con paginación y filtros (admin only).

```typescript
const { users } = await getUsers(request, {
    page: 1,
    limit: 20,
    search: "búsqueda",
    role: "owner",
    status: "active"
});
```

#### `getUserById(request, userId)`

Obtiene usuario específico por ID.

```typescript
const { user } = await getUserById(request, userId);
```

#### `getCurrentUser(request)`

Obtiene perfil completo del usuario autenticado.

```typescript
const { user } = await getCurrentUser(request);
```

#### `updateCurrentUserProfile(request, userData)`

Actualiza perfil del usuario autenticado.

```typescript
const { success, user } = await updateCurrentUserProfile(request, {
    first_name: "John",
    last_name: "Doe",
    phone: "+57 300 123 4567",
    // Campos específicos del rol
    document_type: "CC",
    document_number: "123456789"
});
```

#### `createUser(request, userData)`

Crea nuevo usuario (admin only).

```typescript
const { user } = await createUser(request, {
    email: "user@example.com",
    first_name: "John",
    last_name: "Doe",
    role: "owner",
    password: "SecurePass123"
});
```

**⚠️ Valores por defecto:**
```typescript
// Para evitar errores de validación
if (userData.role === 'admin') {
    requestData.department = 'general';
} else if (userData.role === 'developer') {
    requestData.company_name = userData.company || 'Sin especificar';
}
```

#### `updateUser(request, userId, userData)`

Actualiza usuario existente (admin only).

```typescript
const { user } = await updateUser(request, userId, {
    first_name: "Jane",
    is_active: false
});
```

#### `deleteUser(request, userId)`

Elimina usuario permanentemente (admin only).

#### `updateUserStatus(request, userId, status)`

Actualiza estado de usuario (admin only).

```typescript
await updateUserStatus(request, userId, "inactive");
```

### Solicitudes de Usuario

#### `getUserRequests(request, filters?)`

Obtiene solicitudes del usuario autenticado.

```typescript
const { requests } = await getUserRequests(request, {
    type: "support",
    status: "pending",
    search: "búsqueda"
});
```

#### `createUserRequest(request, requestData)`

Crea nueva solicitud.

```typescript
const { request } = await createUserRequest(request, {
    request_type: "support",
    title: "Problema con documento",
    description: "No puedo subir el archivo CTL",
    reference_id: "lote-uuid"
});
```

#### `getUserRequestsSummary(request)`

Obtiene resumen de solicitudes.

```typescript
const { summary } = await getUserRequestsSummary(request);
// { total, pending, approved, rejected, by_type }
```

#### `getRecentRequestUpdates(request, days?, limit?)`

Obtiene actualizaciones recientes de solicitudes.

```typescript
const { updates } = await getRecentRequestUpdates(request, 30, 10);
```

### Helpers

#### `markFirstLoginCompleted(request)`

Marca primera sesión como completada (elimina modal de bienvenida).

```typescript
const { success, user } = await markFirstLoginCompleted(request);
```

#### `handleApiError(error, defaultMessage?)`

Procesa errores de API de forma consistente.

```typescript
const { error, status } = handleApiError(error, "Error desconocido");
```

---

# 🎯 Patrones y Mejores Prácticas

## 1. Estructura Consistente

Todos los servicios siguen:

```typescript
export async function functionName(
    request: Request,
    ...params: any[]
): Promise<{ data: any; headers: Headers }> {
    try {
        // Logging inicial
        console.log(`[Service] Action: params`);
        
        // Fetch con autenticación
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            endpoint,
            options
        );
        
        // Validación
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[Service] Error:`, res.status, errorText);
            throw new Error(`Error: ${res.status}`);
        }
        
        // Parseo
        const data = await res.json();
        console.log(`[Service] Success`);
        
        // Retorno con headers
        return {
            data,
            headers: setCookieHeaders
        };
        
    } catch (error) {
        console.error('[Service] Error:', error);
        throw error; // Propagar para manejo en rutas
    }
}
```

## 2. Manejo de Diferentes Estructuras de Respuesta

```typescript
// Backend puede devolver diferentes formatos
let items = [];

if (Array.isArray(data)) {
    items = data;
} else if (data.results && Array.isArray(data.results)) {
    items = data.results;
} else if (data.data && Array.isArray(data.data)) {
    items = data.data;
} else {
    console.warn("Unexpected response structure:", data);
    items = [];
}
```

## 3. Fallbacks Automáticos

```typescript
try {
    // Intentar endpoint preferido
    return await fetchFromEndpoint(request, '/api/lotes/');
} catch (error) {
    console.log("Endpoint no disponible, usando fallback");
    
    // Fallback a endpoint alternativo
    return await fetchFromAlternativeEndpoint(request);
}
```

## 4. Corrección de URLs de Docker

```typescript
// Corregir URLs internas de Docker
let fileUrl = doc.file_url || doc.file;

if (fileUrl && (fileUrl.includes('backend:8000') || fileUrl.includes('lateral360_backend'))) {
    fileUrl = fileUrl.replace(/https?:\/\/[^\/]+/, 'http://localhost:8000');
}
```

## 5. Validación de UUIDs

```typescript
// Siempre usar UUID como string
body: JSON.stringify({ 
    lote: loteId,  // UUID como string, NO parseInt()
    notas: notas || ''
})
```

## 6. FormData para Archivos

```typescript
const formData = new FormData();
formData.append('archivo', file);
formData.append('document_type', type);
// ✅ NO establecer Content-Type

const { res } = await fetchWithAuth(request, endpoint, {
    method: 'POST',
    body: formData  // fetchWithAuth detecta FormData automáticamente
});
```

## 7. Logging Detallado

```typescript
console.log(`[Service] Action: param1=${value1}, param2=${value2}`);

if (!res.ok) {
    const errorText = await res.text();
    console.error(`[Service] Error:`, res.status, errorText);
}

console.log(`[Service] Success: ${items.length} items loaded`);
```

## 8. Manejo de Headers

```typescript
// Siempre retornar headers para actualizar cookies
return {
    data,
    headers: setCookieHeaders || new Headers()
};
```

---

# 🔒 Seguridad

## Autenticación Automática

Todos los servicios usan `fetchWithAuth` que:
- ✅ Agrega token JWT automáticamente
- ✅ Refresca token si expira
- ✅ Maneja cookies HTTP-only
- ✅ Propaga headers actualizados

## Validación de Roles

```typescript
// En loaders/actions de rutas
const user = await requireUser(request);

if (user.role !== 'admin') {
    throw new Response("Acceso denegado", { status: 403 });
}
```

## Sanitización

```typescript
// Validar y sanitizar inputs
const email = formData.get('email')?.toString().trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email inválido");
}
```

---

# 🧪 Testing

## Ejemplo de Test para Servicio

```typescript
import { getLoteById } from '~/services/lotes.server';
import { createMockRequest } from '~/test/utils';

describe('lotes.server', () => {
    test('getLoteById retorna lote válido', async () => {
        const request = createMockRequest({ user: mockOwner });
        
        const { lote } = await getLoteById(request, 'valid-uuid');
        
        expect(lote).toBeDefined();
        expect(lote.id).toBe('valid-uuid');
    });
    
    test('getLoteById lanza error si lote no existe', async () => {
        const request = createMockRequest({ user: mockOwner });
        
        await expect(
            getLoteById(request, 'invalid-uuid')
        ).rejects.toThrow();
    });
});
```

---

# 📊 Resumen de Endpoints Backend

## Autenticación
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/register/` - Registro
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Usuario actual

## Lotes
- `GET /api/lotes/` - Lista de lotes
- `POST /api/lotes/` - Crear lote
- `GET /api/lotes/{id}/` - Detalle de lote
- `PUT /api/lotes/{id}/` - Actualizar lote
- `DELETE /api/lotes/{id}/` - Eliminar lote
- `GET /api/lotes/search/` - Búsqueda avanzada
- `GET /api/lotes/available/` - Lotes disponibles (developers)
- `POST /api/lotes/{id}/verify/` - Verificar lote (admin)

## Documentos
- `GET /api/documents/documents/` - Lista de documentos
- `POST /api/documents/documents/` - Subir documento
- `GET /api/documents/lote/{id}/` - Documentos de lote
- `DELETE /api/documents/documents/{id}/` - Eliminar documento
- `GET /api/documents/validation/list/` - Documentos pendientes
- `POST /api/documents/validation/{id}/action/` - Validar/Rechazar

## POT
- `GET /api/pot/tratamientos/` - Lista de tratamientos
- `GET /api/pot/lista/` - Tratamientos activos
- `GET /api/pot/detalle/{codigo}/` - Detalle por código
- `GET /api/pot/normativa/cbml/?cbml={cbml}` - Normativa por CBML
- `POST /api/pot/aprovechamiento/calcular/` - Calcular aprovechamiento

## Usuarios
- `GET /api/users/` - Lista de usuarios (admin)
- `POST /api/users/` - Crear usuario (admin)
- `GET /api/users/{id}/` - Detalle de usuario
- `PUT /api/users/{id}/` - Actualizar usuario
- `DELETE /api/users/{id}/` - Eliminar usuario
- `GET /api/users/me/` - Perfil actual
- `PUT /api/users/me/update/` - Actualizar perfil

## Notificaciones
- `GET /api/notifications/` - Lista de notificaciones
- `GET /api/notifications/unread_count/` - Contador no leídas
- `POST /api/notifications/{id}/mark_read/` - Marcar como leída
- `POST /api/notifications/mark_all_read/` - Marcar todas

## Favoritos
- `GET /api/lotes/favorites/` - Lista de favoritos
- `POST /api/lotes/favorites/` - Agregar favorito
- `DELETE /api/lotes/favorites/{id}/` - Eliminar favorito
- `GET /api/lotes/favorites/check/?lote_id={id}` - Verificar favorito
- `POST /api/lotes/favorites/toggle/` - Toggle favorito

---

**Última actualización:** Enero 2025  
**Total de servicios documentados:** 9  
**Total de funciones:** 100+  
**Framework:** Remix 2.x con Django Backend
