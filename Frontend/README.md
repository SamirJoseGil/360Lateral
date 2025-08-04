# 📱 Frontend - Lateral 360° Web App

Aplicación web desarrollada con React, Remix y TypeScript para la gestión de lotes inmobiliarios.

## 📋 Tabla de Contenidos

- [🚀 Inicio Rápido](#-inicio-rápido)
- [⚙️ Configuración](#️-configuración)
- [🏗️ Arquitectura](#️-arquitectura)
- [🎨 Componentes](#-componentes)
- [🔄 Estado y API](#-estado-y-api)
- [🎯 Rutas](#-rutas)
- [🧪 Testing](#-testing)
- [📱 Responsive Design](#-responsive-design)

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up frontend
```

### Desarrollo Local

#### Prerequisitos
- Node.js 18+
- npm o yarn
- Backend API ejecutándose

#### Instalación

```bash
# 1. Navegar al directorio del frontend
cd Frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. Abrir en el navegador
# http://localhost:3000
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en el directorio Frontend:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_NAME=Lateral 360°
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# Maps Configuration (opcional)
VITE_GOOGLE_MAPS_API_KEY=tu-google-maps-key
VITE_MAPBOX_ACCESS_TOKEN=tu-mapbox-token

# Features Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Ejecutar servidor de desarrollo
npm run build            # Build de producción
npm run start            # Ejecutar build de producción
npm run preview          # Preview del build

# Testing
npm run test             # Ejecutar tests
npm run test:coverage    # Tests con coverage
npm run test:watch       # Tests en modo watch

# Linting y Formato
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de ESLint
npm run type-check       # Verificar tipos TypeScript
npm run format           # Formatear con Prettier

# Utilidades
npm run clean            # Limpiar archivos generados
npm run analyze          # Analizar bundle size
```

## 🏗️ Arquitectura

### Estructura de Directorios

```
Frontend/
├── app/                        # Código fuente principal
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                # Componentes UI básicos
│   │   ├── forms/             # Componentes de formularios
│   │   ├── charts/            # Gráficos y visualizaciones
│   │   └── maps/              # Componentes de mapas
│   ├── routes/                # Rutas y páginas
│   │   ├── _index.tsx         # Página principal
│   │   ├── lotes/             # Rutas de lotes
│   │   ├── documents/         # Rutas de documentos
│   │   └── auth/              # Rutas de autenticación
│   ├── services/              # Servicios API
│   │   ├── api.ts             # Cliente API base
│   │   ├── auth.ts            # Servicios de autenticación
│   │   ├── lotes.ts           # Servicios de lotes
│   │   └── healthCheck.ts     # Health checks
│   ├── types/                 # Tipos TypeScript
│   │   ├── api.ts             # Tipos de API
│   │   ├── auth.ts            # Tipos de autenticación
│   │   └── lotes.ts           # Tipos de lotes
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.ts         # Hook de autenticación
│   │   ├── useApi.ts          # Hook para API calls
│   │   └── useLocalStorage.ts # Hook para localStorage
│   ├── utils/                 # Utilidades
│   │   ├── api.ts             # Helpers de API
│   │   ├── format.ts          # Formatters
│   │   └── constants.ts       # Constantes
│   ├── styles/                # Estilos globales
│   └── root.tsx               # Componente raíz
├── public/                     # Archivos públicos
├── build/                      # Build de producción
├── package.json               # Dependencias y scripts
├── tailwind.config.js         # Configuración Tailwind
├── vite.config.ts             # Configuración Vite
└── tsconfig.json              # Configuración TypeScript
```

### Stack Tecnológico

- **Remix**: Framework full-stack React
- **React 18**: Biblioteca de UI
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de estilos
- **React Query**: Gestión de estado del servidor
- **React Hook Form**: Gestión de formularios
- **Recharts**: Gráficos y visualizaciones
- **Heroicons**: Iconos
- **Headless UI**: Componentes accesibles

## 🎨 Componentes

### Componentes UI Básicos

```typescript
// app/components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

// app/components/ui/Input.tsx
interface InputProps {
  label: string
  type: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  error?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
}
```

### Componentes de Formularios

```typescript
// app/components/forms/LoteForm.tsx
import { useForm } from 'react-hook-form'
import { LoteFormData } from '~/types/lotes'

export function LoteForm({ onSubmit, initialData }: LoteFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoteFormData>()
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campos del formulario */}
    </form>
  )
}
```

### Componentes de Gráficos

```typescript
// app/components/charts/SalesChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export function SalesChart({ data }: { data: SalesData[] }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="ventas" fill="#8884d8" />
    </BarChart>
  )
}
```

## 🔄 Estado y API

### Configuración de API

```typescript
// app/services/api.ts
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para autenticación
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### React Query Setup

```typescript
// app/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useLotes() {
  return useQuery({
    queryKey: ['lotes'],
    queryFn: () => LotesService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useCreateLote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: LotesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lotes'] })
    },
  })
}
```

### Custom Hooks

```typescript
// app/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (credentials: LoginCredentials) => {
    const response = await AuthService.login(credentials)
    setUser(response.user)
    localStorage.setItem('auth_token', response.token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_token')
  }

  return { user, loading, login, logout }
}
```

## 🎯 Rutas

### Estructura de Rutas

```typescript
// app/routes/_index.tsx - Página principal
export default function Index() {
  return <DashboardPage />
}

// app/routes/lotes._index.tsx - Lista de lotes
export default function LotesIndex() {
  const lotes = useLotes()
  return <LotesList lotes={lotes.data} />
}

// app/routes/lotes.$id.tsx - Detalle de lote
export default function LoteDetail() {
  const { id } = useParams()
  const lote = useLote(id)
  return <LoteDetailPage lote={lote.data} />
}

// app/routes/auth.login.tsx - Login
export default function Login() {
  return <LoginForm />
}
```

### Navegación

```typescript
// app/components/layout/Navigation.tsx
import { Link, useLocation } from '@remix-run/react'

export function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: HomeIcon },
    { href: '/lotes', label: 'Lotes', icon: MapIcon },
    { href: '/documents', label: 'Documentos', icon: DocumentIcon },
    { href: '/stats', label: 'Estadísticas', icon: ChartBarIcon },
  ]

  return (
    <nav className="bg-white shadow-lg">
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={`nav-link ${location.pathname === item.href ? 'active' : ''}`}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

## 🧪 Testing

### Configuración de Testing

```javascript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
  },
})
```

### Tests de Componentes

```typescript
// app/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../ui/Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button variant="primary">Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button variant="primary" onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Tests de Hooks

```typescript
// app/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'

describe('useAuth', () => {
  it('should login user', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    expect(result.current.user).toBeDefined()
  })
})
```

### Tests de Integración

```typescript
// app/routes/__tests__/lotes.test.tsx
import { render, screen } from '@testing-library/react'
import { createRemixStub } from '@remix-run/testing'
import LotesIndex from '../lotes._index'

describe('Lotes Route', () => {
  it('renders lotes list', async () => {
    const RemixStub = createRemixStub([
      {
        path: '/lotes',
        Component: LotesIndex,
      },
    ])

    render(<RemixStub initialEntries={['/lotes']} />)
    
    expect(screen.getByText('Lista de Lotes')).toBeInTheDocument()
  })
})
```

## 📱 Responsive Design

### Breakpoints de Tailwind

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // => @media (min-width: 640px)
      'md': '768px',   // => @media (min-width: 768px)
      'lg': '1024px',  // => @media (min-width: 1024px)
      'xl': '1280px',  // => @media (min-width: 1280px)
      '2xl': '1536px', // => @media (min-width: 1536px)
    }
  }
}
```

### Componentes Responsivos

```typescript
// app/components/layout/Grid.tsx
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  )
}

// app/components/layout/Sidebar.tsx
export function Sidebar() {
  return (
    <aside className="hidden md:block w-64 bg-gray-100 h-full">
      {/* Contenido del sidebar */}
    </aside>
  )
}
```

### Imágenes Responsivas

```typescript
// app/components/ui/ResponsiveImage.tsx
interface ResponsiveImageProps {
  src: string
  alt: string
  sizes: string
}

export function ResponsiveImage({ src, alt, sizes }: ResponsiveImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className="w-full h-auto object-cover"
      loading="lazy"
    />
  )
}
```

## 🎨 Estilos y Temas

### Configuración de Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### Sistema de Diseño

```typescript
// app/styles/design-system.ts
export const colors = {
  primary: '#3b82f6',
  secondary: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
}

export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
}

export const typography = {
  h1: 'text-4xl font-bold',
  h2: 'text-3xl font-semibold',
  h3: 'text-2xl font-medium',
  body: 'text-base',
  caption: 'text-sm text-gray-600',
}
```

## 🔧 Optimización

### Code Splitting

```typescript
// app/routes/lotes.lazy.tsx
import { lazy } from 'react'

const LotesPage = lazy(() => import('./lotes._index'))

export default function LotesLazy() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LotesPage />
    </Suspense>
  )
}
```

### Bundle Analysis

```bash
# Analizar tamaño del bundle
npm run build
npm run analyze
```

### Performance Monitoring

```typescript
// app/utils/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} took ${end - start} milliseconds`)
}
```

## 🚀 Build y Deploy

### Build de Producción

```bash
# Build optimizado
npm run build

# Preview del build
npm run preview

# Verificar build
npm run check
```

### Variables de Entorno por Ambiente

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENABLE_DEBUG=true

# .env.production
VITE_API_BASE_URL=https://api.lateral360.com
VITE_ENABLE_DEBUG=false
```

---

¿Necesitas ayuda? Consulta la [documentación principal](../README.md) o el [README del Backend](../Backend/README.md).
