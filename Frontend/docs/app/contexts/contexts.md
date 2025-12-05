# 📚 Documentación de Contexts

Esta carpeta contiene los contextos de React utilizados en la aplicación para gestionar estados globales compartidos entre componentes.

---

## 📬 NotificationContext

**Archivo:** `app/contexts/NotificationContext.tsx`

### Descripción General

Context de React que proporciona un sistema centralizado de notificaciones para toda la aplicación. Gestiona la obtención, visualización y actualización de notificaciones en tiempo real, permitiendo que cualquier componente de la aplicación acceda al estado de notificaciones sin necesidad de prop drilling.

### Características Principales

- ✅ Gestión centralizada de notificaciones
- ✅ Contador de notificaciones no leídas
- ✅ Polling automático cada 30 segundos
- ✅ Actualización optimista de UI
- ✅ Integración con Remix Fetcher para autenticación
- ✅ Panel de notificaciones global

---

## 📋 Tipos y Estructuras de Datos

### `Notification`

```typescript
type Notification = {
    id: string;                    // ID único de la notificación
    type: string;                  // Tipo de notificación (ej: 'analisis_completado')
    type_display: string;          // Nombre legible del tipo
    title: string;                 // Título de la notificación
    message: string;               // Mensaje descriptivo
    priority: string;              // Prioridad ('high', 'medium', 'low')
    priority_display: string;      // Prioridad legible
    is_read: boolean;              // Estado de lectura
    action_url?: string;           // URL opcional para acción
    created_at: string;            // Fecha de creación (ISO)
    time_ago: string;              // Tiempo relativo (ej: "hace 5 minutos")
    data?: any;                    // Datos adicionales opcionales
};
```

### `NotificationContextType`

```typescript
type NotificationContextType = {
    notifications: Notification[];       // Lista de todas las notificaciones
    unreadCount: number;                 // Contador de notificaciones no leídas
    loading: boolean;                    // Estado de carga
    fetchNotifications: () => void;      // Función para recargar notificaciones
    markAsRead: (id: string) => void;    // Marcar una notificación como leída
    markAllAsRead: () => void;           // Marcar todas como leídas
    showPanel: boolean;                  // Estado de visibilidad del panel
    setShowPanel: (show: boolean) => void; // Controlar visibilidad del panel
};
```

---

## 🔧 API del Context

### Provider: `NotificationProvider`

Envuelve la aplicación o secciones que necesitan acceso a notificaciones.

**Props:**
- `children: ReactNode` - Componentes hijos que tendrán acceso al context

**Ejemplo de uso:**
```tsx
import { NotificationProvider } from '~/contexts/NotificationContext';

export default function App() {
    return (
        <NotificationProvider>
            <YourApp />
        </NotificationProvider>
    );
}
```

---

### Hook: `useNotifications()`

Hook personalizado para acceder al contexto de notificaciones.

**Retorna:** `NotificationContextType`

**Ejemplo de uso:**
```tsx
import { useNotifications } from '~/contexts/NotificationContext';

function MyComponent() {
    const { 
        notifications, 
        unreadCount, 
        markAsRead,
        setShowPanel 
    } = useNotifications();

    return (
        <div>
            <button onClick={() => setShowPanel(true)}>
                Notificaciones ({unreadCount})
            </button>
        </div>
    );
}
```

**⚠️ Importante:** Este hook debe usarse solo dentro de componentes envueltos por `NotificationProvider`, de lo contrario lanzará un error.

---

## 🔄 Funciones Principales

### 1. `fetchNotifications()`

Obtiene las notificaciones más recientes del servidor.

**Comportamiento:**
- Realiza dos peticiones paralelas:
  1. `GET /api/notifications` - Lista de notificaciones
  2. `GET /api/notifications?action=unread_count` - Contador de no leídas
- Actualiza el estado de `loading` durante la carga
- Maneja errores silenciosamente (no rompe la UI)

**Llamada automática:**
- Al montar el componente
- Cada 30 segundos (polling)

**Ejemplo de uso manual:**
```tsx
const { fetchNotifications } = useNotifications();

// Recargar manualmente después de una acción
const handleSomeAction = async () => {
    await someApiCall();
    fetchNotifications(); // Refrescar notificaciones
};
```

---

### 2. `markAsRead(id: string)`

Marca una notificación específica como leída.

**Parámetros:**
- `id: string` - ID de la notificación a marcar

**Comportamiento:**
1. **Actualización optimista:** Actualiza la UI inmediatamente
2. Decrementa `unreadCount` localmente
3. Envía la actualización al servidor en segundo plano
4. Si falla, el servidor se encargará de la consistencia

**Ejemplo de uso:**
```tsx
const { notifications, markAsRead } = useNotifications();

<div>
    {notifications.map(notif => (
        <div key={notif.id}>
            <p>{notif.message}</p>
            {!notif.is_read && (
                <button onClick={() => markAsRead(notif.id)}>
                    Marcar como leída
                </button>
            )}
        </div>
    ))}
</div>
```

---

### 3. `markAllAsRead()`

Marca todas las notificaciones como leídas de una vez.

**Comportamiento:**
1. **Actualización optimista:** Marca todas como leídas en la UI
2. Resetea `unreadCount` a 0
3. Envía la actualización al servidor

**Ejemplo de uso:**
```tsx
const { unreadCount, markAllAsRead } = useNotifications();

{unreadCount > 0 && (
    <button onClick={markAllAsRead}>
        Marcar todas como leídas ({unreadCount})
    </button>
)}
```

---

## 🎨 Control del Panel de Notificaciones

### `showPanel` y `setShowPanel`

Controla la visibilidad de un panel/modal de notificaciones global.

**Ejemplo de implementación:**
```tsx
import { useNotifications } from '~/contexts/NotificationContext';

function NotificationBell() {
    const { unreadCount, setShowPanel } = useNotifications();

    return (
        <button 
            onClick={() => setShowPanel(true)}
            className="relative"
        >
            🔔
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                    {unreadCount}
                </span>
            )}
        </button>
    );
}

function NotificationPanel() {
    const { notifications, showPanel, setShowPanel, markAsRead } = useNotifications();

    if (!showPanel) return null;

    return (
        <div className="fixed right-0 top-16 w-96 bg-white shadow-lg">
            <div className="flex justify-between p-4 border-b">
                <h3>Notificaciones</h3>
                <button onClick={() => setShowPanel(false)}>✕</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.map(notif => (
                    <div 
                        key={notif.id} 
                        className={notif.is_read ? 'opacity-60' : ''}
                        onClick={() => markAsRead(notif.id)}
                    >
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <span>{notif.time_ago}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
```

---

## ⚙️ Implementación Técnica

### Uso de Remix Fetcher

El contexto utiliza `useFetcher` de Remix en lugar de `fetch` estándar para:

1. **Autenticación automática:** Las cookies se envían automáticamente
2. **Manejo de sesión:** Si la sesión expira, Remix maneja la redirección
3. **Optimización:** Remix gestiona la cache y revalidación
4. **SSR friendly:** Compatible con Server-Side Rendering

**Fetchers utilizados:**
```typescript
const notificationsFetcher = useFetcher();  // Lista de notificaciones
const countFetcher = useFetcher();          // Contador de no leídas
const actionFetcher = useFetcher();         // Acciones (marcar como leída)
```

### Polling Automático

```typescript
useEffect(() => {
    fetchNotifications(); // Carga inicial
    
    const interval = setInterval(() => {
        fetchNotifications();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval); // Limpiar al desmontar
}, []);
```

**Consideraciones:**
- Se ejecuta en segundo plano sin interrumpir la UX
- El intervalo se limpia al desmontar el componente
- Puede ajustarse según necesidades (ej: 60000ms = 1 minuto)

---

## 🔗 Integración con API Routes

El contexto se comunica con rutas API de Remix que actúan como proxy al backend:

### Endpoints utilizados:

1. **GET `/api/notifications`**
   - Obtiene lista de notificaciones
   - Respuesta: `{ results: Notification[] }`

2. **GET `/api/notifications?action=unread_count`**
   - Obtiene contador de no leídas
   - Respuesta: `{ count: number }`

3. **POST `/api/notifications`**
   - Acción: `mark_read` - Marcar una como leída
   - Body: `{ action: 'mark_read', notificationId: string }`
   
4. **POST `/api/notifications`**
   - Acción: `mark_all_read` - Marcar todas como leídas
   - Body: `{ action: 'mark_all_read' }`

---

## 🎯 Actualización Optimista

El contexto implementa actualizaciones optimistas para mejorar la UX:

### Ventajas:
- ✅ Respuesta instantánea en la UI
- ✅ No espera confirmación del servidor
- ✅ Mejora percepción de velocidad

### Implementación:

```typescript
const markAsRead = (id: string) => {
    // 1. Actualización optimista (UI se actualiza de inmediato)
    setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // 2. Sincronización con servidor (en segundo plano)
    actionFetcher.submit(
        { action: 'mark_read', notificationId: id },
        { method: 'POST', action: '/api/notifications' }
    );
};
```

**⚠️ Nota:** Si el servidor falla, el estado local quedará inconsistente hasta la próxima recarga. En producción, se recomienda implementar reconciliación de estado.

---

## 🚨 Manejo de Errores

El contexto maneja errores de forma silenciosa para no interrumpir la UX:

```typescript
useEffect(() => {
    if (notificationsFetcher.data && !notificationsFetcher.data.error) {
        // Procesar datos exitosos
        setNotifications(data.results || data);
        setLoading(false);
    }
    // Los errores se ignoran silenciosamente
}, [notificationsFetcher.data]);
```

**Recomendaciones:**
- Agregar logging de errores en producción
- Implementar retry logic para peticiones fallidas
- Mostrar toast/notificación si todas las peticiones fallan consecutivamente

---

## 📊 Estados del Contexto

| Estado | Tipo | Descripción | Valor Inicial |
|--------|------|-------------|---------------|
| `notifications` | `Notification[]` | Lista de todas las notificaciones | `[]` |
| `unreadCount` | `number` | Contador de notificaciones no leídas | `0` |
| `loading` | `boolean` | Indica si se están cargando notificaciones | `false` |
| `showPanel` | `boolean` | Controla visibilidad del panel | `false` |

---

## 🔐 Consideraciones de Seguridad

1. **Autenticación:** Todas las peticiones pasan por rutas autenticadas de Remix
2. **Autorización:** El backend valida que el usuario solo vea sus notificaciones
3. **CSRF Protection:** Remix maneja protección CSRF automáticamente
4. **Session Management:** Las cookies HTTP-only son gestionadas por Remix

---

## 🎭 Ejemplo Completo de Integración

```tsx
// app/root.tsx
import { NotificationProvider } from '~/contexts/NotificationContext';

export default function App() {
    return (
        <html>
            <body>
                <NotificationProvider>
                    <Layout>
                        <Outlet />
                    </Layout>
                </NotificationProvider>
            </body>
        </html>
    );
}

// app/components/NotificationBell.tsx
import { useNotifications } from '~/contexts/NotificationContext';

export function NotificationBell() {
    const { unreadCount, setShowPanel } = useNotifications();

    return (
        <button 
            onClick={() => setShowPanel(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full"
        >
            🔔
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}

// app/components/NotificationPanel.tsx
import { useNotifications } from '~/contexts/NotificationContext';
import { Link } from '@remix-run/react';

export function NotificationPanel() {
    const { 
        notifications, 
        showPanel, 
        setShowPanel, 
        markAsRead, 
        markAllAsRead,
        unreadCount 
    } = useNotifications();

    if (!showPanel) return null;

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={() => setShowPanel(false)}
            />
            
            {/* Panel */}
            <div className="fixed right-4 top-16 w-96 bg-white rounded-lg shadow-2xl z-50 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold">Notificaciones</h3>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                        <button 
                            onClick={() => setShowPanel(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Lista de notificaciones */}
                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No tienes notificaciones
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div 
                                key={notif.id}
                                className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                                    !notif.is_read ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => {
                                    if (!notif.is_read) markAsRead(notif.id);
                                    if (notif.action_url) {
                                        setShowPanel(false);
                                    }
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Indicador de no leída */}
                                    {!notif.is_read && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                                    )}
                                    
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {notif.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500">
                                                {notif.time_ago}
                                            </span>
                                            {notif.action_url && (
                                                <Link 
                                                    to={notif.action_url}
                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                >
                                                    Ver detalles →
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
```

---

## 🚀 Mejoras Futuras Sugeridas

1. **WebSockets:** Reemplazar polling por WebSockets para notificaciones en tiempo real
2. **Persistencia local:** Cachear notificaciones en localStorage
3. **Reconciliación de estado:** Manejar inconsistencias entre cliente y servidor
4. **Filtros y búsqueda:** Permitir filtrar notificaciones por tipo o fecha
5. **Agrupación:** Agrupar notificaciones similares
6. **Sonido/vibración:** Alertas sonoras para notificaciones importantes
7. **Preferencias:** Permitir al usuario configurar qué notificaciones recibir
8. **Historial paginado:** Implementar scroll infinito para notificaciones antiguas

---

## 📝 Notas Adicionales

- El contexto es **role-agnostic**, funciona para todos los tipos de usuario (owner, developer, admin)
- Se recomienda usar este contexto solo en componentes que realmente necesiten acceder a notificaciones
- Para componentes que solo necesitan el contador, considerar extraer un hook `useUnreadCount()` para optimización
- El polling de 30 segundos es configurable, ajustar según la carga del servidor

---

**Última actualización:** Enero 2025  
**Versión de Remix:** 2.x  
**Compatibilidad:** React 18+
