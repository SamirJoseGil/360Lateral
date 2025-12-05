# 🛣️ Documentación de Routes

Esta carpeta contiene todas las rutas (endpoints) de la aplicación Remix. Las rutas están organizadas por rol y funcionalidad.

---

## 📑 Índice de Rutas

### 🏠 Públicas
- [`_index.tsx`](#_indextsx) - Página de inicio
- [`about.tsx`](#abouttsx) - Página "Acerca de"
- [`$.tsx`](#tsx) - Página 404 (catch-all)
- [`login.tsx`](#logintsx) - Inicio de sesión
- [`register.tsx`](#registertsx) - Registro de usuario
- [`forgot-password.tsx`](#forgot-passwordtsx) - Recuperar contraseña
- [`reset-password.tsx`](#reset-passwordtsx) - Restablecer contraseña

### 🔐 API Routes
- [`api.auth.logout.ts`](#apiauthlogoutts) - Cerrar sesión
- [`api.auth.me.ts`](#apiauthmet) - Obtener usuario actual
- [`api.notifications.tsx`](#apinotificationstsx) - Gestión de notificaciones

### 👤 Perfil
- [`profile.tsx`](#profiletsx) - Perfil de usuario

### 👨‍💼 Admin
- [`admin.tsx`](#admintsx) - Layout de admin
- [`admin._index.tsx`](#admin_indextsx) - Dashboard admin
- [`admin.lotes.tsx`](#adminlotestsx) - Lista de lotes
- [`admin.lote.$id.tsx`](#adminloteidtsx) - Detalle de lote
- [`admin.lotes_.$id.editar.tsx`](#adminlotes_ideditartsx) - Editar lote
- [`admin.usuarios.tsx`](#adminusuariostsx) - Lista de usuarios
- [`admin.usuario.$id.tsx`](#adminusuarioidtsx) - Detalle de usuario
- [`admin.usuarios_.$id.editar.tsx`](#adminusuarios_ideditartsx) - Editar usuario
- [`admin.usuarios_.nuevo.tsx`](#adminusuarios_nuevotsx) - Crear usuario
- [`admin.solicitudes.tsx`](#adminsolicitudestsx) - Gestión de solicitudes
- [`admin.analisis.tsx`](#adminanalisistsx) - Lista de análisis
- [`admin.analisisa.$id.tsx`](#adminanalisisaidtsx) - Detalle de análisis
- [`admin.investments.tsx`](#admininvestmentstsx) - Gestión de inversiones
- [`admin.validacion.tsx`](#adminvalidaciontsx) - Validación de documentos

### 🏘️ Owner (Propietario)
- [`owner.tsx`](#ownertsx) - Layout de owner
- [`owner._index.tsx`](#owner_indextsx) - Dashboard owner
- [`owner.lotes.tsx`](#ownerlotestsx) - Mis lotes
- [`owner.lotes_.nuevo.tsx`](#ownerlotes_nuevotsx) - Registrar lote
- [`owner.lote.$loteId.tsx`](#ownerlotelotetsx) - Detalle de lote
- [`owner.lote.$loteId_.documentos.tsx`](#ownerlotelotetsx-1) - Gestión de documentos
- [`owner.documentos.tsx`](#ownerdocumentostsx) - Todos mis documentos
- [`owner.solicitudes.tsx`](#ownersolicitudestsx) - Mis solicitudes
- [`owner.analisis._index.tsx`](#owneranalisis_indextsx) - Lista de análisis
- [`owner.analisis.$id.tsx`](#owneranalisisidtsx) - Detalle de análisis
- [`owner.analisis.solicitar.tsx`](#owneranasissolicitar) - Solicitar análisis

### 👨‍💻 Developer (Desarrollador)
- [`developer.tsx`](#developertsx) - Layout de developer
- [`developer._index.tsx`](#developer_indextsx) - Dashboard developer
- [`developer.search.tsx`](#developersearchtsx) - Buscar lotes
- [`developer.lots.$lotId.tsx`](#developerlotslotidtsx) - Detalle de lote
- [`developer.favorites.tsx`](#developerfavoritestsx) - Favoritos
- [`developer.investment.tsx`](#developerinvestmenttsx) - Criterios de inversión
- [`developer.analisis._index.tsx`](#developeranalisis_indextsx) - Lista de análisis
- [`developer.analisis.$id.tsx`](#developeranalisisidtsx) - Detalle de análisis
- [`developer.analisis.solicitar.tsx`](#developeranasissolicitar) - Solicitar análisis

---

# 🏠 Rutas Públicas

## `_index.tsx`

**Ruta:** `/`  
**Tipo:** Pública (Landing Page)

### Descripción
Página de inicio de la aplicación con información institucional, características y CTAs.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    
    // Si está autenticado, redirigir a su dashboard
    if (user) {
        return redirect(`/${user.role}`);
    }
    
    return json({});
}
```

**Lógica:**
- ✅ Detecta usuario autenticado
- ✅ Redirige a dashboard según rol
- ✅ Muestra landing si no está autenticado

### Componente
Página estática con:
- Hero section con CTA
- Sección de características
- Testimonios
- Footer

### Navegación
- **Login:** `/login`
- **Registro:** `/register`
- **Sobre nosotros:** `/about`

---

## `about.tsx`

**Ruta:** `/about`  
**Tipo:** Pública

### Descripción
Página informativa "Acerca de 360Lateral" con misión, visión y equipo.

### Loader
```typescript
export async function loader() {
    return json({
        company: {
            name: "360Lateral",
            founded: "2024",
            mission: "...",
            vision: "..."
        }
    });
}
```

### Contenido
- Misión y visión
- Valores de la empresa
- Equipo fundador
- Datos de contacto

---

## `$.tsx`

**Ruta:** `/*` (catch-all)  
**Tipo:** Error 404

### Descripción
Página de error 404 para rutas no encontradas.

### Características
- ✅ Mensaje amigable "Página no encontrada"
- ✅ Sugerencias de navegación
- ✅ Botón para volver al inicio
- ✅ Búsqueda de rutas similares

### Uso
```tsx
export default function NotFound() {
    return (
        <div className="error-404">
            <h1>404 - Página no encontrada</h1>
            <Link to="/">Volver al inicio</Link>
        </div>
    );
}
```

---

## `login.tsx`

**Ruta:** `/login`  
**Tipo:** Pública (requiere NO estar autenticado)

### Descripción
Formulario de inicio de sesión con email/contraseña.

### Loader
Redirige si ya está autenticado:
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    
    if (user) {
        return redirect(`/${user.role}`);
    }
    
    return json({});
}
```

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const remember = formData.get("remember") === "on";
    
    // Validaciones
    // ...
    
    // Autenticar con backend
    const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    
    // Guardar tokens en cookies
    const headers = await commitAuthCookies(tokens, remember);
    
    return redirect(`/${user.role}`, { headers });
}
```

### Campos del Formulario
- **Email** (requerido): Input con validación de formato
- **Password** (requerido): PasswordInput con toggle show/hide
- **Remember me** (opcional): Checkbox para sesión persistente

### Estados de Validación
```typescript
const errors: Record<string, string> = {};

if (!email) errors.email = "El email es obligatorio";
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Formato de email inválido";
}
if (!password) errors.password = "La contraseña es obligatoria";
```

### Redirecciones
- **Éxito:** `/${user.role}` (admin, owner, developer)
- **Usuario no verificado:** Mensaje de verificación
- **Credenciales inválidas:** Error en formulario

### Links Relacionados
- Crear cuenta: `/register`
- Olvidé mi contraseña: `/forgot-password`

---

## `register.tsx`

**Ruta:** `/register`  
**Tipo:** Pública (requiere NO estar autenticado)

### Descripción
Formulario de registro multi-paso con validaciones en tiempo real.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await getUser(request);
    
    if (user) {
        return redirect(`/${user.role}`);
    }
    
    return json({});
}
```

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    
    const payload = {
        email,
        password,
        password_confirm,
        first_name,
        last_name,
        phone,
        role,
        // Campos específicos de developer si aplica
        developer_type,
        person_type,
        legal_name,
        document_type,
        document_number
    };
    
    // Validar que role NO sea 'admin'
    if (role === 'admin') {
        return json({
            errors: { role: 'No puedes registrarte como administrador' }
        }, { status: 400 });
    }
    
    // POST a /api/auth/register/
    const response = await fetch(`${API_URL}/api/auth/register/`, {
        method: "POST",
        body: JSON.stringify(payload)
    });
    
    // Guardar tokens y redirigir
    const headers = await commitAuthCookies(tokens, true); // Siempre remember en registro
    return redirect(`/${user.role}`, { headers });
}
```

### Secciones del Formulario

#### 1. Información Personal
- **Nombre** (requerido)
- **Apellido** (requerido)
- **Email** (requerido, único)
- **Teléfono** (requerido, min. 10 dígitos)

#### 2. Tipo de Cuenta
- **Role Selector:** Owner o Developer (Admin NO permitido)

#### 3. Información del Desarrollador (solo si role === 'developer')
- **Tipo de Desarrollador** (requerido):
  - Constructora
  - Fondo de Inversión
  - Inversionista
  - Otro
- **Tipo de Persona** (requerido):
  - Natural
  - Jurídica
- **Nombre Legal** (requerido si jurídica)
- **Tipo de Documento** (requerido):
  - CC, CE, Pasaporte, TI (natural)
  - NIT (jurídica)
- **Número de Documento** (requerido, solo números, min. 6 dígitos)

#### 4. Seguridad
- **Username** (opcional, se genera automático)
- **Contraseña** (requerido, min. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número)
- **Confirmar Contraseña** (requerido, debe coincidir)

#### 5. Términos y Condiciones
- Checkbox obligatorio con links a PDF de políticas

### Validaciones en Tiempo Real

```typescript
const validateField = (field: string, value: string): string => {
    switch (field) {
        case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'El formato del email es inválido';
            }
            break;
        
        case 'password':
            if (value.length < 8) return 'Min. 8 caracteres';
            if (!/[A-Z]/.test(value)) return 'Incluye una mayúscula';
            if (!/[a-z]/.test(value)) return 'Incluye una minúscula';
            if (!/[0-9]/.test(value)) return 'Incluye un número';
            break;
        
        case 'document_number':
            if (!/^\d+$/.test(value)) {
                return 'Solo números';
            }
            if (value.length < 6) {
                return 'Min. 6 dígitos';
            }
            break;
    }
    return '';
};
```

### Indicador de Fortaleza de Contraseña

```typescript
const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, text: 'Débil', color: 'bg-red-500' };
    if (strength <= 4) return { level: 2, text: 'Media', color: 'bg-yellow-500' };
    return { level: 3, text: 'Fuerte', color: 'bg-green-500' };
};
```

### Restricciones de Negocio

1. ✅ **NO** se permite registro como Admin
2. ✅ Desarrolladores tipo "jurídica" **DEBEN** usar NIT
3. ✅ Desarrolladores tipo "natural" **NO PUEDEN** usar NIT
4. ✅ Username se genera automáticamente si no se proporciona
5. ✅ Sesión se guarda con "remember me" por defecto (7 días)

### Links Relacionados
- Ya tienes cuenta: `/login`
- Términos: `https://360lateral.com/.../terminos.pdf`
- Privacidad: `https://360lateral.com/.../privacidad.pdf`

---

## `forgot-password.tsx`

**Ruta:** `/forgot-password`  
**Tipo:** Pública

### Descripción
Solicitud de recuperación de contraseña por email.

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const email = formData.get("email");
    
    // POST a /api/users/password-reset/request/
    const response = await fetch(`${API_URL}/api/users/password-reset/request/`, {
        method: "POST",
        body: JSON.stringify({ email })
    });
    
    // Siempre mostrar mensaje de éxito (por seguridad)
    return json({
        success: true,
        message: "Si existe una cuenta, recibirás un email"
    });
}
```

### Flujo
1. Usuario ingresa email
2. Backend genera token de recuperación
3. Email enviado con link: `/reset-password?token=...`
4. Token válido por 1 hora

### Características de Seguridad
- ✅ No revela si el email existe (siempre muestra "enviado")
- ✅ Token de un solo uso
- ✅ Expiración de 1 hora
- ✅ Límite de intentos por IP

---

## `reset-password.tsx`

**Ruta:** `/reset-password?token=...`  
**Tipo:** Pública (requiere token válido)

### Descripción
Formulario para establecer nueva contraseña usando token de recuperación.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    
    if (!token) {
        return redirect("/forgot-password");
    }
    
    // Verificar validez del token
    const response = await fetch(`${API_URL}/api/users/password-reset/verify-token/`, {
        method: "POST",
        body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    
    if (!data.valid) {
        return json({
            tokenValid: false,
            error: "Token inválido o expirado"
        });
    }
    
    return json({
        tokenValid: true,
        userEmail: data.user_email
    });
}
```

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const token = formData.get("token");
    const new_password = formData.get("new_password");
    const confirm_password = formData.get("confirm_password");
    
    // Validaciones
    if (new_password !== confirm_password) {
        return json({ errors: { confirm_password: 'No coinciden' } });
    }
    
    // POST a /api/users/password-reset/confirm/
    const response = await fetch(`${API_URL}/api/users/password-reset/confirm/`, {
        method: "POST",
        body: JSON.stringify({ token, new_password, confirm_password })
    });
    
    // Redirigir a login con mensaje de éxito
    return redirect("/login?reset=success");
}
```

### Estados del Token

| Estado | Acción |
|--------|--------|
| **Válido** | Mostrar formulario de contraseña |
| **Inválido** | Mostrar error + link a forgot-password |
| **Expirado** | Mensaje + link para solicitar nuevo token |
| **Ya usado** | Error + link a login |

### Componentes
- PasswordInput con indicador de fortaleza
- Validación de coincidencia en tiempo real
- Botón disabled hasta que ambos campos sean válidos

---

# 🔐 API Routes

## `api.auth.logout.ts`

**Ruta:** `/api/auth/logout`  
**Tipo:** API (POST)  
**Autenticación:** Requerida

### Descripción
Endpoint para cerrar sesión del usuario. Invalida tokens y limpia cookies.

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    // Obtener refresh token de las cookies
    const cookieHeader = request.headers.get("Cookie");
    const cookies = parse(cookieHeader || "");
    const refreshToken = cookies.refresh;
    
    // Invalidar en el backend
    if (refreshToken) {
        await fetch(`${API_URL}/api/auth/logout/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });
    }
    
    // Limpiar cookies
    const headers = new Headers();
    headers.append("Set-Cookie", serialize("access", "", { maxAge: 0, path: "/" }));
    headers.append("Set-Cookie", serialize("refresh", "", { maxAge: 0, path: "/" }));
    
    return json({ success: true }, { headers });
}
```

### Flujo Completo
1. Cliente llama POST `/api/auth/logout`
2. Backend invalida refresh token
3. Cookies `access` y `refresh` se eliminan
4. Cliente limpia localStorage/sessionStorage
5. Redirección a `/`

### Uso desde Cliente
```typescript
// En navbar.tsx
const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    localStorage.clear();
    sessionStorage.clear();
    
    logoutFetcher.submit({}, {
        method: "post",
        action: "/api/auth/logout"
    });
};

useEffect(() => {
    if (logoutFetcher.state === "idle" && logoutFetcher.data !== undefined) {
        if (!window.location.href.includes('?logout=true')) {
            window.location.href = "/?logout=true";
        }
    }
}, [logoutFetcher.state, logoutFetcher.data]);
```

---

## `api.auth.me.ts`

**Ruta:** `/api/auth/me`  
**Tipo:** API (GET)  
**Autenticación:** Requerida

### Descripción
Obtiene información completa del usuario autenticado actual.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    if (!user) {
        return json({ error: "No autenticado" }, { status: 401 });
    }
    
    try {
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/auth/me/`
        );
        
        if (!res.ok) {
            throw new Error("Error fetching user data");
        }
        
        const data = await res.json();
        
        return json({
            success: true,
            data: data.data || data
        }, {
            headers: setCookieHeaders
        });
    } catch (error) {
        return json({
            error: "Error al obtener datos del usuario"
        }, { status: 500 });
    }
}
```

### Respuesta Esperada
```typescript
{
    "success": true,
    "data": {
        "id": 123,
        "email": "user@example.com",
        "username": "user123",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+57 300 123 4567",
        "role": "owner",
        "is_active": true,
        "is_verified": true,
        "created_at": "2025-01-01T00:00:00Z",
        "role_fields": {
            // Campos específicos del rol
            "document_type": "CC",
            "document_number": "123456789",
            // ...
        }
    }
}
```

### Uso desde Cliente
```typescript
// En profile.tsx loader
const { res: meRes, setCookieHeaders } = await fetchWithAuth(
    request,
    `${API_URL}/api/auth/me/`
);

const meData = await meRes.json();
const fullUserData = meData.data || meData;

return json({ user: fullUserData }, { headers: setCookieHeaders });
```

---

## `api.notifications.tsx`

**Ruta:** `/api/notifications`  
**Tipo:** API (GET, POST)  
**Autenticación:** Requerida

### Descripción
API proxy para gestión de notificaciones del usuario. Soporta listar, contar y marcar como leídas.

### Loader (GET)
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    
    // Contador de no leídas
    if (action === "unread_count") {
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/notifications/unread_count/`
        );
        
        const data = await res.json();
        return json({ count: data.count }, { headers: setCookieHeaders });
    }
    
    // Lista de notificaciones
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/notifications/`
    );
    
    const data = await res.json();
    return json(data, { headers: setCookieHeaders });
}
```

### Action (POST)
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    const action = formData.get("action");
    
    // Marcar una como leída
    if (action === "mark_read") {
        const notificationId = formData.get("notificationId");
        
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/notifications/${notificationId}/mark_read/`,
            { method: "POST" }
        );
        
        return json({ success: true }, { headers: setCookieHeaders });
    }
    
    // Marcar todas como leídas
    if (action === "mark_all_read") {
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/notifications/mark_all_read/`,
            { method: "POST" }
        );
        
        return json({ success: true }, { headers: setCookieHeaders });
    }
    
    return json({ error: "Acción inválida" }, { status: 400 });
}
```

### Endpoints Proxy

| Método | Query/Body | Acción Backend |
|--------|------------|----------------|
| GET | - | `GET /api/notifications/` |
| GET | `?action=unread_count` | `GET /api/notifications/unread_count/` |
| POST | `action=mark_read&notificationId=X` | `POST /api/notifications/X/mark_read/` |
| POST | `action=mark_all_read` | `POST /api/notifications/mark_all_read/` |

### Integración con Context

```typescript
// En NotificationContext.tsx
const notificationsFetcher = useFetcher();

// Cargar notificaciones
notificationsFetcher.load('/api/notifications');

// Marcar como leída
const formData = new FormData();
formData.append('action', 'mark_read');
formData.append('notificationId', id);

actionFetcher.submit(formData, {
    method: 'POST',
    action: '/api/notifications'
});
```

---

# 👤 Perfil

## `profile.tsx`

**Ruta:** `/profile`  
**Tipo:** Autenticada (todos los roles)

### Descripción
Página de perfil con información del usuario, edición de datos y cambio de contraseña.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    // Obtener datos completos del usuario
    const { res: meRes, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/auth/me/`
    );
    
    const meData = await meRes.json();
    const fullUserData = meData.data || meData;
    
    return json({ user: fullUserData }, { headers: setCookieHeaders });
}
```

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    const intent = formData.get("intent");
    
    // Actualizar perfil
    if (intent === "updateProfile") {
        const updateData = {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            phone: formData.get("phone"),
            company: formData.get("company"),
            // Campos por rol...
        };
        
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/users/me/update/`,
            {
                method: 'PUT',
                body: JSON.stringify(updateData)
            }
        );
        
        return json({
            intent: 'updateProfile',
            success: "Perfil actualizado correctamente"
        }, { headers: setCookieHeaders });
    }
    
    // Cambiar contraseña
    if (intent === "changePassword") {
        // Generar token de recuperación
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/users/password-reset/request/`,
            {
                method: 'POST',
                body: JSON.stringify({ email: user.email })
            }
        );
        
        const data = await res.json();
        
        // Redirigir a reset-password con token
        if (data.success && data.data && data.data.token) {
            return json({
                intent: 'changePassword',
                success: true,
                resetToken: data.data.token
            }, { headers: setCookieHeaders });
        }
    }
    
    return json({ errors: { general: "Operación no válida" } }, { status: 400 });
}
```

### Tabs de la Página

#### 1. Información Personal
- **Nombre** y **Apellido**
- **Email** (solo lectura)
- **Teléfono**
- **Empresa**

Campos específicos por rol:
- **Owner:** document_type, document_number, address
- **Developer:** company_name, company_nit, position, experience_years, portfolio_url, focus_area
- **Admin:** department, permissions_scope

#### 2. Seguridad
- **Estado de verificación:** Badge verde/rojo
- **Estado de cuenta:** Activa/Inactiva
- **Fecha de creación:** Display formateado
- **Cambiar contraseña:** Botón que genera token y redirige a reset-password

### Detección de Cambios

```typescript
const [hasChanges, setHasChanges] = useState(false);

useEffect(() => {
    const hasChanged = 
        profileData.first_name !== (user.first_name || "") ||
        profileData.last_name !== (user.last_name || "") ||
        // ... otros campos
    
    setHasChanges(hasChanged);
}, [profileData, user]);

// Botón solo visible si hay cambios
{hasChanges && (
    <button type="submit">Actualizar Perfil</button>
)}
```

### Flujo de Cambio de Contraseña

```typescript
// 1. Click en "Solicitar cambio de contraseña"
<Form method="post">
    <input type="hidden" name="intent" value="changePassword" />
    <button type="submit">Solicitar cambio de contraseña</button>
</Form>

// 2. Backend genera token

// 3. useEffect detecta token en actionData y redirige
useEffect(() => {
    if (actionData?.intent === 'changePassword' && 
        actionData?.success && 
        actionData?.resetToken) {
        navigate(`/reset-password?token=${actionData.resetToken}`);
    }
}, [actionData, navigate]);
```

---

# 👨‍💼 Rutas de Admin

## `admin.tsx`

**Ruta:** `/admin/*`  
**Tipo:** Layout Route  
**Autenticación:** Admin only

### Descripción
Layout principal para todas las rutas del panel de administración. Incluye sidebar y validación de rol.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    if (user.role !== 'admin') {
        throw new Response("Acceso denegado", { status: 403 });
    }
    
    return json({ user });
}
```

### Componente
```tsx
export default function AdminLayout() {
    const { user } = useLoaderData<typeof loader>();
    
    const sidebarOptions = [
        { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
        { to: '/admin/lotes', label: 'Lotes', icon: 'map' },
        { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
        { to: '/admin/solicitudes', label: 'Solicitudes', icon: 'clipboard-list' },
        { to: '/admin/analisis', label: 'Análisis IA', icon: 'chart-bar' },
        { to: '/admin/validacion', label: 'Validación', icon: 'check-circle' },
    ];
    
    return (
        <div className="flex h-screen">
            <Sidebar options={sidebarOptions} user={user} />
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
```

---

## `admin._index.tsx`

**Ruta:** `/admin`  
**Tipo:** Dashboard  
**Autenticación:** Admin only

### Descripción
Dashboard principal del administrador con estadísticas globales y acciones rápidas.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    if (user.role !== 'admin') {
        return redirect('/');
    }
    
    // Obtener estadísticas generales
    const [lotes, usuarios, solicitudes, analisis] = await Promise.all([
        fetchWithAuth(request, `${API_URL}/api/lotes/stats/`),
        fetchWithAuth(request, `${API_URL}/api/users/stats/`),
        fetchWithAuth(request, `${API_URL}/api/solicitudes/stats/`),
        fetchWithAuth(request, `${API_URL}/api/analisis/stats/`)
    ]);
    
    return json({
        user,
        stats: {
            lotes: await lotes.res.json(),
            usuarios: await usuarios.res.json(),
            solicitudes: await solicitudes.res.json(),
            analisis: await analisis.res.json()
        }
    });
}
```

### Métricas Mostradas
- **Lotes:** Total, Activos, Pendientes, Rechazados
- **Usuarios:** Total, Owners, Developers, Verificados
- **Solicitudes:** Pendientes, En Proceso, Completadas
- **Análisis:** Total, Pendientes, Completados

### Componentes
- Stats Cards con íconos y colores
- Gráficos de resumen (opcional)
- Lista de acciones recientes
- Accesos rápidos a secciones

---

## `admin.lotes.tsx`

**Ruta:** `/admin/lotes`  
**Tipo:** Lista con filtros  
**Autenticación:** Admin only

### Descripción
Lista completa de lotes con filtros avanzados y acciones administrativas.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    
    // Parámetros de filtrado
    const filters = {
        status: url.searchParams.get('status'),
        is_verified: url.searchParams.get('verified'),
        search: url.searchParams.get('search'),
        page: parseInt(url.searchParams.get('page') || '1'),
        ordering: url.searchParams.get('ordering') || '-created_at'
    };
    
    const queryString = new URLSearchParams(
        Object.entries(filters)
            .filter(([_, v]) => v !== null)
            .map(([k, v]) => [k, String(v)])
    ).toString();
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/admin/lotes/?${queryString}`
    );
    
    const data = await res.json();
    
    return json({
        user,
        lotes: data.results || data,
        pagination: {
            count: data.count,
            next: data.next,
            previous: data.previous,
            page: filters.page,
            totalPages: Math.ceil(data.count / 20)
        }
    }, { headers: setCookieHeaders });
}
```

### Filtros Disponibles
- **Estado:** pending, active, rejected, archived
- **Verificación:** verified, unverified
- **Búsqueda:** Por nombre, dirección, CBML, propietario
- **Ordenamiento:** Fecha, Nombre, Área, Estado

### Acciones por Lote
- Ver detalles
- Editar información
- Verificar/Rechazar (LoteStatusManager)
- Archivar/Reactivar
- Ver documentos

---

## `admin.lote.$id.tsx`

**Ruta:** `/admin/lote/:id`  
**Tipo:** Detalle  
**Autenticación:** Admin only

### Descripción
Vista detallada de un lote con toda la información, documentos y acciones administrativas.

### Loader
```typescript
export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/admin/lotes/${params.id}/`
    );
    
    if (!res.ok) {
        throw new Response("Lote no encontrado", { status: 404 });
    }
    
    const lote = await res.json();
    
    return json({ user, lote }, { headers: setCookieHeaders });
}
```

### Tabs de Información
1. **Información General:** Datos básicos del lote
2. **Ubicación:** Mapa interactivo
3. **Documentos:** Lista de documentos subidos
4. **Normativa POT:** Información urbanística
5. **Historial:** Cambios de estado y auditoría
6. **Propietario:** Información del dueño

### Componentes Integrados
- `LoteStatusManager` - Gestión de estado
- `MapView` - Visualización de ubicación
- `DocumentStatusIndicator` - Estado de documentos
- `POTInfo` - Información de normativa

---

## `admin.lotes_.$id.editar.tsx`

**Ruta:** `/admin/lotes/:id/editar`  
**Tipo:** Formulario de edición  
**Autenticación:** Admin only

### Descripción
Formulario completo para que el admin edite cualquier campo de un lote.

### Action
```typescript
export async function action({ request, params }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    
    const updateData = {
        nombre: formData.get('nombre'),
        direccion: formData.get('direccion'),
        area: parseFloat(formData.get('area') as string),
        precio: parseFloat(formData.get('precio') as string),
        cbml: formData.get('cbml'),
        latitud: parseFloat(formData.get('latitud') as string),
        longitud: parseFloat(formData.get('longitud') as string),
        // ... más campos
    };
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/admin/lotes/${params.id}/`,
        {
            method: 'PUT',
            body: JSON.stringify(updateData)
        }
    );
    
    if (!res.ok) {
        const errors = await res.json();
        return json({ errors }, { status: 400 });
    }
    
    return redirect(`/admin/lote/${params.id}`, { headers: setCookieHeaders });
}
```

### Campos Editables
- Información básica (nombre, dirección, área)
- Ubicación (coordenadas, mapa)
- Financiero (precio, precio_m2)
- Normativa (CBML, POT)
- Características adicionales
- Estado y verificación

---

## `admin.usuarios.tsx`

**Ruta:** `/admin/usuarios`  
**Tipo:** Lista con filtros  
**Autenticación:** Admin only

### Descripción
Gestión completa de usuarios con filtros por rol, estado y búsqueda.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    
    const filters = {
        role: url.searchParams.get('role'),
        is_active: url.searchParams.get('active'),
        is_verified: url.searchParams.get('verified'),
        search: url.searchParams.get('search'),
        page: parseInt(url.searchParams.get('page') || '1')
    };
    
    const queryString = new URLSearchParams(
        Object.entries(filters)
            .filter(([_, v]) => v !== null)
            .map(([k, v]) => [k, String(v)])
    ).toString();
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/admin/users/?${queryString}`
    );
    
    const data = await res.json();
    
    return json({
        user,
        usuarios: data.results || data,
        pagination: {
            count: data.count,
            page: filters.page,
            totalPages: Math.ceil(data.count / 20)
        }
    }, { headers: setCookieHeaders });
}
```

### Filtros Disponibles
- **Rol:** owner, developer, admin
- **Estado:** activo, inactivo
- **Verificación:** verificado, sin verificar
- **Búsqueda:** Por nombre, email, username

### Acciones por Usuario
- Ver perfil completo
- Editar información
- Activar/Desactivar cuenta
- Verificar/Desverificar
- Resetear contraseña
- Eliminar cuenta (con confirmación)

---

## `admin.usuario.$id.tsx`

**Ruta:** `/admin/usuario/:id`  
**Tipo:** Perfil detallado  
**Autenticación:** Admin only

### Descripción
Vista completa del perfil de un usuario con toda su actividad.

### Tabs de Información
1. **Información Personal:** Datos básicos
2. **Actividad:** Lotes, solicitudes, análisis
3. **Seguridad:** Estado de cuenta, sesiones
4. **Auditoría:** Historial de cambios

---

## `admin.usuarios_.$id.editar.tsx`

**Ruta:** `/admin/usuarios/:id/editar`  
**Tipo:** Formulario de edición  
**Autenticación:** Admin only

### Descripción
Edición completa del perfil de usuario por parte del admin.

---

## `admin.usuarios_.nuevo.tsx`

**Ruta:** `/admin/usuarios/nuevo`  
**Tipo:** Formulario de creación  
**Autenticación:** Admin only

### Descripción
Creación manual de usuarios por parte del admin (cualquier rol).

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    
    const userData = {
        email: formData.get('email'),
        password: formData.get('password'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        is_verified: formData.get('is_verified') === 'on'
    };
    
    // Admin puede crear cualquier rol, incluido admin
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/admin/users/`,
        {
            method: 'POST',
            body: JSON.stringify(userData)
        }
    );
    
    if (!res.ok) {
        const errors = await res.json();
        return json({ errors }, { status: 400 });
    }
    
    const newUser = await res.json();
    return redirect(`/admin/usuario/${newUser.id}`, { headers: setCookieHeaders });
}
```

---

## `admin.solicitudes.tsx`

**Ruta:** `/admin/solicitudes`  
**Tipo:** Gestión de solicitudes  
**Autenticación:** Admin only

### Descripción
Panel para gestionar solicitudes de soporte/contacto de usuarios.

### Características
- Lista de solicitudes con filtros
- Estados: nueva, en_proceso, resuelta, cerrada
- Asignación a analistas
- Respuestas y notas internas

---

## `admin.analisis.tsx`

**Ruta:** `/admin/analisis`  
**Tipo:** Lista de análisis  
**Autenticación:** Admin only

### Descripción
Gestión completa de análisis urbanísticos solicitados.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    
    const filters = {
        estado: url.searchParams.get('estado'),
        tipo_analisis: url.searchParams.get('tipo'),
        analista: url.searchParams.get('analista'),
        search: url.searchParams.get('search')
    };
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/admin/analisis/?${new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v)
        )}`
    );
    
    const data = await res.json();
    
    return json({
        user,
        analisis: data.results || data,
        stats: {
            pendientes: data.pendientes,
            en_proceso: data.en_proceso,
            completados: data.completados
        }
    }, { headers: setCookieHeaders });
}
```

### Acciones Administrativas
- Ver detalles del análisis
- Asignar/Reasignar analista
- Cambiar estado manualmente
- Ver respuesta IA generada
- Aprobar/Rechazar análisis
- Generar informe PDF

---

## `admin.analisisa.$id.tsx`

**Ruta:** `/admin/analisisa/:id`  
**Tipo:** Detalle de análisis  
**Autenticación:** Admin only

### Descripción
Vista completa de un análisis con opción de editar estado y respuesta.

### Action (Gestión de Análisis)
```typescript
export async function action({ request, params }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    const intent = formData.get('intent');
    
    if (intent === 'assign') {
        // Asignar analista
        const analistaId = formData.get('analista_id');
        await fetchWithAuth(
            request,
            `${API_URL}/api/admin/analisis/${params.id}/assign/`,
            {
                method: 'POST',
                body: JSON.stringify({ analista_id: analistaId })
            }
        );
    }
    
    if (intent === 'update_status') {
        // Cambiar estado
        const nuevoEstado = formData.get('estado');
        await fetchWithAuth(
            request,
            `${API_URL}/api/admin/analisis/${params.id}/`,
            {
                method: 'PATCH',
                body: JSON.stringify({ estado: nuevoEstado })
            }
        );
    }
    
    if (intent === 'approve') {
        // Aprobar análisis
        await fetchWithAuth(
            request,
            `${API_URL}/api/admin/analisis/${params.id}/approve/`,
            { method: 'POST' }
        );
    }
    
    return redirect(`/admin/analisis/${params.id}`);
}
```

---

## `admin.investments.tsx`

**Ruta:** `/admin/investments`  
**Tipo:** Gestión de criterios de inversión  
**Autenticación:** Admin only

### Descripción
Panel para revisar y gestionar criterios de inversión de developers.

---

## `admin.validacion.tsx`

**Ruta:** `/admin/validacion`  
**Tipo:** Validación de documentos  
**Autenticación:** Admin only

### Descripción
Cola de documentos pendientes de validación con herramientas de revisión.

### Características
- Lista de documentos pendientes
- Visor de archivos (PDF, imágenes)
- Aprobar/Rechazar con comentarios
- Historial de validaciones

---

# 🏘️ Rutas de Owner

## `owner.tsx`

**Ruta:** `/owner/*`  
**Tipo:** Layout Route  
**Autenticación:** Owner only

### Descripción
Layout principal para propietarios con sidebar y navegación.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    if (user.role !== 'owner') {
        return redirect(`/${user.role}`);
    }
    
    return json({ user });
}
```

---

## `owner._index.tsx`

**Ruta:** `/owner`  
**Tipo:** Dashboard  
**Autenticación:** Owner only

### Descripción
Dashboard del propietario con resumen de lotes y acciones rápidas.

### Métricas Mostradas
- Total de lotes
- Lotes activos
- Lotes pendientes de validación
- Solicitudes de análisis
- Documentos pendientes

---

## `owner.lotes.tsx`

**Ruta:** `/owner/lotes`  
**Tipo:** Lista de lotes propios  
**Autenticación:** Owner only

### Descripción
Lista completa de lotes del propietario con filtros y búsqueda.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    
    const filters = {
        status: url.searchParams.get('status'),
        search: url.searchParams.get('search'),
        ordering: url.searchParams.get('ordering') || '-created_at'
    };
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/lotes/?${new URLSearchParams(
            Object.entries(filters).filter(([_, v]) => v)
        )}`
    );
    
    const data = await res.json();
    
    return json({
        user,
        lotes: data.results || data,
        stats: {
            total: data.count,
            activos: data.activos,
            pendientes: data.pendientes,
            incompletos: data.incompletos
        }
    }, { headers: setCookieHeaders });
}
```

### Filtros
- Estado: active, pending, incomplete
- Búsqueda por nombre/dirección
- Ordenamiento: fecha, nombre, área

---

## `owner.lotes_.nuevo.tsx`

**Ruta:** `/owner/lotes/nuevo`  
**Tipo:** Formulario de creación  
**Autenticación:** Owner only

### Descripción
Formulario multi-paso para registrar un nuevo lote.

### Action
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    
    const loteData = {
        nombre: formData.get('nombre'),
        direccion: formData.get('direccion'),
        area: parseFloat(formData.get('area') as string),
        precio: parseFloat(formData.get('precio') as string),
        latitud: parseFloat(formData.get('latitud') as string),
        longitud: parseFloat(formData.get('longitud') as string),
        cbml: formData.get('cbml'),
        barrio: formData.get('barrio'),
        estrato: parseInt(formData.get('estrato') as string),
        // ... más campos
    };
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/lotes/`,
        {
            method: 'POST',
            body: JSON.stringify(loteData)
        }
    );
    
    if (!res.ok) {
        const errors = await res.json();
        return json({ errors }, { status: 400 });
    }
    
    const lote = await res.json();
    
    // Redirigir a subir documentos
    return redirect(`/owner/lote/${lote.id}/documentos`, { headers: setCookieHeaders });
}
```

### Pasos del Formulario
1. **Información Básica:** Nombre, dirección, área
2. **Ubicación:** Mapa interactivo (LocationPicker)
3. **Detalles:** CBML, barrio, estrato, precio
4. **Características:** Servicios, accesos
5. **Confirmación:** Resumen antes de crear

---

## `owner.lote.$loteId.tsx`

**Ruta:** `/owner/lote/:loteId`  
**Tipo:** Detalle de lote  
**Autenticación:** Owner only (propietario del lote)

### Descripción
Vista completa del lote con todas las secciones y acciones disponibles.

### Loader
```typescript
export async function loader({ request, params }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/lotes/${params.loteId}/`
    );
    
    if (!res.ok) {
        throw new Response("Lote no encontrado", { status: 404 });
    }
    
    const lote = await res.json();
    
    // Verificar que el usuario es el propietario
    if (lote.propietario !== user.id) {
        throw new Response("No autorizado", { status: 403 });
    }
    
    return json({ user, lote }, { headers: setCookieHeaders });
}
```

### Componentes Mostrados
- `RequiredDocumentsNotice` - Si hay documentos pendientes
- `MapView` - Ubicación del lote
- `DocumentStatusIndicator` - Estado de documentos
- `POTInfo` - Información de normativa (si tiene CBML)

---

## `owner.lote.$loteId_.documentos.tsx`

**Ruta:** `/owner/lote/:loteId/documentos`  
**Tipo:** Gestión de documentos  
**Autenticación:** Owner only (propietario del lote)

### Descripción
Interfaz para subir, ver y gestionar documentos del lote.

### Action (Subir Documento)
```typescript
export async function action({ request, params }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    const intent = formData.get('intent');
    
    if (intent === 'upload') {
        const archivo = formData.get('archivo') as File;
        const document_type = formData.get('document_type');
        const title = formData.get('title');
        
        // Crear FormData para envío multipart
        const uploadFormData = new FormData();
        uploadFormData.append('archivo', archivo);
        uploadFormData.append('document_type', document_type as string);
        uploadFormData.append('title', title as string);
        uploadFormData.append('lote', params.loteId as string);
        
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/documentos/`,
            {
                method: 'POST',
                body: uploadFormData
            }
        );
        
        if (!res.ok) {
            const errors = await res.json();
            return json({ errors }, { status: 400 });
        }
        
        return json({ success: true }, { headers: setCookieHeaders });
    }
    
    if (intent === 'delete') {
        const documentId = formData.get('documentId');
        
        await fetchWithAuth(
            request,
            `${API_URL}/api/documentos/${documentId}/`,
            { method: 'DELETE' }
        );
        
        return json({ success: true });
    }
    
    return json({ error: 'Intent inválido' }, { status: 400 });
}
```

### Funcionalidades
- **Upload:** Drag & drop + selector de archivos
- **Preview:** Visor de PDFs e imágenes
- **Validación:** Tamaño máximo, formatos permitidos
- **Categorización:** Selector de tipo de documento
- **Estado:** Pendiente, Aprobado, Rechazado
- **Eliminación:** Con confirmación

---

## `owner.documentos.tsx`

**Ruta:** `/owner/documentos`  
**Tipo:** Lista global de documentos  
**Autenticación:** Owner only

### Descripción
Vista consolidada de todos los documentos de todos los lotes del propietario.

---

## `owner.solicitudes.tsx`

**Ruta:** `/owner/solicitudes`  
**Tipo:** Lista de solicitudes  
**Autenticación:** Owner only

### Descripción
Solicitudes de soporte o consultas realizadas por el propietario.

---

## `owner.analisis._index.tsx`

**Ruta:** `/owner/analisis`  
**Tipo:** Lista de análisis  
**Autenticación:** Owner only

### Descripción
Lista de análisis urbanísticos solicitados por el propietario.

### Documentado anteriormente - Ver sección completa

---

## `owner.analisis.$id.tsx`

**Ruta:** `/owner/analisis/:id`  
**Tipo:** Detalle de análisis  
**Autenticación:** Owner only

### Documentado anteriormente - Ver sección completa

---

## `owner.analisis.solicitar.tsx`

**Ruta:** `/owner/analisis/solicitar`  
**Tipo:** Formulario de solicitud  
**Autenticación:** Owner only

### Documentado anteriormente - Ver sección completa

---

# 👨‍💻 Rutas de Developer

## `developer.tsx`

**Ruta:** `/developer/*`  
**Tipo:** Layout Route  
**Autenticación:** Developer only

### Descripción
Layout principal para desarrolladores.

---

## `developer._index.tsx`

**Ruta:** `/developer`  
**Tipo:** Dashboard  
**Autenticación:** Developer only

### Métricas Mostradas
- Lotes favoritos
- Búsquedas guardadas
- Análisis solicitados
- Recomendaciones

---

## `developer.search.tsx`

**Ruta:** `/developer/search`  
**Tipo:** Buscador de lotes  
**Autenticación:** Developer only

### Descripción
Interfaz de búsqueda avanzada de lotes con filtros múltiples.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    const url = new URL(request.url);
    
    const filters = {
        search: url.searchParams.get('search'),
        zona: url.searchParams.get('zona'),
        barrio: url.searchParams.get('barrio'),
        area_min: url.searchParams.get('area_min'),
        area_max: url.searchParams.get('area_max'),
        precio_min: url.searchParams.get('precio_min'),
        precio_max: url.searchParams.get('precio_max'),
        tratamiento: url.searchParams.get('tratamiento'),
        estrato: url.searchParams.get('estrato'),
        ordering: url.searchParams.get('ordering') || 'area'
    };
    
    const queryString = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v)
    ).toString();
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/lotes/search/?${queryString}`
    );
    
    const data = await res.json();
    
    return json({
        user,
        lotes: data.results || data,
        totalCount: data.count,
        filters
    }, { headers: setCookieHeaders });
}
```

### Filtros Avanzados
- **Ubicación:** Zona, barrio
- **Área:** Rango min-max
- **Precio:** Rango min-max  
- **Normativa:** Tratamiento POT
- **Características:** Estrato, servicios
- **Ordenamiento:** Precio, área, fecha

### Componentes
- Mapa de resultados
- Lista/Grid de lotes (`LoteCard`)
- Panel de filtros lateral
- Paginación

---

## `developer.lots.$lotId.tsx`

**Ruta:** `/developer/lots/:lotId`  
**Tipo:** Detalle de lote  
**Autenticación:** Developer only

### Descripción
Vista completa de un lote público con opción de agregar a favoritos.

### Action (Toggle Favorito)
```typescript
export async function action({ request, params }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    const intent = formData.get('intent');
    
    if (intent === 'toggle_favorite') {
        const { res, setCookieHeaders } = await fetchWithAuth(
            request,
            `${API_URL}/api/favorites/toggle/`,
            {
                method: 'POST',
                body: JSON.stringify({ lote_id: params.lotId })
            }
        );
        
        const data = await res.json();
        
        return json({
            isFavorite: data.is_favorite,
            message: data.message
        }, { headers: setCookieHeaders });
    }
    
    return json({ error: 'Intent inválido' }, { status: 400 });
}
```

---

## `developer.favorites.tsx`

**Ruta:** `/developer/favorites`  
**Tipo:** Lista de favoritos  
**Autenticación:** Developer only

### Descripción
Gestión de lotes marcados como favoritos.

### Loader
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const user = await requireUser(request);
    
    const { favorites, count, headers } = await getFavoriteLotes(request);
    
    return json({
        user,
        favorites,
        count
    }, { headers });
}
```

### Action (Eliminar Favorito)
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    const intent = formData.get('intent');
    
    if (intent === 'remove') {
        const favoriteId = formData.get('favoriteId');
        
        await fetchWithAuth(
            request,
            `${API_URL}/api/favorites/${favoriteId}/`,
            { method: 'DELETE' }
        );
        
        return json({ success: true });
    }
    
    return json({ error: 'Intent inválido' }, { status: 400 });
}
```

---

## `developer.investment.tsx`

**Ruta:** `/developer/investment`  
**Tipo:** Criterios de inversión  
**Autenticación:** Developer only

### Descripción
Configuración de criterios de inversión para recomendaciones personalizadas.

### Action (Guardar Criterios)
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const user = await requireUser(request);
    const formData = await request.formData();
    
    const criterios = {
        zonas_interes: formData.getAll('zonas'),
        presupuesto_min: parseFloat(formData.get('presupuesto_min') as string),
        presupuesto_max: parseFloat(formData.get('presupuesto_max') as string),
        area_min: parseFloat(formData.get('area_min') as string),
        tratamientos: formData.getAll('tratamientos'),
        tipo_proyecto: formData.get('tipo_proyecto')
    };
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/investment-criteria/`,
        {
            method: 'POST',
            body: JSON.stringify(criterios)
        }
    );
    
    if (!res.ok) {
        const errors = await res.json();
        return json({ errors }, { status: 400 });
    }
    
    return json({ success: true }, { headers: setCookieHeaders });
}
```

### Criterios Configurables
- Zonas de interés
- Rango de presupuesto
- Área mínima/máxima
- Tratamientos POT preferidos
- Tipo de proyecto (VIS, VIP, No VIS, Mixto)
- ROI esperado

---

## `developer.analisis._index.tsx`

**Ruta:** `/developer/analisis`  
**Tipo:** Lista de análisis  
**Autenticación:** Developer only

### Documentado anteriormente - Ver sección completa

---

## `developer.analisis.$id.tsx`

**Ruta:** `/developer/analisis/:id`  
**Tipo:** Detalle de análisis  
**Autenticación:** Developer only

### Documentado anteriormente - Ver sección completa

---

## `developer.analisis.solicitar.tsx`

**Ruta:** `/developer/analisis/solicitar`  
**Tipo:** Formulario de solicitud  
**Autenticación:** Developer only

### Documentado anteriormente - Ver sección completa

---

# 📊 Resumen de Arquitectura de Rutas

## Convenciones de Nomenclatura

### Layouts (sin extensión específica)
```
admin.tsx          → /admin/* (layout)
owner.tsx          → /owner/* (layout)
developer.tsx      → /developer/* (layout)
```

### Index Routes (._index)
```
admin._index.tsx       → /admin (index del layout)
owner._index.tsx       → /owner
developer._index.tsx   → /developer
```

### Rutas Anidadas
```
admin.lotes.tsx              → /admin/lotes
admin.lote.$id.tsx           → /admin/lote/:id
admin.lotes_.$id.editar.tsx  → /admin/lotes/:id/editar
```

### Underscore (_) para Evitar Anidación
```
owner.lotes_.nuevo.tsx       → /owner/lotes/nuevo (NO anidado bajo lotes.tsx)
admin.usuarios_.nuevo.tsx    → /admin/usuarios/nuevo
```

### Parámetros Dinámicos ($)
```
admin.lote.$id.tsx                → /admin/lote/:id
owner.lote.$loteId.tsx            → /owner/lote/:loteId
owner.lote.$loteId_.documentos.tsx → /owner/lote/:loteId/documentos
```

---

## Protección de Rutas

### Middleware de Autenticación
```typescript
// En cada loader
const user = await requireUser(request);

// requireUser lanza redirect si no está autenticado
if (!user) {
    throw redirect('/login');
}
```

### Validación de Rol
```typescript
// En loaders de rutas específicas
if (user.role !== 'admin') {
    throw new Response("Acceso denegado", { status: 403 });
}
```

### Validación de Propiedad
```typescript
// En rutas de recursos propios (ej: owner.lote.$loteId)
const lote = await getLote(params.loteId);

if (lote.propietario !== user.id) {
    throw new Response("No autorizado", { status: 403 });
}
```

---

## Manejo de Errores

### Error Boundaries
Cada layout tiene un ErrorBoundary:

```tsx
export function ErrorBoundary() {
    const error = useRouteError();
    
    if (isRouteErrorResponse(error)) {
        return (
            <div className="error-page">
                <h1>{error.status} {error.statusText}</h1>
                <p>{error.data}</p>
            </div>
        );
    }
    
    return (
        <div className="error-page">
            <h1>Error inesperado</h1>
            <p>{error.message}</p>
        </div>
    );
}
```

---

## Patrones de Loader

### Loader con Filtros
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const filters = {
        search: url.searchParams.get('search'),
        status: url.searchParams.get('status'),
        page: parseInt(url.searchParams.get('page') || '1')
    };
    
    const queryString = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v)
    ).toString();
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/resource/?${queryString}`
    );
    
    const data = await res.json();
    
    return json({ data }, { headers: setCookieHeaders });
}
```

### Loader con Múltiples Requests
```typescript
export async function loader({ request }: LoaderFunctionArgs) {
    const [lotes, stats, notifications] = await Promise.all([
        fetchWithAuth(request, `${API_URL}/api/lotes/`),
        fetchWithAuth(request, `${API_URL}/api/stats/`),
        fetchWithAuth(request, `${API_URL}/api/notifications/`)
    ]);
    
    return json({
        lotes: await lotes.res.json(),
        stats: await stats.res.json(),
        notifications: await notifications.res.json()
    });
}
```

---

## Patrones de Action

### Action con Múltiples Intents
```typescript
export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData();
    const intent = formData.get('intent');
    
    switch (intent) {
        case 'create':
            return handleCreate(request, formData);
        case 'update':
            return handleUpdate(request, params, formData);
        case 'delete':
            return handleDelete(request, params);
        default:
            return json({ error: 'Intent inválido' }, { status: 400 });
    }
}
```

### Action con Upload de Archivos
```typescript
export async function action({ request }: ActionFunctionArgs) {
    const formData = await request.formData();
    const archivo = formData.get('archivo') as File;
    
    // Validaciones
    if (!archivo) {
        return json({ errors: { archivo: 'Archivo requerido' } });
    }
    
    if (archivo.size > 10 * 1024 * 1024) { // 10MB
        return json({ errors: { archivo: 'Archivo muy grande' } });
    }
    
    // Crear FormData para multipart
    const uploadData = new FormData();
    uploadData.append('archivo', archivo);
    
    const { res, setCookieHeaders } = await fetchWithAuth(
        request,
        `${API_URL}/api/upload/`,
        {
            method: 'POST',
            body: uploadData
        }
    );
    
    return json({ success: true }, { headers: setCookieHeaders });
}
```

---

## Integración con fetchWithAuth

Todas las rutas usan `fetchWithAuth` para:
- ✅ Incluir automáticamente cookies de auth
- ✅ Refrescar tokens si expiran
- ✅ Retornar headers con cookies actualizadas
- ✅ Manejar errores de autenticación

```typescript
const { res, setCookieHeaders } = await fetchWithAuth(
    request,
    `${API_URL}/api/endpoint/`,
    {
        method: 'POST',
        body: JSON.stringify(data)
    }
);

return json(responseData, { headers: setCookieHeaders });
```

---

**Última actualización:** Enero 2025  
**Total de rutas documentadas:** 50+  
**Framework:** Remix 2.x  
**Patrón de autenticación:** Cookie-based JWT