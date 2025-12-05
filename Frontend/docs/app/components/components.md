# 📦 Documentación de Components

Esta carpeta contiene todos los componentes reutilizables de React utilizados en la aplicación. Los componentes están organizados por funcionalidad y dominio.

---

## 📁 Estructura de Carpetas

```
app/components/
├── admin/              # Componentes específicos del panel de administración
├── forms/              # Componentes de formularios reutilizables
├── layout/             # Componentes de estructura de página
├── lotes/              # Componentes relacionados con lotes
├── register/           # Componentes del flujo de registro
├── FormInput.tsx       # Input genérico (raíz)
├── PasswordInput.tsx   # Input de contraseña (raíz)
├── RoleSelector.tsx    # Selector de rol (raíz)
└── WelcomeModal.tsx    # Modal de bienvenida
```

---

# 🔐 Componentes de Admin

## LoteStatusManager

**Archivo:** `app/components/admin/LoteStatusManager.tsx`

### Descripción
Componente para que los administradores gestionen el estado y verificación de lotes (aprobar, rechazar, archivar, reactivar).

### Props

```typescript
interface LoteStatusManagerProps {
    lote: Lote;           // Objeto completo del lote
    onSuccess?: () => void; // Callback opcional al completar acción
}

interface Lote {
    id: string;
    nombre: string;
    status: string;        // 'pending' | 'active' | 'rejected' | 'archived'
    is_verified: boolean;
    rejection_reason?: string;
    rejected_at?: string;
    rejected_by?: string;
}
```

### Características

- ✅ **Verificación de lotes:** Aprobar lotes pendientes
- ✅ **Rechazo con motivo:** Rechazar con razón obligatoria
- ✅ **Archivado:** Archivar lotes activos
- ✅ **Reactivación:** Restaurar lotes rechazados/archivados
- ✅ **Modales de confirmación:** Prevenir acciones accidentales
- ✅ **Actualización optimista:** UI se actualiza inmediatamente

### Estados Manejados

| Estado | Acciones Disponibles |
|--------|---------------------|
| `pending` | Verificar, Rechazar |
| `active` + verificado | Archivar |
| `rejected` / `archived` | Reactivar |

### Uso

```tsx
import LoteStatusManager from '~/components/admin/LoteStatusManager';

<LoteStatusManager 
    lote={loteData}
    onSuccess={() => {
        console.log('Acción completada');
        refetchLotes();
    }}
/>
```

### Modales

**1. Modal de Rechazo**
- Textarea obligatorio para motivo
- Validación: mínimo 1 carácter
- Botón deshabilitado si está vacío

**2. Modal de Confirmación**
- Usado para: Verificar, Archivar, Reactivar
- Muestra advertencia según la acción
- Confirmar/Cancelar

### Flujo de Acciones

```typescript
// Verificar lote
verify → Confirmar → POST /api/admin/lotes → Callback onSuccess

// Rechazar lote  
reject → Ingresar motivo → POST /api/admin/lotes → Callback onSuccess

// Archivar lote
archive → Confirmar → POST /api/admin/lotes → Callback onSuccess

// Reactivar lote
reactivate → Confirmar → POST /api/admin/lotes → Callback onSuccess
```

### Manejo de Estados de Carga

```tsx
const isSubmitting = fetcher.state === "submitting" || fetcher.state === "loading";

// Deshabilitar botones durante carga
<button disabled={isSubmitting}>
    {isSubmitting ? 'Procesando...' : 'Verificar'}
</button>
```

### Notificaciones de Estado

- ✅ **Éxito:** Banner verde con mensaje de confirmación
- ❌ **Error:** Banner rojo con mensaje de error
- El banner se oculta automáticamente después de 5 segundos

---

# 📝 Componentes de Forms

## FormInput

**Archivo:** `app/components/forms/FormInput.tsx`

### Descripción
Componente de input de texto reutilizable con validación visual de errores.

### Props

```typescript
interface FormInputProps {
    id: string;
    label: string;
    type?: string;           // Default: 'text'
    required?: boolean;      // Default: false
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;          // Mensaje de error a mostrar
    icon?: ReactNode;        // Icono opcional a la izquierda
    helperText?: string;     // Texto de ayuda
}
```

### Características

- ✅ Label con indicador de campo requerido (*)
- ✅ Icono opcional a la izquierda del input
- ✅ Validación visual con borde rojo en error
- ✅ Mensaje de error con icono
- ✅ Texto de ayuda opcional
- ✅ Estilos focus con ring de color lateral

### Uso

```tsx
import FormInput from '~/components/forms/FormInput';

<FormInput
    id="email"
    label="Correo Electrónico"
    type="email"
    required
    value={email}
    onChange={setEmail}
    placeholder="tu@email.com"
    error={errors.email}
    helperText="Usaremos este email para notificaciones"
    icon={
        <svg className="w-5 h-5 text-gray-400">...</svg>
    }
/>
```

### Estados Visuales

- **Normal:** Borde gris, fondo blanco
- **Focus:** Borde lateral-500, ring lateral-200
- **Error:** Borde rojo-300, fondo rojo-50
- **Con icono:** Padding izquierdo aumentado (pl-10)

---

## PasswordInput

**Archivo:** `app/components/forms/PasswordInput.tsx`

### Descripción
Input especializado para contraseñas con opción de mostrar/ocultar texto.

### Props

```typescript
interface PasswordInputProps {
    id: string;
    label: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    helperText?: string;
}
```

### Características

- ✅ Toggle show/hide password con botón visual
- ✅ Iconos SVG para ojo abierto/cerrado
- ✅ Misma validación visual que FormInput
- ✅ Estado interno para visibilidad

### Uso

```tsx
import PasswordInput from '~/components/forms/PasswordInput';

<PasswordInput
    id="password"
    label="Contraseña"
    required
    value={password}
    onChange={setPassword}
    placeholder="••••••••"
    error={errors.password}
/>
```

### Lógica de Toggle

```tsx
const [showPassword, setShowPassword] = useState(false);

<input type={showPassword ? "text" : "password"} />

<button onClick={() => setShowPassword(!showPassword)}>
    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
</button>
```

---

## RoleSelector

**Archivo:** `app/components/forms/RoleSelector.tsx`

### Descripción
Selector visual de roles (Owner/Developer) con diseño de tarjetas.

### Props

```typescript
interface RoleSelectorProps {
    selectedRole: string;    // 'owner' | 'developer'
    onChange: (role: string) => void;
}
```

### Características

- ✅ Diseño de tarjetas interactivas
- ✅ Iconos distintivos por rol
- ✅ Descripción de cada rol
- ✅ Highlight visual del rol seleccionado
- ✅ Radio buttons ocultos (accesibilidad)

### Roles Disponibles

**1. Owner (Propietario/Comisionista)**
- Icono: 🏢 (edificio)
- Color: Verde
- Descripción: "Registro y gestión de lotes, solicitudes de análisis urbanístico"

**2. Developer (Desarrollador)**
- Icono: 🔍 (lupa)
- Color: Azul
- Descripción: "Búsqueda de lotes, análisis de oportunidades de inversión"

### Uso

```tsx
import RoleSelector from '~/components/forms/RoleSelector';

<RoleSelector
    selectedRole={selectedRole}
    onChange={setSelectedRole}
/>
```

### Estados Visuales

```tsx
// Seleccionado
border-lateral-500 bg-lateral-50 shadow-md

// No seleccionado
border-gray-200 hover:border-gray-300 hover:shadow-sm
```

---

# 🏗️ Componentes de Layout

## Footer

**Archivo:** `app/components/layout/footer.tsx`

### Descripción
Footer global de la aplicación con enlaces, información de contacto y redes sociales.

### Características

- ✅ **4 columnas:** Empresa, Plataforma, Empresa, Contacto
- ✅ **Redes sociales:** Facebook, Instagram, Twitter, LinkedIn
- ✅ **Enlaces legales:** Privacidad, Términos, Cookies
- ✅ **Copyright dinámico:** Año actual
- ✅ **Responsive:** Grid adaptativo

### Secciones

**Columna 1: Información de la Empresa**
- Logo 360Lateral
- Descripción breve
- Iconos de redes sociales

**Columna 2: Enlaces de Plataforma**
- Propietarios
- Desarrolladores
- Buscar Lotes
- Registrar Lote

**Columna 3: Enlaces de Empresa**
- Sobre Nosotros
- Blog
- Únete al Equipo
- Contacto

**Columna 4: Información de Contacto**
- Dirección física con icono
- Email con link mailto:
- Teléfono con link tel:

### Uso

```tsx
import Footer from '~/components/layout/footer';

<Footer />
```

### Personalización

Para actualizar información de contacto, editar directamente el componente:

```tsx
// Dirección
<span className="text-gris-300">
    Cra. 7 #71-21, <br />Bogotá, Colombia
</span>

// Email
<a href="mailto:info@360lateral.com">
    info@360lateral.com
</a>

// Teléfono
<a href="tel:+573001234567">
    +57 300 123 4567
</a>
```

---

## Navbar

**Archivo:** `app/components/layout/navbar.tsx`

### Descripción
Barra de navegación principal con autenticación, menús contextuales por rol y panel de usuario.

### Características

- ✅ **Responsive:** Menú hamburguesa en móviles
- ✅ **Autenticación:** Detecta usuario desde root loader
- ✅ **Menús dinámicos por rol:** Admin, Owner, Developer
- ✅ **Panel de usuario:** Avatar, nombre, rol, logout
- ✅ **Scroll detection:** Cambia sombra al hacer scroll
- ✅ **Logout mejorado:** Limpia storage y fuerza recarga

### Props Implícitas

Obtiene `user` desde `useRouteLoaderData("root")`:

```typescript
const rootData = useRouteLoaderData<{ user: any }>("root");
const user = rootData?.user;
```

### Enlaces por Rol

```tsx
// Admin
{ to: "/admin", label: "Menú" }
{ to: "/admin/lotes", label: "Lotes" }
{ to: "/admin/usuarios", label: "Usuarios" }
{ to: "/admin/solicitudes", label: "Solicitudes" }
{ to: "/admin/analisis", label: "Análisis IA" }

// Owner
{ to: "/owner", label: "Menú" }
{ to: "/owner/lotes", label: "Mis Lotes" }
{ to: "/owner/solicitudes", label: "Solicitudes" }
{ to: "/owner/analisis", label: "Análisis" }

// Developer
{ to: "/developer", label: "Menú" }
{ to: "/developer/search", label: "Buscar Lotes" }
{ to: "/developer/investment", label: "Inversión" }
```

### Menú de Usuario

**Información mostrada:**
- Nombre completo o email
- Rol traducido (Administrador/Propietario/Desarrollador)
- Avatar con iniciales

**Opciones:**
- Ir al Dashboard
- Ver Perfil
- Cerrar Sesión

### Logout Mejorado

```tsx
const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Limpiar storage
    localStorage.clear();
    sessionStorage.clear();

    // Usar fetcher para logout
    logoutFetcher.submit({}, {
        method: "post",
        action: "/api/auth/logout"
    });
};

// Detectar cuando logout completa
useEffect(() => {
    if (logoutFetcher.state === "idle" && logoutFetcher.data !== undefined) {
        // Forzar recarga SOLO UNA VEZ
        if (!window.location.href.includes('?logout=true')) {
            window.location.href = "/?logout=true";
        }
    }
}, [logoutFetcher.state, logoutFetcher.data]);
```

### Uso

```tsx
import Navbar from '~/components/layout/navbar';

<Navbar />
```

### Estados Visuales

```tsx
// Scroll detectado
className={`navbar-lateral ${isScrolled ? 'shadow-lateral py-2' : 'py-4'}`}

// Link activo
className={({ isActive }) => `btn-nav ${isActive ? 'active' : ''}`}
```

---

## NotificationBell

**Archivo:** `app/components/layout/NotificationBell.tsx`

### Descripción
Campana de notificaciones con contador, panel desplegable y navegación a acciones.

### Características

- ✅ **Badge animado:** Muestra contador con pulse animation
- ✅ **Panel modal:** Overlay + panel flotante
- ✅ **Iconos por tipo:** Visuales personalizados según tipo de notificación
- ✅ **Marcar como leída:** Click en notificación
- ✅ **Marcar todas:** Botón en header del panel
- ✅ **Navegación:** Click redirige a action_url
- ✅ **Indicador visual:** Punto azul para no leídas

### Integración con Context

```tsx
import { useNotifications } from '~/contexts/NotificationContext';

const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    showPanel, 
    setShowPanel 
} = useNotifications();
```

### Tipos de Notificaciones

```typescript
const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'lote_aprobado':
            return <CheckCircleIcon className="text-green-600" />;
        case 'lote_rechazado':
            return <XCircleIcon className="text-red-600" />;
        case 'documento_validado':
            return <DocumentCheckIcon className="text-blue-600" />;
        case 'solicitud_respondida':
            return <MailIcon className="text-indigo-600" />;
        default:
            return <BellIcon className="text-gray-500" />;
    }
};
```

### Colores de Prioridad

```typescript
const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'urgent': return 'bg-red-100 border-red-500';
        case 'high': return 'bg-orange-100 border-orange-500';
        case 'normal': return 'bg-blue-100 border-blue-500';
        default: return 'bg-gray-100 border-gray-500';
    }
};
```

### Uso

```tsx
import NotificationBell from '~/components/layout/NotificationBell';

// Dentro del Navbar
<NotificationBell />
```

### Estructura del Panel

```tsx
<div className="fixed right-4 top-16 w-96 bg-white rounded-xl shadow-2xl">
    {/* Header */}
    <div className="p-4 border-b">
        <h3>Notificaciones</h3>
        <button onClick={markAllAsRead}>Marcar todas</button>
    </div>

    {/* Lista */}
    <div className="overflow-y-auto">
        {notifications.map(notif => (
            <NotificationItem 
                key={notif.id}
                notification={notif}
                onClick={() => handleNotificationClick(notif)}
            />
        ))}
    </div>
</div>
```

---

## Sidebar

**Archivo:** `app/components/layout/sidebar.tsx`

### Descripción
Barra lateral de navegación para dashboards (Admin, Owner, Developer).

### Props

```typescript
type SidebarOption = {
    to: string;
    label: string;
    icon: string;    // Nombre del icono
};

type SidebarProps = {
    options: SidebarOption[];
    user: {
        name?: string;
        email: string;
        role: string;
    };
};
```

### Características

- ✅ **Navegación por rol:** Opciones configurables
- ✅ **Iconos SVG:** Biblioteca interna de iconos
- ✅ **Active state:** Highlight visual del link actual
- ✅ **User info:** Muestra nombre y rol
- ✅ **Links fijos:** Inicio, Perfil, Cerrar Sesión
- ✅ **Logout integrado:** Usa fetcher de Remix

### Iconos Disponibles

```typescript
// dashboard, users, map, check-circle, clipboard-list,
// chart-bar, search, heart, document-text
```

### Uso

```tsx
import Sidebar from '~/components/layout/sidebar';

const sidebarOptions = [
    { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/lotes', label: 'Lotes', icon: 'map' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
];

<Sidebar options={sidebarOptions} user={user} />
```

### Estructura

```tsx
<div className="w-64 bg-white shadow-md flex flex-col h-full">
    {/* Header */}
    <div className="p-4 border-b">
        <h2>Panel {role}</h2>
        <p>Bienvenido, {name}</p>
    </div>

    {/* Navegación principal */}
    <nav className="p-4 flex-grow">
        {options.map(option => (
            <NavLink to={option.to}>{option.label}</NavLink>
        ))}
    </nav>

    {/* Links fijos */}
    <div className="p-4 border-t">
        <Link to="/">Inicio</Link>
        <Link to="/profile">Mi Perfil</Link>
        <Link to="/api/auth/logout" onClick={handleLogout}>
            Cerrar Sesión
        </Link>
    </div>
</div>
```

---

# 🏘️ Componentes de Lotes

## DocumentStatusIndicator

**Archivo:** `app/components/lotes/DocumentStatusIndicator.tsx`

### Descripción
Muestra el estado de documentos subidos para un lote con contadores por tipo.

### Props

```typescript
interface DocumentStatusIndicatorProps {
    loteId: string;
    documents: Document[];
    totalCount?: number;
}

interface Document {
    id: string;
    document_type: string;
    title: string;
    created_at: string;
}
```

### Tipos de Documentos

```typescript
const DOCUMENT_TYPES = [
    { value: "ctl", label: "Certificado de Tradición y Libertad", icon: "📜" },
    { value: "planos", label: "Planos Arquitectónicos", icon: "📐" },
    { value: "topografia", label: "Levantamiento Topográfico", icon: "🗺️" },
    { value: "licencia_construccion", label: "Licencia de Construcción", icon: "🏗️" },
    { value: "escritura_publica", label: "Escritura Pública", icon: "📄" },
    { value: "certificado_libertad", label: "Certificado de Libertad", icon: "✅" },
    { value: "avaluo_comercial", label: "Avalúo Comercial", icon: "💰" },
    { value: "estudio_suelos", label: "Estudio de Suelos", icon: "🔬" },
    { value: "otros", label: "Otros Documentos", icon: "📎" },
];
```

### Características

- ✅ **Agrupación por tipo:** Cuenta documentos de cada categoría
- ✅ **Estado vacío:** Mensaje y CTA si no hay documentos
- ✅ **Navegación:** Botón para gestionar documentos
- ✅ **Contador visual:** Badge con cantidad por tipo
- ✅ **Resumen total:** Suma de todos los documentos

### Uso

```tsx
import DocumentStatusIndicator from '~/components/lotes/DocumentStatusIndicator';

<DocumentStatusIndicator
    loteId={lote.id}
    documents={lote.documentos}
    totalCount={lote.total_documentos}
/>
```

### Estado Vacío

```tsx
// Sin documentos
<div className="text-center py-12">
    <DocumentIcon />
    <h4>No hay documentos cargados</h4>
    <p>Comienza subiendo los documentos necesarios</p>
    <Link to={`/owner/lote/${loteId}/documentos`}>
        Subir Primer Documento
    </Link>
</div>
```

### Con Documentos

```tsx
// Grid de tipos con documentos
<div className="space-y-4">
    {DOCUMENT_TYPES.map(type => {
        const count = documentsByType[type.value]?.length || 0;
        if (count === 0) return null;

        return (
            <div key={type.value} className="flex items-center justify-between">
                <span>{type.icon} {type.label}</span>
                <span className="badge">{count}</span>
            </div>
        );
    })}
</div>
```

---

## LocationPicker

**Archivo:** `app/components/lotes/LocationPicker.tsx`

### Descripción
Mapa interactivo de Leaflet para seleccionar ubicación de un lote (lat/lng).

### Props

```typescript
interface LocationPickerProps {
    initialLat?: number;      // Default: 6.2476 (Medellín)
    initialLng?: number;      // Default: -75.5658
    onLocationSelect: (lat: number, lng: number) => void;
    height?: string;          // Default: '400px'
}
```

### Características

- ✅ **Mapa interactivo:** Leaflet + OpenStreetMap
- ✅ **Click to place:** Click en mapa coloca marcador
- ✅ **Draggable marker:** Arrastra el marcador para ajustar
- ✅ **Popup con coordenadas:** Muestra lat/lng del marcador
- ✅ **Preview de coordenadas:** Banner debajo del mapa
- ✅ **Loading state:** Skeleton mientras carga
- ✅ **Error handling:** Mensaje si falla

### Uso

```tsx
import { LocationPicker } from '~/components/lotes/LocationPicker';

<LocationPicker
    initialLat={lote.latitud}
    initialLng={lote.longitud}
    onLocationSelect={(lat, lng) => {
        setFormData(prev => ({ ...prev, latitud: lat, longitud: lng }));
    }}
    height="500px"
/>
```

### Implementación Técnica

```tsx
// Importación dinámica de Leaflet (solo cliente)
const L = await import('leaflet');

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Crear mapa
const map = L.map(mapRef.current).setView(position, 13);

// Agregar tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Marcador draggable
const marker = L.marker(position, { draggable: true }).addTo(map);
```

### Eventos Manejados

```tsx
// Click en mapa
map.on('click', (e: any) => {
    const { lat, lng } = e.latlng;
    marker.setLatLng([lat, lng]);
    onLocationSelect(lat, lng);
});

// Drag del marcador
marker.on('dragend', () => {
    const pos = marker.getLatLng();
    onLocationSelect(pos.lat, pos.lng);
});
```

### Cleanup

```tsx
useEffect(() => {
    // ... init map

    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }
    };
}, []);
```

---

## MapView

**Archivo:** `app/components/lotes/MapView.tsx`

### Descripción
Mapa de Leaflet de solo lectura para mostrar ubicación de un lote.

### Props

```typescript
interface MapViewProps {
    latitud?: number;
    longitud?: number;
    direccion?: string;
    nombre?: string;
    height?: string;    // Default: '400px'
    zoom?: number;      // Default: 15
}
```

### Características

- ✅ **Solo lectura:** No editable, solo visualización
- ✅ **Marcador fijo:** Muestra ubicación con popup
- ✅ **Info en popup:** Nombre, dirección, coordenadas
- ✅ **Error handling:** Mensaje si no hay coordenadas
- ✅ **Loading state:** Skeleton animado

### Uso

```tsx
import { MapView } from '~/components/lotes/MapView';

<MapView
    latitud={lote.latitud}
    longitud={lote.longitud}
    nombre={lote.nombre}
    direccion={lote.direccion}
    height="400px"
    zoom={16}
/>
```

### Popup Personalizado

```tsx
marker.bindPopup(`
    <div style="padding: 8px; max-width: 200px;">
        ${nombre ? `<h3 style="margin: 0 0 8px 0; font-weight: bold;">${nombre}</h3>` : ''}
        ${direccion ? `<p style="margin: 0; font-size: 12px;">${direccion}</p>` : ''}
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">
            ${latitud.toFixed(6)}, ${longitud.toFixed(6)}
        </p>
    </div>
`).openPopup();
```

### Componente Adicional: StaticMapPreview

Para vistas previas estáticas usando Google Maps Static API:

```tsx
export function StaticMapPreview({
    latitud,
    longitud,
    width = 300,
    height = 200,
    zoom = 15
}: {
    latitud?: number;
    longitud?: number;
    width?: number;
    height?: number;
    zoom?: number;
}) {
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitud},${longitud}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitud},${longitud}&key=${API_KEY}`;

    return <img src={staticMapUrl} alt="Mapa" />;
}
```

---

## LoteCard

**Archivo:** `app/components/lotes/LoteCard.tsx`

### Descripción
Tarjeta de presentación de lote con información clave y acciones.

### Props

```typescript
type LoteCardProps = {
    lote: {
        id: string;
        nombre?: string;
        direccion?: string;
        area: number;
        precio?: number;
        estrato?: number;
        zona?: string;
        tratamiento?: string;
        valorEstimado?: number;
        isFavorite?: boolean;
        status?: string;
    };
    showDetailLink?: boolean;      // Default: true
    showAnalysisLink?: boolean;    // Default: false
    onFavoriteToggle?: (id: string) => void;
    className?: string;
    userRole?: 'owner' | 'developer' | 'admin';  // Default: 'owner'
};
```

### Características

- ✅ **Header con gradiente:** Nombre y dirección destacados
- ✅ **Badge de estado:** Activo, Pendiente, Incompleto
- ✅ **Grid de info:** Área, Precio, Estrato, Zona, Tratamiento
- ✅ **Valor potencial y ROI:** Si están disponibles
- ✅ **Botón de favorito:** Icono de corazón (opcional)
- ✅ **Acciones:** Ver Detalles, Análisis
- ✅ **Rutas por rol:** Adapta URLs según userRole

### Uso

```tsx
import LoteCard from '~/components/lotes/LoteCard';

<LoteCard
    lote={loteData}
    showDetailLink={true}
    showAnalysisLink={true}
    onFavoriteToggle={(id) => toggleFavorite(id)}
    userRole="developer"
/>
```

### Cálculo de ROI

```tsx
const roi = precio && valorEstimado 
    ? ((valorEstimado - precio) / precio) * 100 
    : 0;

<div className="bg-green-50 rounded-lg p-3">
    <span className="text-xs text-green-700">ROI Estimado</span>
    <span className="font-bold text-green-700">{Math.round(roi)}%</span>
</div>
```

### Formato de Moneda

```tsx
const formatCurrency = (value?: number): string => {
    if (!value) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(value);
};
```

### Estado Visual

```tsx
const getStatusColor = (status?: string) => {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'incomplete': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};
```

---

## POTInfo

**Archivo:** `app/components/lotes/POTInfo.tsx`

### Descripción
Muestra información de normativa POT (Plan de Ordenamiento Territorial) de un lote.

### Props

```typescript
export type POTData = {
    cbml: string;
    tratamiento_encontrado: string;
    codigo_tratamiento: string;
    normativa: {
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
        frentes_minimos?: Array<{...}>;
        areas_minimas_lote?: Array<{...}>;
        areas_minimas_vivienda?: Array<{...}>;
        activo: boolean;
    };
    datos_mapgis?: {...};
};

interface POTInfoProps {
    potData: POTData;
    showMapGisData?: boolean;  // Default: true
    compact?: boolean;         // Default: false
    className?: string;
}
```

### Características

- ✅ **Vista completa:** Todos los datos de normativa
- ✅ **Vista compacta:** Solo índices principales
- ✅ **Índices urbanísticos:** IO, IC, Altura
- ✅ **Retiros mínimos:** Frontal, Lateral, Posterior
- ✅ **Frentes mínimos:** Por tipo de vivienda
- ✅ **Áreas mínimas:** Lote y vivienda por tipología
- ✅ **Datos MapGIS:** Info adicional de MapGIS (opcional)

### Uso Completo

```tsx
import POTInfo from '~/components/lotes/POTInfo';

<POTInfo
    potData={lote.pot_data}
    showMapGisData={true}
    compact={false}
/>
```

### Uso Compacto

```tsx
<POTInfo
    potData={lote.pot_data}
    compact={true}
    className="mb-4"
/>

// Muestra solo:
// - Tratamiento (nombre + código)
// - IO (%)
// - IC
// - Altura (pisos)
```

### Secciones Renderizadas

**1. Índices Urbanísticos**
```tsx
<div className="grid grid-cols-3 gap-4">
    <div>
        <dt>Índice de Ocupación</dt>
        <dd>{(parseFloat(io) * 100).toFixed(0)}%</dd>
    </div>
    <div>
        <dt>Índice de Construcción</dt>
        <dd>{ic}</dd>
    </div>
    <div>
        <dt>Altura Máxima</dt>
        <dd>{altura} pisos</dd>
    </div>
</div>
```

**2. Retiros Mínimos**
- Solo si existen datos
- Grid de 3 columnas: Frontal, Lateral, Posterior

**3. Frentes Mínimos**
- Por tipo de vivienda (VIS, VIP, No VIS)
- Grid de 2 columnas

**4. Áreas Mínimas de Lote**
- Por tipo de vivienda
- Grid de 2 columnas

**5. Áreas Mínimas de Vivienda**
- Por tipo de vivienda
- Grid de 3 columnas

**6. Datos MapGIS** (opcional)
- Área del lote
- Clasificación del suelo
- Densidad habitacional máx
- Altura normativa

---

## RequiredDocumentsNotice

**Archivo:** `app/components/lotes/RequiredDocumentsNotice.tsx`

### Descripción
Aviso de documentos requeridos con countdown timer y checklist.

### Props

```typescript
interface RequiredDocumentsNoticeProps {
    lote: Lote;
    className?: string;
}
```

### Características

- ✅ **Countdown timer:** Tiempo restante para subir docs
- ✅ **Barra de progreso:** Porcentaje completado
- ✅ **Checklist visual:** Check/número por documento
- ✅ **Advertencias:** Color rojo si quedan < 2 horas
- ✅ **Auto-update:** Timer actualiza cada segundo
- ✅ **Estado completado:** Mensaje de éxito cuando todo está listo

### Documentos Requeridos

```typescript
const docsRequired = {
    ctl: lote.doc_ctl_subido,
    planos: lote.doc_planos_subido,
    topografia: lote.doc_topografia_subido,
};
```

### Uso

```tsx
import RequiredDocumentsNotice from '~/components/lotes/RequiredDocumentsNotice';

<RequiredDocumentsNotice 
    lote={loteData}
    className="mb-6"
/>
```

### Timer Logic

```tsx
useEffect(() => {
    if (!lote.tiempo_restante && !lote.limite_tiempo_docs) {
        setTimeLeft("Tiempo no especificado");
        return;
    }

    const updateTime = () => {
        const now = new Date();
        const limit = new Date(lote.limite_tiempo_docs!);
        const diffSeconds = Math.max(0, Math.floor((limit.getTime() - now.getTime()) / 1000));
        
        setTimeLeft(formatTime(diffSeconds));
        
        if (diffSeconds <= 0) {
            setTimeLeft("Tiempo expirado");
            return false;
        }
        return true;
    };

    const shouldContinue = updateTime();
    
    if (shouldContinue) {
        const interval = setInterval(() => {
            if (!updateTime()) clearInterval(interval);
        }, 1000);
        
        return () => clearInterval(interval);
    }
}, [lote.tiempo_restante, lote.limite_tiempo_docs]);
```

### Checklist de Documentos

```tsx
<div className="space-y-4">
    {/* CTL */}
    <div className="flex items-center">
        <div className={`h-6 w-6 rounded-full ${docsStatus.ctl ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {docsStatus.ctl ? <CheckIcon /> : '1'}
        </div>
        <div className="ml-3">
            <h4>CTL (Certificado de Tradición y Libertad)</h4>
            <p>{docsStatus.ctl ? "Subido ✓" : "Pendiente"}</p>
        </div>
    </div>

    {/* Planos */}
    {/* ... similar ... */}

    {/* Topografía */}
    {/* ... similar ... */}
</div>
```

---

# 👤 Componentes de Register

Componentes específicos del flujo de registro de usuario.

## FormInput (register)

**Archivo:** `app/components/register/FormInput.tsx`

Similar a `app/components/forms/FormInput.tsx`, pero con estilos específicos del flow de registro.

```tsx
// Mismo interface que forms/FormInput
interface FormInputProps {
    id: string;
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    icon?: React.ReactNode;
}
```

---

## PasswordInput (register)

**Archivo:** `app/components/register/PasswordInput.tsx`

Similar a `app/components/forms/PasswordInput.tsx`, específico para registro.

---

## RoleSelector (register)

**Archivo:** `app/components/register/RoleSelector.tsx`

Similar a `app/components/forms/RoleSelector.tsx`, para página de registro.

---

# 🎯 Componentes Raíz

Componentes en la raíz de `/components`:

## FormInput (raíz)

**Archivo:** `app/components/FormInput.tsx`

Version genérica de input usado en múltiples lugares.

## PasswordInput (raíz)

**Archivo:** `app/components/PasswordInput.tsx`

Con medidor de fortaleza de contraseña opcional:

```tsx
interface PasswordInputProps {
    // ... props base ...
    showStrength?: boolean;  // Mostrar indicador de fortaleza
}

const getPasswordStrength = () => {
    if (!value) return null;
    if (value.length < 8) return { text: 'Débil', color: 'text-red-600' };
    if (value.length < 12) return { text: 'Media', color: 'text-yellow-600' };
    return { text: 'Fuerte', color: 'text-green-600' };
};
```

## RoleSelector (raíz)

**Archivo:** `app/components/RoleSelector.tsx`

Diseño más elaborado con tarjetas grandes:

```tsx
// Tarjetas grandes centradas con iconos de 48px
<label className="flex flex-col items-center p-6 rounded-xl border-2">
    <div className="w-12 h-12 rounded-full bg-lateral-600">
        <HomeIcon />
    </div>
    <h3>Propietario</h3>
    <p>Gestiona y valida tus lotes urbanos</p>
</label>
```

---

## WelcomeModal

**Archivo:** `app/components/WelcomeModal.tsx`

### Descripción
Modal de bienvenida mostrado en el primer login del usuario con tutorial personalizado por rol.

### Props

```typescript
interface WelcomeModalProps {
    role: "owner" | "developer";
    userName: string;
    isFirstLogin: boolean;
    onClose: () => void;
}
```

### Características

- ✅ **Contenido por rol:** Owner vs Developer
- ✅ **Features highlight:** Lista de capacidades
- ✅ **Iconos visuales:** Emojis por feature
- ✅ **CTAs:** Acción principal + secundaria
- ✅ **Animaciones:** Fade in, slide in
- ✅ **Overlay dismissible:** Click fuera para cerrar
- ✅ **Tip adicional:** Banner amarillo con consejo

### Uso

```tsx
import { WelcomeModal } from '~/components/WelcomeModal';

const [showWelcome, setShowWelcome] = useState(user.is_first_login);

<WelcomeModal
    role={user.role}
    userName={user.first_name}
    isFirstLogin={showWelcome}
    onClose={() => setShowWelcome(false)}
/>
```

### Contenido por Rol

**Owner:**
```typescript
features: [
    { title: "Registra tus Lotes", icon: "📍" },
    { title: "Sube Documentación", icon: "📄" },
    { title: "Validación Administrativa", icon: "✓" },
    { title: "Análisis Urbanístico", icon: "📊" },
    { title: "Visibilidad", icon: "👁️" }
]
primaryAction: "Registrar mi Primer Lote" → /owner/lotes/nuevo
```

**Developer:**
```typescript
features: [
    { title: "Busca Lotes", icon: "🔍" },
    { title: "Favoritos", icon: "❤️" },
    { title: "Análisis Detallado", icon: "📈" },
    { title: "Criterios de Inversión", icon: "🎯" }
]
primaryAction: "Buscar Lotes" → /developer/search
```

### Estilos de Animación

```tsx
<style>{`
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
`}</style>

<div style={{ animation: "slideIn 0.3s ease-out" }}>
    {/* Modal content */}
</div>
```

---

## 🎨 Guía de Estilos

### Colores de Marca

```css
/* Lateral (Owner) */
--lateral-50: #f0f9ff;
--lateral-100: #e0f2fe;
--lateral-500: #0ea5e9;
--lateral-600: #0284c7;
--lateral-700: #0369a1;

/* Indigo (Developer) */
--indigo-50: #eef2ff;
--indigo-100: #e0e7ff;
--indigo-500: #6366f1;
--indigo-600: #4f46e5;
--indigo-700: #4338ca;

/* Naranja (Acento) */
--naranja-500: #f97316;

/* Grises */
--gris-50: #f9fafb;
--gris-100: #f3f4f6;
--gris-500: #6b7280;
--gris-900: #111827;
```

### Clases Personalizadas

```css
/* Botones */
.btn-primary
.btn-secondary
.btn-outline
.btn-nav
.btn-nav.active

/* Sombras */
.shadow-lateral
.shadow-lg
.shadow-xl

/* Gradientes */
.bg-gradient-lateral
.bg-gradient-to-r from-lateral-600 to-lateral-700

/* Animaciones */
.animate-fade-in
.animate-pulse
.animate-spin
```

---

## 📚 Mejores Prácticas

### 1. Componentes Reutilizables

```tsx
// ✅ BIEN: Componente genérico con props
<FormInput 
    id="email"
    label="Email"
    value={email}
    onChange={setEmail}
    error={errors.email}
/>

// ❌ MAL: Componente específico hardcoded
<EmailInput value={email} onChange={setEmail} />
```

### 2. Manejo de Estados de Carga

```tsx
// ✅ BIEN: Desabilitar y mostrar feedback
<button disabled={isSubmitting}>
    {isSubmitting ? (
        <>
            <Spinner />
            Cargando...
        </>
    ) : (
        'Enviar'
    )}
</button>

// ❌ MAL: Sin feedback visual
<button onClick={submit}>Enviar</button>
```

### 3. Validación de Errores

```tsx
// ✅ BIEN: Validación visual clara
<input className={error ? 'border-red-300 bg-red-50' : 'border-gray-300'} />
{error && <p className="text-red-600 text-sm">{error}</p>}

// ❌ MAL: Sin feedback de error
<input />
```

### 4. Accesibilidad

```tsx
// ✅ BIEN: Labels y aria-labels
<label htmlFor="email">Email</label>
<input id="email" aria-label="Email del usuario" />

// ❌ MAL: Sin labels
<input placeholder="Email" />
```

### 5. Responsive Design

```tsx
// ✅ BIEN: Clases responsive de Tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ❌ MAL: Layout fijo
<div className="grid grid-cols-3">
```

---

## 🔄 Patrones Comunes

### 1. Fetcher Pattern (Remix)

```tsx
import { useFetcher } from '@remix-run/react';

const fetcher = useFetcher();

// Submit
fetcher.submit(formData, { method: 'post', action: '/api/...' });

// Estado
const isSubmitting = fetcher.state === 'submitting';

// Resultado
useEffect(() => {
    if (fetcher.data?.success) {
        // Acción exitosa
    }
}, [fetcher.data]);
```

### 2. Modal Pattern

```tsx
const [isOpen, setIsOpen] = useState(false);

{isOpen && (
    <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
        
        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6">
                {/* Content */}
            </div>
        </div>
    </>
)}
```

### 3. Form State Pattern

```tsx
const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'owner'
});

const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
};

<input 
    value={formData.name}
    onChange={(e) => updateField('name', e.target.value)}
/>
```

---

## 🧪 Testing

### Ejemplo de Test para FormInput

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FormInput from './FormInput';

test('muestra error cuando hay error', () => {
    render(
        <FormInput
            id="test"
            label="Test"
            value=""
            onChange={() => {}}
            error="Campo requerido"
        />
    );

    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
});

test('llama onChange al escribir', () => {
    const handleChange = jest.fn();
    render(
        <FormInput
            id="test"
            label="Test"
            value=""
            onChange={handleChange}
        />
    );

    fireEvent.change(screen.getByLabelText('Test'), {
        target: { value: 'nuevo valor' }
    });

    expect(handleChange).toHaveBeenCalledWith('nuevo valor');
});
```

---

**Última actualización:** Enero 2025  
**Total de componentes documentados:** 20+  
**Categorías:** Admin, Forms, Layout, Lotes, Register, Root
