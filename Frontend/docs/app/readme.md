# 📘 Documentación Completa - 360Lateral Frontend

Bienvenido a la documentación completa de la aplicación frontend de 360Lateral. Esta guía te ayudará a navegar por toda la arquitectura, componentes, servicios y rutas de la aplicación.

---

## 🎯 Resumen Ejecutivo

**360Lateral** es una plataforma web desarrollada con **Remix 2.x** y **TypeScript** que conecta propietarios de lotes urbanos con desarrolladores inmobiliarios. La aplicación facilita:

- 📋 Gestión y validación de lotes urbanos
- 🤖 Análisis urbanísticos con IA
- 📄 Manejo de documentación y certificaciones
- 🔍 Búsqueda avanzada de oportunidades de inversión
- 🔐 Sistema de autenticación robusto con JWT
- 👥 Roles diferenciados: Admin, Owner, Developer

---

## 📚 Índice de Documentación

### 🏗️ Arquitectura Principal

1. **[Components](./components/components.md)** - Componentes reutilizables de React
   - Componentes de Admin
   - Formularios
   - Layout (Navbar, Footer, Sidebar)
   - Componentes de Lotes
   - Componentes de Registro

2. **[Contexts](./contexts/contexts.md)** - Gestión de estado global
   - NotificationContext - Sistema de notificaciones en tiempo real

3. **[Routes](./routes/routes.md)** - Sistema de rutas de Remix
   - Rutas públicas (Landing, Login, Register)
   - API Routes (proxy al backend)
   - Rutas de Admin
   - Rutas de Owner
   - Rutas de Developer

4. **[Services](./services/services.md)** - Servicios del lado del servidor
   - Servicios de autenticación
   - Gestión de lotes
   - Gestión de documentos
   - Sistema de notificaciones
   - Normativa POT

5. **[Utils](./utils/utils.md)** - Utilidades y helpers
   - Autenticación (auth.server.ts)
   - Sesiones (session.server.ts)
   - Variables de entorno (env.server.ts)
   - Análisis POT (pot-analysis.ts)

6. **[Types](./types/types.md)** - Definiciones de tipos TypeScript
   - Tipo Lote
   - Tipos de documentos
   - Tipos de usuarios

---

## 🚀 Tecnologías Principales

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Remix** | 2.x | Framework full-stack React |
| **React** | 18+ | Biblioteca UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.x | Framework CSS utility-first |
| **Leaflet** | 1.9+ | Mapas interactivos |
| **React Markdown** | 9.x | Renderizado de Markdown |

---

## 📂 Estructura del Proyecto

```
Frontend/
├── app/
│   ├── components/          # Componentes React reutilizables
│   │   ├── admin/          # Componentes específicos de admin
│   │   ├── forms/          # Componentes de formularios
│   │   ├── layout/         # Layout (Navbar, Footer, Sidebar)
│   │   ├── lotes/          # Componentes de lotes
│   │   └── register/       # Componentes de registro
│   ├── contexts/           # Contextos de React
│   │   └── NotificationContext.tsx
│   ├── routes/             # Rutas de Remix (50+ archivos)
│   │   ├── _index.tsx      # Landing page
│   │   ├── login.tsx       # Autenticación
│   │   ├── admin.*         # Rutas de admin
│   │   ├── owner.*         # Rutas de propietarios
│   │   ├── developer.*     # Rutas de desarrolladores
│   │   └── api.*           # API routes (proxy)
│   ├── services/           # Servicios del servidor
│   │   ├── auth.server.ts
│   │   ├── lotes.server.ts
│   │   ├── documents.server.ts
│   │   ├── pot.server.ts
│   │   └── users.server.ts
│   ├── utils/              # Utilidades
│   │   ├── auth.server.ts
│   │   ├── session.server.ts
│   │   ├── env.server.ts
│   │   └── pot-analysis.ts
│   ├── types/              # Definiciones TypeScript
│   │   └── lote.ts
│   └── styles/             # Estilos globales
└── docs/                   # Esta documentación
```

---

## 🎨 Arquitectura de la Aplicación

### Flujo de Autenticación

```
1. Usuario → Login/Register
2. Backend → JWT (access + refresh tokens)
3. Remix → Cookies HTTP-only
4. Cada request → fetchWithAuth() agrega tokens
5. Token expirado → Refresh automático
6. Logout → Invalidar tokens + limpiar cookies
```

**Detalle completo:** [Utils - auth.server.ts](./utils/utils.md#authserverts)

---

### Roles y Permisos

#### 👨‍💼 Admin
- ✅ Gestión completa de usuarios
- ✅ Validación de lotes y documentos
- ✅ Gestión de análisis urbanísticos
- ✅ Estadísticas del sistema
- ✅ Configuración de normativa POT

**Rutas:** [Admin Routes](./routes/routes.md#rutas-de-admin)

#### 🏘️ Owner (Propietario)
- ✅ Registro y gestión de lotes propios
- ✅ Subida de documentación
- ✅ Solicitud de análisis urbanísticos
- ✅ Seguimiento de validaciones

**Rutas:** [Owner Routes](./routes/routes.md#rutas-de-owner)

#### 👨‍💻 Developer (Desarrollador)
- ✅ Búsqueda avanzada de lotes
- ✅ Sistema de favoritos
- ✅ Configuración de criterios de inversión
- ✅ Solicitud de análisis de lotes favoritos

**Rutas:** [Developer Routes](./routes/routes.md#rutas-de-developer)

---

## 🔧 Componentes Principales

### 1. Sistema de Notificaciones

**Context:** [NotificationContext](./contexts/contexts.md#notificationcontext)

```tsx
import { useNotifications } from '~/contexts/NotificationContext';

function MyComponent() {
    const { notifications, unreadCount, markAsRead } = useNotifications();
    
    return (
        <button onClick={() => setShowPanel(true)}>
            🔔 Notificaciones ({unreadCount})
        </button>
    );
}
```

**Características:**
- Polling automático cada 30 segundos
- Actualización optimista de UI
- Panel desplegable con acciones
- Integración con Remix Fetcher

---

### 2. Gestión de Lotes

**Componentes:** [Lotes Components](./components/components.md#componentes-de-lotes)

- **LoteCard** - Tarjeta de presentación de lote
- **MapView** - Visualización de ubicación (solo lectura)
- **LocationPicker** - Selector interactivo de ubicación
- **DocumentStatusIndicator** - Estado de documentos
- **POTInfo** - Información de normativa POT
- **RequiredDocumentsNotice** - Aviso de documentos pendientes

---

### 3. Layout y Navegación

**Componentes:** [Layout Components](./components/components.md#componentes-de-layout)

- **Navbar** - Barra de navegación con autenticación
- **Sidebar** - Navegación lateral por rol
- **Footer** - Footer global con links
- **NotificationBell** - Campana de notificaciones

---

## 🔐 Servicios del Servidor

Todos los servicios siguen un patrón consistente:

```typescript
export async function serviceName(request: Request, ...params) {
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

    // 4. Retornar con headers
    return { data, headers: setCookieHeaders };
}
```

**Documentación completa:** [Services](./services/services.md)

### Servicios Disponibles

| Servicio | Propósito | Archivo |
|----------|-----------|---------|
| **auth.server.ts** | Autenticación JWT | [Ver docs](./services/services.md#authserverts) |
| **lotes.server.ts** | Gestión de lotes | [Ver docs](./services/services.md#lotesserverts) |
| **documents.server.ts** | Gestión de documentos | [Ver docs](./services/services.md#documentsserverts) |
| **pot.server.ts** | Normativa POT | [Ver docs](./services/services.md#potserverts) |
| **users.server.ts** | Gestión de usuarios | [Ver docs](./services/services.md#usersserverts) |
| **notifications.server.ts** | Notificaciones | [Ver docs](./services/services.md#notificationsserverts) |
| **investment.server.ts** | Perfiles de inversión | [Ver docs](./services/services.md#investmentserverts) |

---

## 🛣️ Sistema de Rutas

Remix utiliza file-system routing con convenciones específicas:

### Convenciones de Nomenclatura

```
admin.tsx                    → /admin/* (layout)
admin._index.tsx             → /admin (index)
admin.lotes.tsx              → /admin/lotes
admin.lote.$id.tsx           → /admin/lote/:id
admin.lotes_.$id.editar.tsx  → /admin/lotes/:id/editar
```

**Guía completa:** [Routes Documentation](./routes/routes.md)

### Rutas por Categoría

- **Públicas:** Landing, Login, Register, About, 404
- **API:** `/api/auth/*`, `/api/notifications`
- **Admin:** Dashboard, Usuarios, Lotes, Análisis, Validación
- **Owner:** Dashboard, Mis Lotes, Documentos, Análisis
- **Developer:** Dashboard, Búsqueda, Favoritos, Inversión, Análisis

---

## 🔑 Autenticación y Sesión

### Flujo de Login

```typescript
// 1. Usuario envía credenciales
POST /api/auth/login
Body: { email, password, remember }

// 2. Backend valida y retorna tokens
Response: { access, refresh, user }

// 3. Remix guarda en cookies HTTP-only
Set-Cookie: l360_access=...; HttpOnly; Secure
Set-Cookie: l360_refresh=...; HttpOnly; Secure

// 4. Redirige a dashboard según rol
Redirect: /${user.role}
```

### fetchWithAuth

Todas las peticiones autenticadas usan `fetchWithAuth`:

```typescript
const { res, setCookieHeaders } = await fetchWithAuth(
    request,
    `${API_URL}/api/endpoint/`,
    {
        method: 'POST',
        body: JSON.stringify(data)
    }
);

return json(data, { headers: setCookieHeaders });
```

**Características:**
- ✅ Agrega token automáticamente
- ✅ Detecta expiración (401)
- ✅ Refresca token automáticamente
- ✅ Reintenta request con nuevo token
- ✅ Retorna headers actualizados

**Documentación:** [Utils - auth.server.ts](./utils/utils.md#authserverts)

---

## 📄 Gestión de Documentos

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

### Upload de Documentos

```typescript
// ⚠️ IMPORTANTE: Usar FormData para archivos
const formData = new FormData();
formData.append('archivo', file);
formData.append('document_type', 'ctl');
formData.append('lote', loteId);

const { res } = await fetchWithAuth(request, '/api/documentos/', {
    method: 'POST',
    body: formData  // NO usar JSON.stringify()
});
```

**Documentación:** [Services - documents.server.ts](./services/services.md#documentsserverts)

---

## 🏗️ Normativa POT

### Análisis de Aprovechamiento

El sistema integra normativa POT (Plan de Ordenamiento Territorial) para análisis urbanístico:

```typescript
import { analyzeSellability } from '~/utils/pot-analysis';

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
console.log(result.reasons);    // Array de razones
```

**Documentación:** [Utils - pot-analysis.ts](./utils/utils.md#pot-analysists)

---

## 🎨 Estilos y Diseño

### Colores de Marca

```css
/* Lateral (Owner) */
--lateral-600: #0284c7;  /* Azul principal */
--lateral-700: #0369a1;  /* Azul oscuro */

/* Indigo (Developer) */
--indigo-600: #4f46e5;   /* Índigo principal */
--indigo-700: #4338ca;   /* Índigo oscuro */

/* Naranja (Acento) */
--naranja-500: #f97316;  /* Naranja acento */
```

### Componentes de UI

- **Tailwind CSS** para utility-first styling
- **Clases personalizadas** en `app/styles/tailwind.css`
- **Componentes reutilizables** con variants
- **Responsive design** mobile-first

---

## 🧪 Testing (Futuro)

### Estructura Recomendada

```
Frontend/
├── tests/
│   ├── unit/              # Tests unitarios
│   ├── integration/       # Tests de integración
│   └── e2e/               # Tests end-to-end
```

### Herramientas Sugeridas

- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW** - API mocking

---

## 🚀 Despliegue

### Variables de Entorno

```bash
# Backend
API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000/api
VITE_API_URL_EXTERNAL=http://localhost:8000/api

# Session
SESSION_SECRET=your_secret_key

# Docker (opcional)
DOCKER_ENV=true
BACKEND_HOST=backend
BACKEND_PORT=8000

# Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Documentación:** [Utils - env.server.ts](./utils/utils.md#envserverts)

---

## 📖 Guías Rápidas

### Crear una Nueva Ruta Protegida

```typescript
// app/routes/owner.nueva-ruta.tsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    if (user.role !== 'owner') {
        return redirect(`/${user.role}`);
    }
    
    return json({ user });
}

export default function NuevaRuta() {
    const { user } = useLoaderData<typeof loader>();
    
    return (
        <div>
            <h1>Nueva Ruta para {user.role}</h1>
        </div>
    );
}
```

---

### Agregar un Nuevo Componente

```tsx
// app/components/MiComponente.tsx
interface MiComponenteProps {
    title: string;
    onAction: () => void;
}

export function MiComponente({ title, onAction }: MiComponenteProps) {
    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold">{title}</h2>
            <button 
                onClick={onAction}
                className="mt-4 px-4 py-2 bg-lateral-600 text-white rounded"
            >
                Acción
            </button>
        </div>
    );
}
```

---

### Crear un Nuevo Servicio

```typescript
// app/services/mi-servicio.server.ts
import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export async function getMiData(request: Request) {
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/mi-endpoint/`
    );
    
    if (!res.ok) {
        throw new Error("Error loading data");
    }
    
    const data = await res.json();
    
    return { data, headers: setCookieHeaders };
}
```

---

## 🐛 Debugging

### Logs Importantes

```typescript
// En desarrollo, buscar en consola:
console.log('[Auth] Token verified for:', user.email);
console.log('[Service] Success:', items.length, 'items loaded');
console.error('[Service] Error:', res.status, errorText);
```

### Herramientas de Debug

- **Remix Dev Tools** - Panel de debug integrado
- **React DevTools** - Inspector de componentes
- **Network Tab** - Inspeccionar peticiones
- **Redux DevTools** (futuro) - Para state management

---

## 📝 Mejores Prácticas

### 1. Autenticación
- ✅ Siempre usar `requireUser()` en rutas protegidas
- ✅ Validar rol en el loader
- ✅ Usar `fetchWithAuth()` para todas las peticiones autenticadas
- ✅ Retornar `setCookieHeaders` en json/redirect

### 2. Manejo de Errores
- ✅ Usar try-catch en servicios
- ✅ Propagar errores para ErrorBoundary
- ✅ Mostrar mensajes amigables al usuario
- ✅ Loguear errores en servidor

### 3. Performance
- ✅ Usar `defer()` para datos no críticos
- ✅ Implementar paginación en listas
- ✅ Lazy load de componentes pesados
- ✅ Optimizar imágenes y assets

### 4. Seguridad
- ✅ Cookies HTTP-only para tokens
- ✅ CSRF protection (manejado por Remix)
- ✅ Validación de entrada en servidor
- ✅ Sanitización de datos del usuario

---

## 🔗 Links Útiles

### Documentación Externa

- [Remix Documentation](https://remix.run/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)

### Repositorio

- **Frontend:** `c:\Users\samir\Documents\GitHub\360Lateral\Frontend`
- **Backend:** `c:\Users\samir\Documents\GitHub\360Lateral\Backend` (Django)

---

## 👥 Equipo y Contribución

### Estructura del Equipo

- **Frontend:** Remix + React + TypeScript
- **Backend:** Django + DRF + PostgreSQL
- **DevOps:** Docker + Docker Compose

### Proceso de Contribución

1. Crear branch desde `develop`
2. Hacer cambios con commits descriptivos
3. Crear Pull Request
4. Code review
5. Merge a `develop`
6. Deploy a staging
7. Merge a `main` para producción

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Componentes** | 20+ |
| **Rutas** | 50+ |
| **Servicios** | 9 |
| **Contexts** | 1 (Notifications) |
| **Utilidades** | 10+ |
| **Tipos TypeScript** | 2+ principales |
| **Líneas de Código** | ~15,000+ |

---

## 🎓 Glosario

| Término | Definición |
|---------|------------|
| **CBML** | Código Base de Medellín para Lotes (11 dígitos) |
| **POT** | Plan de Ordenamiento Territorial |
| **VIS** | Vivienda de Interés Social |
| **CTL** | Certificado de Tradición y Libertad |
| **JWT** | JSON Web Token (autenticación) |
| **SSR** | Server-Side Rendering |
| **Fetcher** | Herramienta de Remix para peticiones |

---

## 📅 Roadmap

### Completado ✅
- Sistema de autenticación JWT
- Gestión de lotes por rol
- Sistema de documentos
- Notificaciones en tiempo real
- Análisis urbanístico con IA
- Búsqueda avanzada
- Sistema de favoritos

### En Progreso 🚧
- Panel de análisis financiero
- Sistema de mensajería
- Integración de pagos
- App móvil (React Native)

### Futuro 🔮
- WebSockets para notificaciones real-time
- Sistema de ofertas y negociación
- Tours virtuales 360°
- Integración con blockchain
- Machine Learning para recomendaciones

---

## 📞 Soporte

Para preguntas o problemas:

1. **Documentación:** Revisar esta guía completa
2. **Issues:** Crear issue en GitHub
3. **Slack:** Canal #frontend-support
4. **Email:** dev@360lateral.com

---

## 📄 Licencia

Propietario - 360Lateral © 2025  
Todos los derechos reservados.

---

**Última actualización:** Enero 2025  
**Versión de la documentación:** 1.0  
**Versión de la aplicación:** 2.0

**¡Gracias por usar 360Lateral!** 🚀
