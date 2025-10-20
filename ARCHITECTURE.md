# Arquitectura del Sistema - Lateral 360°

## Visión General

Lateral 360° es una plataforma web full-stack para la gestión y análisis de lotes urbanos. Utiliza una arquitectura de microservicios con separación clara entre frontend y backend.

## Stack Tecnológico

### Backend
- **Framework:** Django 4.2.7 + Django REST Framework 3.14.0
- **Base de Datos:** PostgreSQL 15
- **Cache:** Redis 7
- **Autenticación:** JWT (Simple JWT)
- **Documentación API:** drf-yasg (Swagger/OpenAPI)
- **WSGI Server:** Gunicorn (producción)
- **Lenguaje:** Python 3.11

### Frontend
- **Framework:** Remix 2.x (React 18.x)
- **Lenguaje:** TypeScript 5.x
- **Estilos:** Tailwind CSS 3.x
- **Build Tool:** Vite 5.x
- **Renderizado:** SSR (Server-Side Rendering) + CSR (Client-Side Rendering)

### Infraestructura
- **Contenedores:** Docker + Docker Compose
- **Proxy Reverso:** Nginx (producción)
- **CI/CD:** GitHub Actions (futuro)

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                         Cliente                             │
│                      (Navegador Web)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Remix)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Rutas │ Componentes │ Utils │ Services             │  │
│  │  SSR   │    UI       │ Helpers│ API Calls           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Django)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API REST │ Authentication │ Business Logic         │  │
│  │  JWT Auth │ Permissions    │ Services               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│        ┌─────────────────┼─────────────────┐              │
│        ▼                 ▼                 ▼               │
│  ┌─────────┐      ┌──────────┐     ┌──────────┐          │
│  │PostgreSQL│      │  Redis   │     │MapGIS API│          │
│  │   DB     │      │  Cache   │     │ External │          │
│  └─────────┘      └──────────┘     └──────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Arquitectura del Backend

### Estructura de Módulos

```
Backend/
├── apps/
│   ├── authentication/    # Autenticación JWT
│   ├── users/            # Gestión de usuarios
│   ├── lotes/            # Gestión de lotes
│   ├── pot/              # Plan de Ordenamiento Territorial
│   ├── documents/        # Gestión de documentos
│   ├── stats/            # Estadísticas
│   └── common/           # Utilidades comunes
├── config/
│   ├── settings.py       # Configuración unificada
│   ├── urls.py           # URLs principales
│   └── wsgi.py           # WSGI config
└── scripts/              # Scripts de utilidad
```

### Capas de la Aplicación

#### 1. Capa de Presentación (API)
- **Vistas DRF:** Manejan requests HTTP
- **Serializers:** Validación y transformación de datos
- **Permissions:** Control de acceso basado en roles

#### 2. Capa de Lógica de Negocio
- **Services:** Lógica de negocio compleja
- **Models:** Definición de datos y validaciones
- **Signals:** Eventos y efectos secundarios

#### 3. Capa de Datos
- **PostgreSQL:** Almacenamiento persistente
- **Redis:** Cache y sesiones
- **Migraciones:** Control de versiones de BD

### Patrones de Diseño

#### Repository Pattern
```python
# services.py
class RequestStatusService:
    @staticmethod
    def get_user_requests(user, request_type=None, status=None):
        # Lógica de negocio separada del modelo
        queryset = UserRequest.objects.filter(user=user)
        if request_type:
            queryset = queryset.filter(request_type=request_type)
        return queryset
```

#### Service Layer Pattern
```python
# Separación entre vista y lógica de negocio
class UserRequestViewSet(viewsets.ModelViewSet):
    def list(self, request):
        # Vista delgada, lógica en servicio
        requests = RequestStatusService.get_user_requests(request.user)
        return Response(...)
```

## Arquitectura del Frontend

### Estructura de Rutas (Remix)

```
app/
├── routes/
│   ├── _index.tsx              # Página principal
│   ├── login.tsx               # Login
│   ├── register.tsx            # Registro
│   ├── admin/                  # Rutas de admin
│   │   ├── _layout.tsx        # Layout compartido
│   │   ├── _index.tsx         # Dashboard admin
│   │   └── users.tsx          # Gestión usuarios
│   ├── owner/                  # Rutas de propietario
│   └── developer/              # Rutas de desarrollador
├── components/                 # Componentes reutilizables
├── utils/                      # Utilidades
├── services/                   # Servicios API
└── config/                     # Configuración
```

### Flujo de Datos

#### Server-Side Rendering (SSR)
```typescript
// 1. Loader ejecutado en servidor
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);  // SSR
  return json({ user });
}

// 2. Componente renderizado en servidor y cliente
export default function Page() {
  const { user } = useLoaderData<typeof loader>();
  return <div>Hola {user.name}</div>;
}
```

#### Client-Side Rendering (CSR)
```typescript
// Interacciones del cliente
export function Component() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Fetch en cliente
    fetchData().then(setData);
  }, []);
  
  return <div>{data}</div>;
}
```

## Flujo de Autenticación

```
┌─────────┐         ┌──────────┐        ┌─────────┐
│ Cliente │         │ Frontend │        │ Backend │
└────┬────┘         └────┬─────┘        └────┬────┘
     │                   │                   │
     │ 1. Submit Login   │                   │
     │──────────────────>│                   │
     │                   │ 2. POST /login    │
     │                   │──────────────────>│
     │                   │                   │
     │                   │  3. JWT Tokens    │
     │                   │<──────────────────│
     │                   │                   │
     │  4. Set Cookies   │                   │
     │<──────────────────│                   │
     │                   │                   │
     │ 5. Redirect       │                   │
     │<──────────────────│                   │
     │                   │                   │
     │ 6. GET /dashboard │                   │
     │──────────────────>│                   │
     │                   │ 7. GET /user      │
     │                   │──────────────────>│
     │                   │ (Bearer Token)    │
     │                   │                   │
     │                   │  8. User Data     │
     │                   │<──────────────────│
     │  9. Render Page   │                   │
     │<──────────────────│                   │
```

## Base de Datos

### Modelo de Datos Principal

```
┌───────────────┐       ┌──────────────┐
│     User      │       │ UserProfile  │
├───────────────┤       ├──────────────┤
│ id (UUID)     │1────1│ user_id      │
│ email         │       │ bio          │
│ role          │       │ avatar       │
│ first_name    │       │ settings     │
│ last_name     │       └──────────────┘
└───────┬───────┘
        │1
        │
        │*
┌───────┴───────┐       ┌──────────────┐
│     Lote      │       │  Document    │
├───────────────┤       ├──────────────┤
│ id            │1────*│ lote_id      │
│ cbml          │       │ tipo         │
│ owner_id      │       │ archivo      │
│ area          │       │ fecha        │
│ direccion     │       └──────────────┘
└───────────────┘
```

### Índices y Optimizaciones

```sql
-- Índices principales
CREATE INDEX idx_user_email ON users_user(email);
CREATE INDEX idx_lote_cbml ON lotes_lote(cbml);
CREATE INDEX idx_lote_owner ON lotes_lote(owner_id);

-- Índices compuestos
CREATE INDEX idx_lote_owner_status 
  ON lotes_lote(owner_id, status);
```

## Cache Strategy

### Redis Cache Layers

```
┌─────────────────────────────────────┐
│        Application Layer            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│          Redis Cache                │
│  ┌───────────────────────────────┐ │
│  │ Session Cache (30 min)        │ │
│  ├───────────────────────────────┤ │
│  │ User Data Cache (5 min)       │ │
│  ├───────────────────────────────┤ │
│  │ API Response Cache (1 min)    │ │
│  └───────────────────────────────┘ │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│         PostgreSQL                  │
└─────────────────────────────────────┘
```

## Seguridad

### Capas de Seguridad

#### 1. Autenticación
- JWT tokens con expiración
- Refresh tokens rotativos
- HttpOnly cookies en producción

#### 2. Autorización
- RBAC (Role-Based Access Control)
- Permisos a nivel de objeto
- Middleware de autenticación

#### 3. Validación
- Validación en frontend (TypeScript)
- Validación en backend (Django Validators)
- Sanitización de inputs

#### 4. Protección CSRF
- Tokens CSRF en cookies
- Validación en requests POST/PUT/DELETE

#### 5. Rate Limiting
- Límite de intentos de login
- Throttling de API requests
- Bloqueo temporal de cuentas

## Performance

### Optimizaciones Backend

#### 1. Database Query Optimization
```python
# ✅ Bueno - select_related
users = User.objects.select_related('profile').all()

# ❌ Malo - N+1 queries
users = User.objects.all()
for user in users:
    print(user.profile.bio)  # Query adicional
```

#### 2. Caching
```python
from django.core.cache import cache

def get_user_data(user_id):
    cache_key = f'user_data_{user_id}'
    data = cache.get(cache_key)
    
    if data is None:
        data = User.objects.get(id=user_id)
        cache.set(cache_key, data, timeout=300)
    
    return data
```

### Optimizaciones Frontend

#### 1. Code Splitting
```typescript
// Lazy loading de componentes
const AdminPanel = lazy(() => import('./AdminPanel'));
```

#### 2. Prefetching
```typescript
// Remix prefetching automático
<Link to="/dashboard" prefetch="intent">
  Dashboard
</Link>
```

## Escalabilidad

### Estrategias de Escalamiento

#### Escalamiento Horizontal
```
┌─────────────────────────────────────┐
│         Load Balancer               │
└───────┬─────────┬─────────┬─────────┘
        │         │         │
   ┌────▼───┐┌───▼────┐┌───▼────┐
   │Frontend││Frontend││Frontend│
   │   1    ││   2    ││   3    │
   └────┬───┘└───┬────┘└───┬────┘
        └────────┼─────────┘
                 ▼
   ┌─────────────────────────┐
   │    Backend Cluster      │
   └──────────┬──────────────┘
              ▼
        ┌──────────┐
        │PostgreSQL│
        │ Primary  │
        └────┬─────┘
             │
      ┌──────┴──────┐
      │             │
  ┌───▼────┐   ┌───▼────┐
  │Replica │   │Replica │
  │   1    │   │   2    │
  └────────┘   └────────┘
```

## Deployment

### Ambientes

#### Development
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - DJANGO_ENV=development
      - DEBUG=True
```

#### Production
```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - DJANGO_ENV=production
      - DEBUG=False
      - WORKERS=4
```

### CI/CD Pipeline (Futuro)

```
┌─────────┐    ┌──────┐    ┌──────┐    ┌────────┐
│  Commit │───>│ Test │───>│Build │───>│ Deploy │
└─────────┘    └──────┘    └──────┘    └────────┘
                  │            │            │
                  ▼            ▼            ▼
              Unit Tests   Docker      Production
              Integration  Images      Servers
              E2E Tests
```

## Monitoreo

### Métricas Clave

#### Backend
- Tiempo de respuesta API
- Tasa de errores
- Uso de CPU/Memoria
- Conexiones de BD activas
- Cache hit ratio

#### Frontend
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTI (Time to Interactive)
- CLS (Cumulative Layout Shift)

### Logging

```python
# Backend
logger.info(f"User {user.id} logged in")
logger.warning(f"Failed login attempt for {email}")
logger.error(f"Database error: {str(e)}")

# Niveles de log
- DEBUG: Información detallada de debugging
- INFO: Información general
- WARNING: Advertencias
- ERROR: Errores
- CRITICAL: Errores críticos
```

## Disaster Recovery

### Backup Strategy

#### Base de Datos
```bash
# Backup diario automático
0 2 * * * pg_dump lateral360 > backup_$(date +\%Y\%m\%d).sql

# Retención: 30 días
```

#### Media Files
```bash
# Sync a S3/Cloud Storage
aws s3 sync /app/media s3://lateral360-media/
```

### Recovery Plan

1. **RPO (Recovery Point Objective):** 24 horas
2. **RTO (Recovery Time Objective):** 4 horas
3. **Backup locations:** 3 copias (local, cloud, offsite)

## Consideraciones Futuras

### Microservicios
- Separar módulos en servicios independientes
- Message queue (RabbitMQ/Redis)
- API Gateway

### Machine Learning
- Análisis predictivo de lotes
- Recomendaciones personalizadas
- Detección de fraudes

### Mobile Apps
- React Native
- API móvil optimizada
- Notificaciones push

## Referencias

- [Django Architecture Best Practices](https://docs.djangoproject.com/en/4.2/)
- [Remix Architecture](https://remix.run/docs)
- [12 Factor App](https://12factor.net/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
