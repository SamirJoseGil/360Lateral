# 🏗️ Lateral 360° - Plataforma de Gestión de Lotes Inmobiliarios

Una plataforma integral para la gestión, visualización y administración de lotes inmobiliarios con capacidades de mapeo 360°, gestión de documentos y análisis de datos.

## 📋 Tabla de Contenidos

- [🚀 Características Principales](#-características-principales)
- [🛠️ Tecnologías](#️-tecnologías)
- [⚡ Inicio Rápido](#-inicio-rápido)
- [🐳 Instalación con Docker](#-instalación-con-docker)
- [🔧 Desarrollo Local](#-desarrollo-local)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [📚 Documentación Detallada](#-documentación-detallada)
- [👤 Historias de Usuario](#-historias-de-usuario)
- [🔌 Conexiones y Seguridad](#-conexiones-y-seguridad)
- [🌐 API y Endpoints](#-api-y-endpoints)
- [⚙️ Variables de Entorno](#️-variables-de-entorno)
- [👥 Equipo de Desarrollo](#-equipo-de-desarrollo)

## ⚡ Inicio Rápido

### Docker (Recomendado)
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/360Lateral.git
cd 360Lateral

# Ejecutar con Docker
docker-compose up -d

# Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Admin Panel: http://localhost:8000/admin
# API Docs: http://localhost:8000/swagger
```

### Desarrollo Local
```bash
# Backend
cd Backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (en otra terminal)
cd Frontend
npm install
npm run dev
```

## 🚀 Características Principales

### 🏡 Gestión de Lotes
- **Registro completo** de lotes con información detallada
- **Visualización en mapas** con integración de geolocalización
- **Estados y categorías** personalizables
- **Historial de cambios** y auditoría completa

### 📄 Gestión de Documentos
- **Subida y almacenamiento** seguro de documentos
- **Categorización automática** por tipo de documento
- **Versionado de documentos** con historial
- **Vista previa** de documentos directamente en la plataforma

### 🏗️ Análisis Urbanístico
- **Integración con MapGIS Medellín** para consulta automática de predios
- **Cálculos de aprovechamiento** según POT de Medellín
- **Determinación de tipologías viables** por lote
- **Parámetros normativos** en tiempo real
- **Estimación de unidades** y área construible

### 📊 Dashboard y Estadísticas
- **Métricas en tiempo real** de ventas y disponibilidad
- **Gráficos interactivos** con filtros avanzados
- **Reportes exportables** en PDF y Excel
- **Análisis de tendencias** y proyecciones

### 👤 Sistema de Usuarios
- **Autenticación segura** con JWT
- **Roles diferenciados**: Admin, Propietario, Desarrollador
- **Permisos granulares** por funcionalidad
- **Perfil de usuario** personalizable

## 🛠️ Tecnologías

### Backend
- **Django 5.2** - Framework web principal
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y sesiones
- **Swagger/OpenAPI** - Documentación de API

### Frontend
- **Remix** - Framework React full-stack
- **TailwindCSS + DaisyUI** - Diseño y componentes
- **TypeScript** - Tipado estático
- **Vite** - Bundler y dev server

### DevOps
- **Docker & Docker Compose** - Containerización
- **nginx** - Proxy reverso y servidor web
- **PostgreSQL** - Base de datos
- **Redis** - Cache y sesiones

## 🧑‍💻 Sprints de Desarrollo

### ✅ **Sprint 1 – Base de Datos**

**Objetivo:** Modelado de datos, autenticación, estructura base del admin y entidades principales.

| ID            | Tarea                                           |
| ------------- | ----------------------------------------------- |
| LOSMAQUINA-15 | Editar Información de Perfil de Usuario         |
| LOSMAQUINA-36 | Administrar Usuarios (Dueños y Desarrolladores) |
| LOSMAQUINA-68 | Registrar Datos de Propietario                  |
| LOSMAQUINA-69 | Registrar Datos de Propietario de Lote          |
| LOSMAQUINA-14 | Registrar Datos de Desarrollador                |
| LOSMAQUINA-16 | Registrar Lote por propietario o comisionista   |
| LOSMAQUINA-17 | Validar Duplicados de Lote por Dirección y CTL  |
| LOSMAQUINA-34 | Gestionar Avance de Etapas                      |
| LOSMAQUINA-35 | Gestionar Estudios y Documentación de Lotes     |
| LOSMAQUINA-48 | Control de Acceso Basado en Roles               |
| LOSMAQUINA-49 | Comunicación Segura Frontend-Backend            |

---

### ✅ **Sprint 2 – Backend Core**

**Objetivo:** Construcción de APIs, lógica de negocio, endpoints de lotes, usuarios y roles.

| ID            | Tarea                                                          |
| ------------- | -------------------------------------------------------------- |
| LOSMAQUINA-13 | Registrarse con Gmail                                          |
| LOSMAQUINA-59 | CLONE - Registrarse con Gmail - revisión                       |
| LOSMAQUINA-18 | Editar Información No Crítica del Lote por Dueño               |
| LOSMAQUINA-19 | Solicitar Revisión de Datos Críticos del Lote por Dueño        |
| LOSMAQUINA-20 | Ver Estado del Lote por Dueño                                  |
| LOSMAQUINA-21 | Agregar Documentos Adicionales al Lote por Dueño               |
| LOSMAQUINA-33 | Listar y Ver Lotes y Ofertas                                   |
| LOSMAQUINA-40 | Gestionar Solicitudes de Revisión de Datos Críticos            |
| LOSMAQUINA-22 | Definir Campos de Interés/Tesis de Inversión por Desarrollador |
| LOSMAQUINA-23 | Buscar Lotes y Ver Info Básica (Anónimo para Dueño)            |
| LOSMAQUINA-24 | Ver Información de Lotes en Etapa 1 por Desarrollador          |
| LOSMAQUINA-25 | Comprar Acceso a Estudios Detallados del Lote                  |
| LOSMAQUINA-26 | Obtener Exclusividad Temporal (Freezing) del Lote              |
| LOSMAQUINA-27 | Presentar Carta de Intención por un Lote                       |
| LOSMAQUINA-28 | Realizar Oferta/Iniciar Promesa de Compraventa                 |
| LOSMAQUINA-29 | Remover Interés u Oferta de un Lote                            |
| LOSMAQUINA-32 | Aceptar/Rechazar Carta o Freezing                              |
| LOSMAQUINA-30 | Recibir Notificación de Carta/Promesa (Dueño)                  |
| LOSMAQUINA-31 | Ver Cartas de Intención/Promesas Recibidas                     |
| LOSMAQUINA-41 | Cargar Documentos Manualmente                                  |

---

### ✅ **Sprint 3 – Frontend Core**

**Objetivo:** Interfaz de usuario, conexión con backend, lógica de frontend y diseño adaptado por rol.

| ID            | Tarea                                                       |
| ------------- | ----------------------------------------------------------- |
| LOSMAQUINA-15 | Editar Información de Perfil de Usuario (Frontend)          |
| LOSMAQUINA-33 | Listar y Ver Lotes y Ofertas (UI/UX)                        |
| LOSMAQUINA-40 | Gestionar Solicitudes de Revisión de Datos Críticos (UI/UX) |
| LOSMAQUINA-13 | Registrarse con Gmail (UI)                                  |
| LOSMAQUINA-68 | Registrar Datos de Propietario (UI)                         |
| LOSMAQUINA-16 | Registrar Lote por propietario o comisionista (UI)          |
| LOSMAQUINA-19 | Solicitar Revisión de Datos Críticos del Lote (UI)          |
| LOSMAQUINA-20 | Ver Estado del Lote por Dueño (UI)                          |
| LOSMAQUINA-21 | Agregar Documentos Adicionales (UI)                         |
| LOSMAQUINA-24 | Ver Información de Lotes (UI)                               |
| LOSMAQUINA-27 | Presentar Carta de Intención (UI)                           |
| LOSMAQUINA-28 | Iniciar Promesa de Compraventa (UI)                         |
| LOSMAQUINA-32 | Aceptar/Rechazar Carta o Freezing (UI)                      |
| LOSMAQUINA-30 | Notificación de Carta/Promesa (UI)                          |
| LOSMAQUINA-39 | Generar Reportes de Actividad                               |

---

### 🚀 **Sprint 4 – Filtro, Cálculo y Viabilidad de Lote**

**Objetivo:** Integración con MapGIS Medellín, cálculos urbanísticos, análisis de viabilidad y estimación financiera.

| ID            | Tarea                                                    |
| ------------- | -------------------------------------------------------- |
| LOSMAQUINA-40 | Consulta e Identificación del Predio desde MapGIS       |
| LOSMAQUINA-41 | Cálculo de Aprovechamiento Urbanístico del Lote         |
| LOSMAQUINA-42 | Identificación de Condiciones Especiales                |
| LOSMAQUINA-43 | Cálculo de Potencial Constructivo y Tipologías Viables  |
| LOSMAQUINA-44 | Estimación de Costos de Desarrollo y Valor Objetivo del Lote |

#### **LOSMAQUINA-40 – Consulta e Identificación del Predio desde MapGIS** ✅ **COMPLETADO**
**Funcionalidad:** Permite al usuario ingresar matrícula, dirección, CBML o ubicación en mapa para obtener datos del predio desde la plataforma oficial de Medellín.
- **Integración:** ✅ Conexión exitosa con la página MapGIS Medellín extrayendo información real del lote.
- **Flujo:** Usuario → Ingresar Matrícula/Dirección → Consulta MapGIS → ✅ Retornar Datos Reales del Predio
- **Datos obtenidos:** CBML, Clasificación del suelo (Urbano), Casos POT, Normativa específica
- **Cache:** Sistema Redis guardando resultados automáticamente
- **Status:** 🎉 **100% FUNCIONAL - DATOS REALES EXTRAÍDOS**

#### **LOSMAQUINA-41 – Cálculo de Aprovechamiento Urbanístico del Lote**
**Funcionalidad:** Procesa parámetros urbanísticos y de construcción para determinar el potencial de uso residencial, incluyendo índices, alturas, usos de suelo y aislamientos.
- **Integración:** Toma datos del POT, microzonificación y cartografía ambiental del municipio para aplicar reglas.
- **Flujo:** Consulta Datos Lote → Parámetros Urbanísticos → Procesar Índices y Alturas → Determinar Usos y Restricciones

#### **LOSMAQUINA-42 – Identificación de Condiciones Especiales**
**Funcionalidad:** Detecta si el predio está en zona de conservación, tiene restricciones ambientales/patrimoniales o está en plan parcial/macroproyecto.
- **Integración:** Usa cartografía ambiental (GeoMedellín) y otras fuentes públicas para marcar afectaciones.
- **Flujo:** Consulta Datos Lote → Verificación Restricciones Ambientales → Registrar Condiciones Especiales

#### **LOSMAQUINA-43 – Cálculo de Potencial Constructivo y Tipologías Viables**
**Funcionalidad:** Calcula área máxima ocupable, área máxima construida, número estimado de unidades y tipologías viables con base en densidad, índices y afectaciones.
- **Integración:** Combina parámetros normativos con reglas de ocupación de zonas comunes y parqueaderos según POT.
- **Flujo:** Parámetros Urbanísticos → Calcular Área Neta y Bruta → Determinar Área Ocupación y Construcción → Estimar Unidades y Tipologías

#### **LOSMAQUINA-44 – Estimación de Costos de Desarrollo y Valor Objetivo del Lote**
**Funcionalidad:** Genera un presupuesto aproximado de construcción, costos indirectos, financieros y valor final objetivo del lote. Considera variables como precios por m², porcentajes estándar, devolución de IVA (VIS) y utilidad proyectada.
- **Integración:** Cruza información de mercado con reglas financieras preconfiguradas para proyecciones rápidas.
- **Flujo:** Cálculos Potencial Constructivo → Estimar Costos de Construcción → Calcular Costo Indirecto y Financiero → Determinar Valor Objetivo

---

### 🚀 **Sprint 5 – Búsqueda Avanzada y Favoritos**

**Objetivo:** Sistema de búsqueda complejo, filtros avanzados y gestión de favoritos.

| ID            | Tarea                                                       |
| ------------- | ----------------------------------------------------------- |
| Búsqueda-01   | Backend de Búsqueda con Elasticsearch                      |
| Búsqueda-02   | Frontend de Búsqueda con Filtros Dinámicos                 |
| Favoritos-01  | Backend Sistema de Favoritos                               |
| Favoritos-02  | Frontend Lista de Favoritos                                |

---

### 🚀 **Sprint 6 – Analytics y Reportes**

**Objetivo:** Dashboard de métricas, generación de reportes y análisis de datos.

| ID            | Tarea                                                       |
| ------------- | ----------------------------------------------------------- |
| Analytics-01  | Métricas Backend con KPIs                                  |
| Analytics-02  | Charts Frontend con visualizaciones                        |
| Reportes-01   | Generación de PDFs                                         |
| Reportes-02   | Interface de Reportes                                      |

---

### 🚀 **Sprint 7 – Seguridad y Optimización**

**Objetivo:** Fortalecer seguridad, optimizar performance y preparar para producción.

| ID            | Tarea                                                       |
| ------------- | ----------------------------------------------------------- |
| Security-01   | Rate Limiting y Validaciones                               |
| Security-02   | HTTPS/SSL y Variables Seguras                              |
| Perf-01       | Optimización de Base de Datos                             |
| Perf-02       | Optimización Frontend                                      |

---

### 🚀 **Sprint 8 – Deployment y Producción**

**Objetivo:** CI/CD pipeline, deployment automatizado y monitoreo en producción.

| ID            | Tarea                                                       |
| ------------- | ----------------------------------------------------------- |
| Deploy-01     | GitHub Actions CI/CD                                       |
| Deploy-02     | Infrastructure as Code                                     |
| Deploy-03     | Monitoring y Health Checks                                 |
| Deploy-04     | Testing Final Integral                                     |

## 🔌 Conexiones y Seguridad

### Autenticación y Autorización
- **Autenticación básica por rol** (Admin, Dueño, Desarrollador)
- **JWT Tokens** para sesiones seguras
- **Validaciones de permisos** por endpoint
- **Middleware de seguridad** Django

### Base de Datos
- **PostgreSQL** conectada para almacenar lotes, usuarios y documentos
- **Redis** para cache y sesiones temporales
- **Respaldos automáticos** con Docker volumes
- **Migraciones versionadas** con Django

### Validaciones
- **Validaciones para evitar duplicados** de matrícula de lotes
- **Errores de carga controlados** con mensajes descriptivos
- **Sanitización de datos** de entrada
- **Validación de archivos** PDF y formatos permitidos

## ⚙️ Variables de Entorno

### Backend Local (`Backend/.env`)
```bash
# Database
DB_NAME=lateral360_local
DB_HOST=localhost
DB_PORT=5432

# API
CORS_ALLOWED_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key
```

### Frontend Local (`Frontend/.env`)
```bash
# API
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="Lateral 360°"

# Features
VITE_ENABLE_DEBUG=true
```

### Docker
Las variables para Docker están en:
- `Backend/.env.docker`
- `Frontend/.env.docker`

## 🐳 Instalación con Docker

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/360Lateral.git
cd 360Lateral

# Construir y ejecutar servicios
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Ejecutar migraciones (primera vez)
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes
docker-compose down -v
```

## 🔧 Desarrollo Local

### Prerrequisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend
```bash
cd Backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor de desarrollo
python manage.py runserver
```

### Frontend
```bash
cd Frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

### Desarrollo Local

#### Configuración PostgreSQL Local
```bash
# 1. Instalar PostgreSQL (si no está instalado)
# Windows: Descargar desde https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql postgresql-contrib

# 2. Clonar el repositorio
git clone https://github.com/tu-usuario/360Lateral.git
cd 360Lateral

# 3. Configurar Backend
cd Backend

# 4. Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/macOS

# 5. Instalar dependencias
pip install -r requirements.txt

# 6. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 7. Configurar PostgreSQL automáticamente
python scripts/setup_postgres.py

# 8. Ejecutar servidor
python manage.py runserver
```

#### Configuración Manual de PostgreSQL
```bash
# Si prefieres configurar manualmente:

# 1. Conectar a PostgreSQL
psql -U postgres

# 2. Crear base de datos
DROP DATABASE IF EXISTS lateral360;
CREATE DATABASE lateral360
WITH OWNER postgres
ENCODING 'UTF8'
LC_COLLATE = 'C'
LC_CTYPE = 'C'
TEMPLATE template0;

# 3. Salir de PostgreSQL
\q

# 4. Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Crear usuarios demo
python manage.py create_demo_users

# 7. Ejecutar servidor
python manage.py runserver
```

## 📁 Estructura del Proyecto

```
360Lateral/
├── Backend/                 # Django REST API
│   ├── apps/               # Aplicaciones Django
│   │   ├── users/          # Gestión de usuarios
│   │   ├── lotes/          # Gestión de lotes
│   │   ├── documents/      # Gestión de documentos
│   │   └── stats/          # Estadísticas
│   ├── config/             # Configuración Django
│   │   ├── settings/       # Settings por ambiente
│   │   ├── urls.py         # URLs principales
│   │   └── wsgi.py         # WSGI config
│   ├── utils/              # Utilidades y helpers
│   ├── requirements.txt    # Dependencias Python
│   ├── Dockerfile          # Docker para backend
│   ├── .env                # Variables locales
│   └── .env.docker         # Variables Docker
├── Frontend/               # Remix Frontend
│   ├── app/                # Código de la aplicación
│   │   ├── routes/         # Rutas de Remix
│   │   ├── components/     # Componentes React
│   │   ├── utils/          # Utilidades
│   │   └── styles/         # Estilos CSS
│   ├── public/             # Archivos estáticos
│   ├── package.json        # Dependencias Node.js
│   ├── Dockerfile          # Docker para frontend
│   ├── .env                # Variables locales
│   └── .env.docker         # Variables Docker
├── docker-compose.yml      # Orquestación Docker
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Esta documentación
```

## 🌐 API y Endpoints

### Principales Endpoints

#### MapGIS y Análisis Urbanístico
- `POST /api/lotes/scrap/cbml/` - Consultar lote por CBML
- `POST /api/lotes/scrap/matricula/` - Consultar lote por matrícula
- `POST /api/lotes/scrap/direccion/` - Consultar lote por dirección
- `GET /api/lotes/tratamientos/` - Listar tratamientos POT disponibles
- `POST /api/lotes/calcular-aprovechamiento/` - Calcular aprovechamiento urbanístico
- `POST /api/lotes/tipologias-viables/` - Obtener tipologías viables para un lote

#### Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/logout/` - Cerrar sesión
- `POST /api/auth/register/` - Registrar usuario
- `GET /api/auth/users/me/` - Perfil del usuario actual

#### Health Checks
- `GET /api/health/` - Estado completo del sistema
- `GET /api/health/simple/` - Health check simple

#### Documentación
- `GET /swagger/` - Documentación Swagger UI
- `GET /redoc/` - Documentación ReDoc

### Acceso a Servicios

**Desarrollo Local:**
- Frontend: http://localhost:3000
- Análisis Urbanístico: http://localhost:3000/analisis-lote
- MapGIS Debug: http://localhost:3000/scrapinfo
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- API Docs: http://localhost:8000/swagger

**Docker:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- API Docs: http://localhost:8000/swagger

## 👥 Equipo de Desarrollo

### **🎨 Diseño y UX**
- **Heydi Morales** - UI/UX Designer, Frontend Developer
- **Salomon Rodriguez** - UI/UX Designer, Frontend Developer

### **🗄️ Base de Datos y Backend**
- **Sara González** - Database Designer, Backend Developer
- **Jose Daniel Castro** - Backend Developer, API Architect
- **Stiven Muñoz** - Backend Developer, Testing Lead

### **⚛️ Frontend Development**
- **Sofia Hernández** - Frontend Developer
- **Alejandro Torres** - Frontend Developer

### **🛠️ DevOps e Infraestructura**
- **Samir Guartinajas** - DevOps Engineer, Full Stack Architect

**🏗️ Hecho con ❤️ por el equipo de Guartinajas Tech**

---

## 📚 Documentación Detallada

Para información específica de cada componente del proyecto, consulta la documentación detallada:

### 🔗 Enlaces a Documentación

| Componente | Descripción | Enlace |
|------------|-------------|--------|
| **🚀 Backend API** | Django REST API, modelos, endpoints y configuración | [📖 Backend README](./Backend/README.md) |
| **⚛️ Frontend Web** | Remix, React, componentes y routing | [📖 Frontend README](./Frontend/README.md) |
| **🎨 Content & Design** | Mockups, diseños, assets y documentación UX | [📖 Content README](./Content/README.md) |

### 📖 Guías Rápidas

- **🏃‍♂️ [Inicio Rápido Backend](./Backend/README.md#-inicio-rápido)** - Configurar y ejecutar la API
- **🎨 [Inicio Rápido Frontend](./Frontend/README.md#-inicio-rápido)** - Configurar y ejecutar la aplicación web
- **🎯 [Guía de Desarrollo](./Content/README.md#-guía-de-desarrollo)** - Estándares y mejores prácticas

### 🔧 Documentación Técnica

- **📊 [API Endpoints](./Backend/README.md#-api-endpoints)** - Lista completa de endpoints
- **🧩 [Componentes Frontend](./Frontend/README.md#-componentes)** - Librería de componentes
- **🎨 [Sistema de Diseño](./Content/README.md#-sistema-de-diseño)** - Guía de estilos y componentes

## 👤 Historias de Usuario

### 🗄️ **Sprint 1 – Base de Datos y Autenticación** (Semanas 2-3)
*Objetivo: Modelado de datos, autenticación, estructura base del admin y entidades principales.*

#### **🔐 Como Usuario del Sistema**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-15** | Como usuario, quiero **editar la información de mi perfil** para mantener mis datos actualizados |
| **LOSMAQUINA-48** | Como administrador, quiero **control de acceso basado en roles** para garantizar la seguridad |
| **LOSMAQUINA-49** | Como desarrollador, quiero **comunicación segura entre frontend y backend** para proteger los datos |

#### **👤 Como Administrador**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-36** | Como administrador, quiero **administrar usuarios (dueños y desarrolladores)** para gestionar el acceso |
| **LOSMAQUINA-34** | Como administrador, quiero **gestionar avance de etapas** para controlar el flujo de trabajo |
| **LOSMAQUINA-35** | Como administrador, quiero **gestionar estudios y documentación de lotes** para mantener la información actualizada |

#### **🏠 Como Propietario de Lote**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-68** | Como propietario, quiero **registrar mis datos personales** para crear mi perfil en la plataforma |
| **LOSMAQUINA-69** | Como propietario, quiero **registrar mis datos como propietario de lote** para vincular mis propiedades |
| **LOSMAQUINA-16** | Como propietario, quiero **registrar un lote** para ponerlo disponible en la plataforma |
| **LOSMAQUINA-17** | Como propietario, quiero **validación de duplicados por dirección y CTL** para evitar registros erróneos |

#### **🏢 Como Desarrollador/Comprador**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-14** | Como desarrollador, quiero **registrar mis datos** para acceder a las funcionalidades de búsqueda |

---

### ⚙️ **Sprint 2 – Backend Core y Lógica de Negocio** (Semanas 3-5)
*Objetivo: Construcción de APIs, lógica de negocio, endpoints de lotes, usuarios y roles.*

#### **🔑 Como Usuario Nuevo**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-13** | Como usuario nuevo, quiero **registrarme con Gmail** para acceder rápidamente a la plataforma |
| **LOSMAQUINA-59** | Como usuario, quiero **revisión del registro con Gmail** para verificar la funcionalidad |

#### **🏠 Como Propietario de Lote**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-18** | Como propietario, quiero **editar información no crítica de mi lote** para mantenerlo actualizado |
| **LOSMAQUINA-19** | Como propietario, quiero **solicitar revisión de datos críticos** para modificar información importante |
| **LOSMAQUINA-20** | Como propietario, quiero **ver el estado de mi lote** para conocer su situación actual |
| **LOSMAQUINA-21** | Como propietario, quiero **agregar documentos adicionales** para complementar la información |
| **LOSMAQUINA-30** | Como propietario, quiero **recibir notificaciones de cartas/promesas** para estar informado |
| **LOSMAQUINA-31** | Como propietario, quiero **ver cartas de intención/promesas recibidas** para gestionar ofertas |
| **LOSMAQUINA-32** | Como propietario, quiero **aceptar/rechazar cartas o freezing** para controlar las negociaciones |

#### **🏢 Como Desarrollador/Comprador**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-22** | Como desarrollador, quiero **definir campos de interés/tesis de inversión** para personalizar búsquedas |
| **LOSMAQUINA-23** | Como desarrollador, quiero **buscar lotes y ver información básica** para encontrar oportunidades |
| **LOSMAQUINA-24** | Como desarrollador, quiero **ver información de lotes en etapa 1** para evaluar inversiones |
| **LOSMAQUINA-25** | Como desarrollador, quiero **comprar acceso a estudios detallados** para tomar decisiones informadas |
| **LOSMAQUINA-26** | Como desarrollador, quiero **obtener exclusividad temporal (freezing)** para asegurar una oportunidad |
| **LOSMAQUINA-27** | Como desarrollador, quiero **presentar carta de intención** para mostrar interés formal |
| **LOSMAQUINA-28** | Como desarrollador, quiero **realizar oferta/iniciar promesa de compraventa** para formalizar la compra |
| **LOSMAQUINA-29** | Como desarrollador, quiero **remover interés u oferta** para cancelar negociaciones |

#### **👨‍💼 Como Administrador**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-33** | Como administrador, quiero **listar y ver lotes y ofertas** para supervisar la actividad |
| **LOSMAQUINA-40** | Como administrador, quiero **gestionar solicitudes de revisión de datos críticos** para aprobar cambios |
| **LOSMAQUINA-41** | Como administrador, quiero **cargar documentos manualmente** para completar información |

---

### 🎨 **Sprint 3 – Frontend Core e Interfaz de Usuario** (Semanas 4-6)
*Objetivo: Interfaz de usuario, conexión con backend, lógica de frontend y diseño adaptado por rol.*

#### **🖥️ Como Usuario (Interfaz Web)**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-15** | Como usuario, quiero una **interfaz para editar mi perfil** que sea intuitiva y fácil de usar |
| **LOSMAQUINA-13** | Como usuario nuevo, quiero una **interfaz de registro con Gmail** que sea rápida y segura |

#### **🏠 Como Propietario (Dashboard)**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-68** | Como propietario, quiero un **formulario de registro de datos** que sea claro y completo |
| **LOSMAQUINA-16** | Como propietario, quiero una **interfaz para registrar lotes** con validaciones en tiempo real |
| **LOSMAQUINA-19** | Como propietario, quiero una **interfaz para solicitar revisión de datos** con seguimiento del estado |
| **LOSMAQUINA-20** | Como propietario, quiero un **dashboard que muestre el estado de mis lotes** de forma visual |
| **LOSMAQUINA-21** | Como propietario, quiero una **interfaz de carga de documentos** con drag & drop |
| **LOSMAQUINA-30** | Como propietario, quiero **notificaciones visuales** cuando reciba cartas o promesas |
| **LOSMAQUINA-32** | Como propietario, quiero **botones claros para aceptar/rechazar** ofertas y solicitudes |

#### **🏢 Como Desarrollador (Portal de Búsqueda)**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-24** | Como desarrollador, quiero una **interfaz de búsqueda de lotes** con filtros avanzados |
| **LOSMAQUINA-27** | Como desarrollador, quiero un **formulario para presentar cartas de intención** que sea profesional |
| **LOSMAQUINA-28** | Como desarrollador, quiero una **interfaz para iniciar promesas de compraventa** paso a paso |

#### **👨‍💼 Como Administrador (Panel de Control)**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-33** | Como administrador, quiero un **dashboard para listar lotes y ofertas** con métricas en tiempo real |
| **LOSMAQUINA-40** | Como administrador, quiero una **interfaz para gestionar solicitudes** con aprobaciones rápidas |
| **LOSMAQUINA-39** | Como administrador, quiero **generar reportes de actividad** con gráficos y exportación |

---

### 📊 **Historias Adicionales para Futuros Sprints**

#### **🚀 Funcionalidades Avanzadas (No Incluidas en MVP)**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-37** | Como administrador, quiero **cargar lotes masivamente** para importar grandes volúmenes de datos |
| **LOSMAQUINA-38** | Como administrador, quiero **asignar/bloquear lotes manualmente** para casos especiales |
| **LOSMAQUINA-70** | Como comisionista, quiero **registrar mis datos** para actuar como intermediario |

#### **🤖 Análisis e IA (Futuro)**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-45** | Como desarrollador, quiero **interpretación preliminar de normas** para evaluar viabilidad |
| **LOSMAQUINA-46** | Como desarrollador, quiero **estimación básica de valor/tiempo** para planificar inversiones |
| **LOSMAQUINA-47** | Como desarrollador, quiero **ver resultados de análisis básico** en reportes automáticos |

#### **🗺️ Integración GIS (Futuro)**
| ID | Historia de Usuario |
|---|---|
| **LOSMAQUINA-43** | Como usuario, quiero **integración con plataformas GIS externas** para datos geográficos |
| **LOSMAQUINA-44** | Como desarrollador, quiero **recuperar capas de datos urbanos** para análisis de ubicación |

---

### 📝 Cronograma de Desarrollo

**Sprint 1** (Semanas 2-3): Base de Datos y Autenticación - *Sara & Samir*
**Sprint 2** (Semanas 3-5): Backend Core y APIs - *Jose Daniel, Stiven, Sara*
**Sprint 3** (Semanas 4-6): Frontend Core e Interfaces - *Heydi, Salomon, Sofia, Alejandro*
**Sprint 4** (Semanas 6-8): Filtro, Cálculo y Viabilidad (MapGIS) - *Todo el equipo*
**Sprint 5** (Semanas 8-9): Búsqueda Avanzada y Favoritos - *Jose Daniel & Alejandro, Sara & Heydi*
**Sprint 6** (Semanas 9-10): Analytics y Reportes - *Jose Daniel & Salomon, Stiven & Sofia*
**Sprint 7** (Semanas 10-11): Seguridad y Optimización - *Samir & Jose Daniel*
**Sprint 8** (Semanas 11-12): Deployment - *Samir*

---

### 📝 Notas de Desarrollo

- Las migraciones se ejecutan automáticamente en Docker
- Los archivos de log se encuentran en `Backend/logs/`
- Los archivos de media se almacenan en `Backend/media/`
- El hot reload está habilitado en desarrollo

### 🐛 Solución de Problemas

**Error de conexión a la base de datos:**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de la base de datos
docker-compose logs db
```

**Error en el frontend:**
```bash
# Limpiar node_modules
rm -rf Frontend/node_modules
cd Frontend && npm install
```

**Problemas con Docker:**
```bash
# Reconstruir contenedores
docker-compose down
docker-compose up --build

# Si persisten problemas de permisos
docker system prune -af --volúmenes
```

### 📞 Contacto del Equipo

Para dudas técnicas o colaboración, contactar:
- **DevOps/Infraestructura**: Samir Guartinajas
- **Backend/API**: Jose Daniel Castro
- **Frontend/UI**: Heydi Morales  
- **Database**: Sara González
- **Testing**: Stiven Muñoz

---

*Proyecto desarrollado como parte del programa de desarrollo de software - Guartinajas Tech Solutions*