
# 📘 **Documentación General – Proyecto Lateral 360°**

---

## 🧱 **0. Estructura General del Proyecto**

### 🛠 Stack Tecnológico

- **Frontend**: Remix + TailwindCSS + DaisyUI
- **Backend**: Django REST Framework
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT con cookies seguras (HttpOnly)
- **Infraestructura**: Docker
- **Gestión del Proyecto**: Notion + GitHub

---

## 🧠 **1. FRONTEND – Lineamientos y Organización**

### ✅ Confirmado:

- **Framework**: Remix
- **Estilos**: TailwindCSS + DaisyUI
- **Arquitectura visual**: Atomic Design
- **Responsividad**: Obligatoria (desktop-first con adaptación mobile)
- **Cliente HTTP**: Axios
- **Autenticación**: JWT + Cookies HttpOnly

### 📁 Estructura Recomendada:

```plaintext
/app
 ├── components/       # Atomic Design (atoms, molecules, organisms)
 ├── routes/           # Páginas por ruta
 ├── services/         # Axios y llamadas a la API
 ├── contexts/         # Context o Zustand
 ├── styles/           # Configs de Tailwind y DaisyUI
 ├── utils/            # Funciones auxiliares
 └── layout/           # Layouts por rol
```

### 📌 Tareas pendientes:

- Definir vistas finales por rol
- Especificar navegación entre rutas
- Estructurar mensajes globales (error, éxito, carga)

---

## 🔧 **2. BACKEND – Arquitectura y Configuración**

### ✅ Confirmado:

- **Framework**: Django REST Framework
- **Base de datos**: PostgreSQL
- **Autenticación**: JWT con roles embebidos
- **Arquitectura**: MVC
- **Despliegue**: Docker
- **Servicios externos**: No por ahora, pero dejar posibilidad

### 📚 Librerías Sugeridas:

```plaintext
- djangorestframework
- djangorestframework-simplejwt
- django-cors-headers
- psycopg2
- python-decouple
- drf-yasg (documentación Swagger)
```

### 📁 Estructura recomendada:

```plaintext
/backend
 ├── core/              # App principal (lógica de negocio)
 │   ├── models/
 │   ├── views/
 │   ├── serializers/
 │   ├── urls/
 │   ├── permissions/
 │   └── tasks/
 ├── users/             # Autenticación y perfiles
 ├── documents/         # Manejo y verificación de archivos
 ├── utils/             # Funciones auxiliares
 ├── stats/             # Lógica de estadísticas
 ├── config/            # Configuración principal Django
 └── Dockerfile
```

### 📌 Tareas pendientes:

- Definir entidades (Usuario, Lote, Documento...)
- Crear modelo de datos general
- Confirmar roles y encapsular permisos en tokens
- Definir endpoints REST finales

---

## 🎨 **3. MOCKUP – Diseño en Figma**

### ✅ Confirmado:

- Herramienta: Figma
- Estilo: Moderno, basado en [https://360lateral.com/](https://360lateral.com/)
- Enfoque: Desktop-first con diseño responsive

### 🧩 Vistas mínimas por rol:

#### 🔷 Dueño de lote

- Login / Registro
- Dashboard
- Registro de lote (formulario)
- Subida de documentos
- Estado del lote

#### 🔶 Desarrollador

- Login / Registro
- Dashboard
- Buscador de lotes
- Detalle de lote
- Contacto con propietario

#### 🟢 Administrador

- Login
- Panel de control
- Validación de documentos
- Estadísticas del sistema

### 📌 Tareas pendientes:

- Confirmar flujo de navegación completo
- Definir tipografías y paleta (basada en el branding web actual)
- Crear wireframes rápidos por vista
- Montar prototipos funcionales

---

## 🔁 **4. Flujo de Navegación General**

```plaintext
1. Login (con detección de rol)
2. Redirección al dashboard correspondiente
3. Acciones por usuario (registro, búsqueda, contacto, edición)
4. Sistema de validación (documentos, cambios, estado)
5. Reportes y estadísticas para administrador
```

---

## 🌐 **5. Endpoints Preliminares por Rol**

### 🔷 Dueño de Lote

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/lotes`
- `POST /api/lotes`
- `PUT /api/lotes/:id`
- `POST /api/lotes/:id/documentos`
- `GET /api/lotes/:id/estado`

### 🔶 Desarrollador

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/lotes?filtro=...`
- `GET /api/lotes/:id`
- `POST /api/favoritos/:lote_id`
- `POST /api/contacto/:lote_id`

### 🟢 Administrador

- `POST /api/auth/login`
- `GET /api/admin/dashboard`
- `GET /api/admin/usuarios`
- `PUT /api/lotes/:id/estado`
- `GET /api/documentos`
- `PUT /api/documentos/:id`

---

## 📊 **6. Estadísticas para el Admin**

Métricas recomendadas:

- Total de lotes registrados
- Lotes por estado
- Documentos cargados vs. validados
- Zonas con mayor actividad
- Usuarios activos por rol
- Logs recientes por usuario

---

## 📁 **7. Documentos y Validación**

Modelo sugerido:

```python
class DocumentoLote(models.Model):
    lote = models.ForeignKey(Lote, on_delete=models.CASCADE)
    tipo = models.CharField(choices=TIPOS_DOCUMENTO)
    archivo = models.FileField(upload_to='documentos/')
    fecha_subida = models.DateTimeField(auto_now_add=True)
    editable_hasta = models.DateTimeField()
    aprobado = models.BooleanField(default=False)
```

---

## 🧪 **8. Git & Buenas Prácticas**

### 🧬 Ramas

```plaintext
- main
- develop
- feature/*
- hotfix/*
```

### 🧾 Convención de commits

```plaintext
feat: nueva funcionalidad
fix: corrección de bug
chore: cambios menores
docs: documentación
refactor: mejora interna
```

### 🔀 Pull Requests

- Desde `feature/*` a `develop`
- Revisado por mínimo un compañero
- Nombres descriptivos

---

## 🗃️ **9. Notion – Organización Sugerida**

```plaintext
📁 Proyecto Lateral 360°
 ├── 🔹 Vision general del proyecto
 ├── 🔹 Tareas por sprint
 ├── 🔹 Stack tecnológico
 ├── 🔹 Diseño (mockups, wireframes)
 ├── 🔹 Documentación técnica (API, entidades, endpoints)
 └── 🔹 Historial de decisiones
```

	
