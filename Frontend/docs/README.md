# 📚 Documentación de 360Lateral - Frontend

Bienvenido al centro de documentación del frontend de 360Lateral. Aquí encontrarás toda la información necesaria para entender, desarrollar y mantener la aplicación.

---

## 🗂️ Estructura de la Documentación

```
docs/
├── README.md                          # Este archivo - Índice general
├── endpoints.md                       # Documentación completa del backend API
│
└── app/                               # Documentación específica de la app
    ├── readme.md                      # Guía maestra de la aplicación
    ├── components/
    │   └── components.md              # Componentes React reutilizables
    ├── contexts/
    │   └── contexts.md                # Contextos de React (NotificationContext)
    ├── routes/
    │   └── routes.md                  # Sistema de rutas de Remix
    ├── services/
    │   └── services.md                # Servicios del lado del servidor
    ├── utils/
    │   └── utils.md                   # Utilidades y helpers
    └── types/
        └── types.md                   # Definiciones TypeScript
```

---

## 🚀 Inicio Rápido

### Para Nuevos Desarrolladores

1. **Primero:** Lee [`app/readme.md`](./app/readme.md) - Resumen ejecutivo de la aplicación
2. **Luego:** Revisa [`routes/routes.md`](./app/routes/routes.md) - Sistema de rutas
3. **Después:** Consulta [`services/services.md`](./app/services/services.md) - Comunicación con el backend
4. **Finalmente:** Explora [`components/components.md`](./app/components/components.md) - Componentes UI

### Para Integración Backend-Frontend

1. Lee [`endpoints.md`](./endpoints.md) - API completa del backend
2. Revisa [`services/services.md`](./app/services/services.md) - Cómo consumir el backend
3. Consulta [`utils/utils.md`](./app/utils/utils.md) - Especialmente `auth.server.ts`

### Para Entender la Arquitectura

1. [`app/readme.md`](./app/readme.md) - Arquitectura general
2. [`routes/routes.md`](./app/routes/routes.md) - File-system routing de Remix
3. [`contexts/contexts.md`](./app/contexts/contexts.md) - Gestión de estado global

---

## 📖 Guías por Tema

### 🔐 Autenticación y Seguridad

- **Autenticación completa:** [`utils/utils.md#auth.server.ts`](./app/utils/utils.md#authserverts)
- **Endpoints de auth:** [`endpoints.md#autenticación`](./endpoints.md#autenticación)
- **Rutas protegidas:** [`routes/routes.md#protección-de-rutas`](./app/routes/routes.md#protección-de-rutas)

**Conceptos clave:**
- JWT con cookies HTTP-only
- Refresh automático de tokens
- Protección por rol (admin, owner, developer)
- Caché de usuarios en memoria

---

### 🏘️ Gestión de Lotes

- **Componentes:** [`components/components.md#componentes-de-lotes`](./app/components/components.md#componentes-de-lotes)
- **Servicios:** [`services/services.md#lotesserverts`](./app/services/services.md#lotesserverts)
- **Endpoints:** [`endpoints.md#lotes`](./endpoints.md#lotes)
- **Tipos:** [`types/types.md#lotet`](./app/types/types.md#lotet)

**Componentes principales:**
- `LoteCard` - Tarjeta de presentación
- `LocationPicker` - Selector de ubicación interactivo
- `MapView` - Visualización de mapa
- `POTInfo` - Información de normativa

---

### 📄 Sistema de Documentos

- **Servicios:** [`services/services.md#documentsserverts`](./app/services/services.md#documentsserverts)
- **Endpoints:** [`endpoints.md#documentos`](./endpoints.md#documentos)
- **Componentes:** [`components/components.md#documentstatusindicator`](./app/components/components.md#documentstatusindicator)

**Tipos de documentos:**
- CTL, Planos, Topografía, Licencias, Escrituras, Avalúos, Estudios de suelos

---

### 🔔 Sistema de Notificaciones

- **Context:** [`contexts/contexts.md#notificationcontext`](./app/contexts/contexts.md#notificationcontext)
- **Endpoints:** [`endpoints.md#notificaciones`](./endpoints.md#notificaciones)
- **Componentes:** [`components/components.md#notificationbell`](./app/components/components.md#notificationbell)

**Características:**
- Polling cada 30 segundos
- Actualización optimista
- Panel desplegable
- Integración con Remix Fetcher

---

### 📊 Normativa POT

- **Servicios:** [`services/services.md#potserverts`](./app/services/services.md#potserverts)
- **Endpoints:** [`endpoints.md#pot-normativa`](./endpoints.md#pot-normativa)
- **Componentes:** [`components/components.md#potinfo`](./app/components/components.md#potinfo)
- **Análisis:** [`utils/utils.md#pot-analysists`](./app/utils/utils.md#pot-analysists)

**Funcionalidades:**
- Consulta de normativa por CBML
- Cálculo de aprovechamiento
- Análisis de vendibilidad
- Tratamientos POT activos

---

## 🎯 Arquitectura y Patrones

### Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Remix** | 2.x | Framework full-stack |
| **React** | 18+ | Biblioteca UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.x | Estilos utility-first |
| **Leaflet** | 1.9+ | Mapas interactivos |
| **Django** | 4.x | Backend API |

### Patrones de Diseño

**1. Server-Side Rendering (SSR)**
```typescript
// Loader ejecutado en el servidor
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    const data = await fetchData(request);
    return json({ user, data });
}
```

**2. Optimistic Updates**
```typescript
// Actualizar UI inmediatamente, sincronizar después
const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
    ));
    
    fetcher.submit({ action: 'mark_read', id });
};
```

**3. Progressive Enhancement**
```typescript
// Funciona sin JavaScript, mejora con él
<Form method="post">
    <button type="submit">Guardar</button>
</Form>
```

---

## 🔄 Flujos de Trabajo Comunes

### Crear una Nueva Ruta Protegida

```typescript
// app/routes/owner.nueva-ruta.tsx
import { json } from "@remix-run/node";
import { requireUser } from "~/utils/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    if (user.role !== 'owner') {
        return redirect(`/${user.role}`);
    }
    
    return json({ user });
}

export default function NuevaRuta() {
    return <div>Contenido de la ruta</div>;
}
```

### Agregar un Nuevo Servicio

```typescript
// app/services/mi-servicio.server.ts
import { fetchWithAuth } from "~/utils/auth.server";
import { API_URL } from "~/utils/env.server";

export async function getMiData(request: Request) {
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/mi-endpoint/`
    );
    
    const data = await res.json();
    return { data, headers: setCookieHeaders };
}
```

### Crear un Componente Reutilizable

```tsx
// app/components/MiComponente.tsx
interface MiComponenteProps {
    title: string;
    onAction: () => void;
}

export function MiComponente({ title, onAction }: MiComponenteProps) {
    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h2>{title}</h2>
            <button onClick={onAction}>Acción</button>
        </div>
    );
}
```

---

## 📁 Archivos de Configuración (Raíz)

### `.dockerignore`
Archivos excluidos del contenedor Docker.

**Contenido principal:**
```
node_modules/
.git/
.env
build/
.cache/
```

---

### `.env` y `.env.example`

Variables de entorno para desarrollo.

**Variables principales:**
```bash
# Backend
API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
VITE_API_URL_EXTERNAL=http://localhost:8000

# Session
SESSION_SECRET=your_secret_key

# Docker
DOCKER_ENV=false
BACKEND_HOST=backend
BACKEND_PORT=8000

# Maps
GOOGLE_MAPS_API_KEY=your_key
```

**Documentación completa:** [`utils/utils.md#envserverts`](./app/utils/utils.md#envserverts)

---

### `.eslintrc.cjs`

Configuración de ESLint para linting de código.

**Reglas principales:**
- TypeScript strict
- React hooks
- Import order
- Accessibility (a11y)

---

### `.gitignore`

Archivos ignorados por Git.

**Principales exclusiones:**
```
node_modules/
.env
build/
.cache/
*.log
.DS_Store
```

---

### `Dockerfile`

Configuración para contenedor Docker de producción.

**Características:**
- Multi-stage build
- Node 20 Alpine
- Optimización de capas
- Usuario no-root

---

### `package.json`

Configuración de dependencias y scripts del proyecto.

**Scripts principales:**
```json
{
    "dev": "remix vite:dev --host 0.0.0.0 --port 3000",
    "build": "remix vite:build",
    "start": "remix-serve ./build/server/index.js",
    "typecheck": "tsc"
}
```

**Dependencias principales:**
- `@remix-run/node`, `@remix-run/react` - Framework
- `react`, `react-dom` - UI
- `leaflet`, `react-leaflet` - Mapas
- `react-markdown` - Renderizado Markdown
- `tailwindcss` - Estilos

---

### `tailwind.config.ts`

Configuración personalizada de Tailwind CSS.

**Colores personalizados:**
```typescript
colors: {
    lateral: {
        50: "#F5F7FB",
        500: "#2E4E9D",  // Principal
        600: "#1A3A87",
    },
    naranja: {
        500: "#FF6B35",  // Acento
    }
}
```

**Fuentes:**
- `sans`: Inter
- `display`: Montserrat

---

### `tsconfig.json`

Configuración de TypeScript.

**Características clave:**
```json
{
    "compilerOptions": {
        "strict": true,
        "esModuleInterop": true,
        "jsx": "react-jsx",
        "moduleResolution": "Bundler",
        "paths": {
            "~/*": ["./app/*"]
        }
    }
}
```

---

### `vite.config.ts`

Configuración de Vite (bundler).

**Características:**
- Plugin de Remix
- Paths de TypeScript
- Variables de entorno expuestas
- Hot Module Replacement (HMR)
- Server configurado para Docker

---

## 🛠️ Herramientas de Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con HMR

# Producción
npm run build        # Build optimizado
npm run start        # Servidor de producción

# Validación
npm run typecheck    # Verificar tipos TypeScript
npm run lint         # Ejecutar ESLint
```

### Debugging

**VS Code:**
```json
{
    "type": "node",
    "request": "launch",
    "name": "Remix Dev",
    "runtimeExecutable": "npm",
    "runtimeArgs": ["run", "dev"],
    "port": 3000
}
```

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Componentes** | 20+ |
| **Rutas** | 50+ |
| **Servicios** | 9 |
| **Contexts** | 1 |
| **Utilidades** | 10+ |
| **Tipos** | 2+ principales |
| **Endpoints Backend** | 60+ |
| **Líneas de Código** | ~15,000+ |

---

## 🔗 Enlaces Útiles

### Documentación Externa

- [Remix Documentation](https://remix.run/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)

### Repositorio

- **GitHub:** [360Lateral/Frontend](https://github.com/360Lateral/Frontend)
- **Issues:** Reportar bugs o solicitar features
- **Wiki:** Guías adicionales y tutoriales

---

## 🤝 Contribución

### Proceso de Desarrollo

1. Crear branch desde `develop`
2. Hacer cambios con commits descriptivos
3. Crear Pull Request con descripción clara
4. Code review por al menos un desarrollador
5. Merge a `develop`
6. Testing en staging
7. Merge a `main` para producción

### Estándares de Código

- **TypeScript:** Siempre tipar funciones y componentes
- **ESLint:** Corregir todos los warnings
- **Prettier:** Formateo automático (configurado)
- **Commits:** Mensajes descriptivos en español
- **Testing:** Agregar tests para funcionalidades críticas

---

## 📞 Soporte

### Para Consultas

1. **Documentación:** Revisar primero esta guía
2. **Stack Overflow:** Tag `remix` + `react`
3. **Slack:** Canal #frontend-support
4. **Email:** dev@360lateral.com

### Para Reportar Bugs

1. Verificar que no exista issue similar
2. Crear issue en GitHub con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs. actual
   - Screenshots si aplica
   - Versión de Node/npm
   - Sistema operativo

---

## 🚀 Roadmap

### Completado ✅
- Sistema de autenticación JWT
- Gestión de lotes por rol
- Sistema de documentos
- Notificaciones en tiempo real
- Búsqueda avanzada
- Análisis urbanístico con IA

### En Progreso 🚧
- Panel de análisis financiero
- Sistema de mensajería interna
- Integración de pagos
- Tests unitarios y E2E

### Futuro 🔮
- WebSockets para notificaciones real-time
- Sistema de ofertas y negociación
- Tours virtuales 360°
- App móvil (React Native)
- Machine Learning para recomendaciones

---

## 📄 Licencia

Propietario - 360Lateral © 2025  
Todos los derechos reservados.

---

## 📝 Changelog

### v2.0.0 (Enero 2025)
- ✅ Migración a Remix 2.x
- ✅ Sistema de notificaciones mejorado
- ✅ Análisis urbanísticos con IA
- ✅ Documentación completa

### v1.0.0 (Diciembre 2024)
- 🎉 Lanzamiento inicial
- ✅ Sistema base de autenticación
- ✅ CRUD de lotes
- ✅ Gestión de documentos

---

**Última actualización:** Enero 2025  
**Versión de la documentación:** 2.0  
**Mantenido por:** Equipo de Desarrollo 360Lateral

**¡Gracias por contribuir a 360Lateral!** 🚀
