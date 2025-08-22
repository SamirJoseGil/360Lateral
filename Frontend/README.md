# 360Lateral Frontend

Aplicación web para la plataforma de contratación lateral 360Lateral, construida con React, TypeScript y Vite.

## 🚀 Características

- **Autenticación de usuarios**: Sistema completo de login y registro
- **Dashboard interactivo**: Panel principal con métricas y navegación
- **Perfil de usuario**: Gestión de información personal
- **Diseño responsivo**: Optimizado para dispositivos móviles y desktop
- **Componentes reutilizables**: Arquitectura modular con componentes UI

## 🛠️ Tecnologías

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- ESLint

## 📁 Estructura del Proyecto

```
360Lateral-Frontend/
📦 app  
┣ 📂 components  
┃ ┣ 📂 atoms  
┃ ┣ 📂 dashboards  
┃ ┣ 📂 molecules  
┃ ┣ 📂 organisms  
┣ 📂 hooks  
┣ 📂 routes  
┣ 📂 services  
┣ 📂 types  
┣ 📂 utils  
┣ 📜 entry.client.tsx  
┣ 📜 entry.server.tsx  
┣ 📜 filesinfo.md  
┣ 📜 root.tsx  
┣ 📜 tailwind.css  
📂 info  
📂 node_modules  
📂 public  
📜 .dockerignore  
📜 .env.docker  
📜 .env.example  
📜 .eslintrc.cjs  
📜 Dockerfile  
📜 package-lock.json  
📜 package.json  
📜 postcss.config.js  
📜 README.md  
📜 remix.config.js  
📜 tailwind.config.ts  
📜 tsconfig.json  
📜 vite.config.ts

```

## ⚡ Instalación y Configuración

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd 360Lateral-Frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```env
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8000
   
   # Environment
   NODE_ENV=development
   
   # Optional: Para configuraciones adicionales
   VITE_APP_NAME=360Lateral
   ```

4. **Asegúrate de que el backend esté ejecutándose**
   
   El backend Django debe estar corriendo en `http://localhost:8000`. Consulta la documentación del backend para más detalles sobre su configuración.

5. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

6. **Construir para producción**
   ```bash
   npm run build
   ```

## 🎯 Scripts Disponibles

- `npm run dev` - Ejecuta la aplicación en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run lint` - Ejecuta ESLint para revisar el código
- `npm run preview` - Previsualiza la construcción de producción

## 🏗️ Arquitectura

### Componentes

- **auth/**: Componentes relacionados con autenticación
- **common/**: Componentes de layout y navegación
- **ui/**: Componentes de interfaz reutilizables

### Páginas

- **Home**: Página de inicio
- **Login/Register**: Páginas de autenticación
- **Dashboard**: Panel principal del usuario
- **Profile**: Gestión del perfil de usuario

## � Configuración de la API

### Backend requerido
El frontend está configurado para conectarse a la API Django que debe estar ejecutándose en `http://localhost:8000`.

### Endpoints disponibles
- **POST** `/api/auth/register/` - Registro de usuarios
- **POST** `/api/auth/login/` - Inicio de sesión
- **POST** `/api/auth/logout/` - Cierre de sesión
- **GET** `/api/auth/users/me/` - Perfil del usuario actual
- **PUT** `/api/users/{id}/` - Actualizar perfil
- **POST** `/api/auth/change-password/` - Cambiar contraseña

### Seguridad implementada
- Autenticación JWT con tokens de 15 minutos
- Rate limiting en endpoints críticos
- Validaciones de seguridad en formularios
- Manejo automático de tokens expirados

## 📦 Nuevos Servicios y Componentes

### Servicio de Autenticación (`~/services/authNew.ts`)
- Manejo completo de la API de usuarios
- Gestión automática de tokens JWT
- Manejo de errores HTTP específicos
- Validaciones de seguridad integradas

### Hook de Autenticación (`~/hooks/useAuth.ts`)
- Estado global de autenticación
- Auto-refresh del perfil de usuario
- Verificación automática de tokens

### Contexto de Autenticación (`~/components/auth/AuthProvider.tsx`)
- Proveedor de contexto para toda la aplicación
- Componente de protección de rutas
- Componente de información del usuario

### Rutas de Autenticación Actualizadas
- **Login** (`~/routes/auth.login.tsx`) - Formulario mejorado con validaciones
- **Registro** (`~/routes/auth.register.tsx`) - Campos completos según API

## 🚀 Uso de los Nuevos Componentes

### 1. Configurar el AuthProvider en tu aplicación principal

```tsx
import { AuthProvider } from '~/components/auth/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      {/* Tu aplicación aquí */}
    </AuthProvider>
  );
}
```

### 2. Proteger rutas privadas

```tsx
import { ProtectedRoute } from '~/components/auth/AuthProvider';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      {/* Contenido del dashboard */}
    </ProtectedRoute>
  );
}
```

### 3. Usar el contexto de autenticación

```tsx
import { useAuthContext } from '~/components/auth/AuthProvider';

export default function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthContext();
  
  if (!isAuthenticated) {
    return <div>No autenticado</div>;
  }
  
  return (
    <div>
      <h1>Hola, {user?.first_name}!</h1>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

## � Testing del Sistema

### 1. Verificar conexión con el backend
```bash
# Asegúrate de que el backend Django esté ejecutándose
curl http://localhost:8000/api/auth/login/

# Deberías recibir una respuesta de error (405 Method Not Allowed) indicando que la API está activa
```

### 2. Probar registro de usuario
1. Inicia el frontend: `npm run dev`
2. Ve a `http://localhost:3000/auth/register`
3. Completa el formulario con datos válidos
4. Verifica que seas redirigido al dashboard tras el registro exitoso

### 3. Probar inicio de sesión
1. Ve a `http://localhost:3000/auth/login`
2. Usa las credenciales del usuario que registraste
3. Verifica que seas redirigido al dashboard

### 4. Probar rutas protegidas
- `/dashboard` - Requiere autenticación
- `/profile` - Permite editar información personal
- `/users` - Solo para administradores

## 🔧 Solución de Problemas Comunes

### Error de CORS
Si ves errores de CORS en el navegador, asegúrate de que el backend Django tenga configurado `django-cors-headers` y permita el origen `http://localhost:3000`.

### Tokens expirados
Los tokens JWT expiran en 15 minutos. El sistema debería manejar esto automáticamente, pero si ves errores 401, intenta cerrar sesión e iniciar sesión nuevamente.

### Error de conexión a la API
- Verifica que el backend esté ejecutándose en `http://localhost:8000`
- Revisa la configuración de la variable `VITE_API_BASE_URL` en el archivo `.env`
- Verifica que no haya firewalls bloqueando las conexiones

## 📋 Checklist de Implementación Completado

✅ **Servicios de Autenticación**
- Servicio completo de API (`~/services/authNew.ts`)
- Manejo de tokens JWT automático
- Gestión de errores HTTP específicos

✅ **Hooks y Contexto**
- Hook de autenticación (`~/hooks/useAuth.ts`)
- Hook de formularios con validaciones (`~/hooks/useForm.ts`) 
- Contexto de autenticación global (`~/components/auth/AuthProvider.tsx`)

✅ **Componentes de UI**
- Layout principal con navegación (`~/components/layout/AppLayout.tsx`)
- Componentes de protección de rutas
- Componentes de información del usuario

✅ **Rutas Funcionales**
- Login actualizado (`~/routes/auth.login.tsx`)
- Registro completo (`~/routes/auth.register.tsx`)
- Dashboard con información del usuario (`~/routes/dashboard.tsx`)
- Perfil editable (`~/routes/profile.tsx`)

✅ **Configuración**
- Variables de entorno configuradas
- Tipos TypeScript definidos
- Documentación completa

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.