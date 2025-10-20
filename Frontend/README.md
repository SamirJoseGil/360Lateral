### [README.md](file:///c%3A/Users/samir/Escritorio/360Lateral/Frontend/app/utils/README.md)

```markdown
# Utilidades - Documentación

Esta carpeta contiene utilidades y helpers reutilizables del sistema.

## 📋 Índice de Utilidades

1. [auth.server.ts](#authserverts) - Autenticación y Autorización
2. [env.server.ts](#envserverts) - Variables de Entorno
3. [api.server.ts](#apiserverts) - Helpers de API (Server)
4. [api.ts](#apits) - Helpers de API (Client)
5. [session.server.ts](#sessionserverts) - Gestión de Sesión
6. [jwt.server.ts](#jwtserverts) - Manejo de JWT
7. [roleToDashboard.ts](#roletodashboardts) - Navegación por Rol
8. [pot-analysis.ts](#pot-analysists) - Análisis POT

---

## 🔐 auth.server.ts

Sistema centralizado de autenticación, cookies y protección de rutas.

### Configuración de Cookies

```typescript
// Cookies configuradas automáticamente
const accessTokenCookie = createCookie("l360_access", {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: 60 * 60 // 1 hora
});

const refreshTokenCookie = createCookie("l360_refresh", {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7 // 7 días
});
```

### Funciones de Cookies

#### `getAccessTokenFromCookies(request)`
Obtiene el access token de las cookies.

```typescript
const token = await getAccessTokenFromCookies(request);

if (!token) {
  // Usuario no autenticado
}
```

#### `getRefreshTokenFromCookies(request)`
Obtiene el refresh token de las cookies.

```typescript
const refreshToken = await getRefreshTokenFromCookies(request);
```

#### `commitAuthCookies({ access, refresh })`
Serializa tokens en headers de cookies.

```typescript
const headers = await commitAuthCookies({
  access: "access-token-here",
  refresh: "refresh-token-here"
});

return redirect("/dashboard", { headers });
```

#### `clearAuthCookies()`
Limpia las cookies de autenticación.

```typescript
const headers = await clearAuthCookies();
return redirect("/login", { headers });
```

### Gestión de Usuario

#### `getUser(request)`
Obtiene el usuario autenticado actual.

```typescript
const user = await getUser(request);

if (!user) {
  // No autenticado
  throw redirect('/login');
}

// user.role: "admin" | "owner" | "developer"
```

**Características:**
- Implementa caché de 5 minutos
- Maneja invalidación automática
- Retorna `null` en rutas públicas

#### `requireAuth(request)`
Requiere autenticación o redirige a login.

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  // Si llegamos aquí, el usuario está autenticado
  const data = await getData(request);
  
  return json({ user, data });
}
```

#### `authenticateAdmin(request)`
Requiere rol de administrador.

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticateAdmin(request);
  
  // Solo admins llegan aquí
  const adminData = await getAdminData(request);
  
  return json({ adminData });
}
```

### Fetch Autenticado

#### `fetchWithAuth(request, url, options?)`
Realiza fetch con autenticación automática.

```typescript
const { res, setCookieHeaders } = await fetchWithAuth(
  request,
  `${API_URL}/api/some-endpoint/`,
  {
    method: 'POST',
    body: JSON.stringify({ data })
  }
);

if (!res.ok) {
  throw new Error('Request failed');
}

const data = await res.json();

return json({ data }, { headers: setCookieHeaders });
```

**Características:**
- Incluye access token automáticamente
- Maneja refresh de tokens si expira
- Retorna headers actualizados
- Soporta FormData y JSON

### Acciones de Autenticación

#### `loginAction(request)`
Maneja el proceso de login.

```typescript
export async function action({ request }: ActionFunctionArgs) {
  return await loginAction(request);
  
  // Automáticamente:
  // 1. Valida credenciales
  // 2. Guarda tokens en cookies
  // 3. Cachea usuario
  // 4. Redirige según rol
}
```

#### `logoutAction(request)`
Maneja el proceso de logout.

```typescript
export async function action({ request }: ActionFunctionArgs) {
  return await logoutAction(request);
  
  // Automáticamente:
  // 1. Limpia caché de usuario
  // 2. Invalida tokens en backend
  // 3. Limpia cookies
  // 4. Redirige a home
}
```

### Caché de Usuario

#### `clearUserCache(token?)`
Limpia el caché de usuario.

```typescript
// Limpiar todo el caché
clearUserCache();

// Limpiar caché de un token específico
clearUserCache(specificToken);

// Útil al:
// - Logout
// - Actualizar perfil
// - Cambiar roles
```

### Headers Helper

#### `mergeSetCookieHeaders({ loaderHeaders, parentHeaders })`
Combina headers de cookies de múltiples loaders.

```typescript
export const headers: HeadersFunction = ({ loaderHeaders, parentHeaders }) => {
  return mergeSetCookieHeaders({ loaderHeaders, parentHeaders });
};
```

---

## 🌐 env.server.ts

Configuración centralizada de variables de entorno.

### Variables Exportadas

```typescript
export const ENV = {
  API_BASE_URL: string,        // URL interna (SSR)
  API_BASE_URL_EXTERNAL: string, // URL externa (cliente)
  NODE_ENV: string,
  BACKEND_HOST: string,
  BACKEND_PORT: string,
};

export const API_URL: string;  // URL según contexto (SSR vs cliente)
export const isProd: boolean;
export const isDev: boolean;
```

### Funciones

#### `logApiUrl(context)`
Log de URL de API para debug.

```typescript
import { logApiUrl } from "~/utils/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
  logApiUrl("myLoader");
  // [myLoader] API_URL: http://backend:8000 (isServer: true)
  
  const data = await fetchData(request);
  return json({ data });
}
```

#### `getEnvDebugInfo()`
Información completa del entorno para debug.

```typescript
const debugInfo = getEnvDebugInfo();

console.log(debugInfo);
// {
//   API_BASE_URL: "http://backend:8000",
//   API_BASE_URL_EXTERNAL: "http://localhost:8000",
//   currentApiUrl: "http://backend:8000",
//   isServer: true,
//   isProduction: false,
//   ...
// }
```

### Uso Típico

```typescript
import { API_URL, isProd, logApiUrl } from "~/utils/env.server";

export async function loader({ request }: LoaderFunctionArgs) {
  logApiUrl("userLoader");
  
  const endpoint = `${API_URL}/api/users/`;
  
  if (isProd) {
    // Lógica específica de producción
  }
  
  const response = await fetch(endpoint);
  // ...
}
```

---

## 🌐 api.server.ts

Helpers de API para uso en servidor.

### Constantes

```typescript
export const API_URL: string;  // URL base de la API
```

### Tipos MapGIS

```typescript
export type MapGisSearchType = 'cbml' | 'matricula' | 'direccion';
```

### Funciones

#### `fetchMapGisData(type, value)`
Consulta datos de MapGIS.

```typescript
const data = await fetchMapGisData('cbml', '01-01-0001-0001-000');
const data = await fetchMapGisData('matricula', '123-456');
const data = await fetchMapGisData('direccion', 'Calle 123 #45-67');
```

#### `checkPermission(userRole, requiredRole)`
Verifica permisos basados en roles.

```typescript
const canAccess = checkPermission(user.role, 'admin');

if (!canAccess) {
  throw redirect('/unauthorized');
}

// Jerarquía de roles:
// user (0) < developer (1) < owner (2) < admin (3)
```

---

## 🌐 api.ts

Helpers de API para uso en cliente.

### Constantes

```typescript
export const API_BASE_URL: string;  // URL dinámica según contexto
```

### Funciones

#### `apiFetch(endpoint, options?)`
Fetch con configuración automática y fallback.

```typescript
const response = await apiFetch('/users/', {
  method: 'GET'
});

const data = await response.json();
```

**Características:**
- Agrega headers automáticamente
- Maneja errores de red
- Fallback automático en SSR
- Logging detallado

#### `apiGet(endpoint)`
Helper para GET requests.

```typescript
const users = await apiGet('/users/');
```

#### `apiPost(endpoint, data)`
Helper para POST requests.

```typescript
const result = await apiPost('/users/', {
  name: "John Doe",
  email: "john@example.com"
});
```

#### `getApiDebugInfo()`
Información de debug de la API.

```typescript
const debug = getApiDebugInfo();
console.log(debug);
// {
//   API_BASE_URL: "http://localhost:8000/api",
//   environment: "Client",
//   envVars: { ... }
// }
```

---

## 📦 session.server.ts

Gestión de sesiones con cookies.

### Storage

```typescript
export const sessionStorage: CookieSessionStorage;
```

### Funciones

#### `getSession(request)`
Obtiene la sesión actual.

```typescript
const session = await getSession(request);
const userId = session.get("userId");
```

#### `commitSession(session)`
Guarda cambios en la sesión.

```typescript
const session = await getSession(request);
session.set("userId", user.id);

const headers = new Headers();
headers.append("Set-Cookie", await commitSession(session));

return redirect("/dashboard", { headers });
```

#### `destroySession(session)`
Destruye la sesión.

```typescript
const session = await getSession(request);

const headers = new Headers();
headers.append("Set-Cookie", await destroySession(session));

return redirect("/login", { headers });
```

#### `getUserFromSession(request)`
Obtiene usuario de la sesión.

```typescript
const user = await getUserFromSession(request);

if (!user) {
  throw redirect('/login');
}
```

---

## 🔑 jwt.server.ts

Utilidades para manejo de JWT.

### Tipos

```typescript
export type JwtPayload = { 
  exp?: number; 
  [k: string]: unknown 
};
```

### Funciones

#### `decodeJwtPayload(token)`
Decodifica el payload de un JWT.

```typescript
const payload = decodeJwtPayload(token);

console.log(payload);
// {
//   user_id: "123",
//   email: "user@example.com",
//   exp: 1234567890,
//   iat: 1234567890
// }
```

#### `isExpired(token)`
Verifica si un token ha expirado.

```typescript
if (isExpired(accessToken)) {
  // Token expirado, necesita refresh
  const newToken = await refreshToken(refreshToken);
}
```

**Nota:** Estos helpers son principalmente para debugging. El sistema de autenticación maneja tokens automáticamente.

---

## 🎯 roleToDashboard.ts

Mapeo de roles a rutas de dashboard.

### Función

#### `roleToDashboard(role)`
Convierte rol a ruta de dashboard.

```typescript
import { roleToDashboard } from "~/utils/roleToDashboard";

const dashboardPath = roleToDashboard(user.role);

return redirect(dashboardPath);

// "admin" → "/admin"
// "owner" → "/owner"
// "developer" → "/developer"
// default → "/"
```

### Uso Típico

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  
  if (!user) {
    throw redirect('/login');
  }
  
  // Redirigir al dashboard correcto
  const dashboard = roleToDashboard(user.role);
  throw redirect(dashboard);
}
```

---

## 📐 pot-analysis.ts

Análisis de datos POT para determinar vendibilidad de lotes.

### Tipos

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

export interface SellabilityResult {
  canSell: boolean;
  reasons: string[];
  score: number; // 0-100
  recommendations: string[];
  treatmentDetails?: TreatmentDetails;
}
```

### Funciones

#### `analyzeSellability(potData)`
Analiza si un lote puede venderse basado en datos POT.

```typescript
const analysis = analyzeSellability({
  area: 250,
  clasificacion: "Urbano",
  uso_suelo: "Residencial",
  tratamiento: "Consolidación",
  densidad: 150,
  restricciones: 1,
  detalles_restricciones: ["Retiro obligatorio 5m"]
});

console.log(analysis);
// {
//   canSell: true,
//   score: 85,
//   reasons: ["Restricción: Retiro obligatorio 5m"],
//   recommendations: [
//     "Uso residencial favorable para desarrollo inmobiliario",
//     "Vendible pero con condiciones a considerar"
//   ],
//   treatmentDetails: { ... }
// }
```

**Sistema de Puntaje:**
- 100-80: Excelente vendibilidad
- 79-60: Buena vendibilidad
- 59-40: Vendible con condiciones
- 39-30: Vendibilidad limitada
- <30: No vendible

**Factores que Afectan el Score:**

```typescript
// Restricciones (-20 por restricción)
// Restricciones críticas (-50 adicional):
// - Zona de protección ambiental
// - Reserva forestal
// - Riesgo no mitigable
// - Zona de ronda hídrica

// Tratamiento:
// - Desarrollo: +15
// - Renovación Urbana: +10
// - Consolidación: 0
// - Mejoramiento Integral: -10
// - Conservación: -20

// Uso del Suelo:
// - Residencial: +10
// - Comercial: +5
// - Dotacional: -15

// Clasificación:
// - Urbano: +5
// - Rural: -10

// Densidad:
// - >200 viv/ha: +10
// - <50 viv/ha: -5
```

#### `extractPotDataFromText(text)`
Extrae datos POT de texto descriptivo.

```typescript
const text = `
  Área: 250 m²
  Clasificación: Urbano
  Uso del suelo: Residencial
  Tratamiento: Consolidación
  Densidad: 150 viv/ha
  Restricciones: 1 tipos identificados
`;

const potData = extractPotDataFromText(text);

console.log(potData);
// {
//   area: 250,
//   clasificacion: "Urbano",
//   uso_suelo: "Residencial",
//   tratamiento: "Consolidación",
//   densidad: 150,
//   restricciones: 1
// }
```

**Patrones de Extracción:**
- Área: `/Área: ([\d,.]+) m²/`
- Clasificación: `/Clasificación: (.+?)(?:\n|$)/`
- Uso del suelo: `/Uso del suelo: (.+?)(?:\n|$)/`
- Tratamiento: `/Tratamiento: (.+?)(?:\n|$)/`
- Densidad: `/Densidad: ([\d,.]+) viv\/ha/`
- Restricciones: `/Restricciones: (\d+) tipos identificados/`

### Información de Tratamientos POT

La utilidad incluye información detallada sobre cada tratamiento POT:

#### Renovación Urbana
- **Descripción**: Transformación de zonas con subutilización o deterioro
- **Implicaciones**: Mayor edificabilidad, requiere plan parcial
- **Oportunidades**: Incentivos fiscales, usos mixtos

#### Desarrollo
- **Descripción**: Urbanización de terrenos no urbanizados
- **Implicaciones**: Requiere plan parcial y licencia
- **Oportunidades**: Desarrollo completo, flexibilidad de diseño

#### Consolidación
- **Descripción**: Mantiene condiciones con densificación moderada
- **Implicaciones**: Permite densificación controlada
- **Oportunidades**: Desarrollo predial individual

#### Conservación
- **Descripción**: Protección de patrimonio
- **Implicaciones**: Restricciones significativas
- **Oportunidades**: Incentivos para conservación, valor cultural

#### Mejoramiento Integral
- **Descripción**: Superación de condiciones de marginalidad
- **Implicaciones**: Orientado a barrios informales
- **Oportunidades**: Mejora habitacional, legalización

---

## 🔧 Convenciones de Uso

### Imports

```typescript
// Utilidades de autenticación
import { getUser, requireAuth } from "~/utils/auth.server";

// Variables de entorno
import { API_URL, isProd } from "~/utils/env.server";

// Análisis POT
import { analyzeSellability } from "~/utils/pot-analysis";
```

### Manejo de Errores

```typescript
try {
  const user = await getUser(request);
  const data = await fetchData(request);
  
  return json({ user, data });
} catch (error) {
  console.error("[Module] Error:", error);
  
  if (error instanceof Response) {
    throw error;
  }
  
  return json(
    { error: "Error message" },
    { status: 500 }
  );
}
```

### Logging

```typescript
// Usar prefijos consistentes
console.log("[Auth] User logged in:", userId);
console.error("[API] Request failed:", error);
console.warn("[Cache] Cache miss for:", key);

// Usar logApiUrl para debug de URLs
import { logApiUrl } from "~/utils/env.server";
logApiUrl("contextName");
```

---

## 📝 Notas de Implementación

### Server-Side Only

Las utilidades `.server.ts` **solo** deben usarse en:
- Loaders
- Actions
- Otros archivos `.server.ts`

**Nunca** importar en componentes de cliente.

### Client-Side Compatible

Las utilidades sin `.server.ts` pueden usarse en:
- Componentes React
- Hooks personalizados
- Client-side code

### Type Safety

Todas las utilidades están completamente tipadas con TypeScript:

```typescript
// Tipos exportados para uso externo
export type Role = "admin" | "owner" | "developer";
export type ApiUser = { ... };
export type PotData = { ... };
export type SellabilityResult = { ... };
```

---

Para más información, consultar:
- Documentación Principal
- Servicios de API
- [Remix Documentation](https://remix.run/docs)