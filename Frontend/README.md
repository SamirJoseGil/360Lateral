# 🏗️ 360Lateral - Frontend

Plataforma web que conecta propietarios de lotes urbanos con desarrolladores inmobiliarios, facilitando la compra-venta de terrenos mediante análisis urbanísticos con IA y gestión documental completa.

---

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#sobre-el-proyecto)
- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Desarrollo](#desarrollo)
- [Producción](#producción)
- [Testing](#testing)
- [Documentación](#documentación)
- [Convenciones de Código](#convenciones-de-código)
- [Contribución](#contribución)
- [Licencia](#licencia)

---

## 🎯 Sobre el Proyecto

**360Lateral** es una aplicación web full-stack desarrollada con Remix que permite:

### Para Propietarios (Owners)
- 📋 Registro y gestión de lotes urbanos
- 📄 Subida y validación de documentos legales
- 🤖 Solicitud de análisis urbanísticos con IA
- 📊 Seguimiento del estado de lotes y documentos

### Para Desarrolladores (Developers)
- 🔍 Búsqueda avanzada de lotes disponibles
- ❤️ Sistema de favoritos
- 📈 Configuración de criterios de inversión
- 🤖 Análisis urbanísticos de lotes de interés

### Para Administradores (Admins)
- 👥 Gestión completa de usuarios
- ✅ Validación de lotes y documentos
- 🔧 Administración de análisis urbanísticos
- 📊 Panel de estadísticas del sistema

---

## 🚀 Tecnologías

### Core
- **[Remix 2.x](https://remix.run/)** - Framework full-stack React
- **[React 18+](https://react.dev/)** - Biblioteca UI
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Tipado estático
- **[Node.js](https://nodejs.org/)** - Runtime JavaScript

### Estilos
- **[Tailwind CSS 3.x](https://tailwindcss.com/)** - Framework CSS utility-first
- **CSS Custom Properties** - Variables CSS personalizadas

### Mapas y Geolocalización
- **[Leaflet 1.9+](https://leafletjs.com/)** - Biblioteca de mapas interactivos
- **[React Leaflet](https://react-leaflet.js.org/)** - Componentes React para Leaflet

### Utilidades
- **[React Markdown](https://github.com/remarkjs/react-markdown)** - Renderizado de Markdown
- **[date-fns](https://date-fns.org/)** - Manejo de fechas
- **[clsx](https://github.com/lukeed/clsx)** - Utilidad para clases condicionales

### Backend
- **Django 4.x** - API REST (repositorio separado)
- **PostgreSQL** - Base de datos

---

## 📂 Estructura del Proyecto

```
Frontend/
├── app/
│   ├── components/           # Componentes React reutilizables
│   │   ├── admin/           # Componentes específicos de admin
│   │   ├── forms/           # Componentes de formularios
│   │   ├── layout/          # Layout (Navbar, Footer, Sidebar)
│   │   ├── lotes/           # Componentes de lotes
│   │   └── register/        # Componentes de registro
│   │
│   ├── contexts/            # Contextos de React
│   │   └── NotificationContext.tsx
│   │
│   ├── routes/              # Rutas de Remix (50+ archivos)
│   │   ├── _index.tsx       # Landing page
│   │   ├── login.tsx        # Autenticación
│   │   ├── admin.*          # Rutas de admin
│   │   ├── owner.*          # Rutas de propietarios
│   │   ├── developer.*      # Rutas de desarrolladores
│   │   └── api.*            # API routes (proxy)
│   │
│   ├── services/            # Servicios del servidor (.server.ts)
│   │   ├── auth.server.ts
│   │   ├── lotes.server.ts
│   │   ├── documents.server.ts
│   │   ├── pot.server.ts
│   │   ├── users.server.ts
│   │   └── notifications.server.ts
│   │
│   ├── utils/               # Utilidades
│   │   ├── auth.server.ts   # Sistema de autenticación
│   │   ├── session.server.ts
│   │   ├── env.server.ts
│   │   └── pot-analysis.ts
│   │
│   ├── types/               # Definiciones TypeScript
│   │   └── lote.ts
│   │
│   ├── styles/              # Estilos globales
│   │   ├── tailwind.css
│   │   └── app.css
│   │
│   ├── entry.client.tsx     # Punto de entrada del cliente
│   ├── entry.server.tsx     # Punto de entrada del servidor
│   └── root.tsx             # Layout raíz
│
├── public/                  # Assets estáticos
│   ├── favicon.ico
│   ├── images/
│   └── fonts/
│
├── docs/                    # Documentación completa
│   ├── README.md            # Índice general de documentación
│   ├── endpoints.md         # Endpoints del backend API
│   └── app/
│       ├── readme.md        # Guía maestra de la app
│       ├── components/
│       │   └── components.md
│       ├── contexts/
│       │   └── contexts.md
│       ├── routes/
│       │   └── routes.md
│       ├── services/
│       │   └── services.md
│       ├── utils/
│       │   └── utils.md
│       └── types/
│           └── types.md
│
├── .dockerignore
├── .env                     # Variables de entorno (no versionado)
├── .env.example             # Plantilla de variables de entorno
├── .eslintrc.cjs            # Configuración ESLint
├── .gitignore
├── Dockerfile               # Configuración Docker
├── package.json             # Dependencias y scripts
├── tailwind.config.ts       # Configuración Tailwind CSS
├── tsconfig.json            # Configuración TypeScript
├── vite.config.ts           # Configuración Vite
└── README.md                # Este archivo
```

---

## 📋 Requisitos Previos

- **Node.js:** v18.0.0 o superior
- **npm:** v9.0.0 o superior (o yarn/pnpm)
- **Docker:** (opcional) para desarrollo con contenedores
- **Git:** Para control de versiones

---

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/360Lateral/Frontend.git
cd Frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo de ejemplo y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Backend API
API_URL=http://localhost:8000
VITE_API_URL=http://localhost:8000
VITE_API_URL_EXTERNAL=http://localhost:8000

# Session
SESSION_SECRET=tu_secret_key_seguro

# Docker (opcional)
DOCKER_ENV=false
BACKEND_HOST=backend
BACKEND_PORT=8000

# Google Maps
GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
```

### 4. Configurar el backend

Asegúrate de que el backend de Django esté corriendo en `http://localhost:8000`

---

## 🚀 Desarrollo

### Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

### Scripts disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con HMR
npm run dev:debug        # Desarrollo con debugging habilitado

# Producción
npm run build            # Build optimizado para producción
npm run start            # Servidor de producción

# Validación
npm run typecheck        # Verificar tipos TypeScript
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de ESLint

# Limpieza
npm run clean            # Limpiar archivos de build
```

### Hot Module Replacement (HMR)

El servidor de desarrollo incluye HMR automático:
- ✅ Recarga automática al cambiar archivos
- ✅ Preserva estado de React
- ✅ Actualización instantánea de estilos

---

## 🐳 Docker

### Desarrollo con Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up

# Solo frontend
docker-compose up frontend

# Rebuild
docker-compose up --build
```

### Build de imagen Docker

```bash
# Build
docker build -t 360lateral-frontend .

# Run
docker run -p 3000:3000 360lateral-frontend
```

**Dockerfile optimizado:**
- Multi-stage build
- Node 20 Alpine (imagen ligera)
- Optimización de capas
- Usuario no-root por seguridad

---

## 🏗️ Producción

### Build de producción

```bash
npm run build
```

Genera archivos optimizados en:
- `build/` - Código del servidor
- `public/build/` - Assets del cliente

### Deploy

```bash
# Iniciar servidor de producción
npm start

# Con PM2 (recomendado)
pm2 start npm --name "360lateral-frontend" -- start
```

### Optimizaciones incluidas

- ✅ Code splitting automático
- ✅ Tree shaking
- ✅ Minificación de JS/CSS
- ✅ Compresión de assets
- ✅ Prefetching de rutas
- ✅ Service Worker (PWA ready)

---

## 🧪 Testing

### Configuración (pendiente)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### Herramientas sugeridas

- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW** - API mocking

---

## 📚 Documentación

### Documentación Completa

Toda la documentación está en la carpeta `docs/`:

- **[📘 Guía General](./docs/README.md)** - Índice principal de documentación
- **[🌐 Endpoints API](./docs/endpoints.md)** - Documentación completa del backend
- **[📱 Aplicación](./docs/app/readme.md)** - Guía maestra de la app

### Documentación por Sección

| Sección | Descripción | Link |
|---------|-------------|------|
| **Components** | Componentes React reutilizables | [Ver docs](./docs/app/components/components.md) |
| **Contexts** | Gestión de estado global | [Ver docs](./docs/app/contexts/contexts.md) |
| **Routes** | Sistema de rutas de Remix | [Ver docs](./docs/app/routes/routes.md) |
| **Services** | Servicios del servidor | [Ver docs](./docs/app/services/services.md) |
| **Utils** | Utilidades y helpers | [Ver docs](./docs/app/utils/utils.md) |
| **Types** | Definiciones TypeScript | [Ver docs](./docs/app/types/types.md) |

### Documentación Inline

Todos los archivos incluyen comentarios JSDoc/TSDoc:

```typescript
/**
 * Componente para mostrar tarjeta de lote
 * @param {Lote} lote - Objeto con información del lote
 * @param {Function} onFavorite - Callback al agregar a favoritos
 */
export function LoteCard({ lote, onFavorite }: LoteCardProps) {
    // ...
}
```

---

## 🎨 Convenciones de Código

### Estilo de Código

- **Formato:** Prettier (configurado en `.prettierrc`)
- **Linting:** ESLint (configurado en `.eslintrc.cjs`)
- **Commits:** Conventional Commits

```bash
# Ejemplos de commits válidos
feat: agregar componente de notificaciones
fix: corregir error en autenticación
docs: actualizar README
refactor: simplificar lógica de validación
```

### TypeScript

```typescript
// ✅ BUENO: Siempre tipar funciones
function getUserById(id: string): User | null {
    // ...
}

// ✅ BUENO: Usar tipos de Remix
export async function loader({ request }: LoaderFunctionArgs) {
    // ...
}

// ❌ MALO: Evitar any
function processData(data: any) {  // No hacer esto
    // ...
}
```

### Estructura de Componentes

```tsx
// 1. Imports
import { useState } from 'react';
import type { PropsType } from './types';

// 2. Types/Interfaces
interface ComponentProps {
    title: string;
}

// 3. Component
export function Component({ title }: ComponentProps) {
    // 3.1 Hooks
    const [state, setState] = useState();
    
    // 3.2 Handlers
    const handleClick = () => { };
    
    // 3.3 Effects
    useEffect(() => { }, []);
    
    // 3.4 Render
    return <div>{title}</div>;
}
```

### Nombres de Archivos

```
PascalCase:    ComponentName.tsx
camelCase:     utils.ts, helpers.ts
kebab-case:    route-name.tsx (solo en routes/)
```

---

## 🔒 Seguridad

### Autenticación

- **JWT con cookies HTTP-only:** Tokens seguros
- **Refresh automático:** Gestión de sesión sin interrupciones
- **CSRF Protection:** Remix lo maneja automáticamente
- **Role-based access:** Validación de permisos por rol

### Variables Sensibles

⚠️ **NUNCA** commitear:
- `.env` - Variables de entorno
- Tokens o API keys
- Credenciales de base de datos

✅ **Siempre** usar:
- `.env.example` - Plantilla sin valores reales
- Variables de entorno del sistema en producción

---

## 🤝 Contribución

### Flujo de Trabajo

1. **Fork** del repositorio
2. **Crear branch** desde `develop`
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Hacer cambios** con commits descriptivos
4. **Push** a tu fork
5. **Pull Request** a `develop`
6. **Code Review** por el equipo
7. **Merge** después de aprobación

### Guidelines

- ✅ Seguir convenciones de código
- ✅ Agregar tests para nuevas features
- ✅ Actualizar documentación
- ✅ Mantener commits atómicos
- ✅ Resolver conflictos antes del PR

### Code Review Checklist

- [ ] El código sigue las convenciones del proyecto
- [ ] Todos los tests pasan
- [ ] No hay warnings de TypeScript
- [ ] La documentación está actualizada
- [ ] El código es fácil de entender
- [ ] No hay duplicación innecesaria

---

## 🐛 Reportar Bugs

### Información Necesaria

Al reportar un bug, incluir:

1. **Descripción clara** del problema
2. **Pasos para reproducir:**
   ```
   1. Ir a página X
   2. Click en botón Y
   3. Ver error Z
   ```
3. **Comportamiento esperado**
4. **Comportamiento actual**
5. **Screenshots** (si aplica)
6. **Entorno:**
   - Browser: Chrome 120
   - OS: Windows 11
   - Node: v20.10.0

### Crear Issue

```markdown
**Descripción:**
[Descripción clara del bug]

**Pasos para reproducir:**
1. ...
2. ...

**Comportamiento esperado:**
[Qué debería pasar]

**Comportamiento actual:**
[Qué está pasando]

**Entorno:**
- Browser: ...
- OS: ...
- Version: ...
```

---

## 📊 Performance

### Métricas Objetivo

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1
- **Time to Interactive:** < 3.8s

### Optimizaciones Implementadas

- ✅ Code splitting por ruta
- ✅ Lazy loading de componentes
- ✅ Caché de usuarios en memoria (5 min TTL)
- ✅ Prefetching de rutas
- ✅ Optimización de imágenes
- ✅ Minificación de assets

---

## 🌍 Internacionalización (i18n)

### Estado Actual
- Idioma: Español (es-CO)
- Formato de fechas: dd/MM/yyyy
- Moneda: COP (Peso Colombiano)

### Futuro
- [ ] Soporte multi-idioma (Inglés)
- [ ] Detección automática de locale
- [ ] Formateo de números por región

---

## ♿ Accesibilidad

### Estándares

- **WCAG 2.1 Level AA** (objetivo)
- Navegación por teclado
- Lectores de pantalla
- Alto contraste

### Herramientas

```bash
# Auditoría de accesibilidad
npm run audit:a11y
```

---

## 📝 Changelog

### v2.0.0 (Enero 2025)
- ✅ Migración a Remix 2.x
- ✅ Sistema de notificaciones mejorado
- ✅ Análisis urbanísticos con IA
- ✅ Documentación completa
- ✅ Docker support

### v1.0.0 (Diciembre 2024)
- 🎉 Lanzamiento inicial
- ✅ Sistema de autenticación
- ✅ CRUD de lotes
- ✅ Gestión de documentos

Ver [CHANGELOG.md](./CHANGELOG.md) para historial completo.

---

## 🗺️ Roadmap

### Q1 2025
- [ ] Sistema de mensajería interna
- [ ] Panel de análisis financiero
- [ ] Integración de pagos

### Q2 2025
- [ ] WebSockets para notificaciones real-time
- [ ] Sistema de ofertas y negociación
- [ ] Tours virtuales 360°

### Q3 2025
- [ ] App móvil (React Native)
- [ ] Machine Learning para recomendaciones
- [ ] Integración con blockchain

---

## 📞 Soporte y Contacto

### Canales de Soporte

- **📧 Email:** dev@360lateral.com
- **💬 Slack:** Canal #frontend-support
- **🐛 Issues:** [GitHub Issues](https://github.com/360Lateral/Frontend/issues)
- **📚 Docs:** [Documentación completa](./docs/README.md)

### Equipo de Desarrollo

- **Frontend Lead:** [Nombre]
- **Backend Lead:** [Nombre]
- **DevOps:** [Nombre]

---

## 📄 Licencia

Este proyecto es propietario y confidencial.

**360Lateral © 2025** - Todos los derechos reservados.

No está permitido copiar, distribuir o modificar este código sin autorización expresa de 360Lateral.

---

## 🙏 Agradecimientos

- Equipo de 360Lateral
- Comunidad de Remix
- Contribuidores de open source

---

## 🔗 Enlaces Útiles

### Documentación Técnica
- [Remix Documentation](https://remix.run/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Recursos del Proyecto
- [Frontend Repository](https://github.com/360Lateral/Frontend)
- [Backend Repository](https://github.com/360Lateral/Backend)
- [Design System](https://360lateral.com/design)
- [API Documentation](./docs/endpoints.md)

---

**¿Listo para empezar?** 🚀

```bash
npm install
npm run dev
```

Visita http://localhost:3000 y comienza a desarrollar.

---

**Última actualización:** Enero 2025  
**Versión:** 2.0.0  
**Framework:** Remix 2.x  
**Mantenido por:** Equipo 360Lateral