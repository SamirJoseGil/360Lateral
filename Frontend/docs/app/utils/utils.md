# 🛠️ Documentación de Utils

Esta carpeta contiene utilidades y helpers utilizados en toda la aplicación. Incluye funciones de autenticación, manejo de sesiones, configuración de entorno, y más.

---

## 📑 Índice de Utilidades

1. [auth.server.ts](#authserverts) - Autenticación y autorización
2. [session.server.ts](#sessionserverts) - Gestión de sesiones
3. [env.server.ts](#envserverts) - Variables de entorno
4. [jwt.server.ts](#jwtserverts) - Manejo de JWT
5. [api.server.ts](#apiservert) - Utilidades de API
6. [api.ts](#apits) - Cliente API (cliente)
7. [roleToDashboard.ts](#roletodashboardts) - Mapeo de roles
8. [pot-analysis.ts](#pot-analysists) - Análisis POT
9. [ciudades.ts](#ciudadests) - Lista de ciudades
10. [documentHelpers.ts](#documenthelpersts) - Helpers de documentos

---

# 🔐 auth.server.ts

**Propósito:** Sistema completo de autenticación y autorización del lado del servidor.

## Características Principales

- ✅ Autenticación basada en cookies HTTP-only
- ✅ Refresh automático de tokens JWT
- ✅ Caché de usuarios en memoria
- ✅ Protección de rutas por rol
- ✅ Logging optimizado (reducido en producción)

## Tipos Exportados

### `Role`
```typescript
export type Role = "admin" | "owner" | "developer";
```

### `ApiUser`
```typescript
export type ApiUser = {
    id: string;
    email: string;
    role: Role;
    first_name?: string;
    last_name?: string;
    name?: string;
};
```

## Configuración de Cookies

```typescript
const cookieConfig = {
    httpOnly: true,
    secure: isProd,               // Solo HTTPS en producción
    sameSite: "lax" as const,
    path: "/",
};

// Cookies creadas:
// - l360_access: Token de acceso (1 hora)
// - l360_refresh: Token de refresco (7 días)
```

## Funciones Principales

### `getAccessTokenFromCookies(request: Request)`

Obtiene el token de acceso desde las cookies.

```typescript
const token = await getAccessTokenFromCookies(request);
if (!token) {
    // Usuario no autenticado
}
```

### `getRefreshTokenFromCookies(request: Request)`

Obtiene el token de refresco desde las cookies.

### `commitAuthCookies({ access, refresh })`

Crea headers con cookies serializadas.

```typescript
const headers = await commitAuthCookies({
    access: "jwt_token",
    refresh: "refresh_token"
});

return json(data, { headers });
```

### `clearAuthCookies()`

Limpia las cookies de autenticación.

```typescript
const headers = await clearAuthCookies();
return redirect("/", { headers });
```

## Caché de Usuario

Sistema de caché en memoria para reducir llamadas al backend:

```typescript
// TTL: 5 minutos
const CACHE_TTL = 5 * 60 * 1000;

// Funciones:
getCachedUser(token: string)         // Obtener de caché
setCachedUser(token: string, user)   // Guardar en caché
clearUserCache(token?: string)       // Limpiar caché
```

**Uso:**
```typescript
const cached = getCachedUser(token);
if (cached !== undefined) {
    return cached; // Retorna usuario o null
}

// Si no está en caché, consultar backend
const user = await fetchUserFromAPI(token);
setCachedUser(token, user);
```

## Autenticación Principal

### `getUser(request: Request): Promise<ApiUser | null>`

Obtiene usuario autenticado sin lanzar errores.

```typescript
const user = await getUser(request);

if (!user) {
    // Usuario no autenticado
    return redirect("/login");
}

// Usuario autenticado
console.log(user.role); // "admin" | "owner" | "developer"
```

**Flujo:**
1. Extrae token de cookies
2. Verifica caché (5 min TTL)
3. Si no hay caché, valida con backend
4. Guarda en caché el resultado
5. Retorna usuario o null

**Rutas públicas excluidas:**
- `/logout`
- `/?logout=true`

### `requireUser(request: Request): Promise<ApiUser>`

Obtiene usuario autenticado o redirige a login.

```typescript
const user = await requireUser(request);
// Garantizado: user siempre existe aquí
```

**⚠️ Importante:** Si el usuario no está autenticado, lanza `redirect("/login")` automáticamente.

## Fetch con Autenticación

### `fetchWithAuth(request, url, options?)`

Wrapper de fetch con autenticación automática y refresh de tokens.

```typescript
const { res, setCookieHeaders } = await fetchWithAuth(
    request,
    `${API_URL}/api/endpoint/`,
    {
        method: "POST",
        body: JSON.stringify(data)
    }
);

if (!res.ok) {
    throw new Error("Request failed");
}

const data = await res.json();
return json(data, { headers: setCookieHeaders });
```

**Características:**
- ✅ Agrega token de acceso automáticamente
- ✅ Detecta token expirado (401)
- ✅ Refresca token automáticamente
- ✅ Reintenta request con nuevo token
- ✅ Retorna headers con cookies actualizadas
- ✅ Maneja FormData correctamente

**Flujo de refresh automático:**
```
1. Request con token de acceso
2. Backend retorna 401 (token expirado)
3. fetchWithAuth detecta 401
4. Llama a /api/auth/token/refresh/ con refresh token
5. Obtiene nuevo access token
6. Actualiza cookies
7. Reintenta request original
8. Retorna respuesta + headers
```

**⚠️ IMPORTANTE - FormData:**
```typescript
// ✅ CORRECTO: No establecer Content-Type para FormData
const formData = new FormData();
formData.append('file', file);

await fetchWithAuth(request, url, {
    method: 'POST',
    body: formData // fetchWithAuth detecta FormData y NO establece Content-Type
});

// ❌ INCORRECTO: Establecer Content-Type manualmente
headers.set('Content-Type', 'multipart/form-data'); // NO hacer esto
```

## Acciones de Autenticación

### `loginAction(request: Request)`

Maneja el proceso de login.

```typescript
export async function action({ request }: ActionFunctionArgs) {
    return loginAction(request);
}
```

**Flujo:**
1. Extrae email, password, remember del FormData
2. POST a `/api/auth/login/`
3. Guarda tokens en cookies
4. Guarda usuario en caché
5. Redirige a dashboard según rol

### `logoutAction(request: Request)`

Maneja el proceso de logout.

```typescript
export async function action({ request }: ActionFunctionArgs) {
    return logoutAction(request);
}
```

**Flujo:**
1. Obtiene refresh token de cookies
2. POST a `/api/auth/logout/` para invalidar en backend
3. Limpia caché de usuario
4. Limpia cookies
5. Redirige a `/?logout=true`

## Protección de Rutas

### `requireAuth(request: Request): Promise<ApiUser>`

Alias de `requireUser`, requiere autenticación.

### `authenticateAdmin(request: Request): Promise<ApiUser>`

Requiere autenticación Y rol de admin.

```typescript
const user = await authenticateAdmin(request);
// Garantizado: user.role === "admin"
```

**⚠️ Si no es admin:** Lanza `redirect('/login?message=...')`

## Helpers de Headers

### `mergeSetCookieHeaders({ loaderHeaders, parentHeaders })`

Combina cookies de múltiples loaders/actions.

```typescript
export function headers({ loaderHeaders, parentHeaders }: any) {
    return mergeSetCookieHeaders({ loaderHeaders, parentHeaders });
}
```

## Optimizaciones de Logging

```typescript
// ✅ Solo loguea en desarrollo
if (isDev) {
    console.log(`[Auth] Token verified for: ${user.email}`);
}

// ✅ Solo loguea errores importantes
if (response.status !== 401) {
    console.log(`[Auth] ❌ Token verification failed: ${response.status}`);
}
```

## Ejemplo Completo

```typescript
// En un loader
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    if (user.role !== 'admin') {
        throw new Response("Acceso denegado", { status: 403 });
    }
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/admin/data/`
    );
    
    const data = await res.json();
    
    return json({ user, data }, { headers: setCookieHeaders });
}
```

---

# 🗂️ session.server.ts

**Propósito:** Gestión de sesiones simplificada con cookies.

## Configuración

```typescript
export const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "l360_session",
        secrets: [process.env.SESSION_SECRET || "s3cret1"],
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 días
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    },
});
```

## Funciones Principales

### `getSession(request: Request)`

Obtiene sesión desde la request.

```typescript
const session = await getSession(request);
const userData = session.get("user");
```

### `commitSession(session: any)`

Serializa sesión en cookie.

```typescript
const headers = new Headers({
    "Set-Cookie": await commitSession(session)
});
```

### `destroySession(session: any)`

Destruye sesión.

```typescript
const headers = new Headers({
    "Set-Cookie": await destroySession(session)
});
```

### `getUserFromSession(request: Request)`

Obtiene usuario desde sesión (no desde JWT).

```typescript
const user = await getUserFromSession(request);
if (!user) {
    // No hay usuario en sesión
}
```

### `markWelcomeModalShown(request: Request)` ✅ NUEVO

Marca que el modal de bienvenida ya fue mostrado.

```typescript
const { headers } = await markWelcomeModalShown(request);
return json(data, { headers });
```

### `hasWelcomeModalBeenShown(request: Request)` ✅ NUEVO

Verifica si el modal ya fue mostrado en esta sesión.

```typescript
const hasShown = await hasWelcomeModalBeenShown(request);
if (hasShown) {
    // No mostrar modal de nuevo
}
```

**Uso en WelcomeModal:**
```typescript
// En loader
const hasShown = await hasWelcomeModalBeenShown(request);

return json({
    user,
    showWelcome: user.is_first_login && !hasShown
});

// Al cerrar modal
const { headers } = await markWelcomeModalShown(request);
return json({ success: true }, { headers });
```

---

# ⚙️ env.server.ts

**Propósito:** Configuración centralizada de variables de entorno.

## Variables Principales

```typescript
export const API_URL = isServer
    ? (isDocker 
        ? `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`
        : process.env.API_URL || 'http://localhost:8000'
      )
    : process.env.VITE_API_URL_EXTERNAL || 'http://localhost:8000';

export const ENV = {
    API_BASE_URL: API_URL,
    API_BASE_URL_INTERNAL: 'http://backend:8000',  // Para SSR en Docker
    API_BASE_URL_EXTERNAL: 'http://localhost:8000', // Para cliente
    NODE_ENV: process.env.NODE_ENV || "development",
    BACKEND_HOST: process.env.BACKEND_HOST || "backend",
    BACKEND_PORT: process.env.BACKEND_PORT || "8000",
    SESSION_SECRET: process.env.SESSION_SECRET || "s3cret1",
};

export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
```

## Detección de Contexto

```typescript
const isServer = typeof window === 'undefined';
const isDocker = process.env.DOCKER_ENV === 'true';

export const isProd = ENV.NODE_ENV === "production";
export const isDev = ENV.NODE_ENV === "development";
```

## Logging Optimizado

```typescript
// ✅ Solo loguea una vez al inicio y solo en desarrollo
let hasLoggedOnce = false;

export const logApiUrl = (isDev && isServer)
    ? (context?: string) => {
        if (!hasLoggedOnce) {
            console.log('🔧 [ENV CONFIG]', {
                isDocker,
                API_URL,
                BACKEND_HOST: ENV.BACKEND_HOST,
            });
            hasLoggedOnce = true;
        }
    }
    : () => {}; // No-op en producción
```

## Debug Info

```typescript
export const getEnvDebugInfo = () => ({
    ...ENV,
    currentApiUrl: API_URL,
    isServer,
    isDocker,
    isProduction: isProd,
});
```

---

# 🔑 jwt.server.ts

**Propósito:** Utilidades para manejo de JWT.

## Funciones

### `decodeJwtPayload(token: any)`

Decodifica payload de JWT sin validar firma.

```typescript
const payload = decodeJwtPayload(token);
console.log(payload.exp); // Timestamp de expiración
```

### `isExpired(token: any)`

Verifica si un token JWT está expirado.

```typescript
if (isExpired(accessToken)) {
    // Token expirado, necesita refresh
}
```

**Lógica:**
```typescript
const expirationTime = payload.exp * 1000;
const now = Date.now();
return now >= expirationTime;
```

---

# 🌐 api.server.ts

**Propósito:** Utilidades de API del lado del servidor.

## Variables

```typescript
export const API_URL = process.env.API_URL || "http://localhost:8000";
```

## MapGIS

### Tipos
```typescript
export type MapGisSearchType = 'cbml' | 'matricula' | 'direccion';
```

### Endpoints
```typescript
export const mapGisEndpoints = {
    cbml: `${API_URL}/api/lotes/public/cbml/`,
    matricula: `${API_URL}/api/lotes/public/matricula/`,
    direccion: `${API_URL}/api/lotes/public/direccion/`,
};
```

### `fetchMapGisData(type, value)`

Consulta datos de MapGIS.

```typescript
const data = await fetchMapGisData('cbml', '12345678901');
console.log(data.area, data.tratamiento);
```

## Permisos

### `checkPermission(userRole, requiredRole)`

Verifica permisos por jerarquía de roles.

```typescript
const hasPermission = checkPermission('admin', 'owner'); // true
const hasPermission = checkPermission('owner', 'admin'); // false
```

**Jerarquía:**
```
user (0) < developer (1) < owner (2) < admin (3)
```

---

# 🖥️ api.ts

**Propósito:** Cliente API para el navegador.

## Configuración

```typescript
const getApiBaseUrl = (): string => {
    if (typeof window === 'undefined') {
        // SSR - usar URL interna de Docker
        return process.env.VITE_API_URL || 'http://localhost:8000/api';
    }
    
    // Cliente - usar URL externa
    return process.env.VITE_API_URL_EXTERNAL || 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();
```

## Funciones

### `apiFetch(endpoint, options?)`

Fetch con configuración por defecto y fallback automático.

```typescript
const response = await apiFetch('/endpoint/', {
    method: 'POST',
    body: JSON.stringify(data)
});
```

**Características:**
- Headers por defecto (Content-Type, Accept)
- Logging detallado
- Fallback automático (SSR → cliente)

### `apiGet(endpoint)`

Helper para GET.

```typescript
const data = await apiGet('/users/');
```

### `apiPost(endpoint, data)`

Helper para POST.

```typescript
const result = await apiPost('/users/', { name: 'John' });
```

### `getApiDebugInfo()`

Información de debug.

```typescript
console.log(getApiDebugInfo());
// { API_BASE_URL, environment, envVars }
```

---

# 🗺️ roleToDashboard.ts

**Propósito:** Mapeo simple de roles a dashboards.

```typescript
import type { Role } from "~/utils/auth.server";

export function roleToDashboard(role: Role) {
    switch (role) {
        case "admin":
            return "/admin";
        case "owner":
            return "/owner";
        case "developer":
            return "/developer";
        default:
            return "/";
    }
}
```

**Uso:**
```typescript
const dashboardUrl = roleToDashboard(user.role);
return redirect(dashboardUrl);
```

---

# 🏗️ pot-analysis.ts

**Propósito:** Análisis de normativa POT para determinar vendibilidad.

## Tipos

### `PotData`
```typescript
export interface PotData {
    area?: number;
    clasificacion?: string;
    uso_suelo?: string;
    tratamiento?: string;
    densidad?: number;
    restricciones?: number;
    detalles_restricciones?: string[];
}
```

### `SellabilityResult`
```typescript
export interface SellabilityResult {
    canSell: boolean;
    reasons: string[];
    score: number; // 0-100
    recommendations: string[];
    treatmentDetails?: TreatmentDetails;
}
```

### `TreatmentDetails`
```typescript
export interface TreatmentDetails {
    name: string;
    description: string;
    implications: string[];
    requirements: string[];
    opportunities: string[];
}
```

## Funciones

### `analyzeSellability(potData: PotData): SellabilityResult`

Analiza si un lote puede venderse según normativa POT.

```typescript
const result = analyzeSellability({
    area: 250,
    clasificacion: "Urbano",
    uso_suelo: "Residencial",
    tratamiento: "Desarrollo",
    densidad: 150,
    restricciones: 0
});

console.log(result.canSell);    // true/false
console.log(result.score);      // 85 (0-100)
console.log(result.reasons);    // ["Uso residencial favorable...", ...]
```

**Criterios de análisis:**
1. **Restricciones graves** (impiden venta):
   - Zona de protección ambiental
   - Reserva forestal
   - Riesgo no mitigable
   - Zona de ronda hídrica
   - Humedal
   - Área protegida

2. **Tratamiento POT:**
   - Renovación Urbana: +10 puntos
   - Desarrollo: +15 puntos
   - Consolidación: neutro
   - Conservación: -20 puntos
   - Mejoramiento Integral: -10 puntos

3. **Uso del suelo:**
   - Residencial: +10 puntos
   - Comercial: +5 puntos
   - Dotacional/Institucional: -15 puntos

4. **Clasificación:**
   - Urbano: +5 puntos
   - Rural: -10 puntos
   - Expansión: neutro

5. **Densidad:**
   - > 200 viv/ha: +10 puntos
   - < 50 viv/ha: -5 puntos

**Score final:**
- Score < 30: `canSell = false`
- Score >= 30: `canSell = true` (con condiciones si score < 50)

### `extractPotDataFromText(text: string): PotData`

Extrae datos POT desde texto descriptivo (para respuestas de IA).

```typescript
const text = `
Área: 250 m²
Clasificación: Urbano
Uso del suelo: Residencial
Tratamiento: Desarrollo
Densidad: 150 viv/ha
Restricciones: 1 tipos identificados
`;

const potData = extractPotDataFromText(text);
console.log(potData.area);          // 250
console.log(potData.tratamiento);   // "Desarrollo"
```

## Información de Tratamientos

```typescript
const TREATMENTS_INFO: Record<string, TreatmentDetails> = {
    "Renovación Urbana": { /* ... */ },
    "Desarrollo": { /* ... */ },
    "Consolidación": { /* ... */ },
    "Conservación": { /* ... */ },
    "Mejoramiento Integral": { /* ... */ }
};
```

---

# 🏙️ ciudades.ts

**Propósito:** Lista de ciudades principales de Colombia para formularios.

```typescript
export const CIUDADES_COLOMBIA = [
    { value: 'medellin', label: 'Medellín' },
    { value: 'bogota', label: 'Bogotá' },
    { value: 'cali', label: 'Cali' },
    { value: 'barranquilla', label: 'Barranquilla' },
    { value: 'cartagena', label: 'Cartagena' },
    // ... 20 ciudades en total
] as const;

export type CiudadColombia = typeof CIUDADES_COLOMBIA[number];
```

**Uso:**
```tsx
<select>
    {CIUDADES_COLOMBIA.map(ciudad => (
        <option key={ciudad.value} value={ciudad.value}>
            {ciudad.label}
        </option>
    ))}
</select>
```

---

# 📄 documentHelpers.ts

**Propósito:** Helpers para gestión de documentos.

## Funciones

### `getDocumentDownloadUrl(document: any): string`

Obtiene URL de descarga con prioridad de campos.

```typescript
const url = getDocumentDownloadUrl(document);
// Prioridad: download_url > file_url > file
```

### `logDocumentAccess(document, action)`

Loguea acceso a documentos.

```typescript
logDocumentAccess(document, 'download');
// [Documents] DOWNLOAD: { id, title, url, ... }
```

### `handleDocumentDownload(document: any)`

Fuerza descarga de documento.

```typescript
<button onClick={() => handleDocumentDownload(doc)}>
    Descargar
</button>
```

**Implementación:**
```typescript
const link = window.document.createElement('a');
link.href = url;
link.download = document.file_name || document.title;
link.target = '_blank';
window.document.body.appendChild(link);
link.click();
window.document.body.removeChild(link);
```

### `handleDocumentPreview(document: any)`

Abre documento en nueva pestaña.

```typescript
<button onClick={() => handleDocumentPreview(doc)}>
    Ver
</button>
```

---

# 📊 Resumen de Utilidades

| Archivo | Propósito | Lado |
|---------|-----------|------|
| `auth.server.ts` | Autenticación JWT + cookies | Servidor |
| `session.server.ts` | Sesiones simplificadas | Servidor |
| `env.server.ts` | Variables de entorno | Servidor |
| `jwt.server.ts` | Utilidades JWT | Servidor |
| `api.server.ts` | Helpers API servidor | Servidor |
| `api.ts` | Cliente API navegador | Cliente |
| `roleToDashboard.ts` | Mapeo de roles | Ambos |
| `pot-analysis.ts` | Análisis POT | Ambos |
| `ciudades.ts` | Datos estáticos | Ambos |
| `documentHelpers.ts` | Gestión documentos | Cliente |

---

**Última actualización:** Enero 2025  
**Total de utilidades:** 10 archivos  
**Framework:** Remix 2.x  
**TypeScript:** 5.x
