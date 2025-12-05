# Módulo de Notificaciones (Notifications)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [URLs](#urls)
- [Tipos de Notificaciones](#tipos-de-notificaciones)
- [Integración con Otros Módulos](#integración-con-otros-módulos)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Notificaciones** gestiona el sistema de alertas y mensajes para usuarios del sistema Lateral 360°, informando sobre eventos importantes como aprobaciones de lotes, validaciones de documentos, y nuevas recomendaciones.

### Características Principales

- 🔔 **Notificaciones en Tiempo Real**: Sistema de alertas para eventos importantes
- 📊 **Múltiples Tipos**: Lotes aprobados/rechazados, documentos validados, solicitudes respondidas
- 🎯 **Prioridades**: Baja, Normal, Alta, Urgente
- ✅ **Estados**: Leída/No leída con timestamps
- 🔗 **Action URLs**: Enlaces directos a recursos relacionados
- 📱 **Metadata**: Información adicional en formato JSON
- 🏠 **Relaciones**: Vinculación con lotes, documentos y solicitudes

---

## Modelos

### `Notification`

Modelo principal para gestión de notificaciones.

**Ubicación**: `apps/notifications/models.py`

#### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `user` | FK(User) | Usuario destinatario |
| `type` | CharField | Tipo de notificación |
| `title` | CharField(255) | Título de la notificación |
| `message` | TextField | Mensaje descriptivo |
| `priority` | CharField | Prioridad: low, normal, high, urgent |
| `lote_id` | UUID | ID del lote relacionado (opcional) |
| `document_id` | UUID | ID del documento relacionado (opcional) |
| `solicitud_id` | Integer | ID de solicitud relacionada (opcional) |
| `data` | JSONField | Datos adicionales |
| `action_url` | CharField(500) | URL de acción |
| `is_read` | Boolean | Si fue leída |
| `read_at` | DateTime | Fecha de lectura |
| `created_at` | DateTime | Fecha de creación |

#### Tipos de Notificación

```python
TIPO_CHOICES = [
    ('lote_aprobado', 'Lote Aprobado'),
    ('lote_rechazado', 'Lote Rechazado'),
    ('documento_validado', 'Documento Validado'),
    ('solicitud_respondida', 'Solicitud Respondida'),
    ('lote_recomendado', 'Lote Recomendado'),
    ('mensaje', 'Mensaje'),
    ('sistema', 'Sistema'),
]
```

#### Prioridades

```python
PRIORITY_CHOICES = [
    ('low', 'Baja'),
    ('normal', 'Normal'),
    ('high', 'Alta'),
    ('urgent', 'Urgente'),
]
```

#### Métodos Importantes

```python
# Marcar como leída
notification.mark_as_read()

# Marcar como no leída
notification.mark_as_unread()
```

#### Índices de Base de Datos

```python
indexes = [
    models.Index(fields=['user', '-created_at']),
    models.Index(fields=['user', 'is_read']),
    models.Index(fields=['type', '-created_at']),
]
```

---

## Serializers

### `NotificationSerializer`

Serializer completo para notificaciones.

**Ubicación**: `apps/notifications/serializers.py`

#### Campos Incluidos

```python
fields = [
    'id', 'type', 'type_display', 'title', 'message',
    'priority', 'priority_display', 'is_read', 'read_at',
    'action_url', 'data', 'created_at', 'time_ago',
    'lote_id', 'document_id', 'solicitud_id'
]
```

#### Ejemplo de Respuesta

```json
{
  "id": "uuid",
  "type": "lote_aprobado",
  "type_display": "Lote Aprobado",
  "title": "🎉 Lote Aprobado",
  "message": "Tu lote 'Lote Centro' ha sido aprobado y ya está activo en el sistema.",
  "priority": "high",
  "priority_display": "Alta",
  "is_read": false,
  "read_at": null,
  "action_url": "/owner/lote/uuid-123",
  "data": {
    "lote_nombre": "Lote Centro",
    "lote_direccion": "Calle 50 #50-50"
  },
  "created_at": "2024-01-15T10:00:00Z",
  "time_ago": "Hace 2 horas",
  "lote_id": "lote-uuid",
  "document_id": null,
  "solicitud_id": null
}
```

#### Método `get_time_ago()`

Calcula tiempo transcurrido desde la creación:

```python
def get_time_ago(self, obj):
    """
    Retorna:
    - 'Hace un momento' (< 1 min)
    - 'Hace X minutos' (< 1 hora)
    - 'Hace X horas' (< 1 día)
    - 'Ayer' (1 día)
    - 'Hace X días' (< 1 semana)
    - 'DD/MM/YYYY' (>= 1 semana)
    """
```

---

## Vistas (Views)

### `NotificationViewSet`

ViewSet principal para gestión de notificaciones.

**Ubicación**: `apps/notifications/views.py`

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/notifications/` | Listar notificaciones | Authenticated |
| GET | `/api/notifications/{id}/` | Detalle de notificación | Authenticated |
| DELETE | `/api/notifications/{id}/` | Eliminar notificación | Authenticated |
| GET | `/api/notifications/unread_count/` | Conteo de no leídas | Authenticated |
| POST | `/api/notifications/mark_all_read/` | Marcar todas como leídas | Authenticated |
| POST | `/api/notifications/{id}/mark_read/` | Marcar una como leída | Authenticated |
| POST | `/api/notifications/{id}/mark_unread/` | Marcar una como no leída | Authenticated |
| GET | `/api/notifications/recent/` | Últimas 10 notificaciones | Authenticated |

---

#### GET /api/notifications/ - Listar Notificaciones

**Permisos**: Authenticated

**Filtrado Automático**: Solo notificaciones del usuario actual

**Query Params**:
- `type`: Filtrar por tipo de notificación
- `is_read`: Filtrar por estado (true/false)
- `priority`: Filtrar por prioridad
- `ordering`: Ordenar (-created_at por defecto)

**Ejemplo Request**:

```bash
GET /api/notifications/?is_read=false&ordering=-created_at
Authorization: Bearer {token}
```

**Ejemplo Response**:

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "type": "lote_aprobado",
      "title": "🎉 Lote Aprobado",
      "message": "Tu lote 'Lote Centro' ha sido aprobado...",
      "priority": "high",
      "is_read": false,
      "created_at": "2024-01-15T10:00:00Z",
      "time_ago": "Hace 2 horas",
      "action_url": "/owner/lote/uuid-123"
    }
  ]
}
```

---

#### GET /api/notifications/unread_count/ - Conteo de No Leídas

**Permisos**: Authenticated

**Descripción**: Retorna el número de notificaciones no leídas del usuario.

**Response**:

```json
{
  "count": 3
}
```

**Uso**: Mostrar badge en el header de la aplicación.

---

#### POST /api/notifications/mark_all_read/ - Marcar Todas como Leídas

**Permisos**: Authenticated

**Descripción**: Marca todas las notificaciones del usuario como leídas.

**Request Body**: Vacío

**Response**:

```json
{
  "success": true,
  "marked": 5,
  "message": "5 notificaciones marcadas como leídas"
}
```

---

#### POST /api/notifications/{id}/mark_read/ - Marcar Como Leída

**Permisos**: Authenticated (solo owner de la notificación)

**Request Body**: Vacío

**Response**:

```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

#### POST /api/notifications/{id}/mark_unread/ - Marcar Como No Leída

**Permisos**: Authenticated (solo owner de la notificación)

**Request Body**: Vacío

**Response**:

```json
{
  "success": true,
  "message": "Notificación marcada como no leída"
}
```

---

#### GET /api/notifications/recent/ - Notificaciones Recientes

**Permisos**: Authenticated

**Descripción**: Retorna las últimas 10 notificaciones del usuario.

**Response**:

```json
[
  {
    "id": "uuid",
    "type": "lote_aprobado",
    "title": "🎉 Lote Aprobado",
    "message": "...",
    "priority": "high",
    "is_read": false,
    "time_ago": "Hace 2 horas"
  }
]
```

---

## Servicios (Services)

### `NotificationService`

Servicio centralizado para crear y gestionar notificaciones.

**Ubicación**: `apps/notifications/services.py`

#### Método Base

##### `create_notification(user, type, title, message, **kwargs)`

Crea una notificación para un usuario.

**Parámetros**:
- `user`: Usuario destinatario
- `type`: Tipo de notificación
- `title`: Título
- `message`: Mensaje
- `**kwargs`: Campos opcionales (priority, lote_id, action_url, data, etc.)

**Ejemplo**:

```python
from apps.notifications.services import NotificationService

notification = NotificationService.create_notification(
    user=user,
    type='lote_aprobado',
    title='🎉 Lote Aprobado',
    message='Tu lote ha sido aprobado',
    priority='high',
    lote_id=lote.id,
    action_url=f'/owner/lote/{lote.id}',
    data={
        'lote_nombre': lote.nombre,
        'lote_direccion': lote.direccion
    }
)
```

---

#### Métodos Específicos por Evento

##### `notify_lote_aprobado(lote)`

Notifica cuando un lote es aprobado.

**Parámetros**:
- `lote`: Instancia del lote aprobado

**Uso**:

```python
from apps.notifications.services import NotificationService

# Cuando admin aprueba un lote
NotificationService.notify_lote_aprobado(lote)
```

**Notificación Creada**:

```python
{
    'type': 'lote_aprobado',
    'title': '🎉 Lote Aprobado',
    'message': f'Tu lote "{lote.nombre}" ha sido aprobado y ya está activo en el sistema.',
    'priority': 'high',
    'lote_id': lote.id,
    'action_url': f'/owner/lote/{lote.id}',
    'data': {
        'lote_nombre': lote.nombre,
        'lote_direccion': lote.direccion
    }
}
```

---

##### `notify_lote_rechazado(lote, reason)`

Notifica cuando un lote es rechazado.

**Parámetros**:
- `lote`: Instancia del lote
- `reason`: Motivo del rechazo

**Uso**:

```python
NotificationService.notify_lote_rechazado(
    lote=lote,
    reason='Falta información catastral'
)
```

**Notificación Creada**:

```python
{
    'type': 'lote_rechazado',
    'title': '❌ Lote Rechazado',
    'message': f'Tu lote "{lote.nombre}" fue rechazado. Razón: {reason}',
    'priority': 'high',
    'lote_id': lote.id,
    'action_url': f'/owner/lote/{lote.id}',
    'data': {
        'lote_nombre': lote.nombre,
        'razon_rechazo': reason
    }
}
```

---

##### `notify_documento_validado(document)`

Notifica cuando un documento es validado.

**Parámetros**:
- `document`: Instancia del documento

**Uso**:

```python
NotificationService.notify_documento_validado(document)
```

**Action URL**:
- Si tiene lote: `/owner/lote/{lote_id}/documentos`
- Sin lote: `None`

---

##### `notify_documento_rechazado(document, reason)`

Notifica cuando un documento es rechazado.

**Parámetros**:
- `document`: Instancia del documento
- `reason`: Motivo del rechazo

**Uso**:

```python
NotificationService.notify_documento_rechazado(
    document=document,
    reason='Falta firma del propietario'
)
```

---

##### `notify_solicitud_respondida(solicitud)`

Notifica cuando una solicitud es respondida.

**Parámetros**:
- `solicitud`: Instancia de la solicitud

**Uso**:

```python
NotificationService.notify_solicitud_respondida(solicitud)
```

---

##### `notify_lote_recomendado(user, lote, match_reasons)`

Notifica recomendación de lote a un developer.

**Parámetros**:
- `user`: Usuario developer
- `lote`: Lote que coincide
- `match_reasons`: String con razones del match

**Uso**:

```python
NotificationService.notify_lote_recomendado(
    user=developer,
    lote=lote,
    match_reasons="Ciudad de interés: Medellín, Uso de suelo: Residencial"
)
```

**Notificación Creada**:

```python
{
    'type': 'lote_recomendado',
    'title': f'🎯 Nuevo lote recomendado: {lote.nombre}',
    'message': f'Encontramos un lote que coincide con tu perfil por: {match_reasons}.',
    'priority': 'normal',
    'lote_id': lote.id,
    'action_url': f'/developer/lote/{lote.id}',
    'data': {
        'lote_nombre': lote.nombre,
        'lote_area': str(lote.area),
        'match_reasons': match_reasons
    }
}
```

---

##### `notify_nueva_solicitud_analisis(analisis)`

Notifica a admins sobre nueva solicitud de análisis.

**Parámetros**:
- `analisis`: Instancia de AnalisisUrbanistico

**Uso**:

```python
NotificationService.notify_nueva_solicitud_analisis(analisis)
```

**Qué Hace**:
1. Busca todos los admins activos
2. Crea notificación para cada uno
3. Log de notificación enviada

---

##### `notify_analisis_completado(analisis)`

Notifica al propietario que su análisis está listo.

**Parámetros**:
- `analisis`: Instancia de AnalisisUrbanistico

**Uso**:

```python
NotificationService.notify_analisis_completado(analisis)
```

---

##### `notify_analisis_rechazado(analisis, motivo)`

Notifica al propietario que su análisis fue rechazado.

**Parámetros**:
- `analisis`: Instancia de AnalisisUrbanistico
- `motivo`: Motivo del rechazo

**Uso**:

```python
NotificationService.notify_analisis_rechazado(
    analisis=analisis,
    motivo='Falta información adicional del lote'
)
```

---

#### Métodos Auxiliares

##### `get_unread_count(user)`

Obtiene conteo de notificaciones no leídas.

```python
count = NotificationService.get_unread_count(user)
print(f"Notificaciones no leídas: {count}")
```

---

##### `mark_all_as_read(user)`

Marca todas las notificaciones del usuario como leídas.

```python
updated = NotificationService.mark_all_as_read(user)
print(f"{updated} notificaciones marcadas como leídas")
```

---

## URLs

**Ubicación**: `apps/notifications/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'notifications'

router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Endpoints generados**:
- `GET /api/notifications/`
- `GET /api/notifications/{id}/`
- `DELETE /api/notifications/{id}/`
- `GET /api/notifications/unread_count/`
- `POST /api/notifications/mark_all_read/`
- `POST /api/notifications/{id}/mark_read/`
- `POST /api/notifications/{id}/mark_unread/`
- `GET /api/notifications/recent/`

---

## Tipos de Notificaciones

### Notificaciones de Lotes

#### Lote Aprobado

**Trigger**: Admin verifica un lote

**Destinatario**: Propietario del lote

**Prioridad**: Alta

**Action URL**: `/owner/lote/{lote_id}`

---

#### Lote Rechazado

**Trigger**: Admin rechaza un lote

**Destinatario**: Propietario del lote

**Prioridad**: Alta

**Action URL**: `/owner/lote/{lote_id}`

---

#### Lote Recomendado

**Trigger**: Nuevo lote coincide con perfil de developer

**Destinatario**: Developer con perfil matching

**Prioridad**: Normal

**Action URL**: `/developer/lote/{lote_id}`

---

### Notificaciones de Documentos

#### Documento Validado

**Trigger**: Admin valida un documento

**Destinatario**: Usuario que subió el documento

**Prioridad**: Normal

**Action URL**: `/owner/lote/{lote_id}/documentos`

---

#### Documento Rechazado

**Trigger**: Admin rechaza un documento

**Destinatario**: Usuario que subió el documento

**Prioridad**: Alta

**Action URL**: `/owner/lote/{lote_id}/documentos`

---

### Notificaciones de Análisis

#### Análisis Completado

**Trigger**: Admin completa un análisis urbanístico

**Destinatario**: Usuario que solicitó el análisis

**Prioridad**: Alta

**Action URL**: `/owner/analisis/{analisis_id}`

---

#### Análisis Rechazado

**Trigger**: Admin rechaza un análisis

**Destinatario**: Usuario que solicitó el análisis

**Prioridad**: Alta

**Action URL**: `/owner/analisis/{analisis_id}`

---

#### Nueva Solicitud de Análisis

**Trigger**: Usuario solicita un análisis

**Destinatario**: Todos los admins

**Prioridad**: Alta

**Action URL**: `/admin/analisis/{analisis_id}`

---

## Integración con Otros Módulos

### Lotes

**Archivo**: `apps/lotes/views.py`

```python
from apps.notifications.services import NotificationService

# Al aprobar lote
def verify_lote(request, lote_id):
    lote = Lote.objects.get(id=lote_id)
    lote.verify(verified_by=request.user)
    
    # Notificar al propietario
    NotificationService.notify_lote_aprobado(lote)
    
    return Response({'success': True})

# Al rechazar lote
def reject_lote(request, lote_id):
    lote = Lote.objects.get(id=lote_id)
    reason = request.data.get('reason')
    lote.reject(reason=reason, rejected_by=request.user)
    
    # Notificar al propietario
    NotificationService.notify_lote_rechazado(lote, reason)
    
    return Response({'success': True})
```

---

### Documentos

**Archivo**: `apps/documents/views.py`

```python
from apps.notifications.services import NotificationService

# Al validar documento
def validate_document(request, document_id):
    document = Document.objects.get(id=document_id)
    document.validate_document(validated_by=request.user)
    
    # Notificar al usuario
    NotificationService.notify_documento_validado(document)
    
    return Response({'success': True})

# Al rechazar documento
def reject_document(request, document_id):
    document = Document.objects.get(id=document_id)
    reason = request.data.get('reason')
    document.reject_document(reason=reason, rejected_by=request.user)
    
    # Notificar al usuario
    NotificationService.notify_documento_rechazado(document, reason)
    
    return Response({'success': True})
```

---

### Análisis

**Archivo**: `apps/analisis/views.py`

```python
from apps.notifications.services import NotificationService

# Al crear análisis (notificar admins)
def create_analisis(request):
    analisis = AnalisisUrbanistico.objects.create(...)
    
    # Notificar a admins
    NotificationService.notify_nueva_solicitud_analisis(analisis)
    
    return Response({'success': True})

# Al completar análisis
def completar_analisis(request, analisis_id):
    analisis = AnalisisUrbanistico.objects.get(id=analisis_id)
    analisis.completar(...)
    
    # Notificar al solicitante
    NotificationService.notify_analisis_completado(analisis)
    
    return Response({'success': True})
```

---

### Signals de Lotes

**Archivo**: `apps/lotes/signals.py`

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.notifications.services import NotificationService

@receiver(post_save, sender=Lote)
def notificar_lote_match(sender, instance, created, **kwargs):
    """Notificar a developers cuando un lote coincide con su perfil"""
    if created or (instance.is_verified and instance.status == 'active'):
        from apps.users.models import User
        
        # Buscar developers con perfil completo
        developers = User.objects.filter(
            role='developer',
            is_active=True
        ).exclude(ciudades_interes__isnull=True)
        
        for developer in developers:
            # Calcular match
            match_reasons = []
            
            if instance.ciudad in developer.ciudades_interes:
                match_reasons.append(f"Ciudad de interés: {instance.ciudad}")
            
            if instance.uso_suelo in developer.usos_preferidos:
                match_reasons.append(f"Uso de suelo: {instance.uso_suelo}")
            
            if match_reasons:
                # Notificar recomendación
                NotificationService.notify_lote_recomendado(
                    user=developer,
                    lote=instance,
                    match_reasons=", ".join(match_reasons)
                )
```

---

## Ejemplos de Uso

### 1. Obtener Notificaciones del Usuario

```bash
GET /api/notifications/?ordering=-created_at
Authorization: Bearer {token}
```

**Response**:

```json
{
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "type": "lote_aprobado",
      "title": "🎉 Lote Aprobado",
      "message": "Tu lote 'Lote Centro' ha sido aprobado",
      "priority": "high",
      "is_read": false,
      "time_ago": "Hace 2 horas",
      "action_url": "/owner/lote/uuid-123"
    }
  ]
}
```

---

### 2. Obtener Conteo de No Leídas (Badge)

```bash
GET /api/notifications/unread_count/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "count": 3
}
```

**Uso en Frontend**:

```javascript
// Mostrar badge en header
const { count } = await fetchUnreadCount();
setBadgeCount(count);
```

---

### 3. Marcar Notificación como Leída

```bash
POST /api/notifications/{notification_id}/mark_read/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

**Uso en Frontend**:

```javascript
// Cuando usuario hace clic en notificación
const handleNotificationClick = async (notification) => {
  // Marcar como leída
  await markAsRead(notification.id);
  
  // Navegar a action_url
  navigate(notification.action_url);
};
```

---

### 4. Marcar Todas como Leídas

```bash
POST /api/notifications/mark_all_read/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "success": true,
  "marked": 5,
  "message": "5 notificaciones marcadas como leídas"
}
```

---

### 5. Obtener Notificaciones Recientes (Dropdown)

```bash
GET /api/notifications/recent/
Authorization: Bearer {token}
```

**Response**: Últimas 10 notificaciones

**Uso en Frontend**:

```javascript
// Dropdown de notificaciones en header
const NotificationsDropdown = () => {
  const { data: notifications } = useQuery('notifications-recent', fetchRecent);
  
  return (
    <Dropdown>
      {notifications.map(notif => (
        <NotificationItem 
          key={notif.id}
          notification={notif}
          onClick={() => handleClick(notif)}
        />
      ))}
    </Dropdown>
  );
};
```

---

### 6. Crear Notificación Personalizada

```python
from apps.notifications.services import NotificationService

# Crear notificación custom
NotificationService.create_notification(
    user=user,
    type='mensaje',
    title='Mensaje del Sistema',
    message='Tienes una nueva actualización disponible',
    priority='normal',
    action_url='/dashboard',
    data={
        'version': '2.0.0',
        'features': ['Nueva UI', 'Performance mejorado']
    }
)
```

---

## Admin de Django

### NotificationAdmin

**Ubicación**: `apps/notifications/admin.py`

#### Características

- **Lista**: title, user, type, priority, is_read, created_at
- **Filtros**: type, priority, is_read, created_at
- **Búsqueda**: Por title, message, user email
- **Read-only**: id, created_at, read_at
- **Fieldsets**: Agrupados por Información, Relaciones, Estado, Sistema

---

## Estructura de Carpetas

Searched codebase for "Perfecto, ahora debemos hacer la de #file:notifications.md #codebase ", 1 result

Voy a crear la documentación completa del módulo de Notificaciones.

# Módulo de Notificaciones (Notifications)

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Modelos](#modelos)
- [Serializers](#serializers)
- [Vistas (Views)](#vistas-views)
- [Servicios (Services)](#servicios-services)
- [URLs](#urls)
- [Tipos de Notificaciones](#tipos-de-notificaciones)
- [Integración con Otros Módulos](#integración-con-otros-módulos)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El módulo de **Notificaciones** gestiona el sistema de alertas y mensajes para usuarios del sistema Lateral 360°, informando sobre eventos importantes como aprobaciones de lotes, validaciones de documentos, y nuevas recomendaciones.

### Características Principales

- 🔔 **Notificaciones en Tiempo Real**: Sistema de alertas para eventos importantes
- 📊 **Múltiples Tipos**: Lotes aprobados/rechazados, documentos validados, solicitudes respondidas
- 🎯 **Prioridades**: Baja, Normal, Alta, Urgente
- ✅ **Estados**: Leída/No leída con timestamps
- 🔗 **Action URLs**: Enlaces directos a recursos relacionados
- 📱 **Metadata**: Información adicional en formato JSON
- 🏠 **Relaciones**: Vinculación con lotes, documentos y solicitudes

---

## Modelos

### `Notification`

Modelo principal para gestión de notificaciones.

**Ubicación**: `apps/notifications/models.py`

#### Campos Principales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `user` | FK(User) | Usuario destinatario |
| `type` | CharField | Tipo de notificación |
| `title` | CharField(255) | Título de la notificación |
| `message` | TextField | Mensaje descriptivo |
| `priority` | CharField | Prioridad: low, normal, high, urgent |
| `lote_id` | UUID | ID del lote relacionado (opcional) |
| `document_id` | UUID | ID del documento relacionado (opcional) |
| `solicitud_id` | Integer | ID de solicitud relacionada (opcional) |
| `data` | JSONField | Datos adicionales |
| `action_url` | CharField(500) | URL de acción |
| `is_read` | Boolean | Si fue leída |
| `read_at` | DateTime | Fecha de lectura |
| `created_at` | DateTime | Fecha de creación |

#### Tipos de Notificación

```python
TIPO_CHOICES = [
    ('lote_aprobado', 'Lote Aprobado'),
    ('lote_rechazado', 'Lote Rechazado'),
    ('documento_validado', 'Documento Validado'),
    ('solicitud_respondida', 'Solicitud Respondida'),
    ('lote_recomendado', 'Lote Recomendado'),
    ('mensaje', 'Mensaje'),
    ('sistema', 'Sistema'),
]
```

#### Prioridades

```python
PRIORITY_CHOICES = [
    ('low', 'Baja'),
    ('normal', 'Normal'),
    ('high', 'Alta'),
    ('urgent', 'Urgente'),
]
```

#### Métodos Importantes

```python
# Marcar como leída
notification.mark_as_read()

# Marcar como no leída
notification.mark_as_unread()
```

#### Índices de Base de Datos

```python
indexes = [
    models.Index(fields=['user', '-created_at']),
    models.Index(fields=['user', 'is_read']),
    models.Index(fields=['type', '-created_at']),
]
```

---

## Serializers

### `NotificationSerializer`

Serializer completo para notificaciones.

**Ubicación**: serializers.py

#### Campos Incluidos

```python
fields = [
    'id', 'type', 'type_display', 'title', 'message',
    'priority', 'priority_display', 'is_read', 'read_at',
    'action_url', 'data', 'created_at', 'time_ago',
    'lote_id', 'document_id', 'solicitud_id'
]
```

#### Ejemplo de Respuesta

```json
{
  "id": "uuid",
  "type": "lote_aprobado",
  "type_display": "Lote Aprobado",
  "title": "🎉 Lote Aprobado",
  "message": "Tu lote 'Lote Centro' ha sido aprobado y ya está activo en el sistema.",
  "priority": "high",
  "priority_display": "Alta",
  "is_read": false,
  "read_at": null,
  "action_url": "/owner/lote/uuid-123",
  "data": {
    "lote_nombre": "Lote Centro",
    "lote_direccion": "Calle 50 #50-50"
  },
  "created_at": "2024-01-15T10:00:00Z",
  "time_ago": "Hace 2 horas",
  "lote_id": "lote-uuid",
  "document_id": null,
  "solicitud_id": null
}
```

#### Método `get_time_ago()`

Calcula tiempo transcurrido desde la creación:

```python
def get_time_ago(self, obj):
    """
    Retorna:
    - 'Hace un momento' (< 1 min)
    - 'Hace X minutos' (< 1 hora)
    - 'Hace X horas' (< 1 día)
    - 'Ayer' (1 día)
    - 'Hace X días' (< 1 semana)
    - 'DD/MM/YYYY' (>= 1 semana)
    """
```

---

## Vistas (Views)

### `NotificationViewSet`

ViewSet principal para gestión de notificaciones.

**Ubicación**: views.py

#### Endpoints Disponibles

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/notifications/` | Listar notificaciones | Authenticated |
| GET | `/api/notifications/{id}/` | Detalle de notificación | Authenticated |
| DELETE | `/api/notifications/{id}/` | Eliminar notificación | Authenticated |
| GET | `/api/notifications/unread_count/` | Conteo de no leídas | Authenticated |
| POST | `/api/notifications/mark_all_read/` | Marcar todas como leídas | Authenticated |
| POST | `/api/notifications/{id}/mark_read/` | Marcar una como leída | Authenticated |
| POST | `/api/notifications/{id}/mark_unread/` | Marcar una como no leída | Authenticated |
| GET | `/api/notifications/recent/` | Últimas 10 notificaciones | Authenticated |

---

#### GET /api/notifications/ - Listar Notificaciones

**Permisos**: Authenticated

**Filtrado Automático**: Solo notificaciones del usuario actual

**Query Params**:
- `type`: Filtrar por tipo de notificación
- `is_read`: Filtrar por estado (true/false)
- `priority`: Filtrar por prioridad
- `ordering`: Ordenar (-created_at por defecto)

**Ejemplo Request**:

```bash
GET /api/notifications/?is_read=false&ordering=-created_at
Authorization: Bearer {token}
```

**Ejemplo Response**:

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "type": "lote_aprobado",
      "title": "🎉 Lote Aprobado",
      "message": "Tu lote 'Lote Centro' ha sido aprobado...",
      "priority": "high",
      "is_read": false,
      "created_at": "2024-01-15T10:00:00Z",
      "time_ago": "Hace 2 horas",
      "action_url": "/owner/lote/uuid-123"
    }
  ]
}
```

---

#### GET /api/notifications/unread_count/ - Conteo de No Leídas

**Permisos**: Authenticated

**Descripción**: Retorna el número de notificaciones no leídas del usuario.

**Response**:

```json
{
  "count": 3
}
```

**Uso**: Mostrar badge en el header de la aplicación.

---

#### POST /api/notifications/mark_all_read/ - Marcar Todas como Leídas

**Permisos**: Authenticated

**Descripción**: Marca todas las notificaciones del usuario como leídas.

**Request Body**: Vacío

**Response**:

```json
{
  "success": true,
  "marked": 5,
  "message": "5 notificaciones marcadas como leídas"
}
```

---

#### POST /api/notifications/{id}/mark_read/ - Marcar Como Leída

**Permisos**: Authenticated (solo owner de la notificación)

**Request Body**: Vacío

**Response**:

```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

#### POST /api/notifications/{id}/mark_unread/ - Marcar Como No Leída

**Permisos**: Authenticated (solo owner de la notificación)

**Request Body**: Vacío

**Response**:

```json
{
  "success": true,
  "message": "Notificación marcada como no leída"
}
```

---

#### GET /api/notifications/recent/ - Notificaciones Recientes

**Permisos**: Authenticated

**Descripción**: Retorna las últimas 10 notificaciones del usuario.

**Response**:

```json
[
  {
    "id": "uuid",
    "type": "lote_aprobado",
    "title": "🎉 Lote Aprobado",
    "message": "...",
    "priority": "high",
    "is_read": false,
    "time_ago": "Hace 2 horas"
  }
]
```

---

## Servicios (Services)

### `NotificationService`

Servicio centralizado para crear y gestionar notificaciones.

**Ubicación**: services.py

#### Método Base

##### `create_notification(user, type, title, message, **kwargs)`

Crea una notificación para un usuario.

**Parámetros**:
- `user`: Usuario destinatario
- `type`: Tipo de notificación
- `title`: Título
- `message`: Mensaje
- `**kwargs`: Campos opcionales (priority, lote_id, action_url, data, etc.)

**Ejemplo**:

```python
from apps.notifications.services import NotificationService

notification = NotificationService.create_notification(
    user=user,
    type='lote_aprobado',
    title='🎉 Lote Aprobado',
    message='Tu lote ha sido aprobado',
    priority='high',
    lote_id=lote.id,
    action_url=f'/owner/lote/{lote.id}',
    data={
        'lote_nombre': lote.nombre,
        'lote_direccion': lote.direccion
    }
)
```

---

#### Métodos Específicos por Evento

##### `notify_lote_aprobado(lote)`

Notifica cuando un lote es aprobado.

**Parámetros**:
- `lote`: Instancia del lote aprobado

**Uso**:

```python
from apps.notifications.services import NotificationService

# Cuando admin aprueba un lote
NotificationService.notify_lote_aprobado(lote)
```

**Notificación Creada**:

```python
{
    'type': 'lote_aprobado',
    'title': '🎉 Lote Aprobado',
    'message': f'Tu lote "{lote.nombre}" ha sido aprobado y ya está activo en el sistema.',
    'priority': 'high',
    'lote_id': lote.id,
    'action_url': f'/owner/lote/{lote.id}',
    'data': {
        'lote_nombre': lote.nombre,
        'lote_direccion': lote.direccion
    }
}
```

---

##### `notify_lote_rechazado(lote, reason)`

Notifica cuando un lote es rechazado.

**Parámetros**:
- `lote`: Instancia del lote
- `reason`: Motivo del rechazo

**Uso**:

```python
NotificationService.notify_lote_rechazado(
    lote=lote,
    reason='Falta información catastral'
)
```

**Notificación Creada**:

```python
{
    'type': 'lote_rechazado',
    'title': '❌ Lote Rechazado',
    'message': f'Tu lote "{lote.nombre}" fue rechazado. Razón: {reason}',
    'priority': 'high',
    'lote_id': lote.id,
    'action_url': f'/owner/lote/{lote.id}',
    'data': {
        'lote_nombre': lote.nombre,
        'razon_rechazo': reason
    }
}
```

---

##### `notify_documento_validado(document)`

Notifica cuando un documento es validado.

**Parámetros**:
- `document`: Instancia del documento

**Uso**:

```python
NotificationService.notify_documento_validado(document)
```

**Action URL**:
- Si tiene lote: `/owner/lote/{lote_id}/documentos`
- Sin lote: `None`

---

##### `notify_documento_rechazado(document, reason)`

Notifica cuando un documento es rechazado.

**Parámetros**:
- `document`: Instancia del documento
- `reason`: Motivo del rechazo

**Uso**:

```python
NotificationService.notify_documento_rechazado(
    document=document,
    reason='Falta firma del propietario'
)
```

---

##### `notify_solicitud_respondida(solicitud)`

Notifica cuando una solicitud es respondida.

**Parámetros**:
- `solicitud`: Instancia de la solicitud

**Uso**:

```python
NotificationService.notify_solicitud_respondida(solicitud)
```

---

##### `notify_lote_recomendado(user, lote, match_reasons)`

Notifica recomendación de lote a un developer.

**Parámetros**:
- `user`: Usuario developer
- `lote`: Lote que coincide
- `match_reasons`: String con razones del match

**Uso**:

```python
NotificationService.notify_lote_recomendado(
    user=developer,
    lote=lote,
    match_reasons="Ciudad de interés: Medellín, Uso de suelo: Residencial"
)
```

**Notificación Creada**:

```python
{
    'type': 'lote_recomendado',
    'title': f'🎯 Nuevo lote recomendado: {lote.nombre}',
    'message': f'Encontramos un lote que coincide con tu perfil por: {match_reasons}.',
    'priority': 'normal',
    'lote_id': lote.id,
    'action_url': f'/developer/lote/{lote.id}',
    'data': {
        'lote_nombre': lote.nombre,
        'lote_area': str(lote.area),
        'match_reasons': match_reasons
    }
}
```

---

##### `notify_nueva_solicitud_analisis(analisis)`

Notifica a admins sobre nueva solicitud de análisis.

**Parámetros**:
- `analisis`: Instancia de AnalisisUrbanistico

**Uso**:

```python
NotificationService.notify_nueva_solicitud_analisis(analisis)
```

**Qué Hace**:
1. Busca todos los admins activos
2. Crea notificación para cada uno
3. Log de notificación enviada

---

##### `notify_analisis_completado(analisis)`

Notifica al propietario que su análisis está listo.

**Parámetros**:
- `analisis`: Instancia de AnalisisUrbanistico

**Uso**:

```python
NotificationService.notify_analisis_completado(analisis)
```

---

##### `notify_analisis_rechazado(analisis, motivo)`

Notifica al propietario que su análisis fue rechazado.

**Parámetros**:
- `analisis`: Instancia de AnalisisUrbanistico
- `motivo`: Motivo del rechazo

**Uso**:

```python
NotificationService.notify_analisis_rechazado(
    analisis=analisis,
    motivo='Falta información adicional del lote'
)
```

---

#### Métodos Auxiliares

##### `get_unread_count(user)`

Obtiene conteo de notificaciones no leídas.

```python
count = NotificationService.get_unread_count(user)
print(f"Notificaciones no leídas: {count}")
```

---

##### `mark_all_as_read(user)`

Marca todas las notificaciones del usuario como leídas.

```python
updated = NotificationService.mark_all_as_read(user)
print(f"{updated} notificaciones marcadas como leídas")
```

---

## URLs

**Ubicación**: urls.py

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'notifications'

router = DefaultRouter()
router.register(r'', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
```

**Endpoints generados**:
- `GET /api/notifications/`
- `GET /api/notifications/{id}/`
- `DELETE /api/notifications/{id}/`
- `GET /api/notifications/unread_count/`
- `POST /api/notifications/mark_all_read/`
- `POST /api/notifications/{id}/mark_read/`
- `POST /api/notifications/{id}/mark_unread/`
- `GET /api/notifications/recent/`

---

## Tipos de Notificaciones

### Notificaciones de Lotes

#### Lote Aprobado

**Trigger**: Admin verifica un lote

**Destinatario**: Propietario del lote

**Prioridad**: Alta

**Action URL**: `/owner/lote/{lote_id}`

---

#### Lote Rechazado

**Trigger**: Admin rechaza un lote

**Destinatario**: Propietario del lote

**Prioridad**: Alta

**Action URL**: `/owner/lote/{lote_id}`

---

#### Lote Recomendado

**Trigger**: Nuevo lote coincide con perfil de developer

**Destinatario**: Developer con perfil matching

**Prioridad**: Normal

**Action URL**: `/developer/lote/{lote_id}`

---

### Notificaciones de Documentos

#### Documento Validado

**Trigger**: Admin valida un documento

**Destinatario**: Usuario que subió el documento

**Prioridad**: Normal

**Action URL**: `/owner/lote/{lote_id}/documentos`

---

#### Documento Rechazado

**Trigger**: Admin rechaza un documento

**Destinatario**: Usuario que subió el documento

**Prioridad**: Alta

**Action URL**: `/owner/lote/{lote_id}/documentos`

---

### Notificaciones de Análisis

#### Análisis Completado

**Trigger**: Admin completa un análisis urbanístico

**Destinatario**: Usuario que solicitó el análisis

**Prioridad**: Alta

**Action URL**: `/owner/analisis/{analisis_id}`

---

#### Análisis Rechazado

**Trigger**: Admin rechaza un análisis

**Destinatario**: Usuario que solicitó el análisis

**Prioridad**: Alta

**Action URL**: `/owner/analisis/{analisis_id}`

---

#### Nueva Solicitud de Análisis

**Trigger**: Usuario solicita un análisis

**Destinatario**: Todos los admins

**Prioridad**: Alta

**Action URL**: `/admin/analisis/{analisis_id}`

---

## Integración con Otros Módulos

### Lotes

**Archivo**: views.py

```python
from apps.notifications.services import NotificationService

# Al aprobar lote
def verify_lote(request, lote_id):
    lote = Lote.objects.get(id=lote_id)
    lote.verify(verified_by=request.user)
    
    # Notificar al propietario
    NotificationService.notify_lote_aprobado(lote)
    
    return Response({'success': True})

# Al rechazar lote
def reject_lote(request, lote_id):
    lote = Lote.objects.get(id=lote_id)
    reason = request.data.get('reason')
    lote.reject(reason=reason, rejected_by=request.user)
    
    # Notificar al propietario
    NotificationService.notify_lote_rechazado(lote, reason)
    
    return Response({'success': True})
```

---

### Documentos

**Archivo**: views.py

```python
from apps.notifications.services import NotificationService

# Al validar documento
def validate_document(request, document_id):
    document = Document.objects.get(id=document_id)
    document.validate_document(validated_by=request.user)
    
    # Notificar al usuario
    NotificationService.notify_documento_validado(document)
    
    return Response({'success': True})

# Al rechazar documento
def reject_document(request, document_id):
    document = Document.objects.get(id=document_id)
    reason = request.data.get('reason')
    document.reject_document(reason=reason, rejected_by=request.user)
    
    # Notificar al usuario
    NotificationService.notify_documento_rechazado(document, reason)
    
    return Response({'success': True})
```

---

### Análisis

**Archivo**: views.py

```python
from apps.notifications.services import NotificationService

# Al crear análisis (notificar admins)
def create_analisis(request):
    analisis = AnalisisUrbanistico.objects.create(...)
    
    # Notificar a admins
    NotificationService.notify_nueva_solicitud_analisis(analisis)
    
    return Response({'success': True})

# Al completar análisis
def completar_analisis(request, analisis_id):
    analisis = AnalisisUrbanistico.objects.get(id=analisis_id)
    analisis.completar(...)
    
    # Notificar al solicitante
    NotificationService.notify_analisis_completado(analisis)
    
    return Response({'success': True})
```

---

### Signals de Lotes

**Archivo**: signals.py

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.notifications.services import NotificationService

@receiver(post_save, sender=Lote)
def notificar_lote_match(sender, instance, created, **kwargs):
    """Notificar a developers cuando un lote coincide con su perfil"""
    if created or (instance.is_verified and instance.status == 'active'):
        from apps.users.models import User
        
        # Buscar developers con perfil completo
        developers = User.objects.filter(
            role='developer',
            is_active=True
        ).exclude(ciudades_interes__isnull=True)
        
        for developer in developers:
            # Calcular match
            match_reasons = []
            
            if instance.ciudad in developer.ciudades_interes:
                match_reasons.append(f"Ciudad de interés: {instance.ciudad}")
            
            if instance.uso_suelo in developer.usos_preferidos:
                match_reasons.append(f"Uso de suelo: {instance.uso_suelo}")
            
            if match_reasons:
                # Notificar recomendación
                NotificationService.notify_lote_recomendado(
                    user=developer,
                    lote=instance,
                    match_reasons=", ".join(match_reasons)
                )
```

---

## Ejemplos de Uso

### 1. Obtener Notificaciones del Usuario

```bash
GET /api/notifications/?ordering=-created_at
Authorization: Bearer {token}
```

**Response**:

```json
{
  "count": 5,
  "results": [
    {
      "id": "uuid",
      "type": "lote_aprobado",
      "title": "🎉 Lote Aprobado",
      "message": "Tu lote 'Lote Centro' ha sido aprobado",
      "priority": "high",
      "is_read": false,
      "time_ago": "Hace 2 horas",
      "action_url": "/owner/lote/uuid-123"
    }
  ]
}
```

---

### 2. Obtener Conteo de No Leídas (Badge)

```bash
GET /api/notifications/unread_count/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "count": 3
}
```

**Uso en Frontend**:

```javascript
// Mostrar badge en header
const { count } = await fetchUnreadCount();
setBadgeCount(count);
```

---

### 3. Marcar Notificación como Leída

```bash
POST /api/notifications/{notification_id}/mark_read/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

**Uso en Frontend**:

```javascript
// Cuando usuario hace clic en notificación
const handleNotificationClick = async (notification) => {
  // Marcar como leída
  await markAsRead(notification.id);
  
  // Navegar a action_url
  navigate(notification.action_url);
};
```

---

### 4. Marcar Todas como Leídas

```bash
POST /api/notifications/mark_all_read/
Authorization: Bearer {token}
```

**Response**:

```json
{
  "success": true,
  "marked": 5,
  "message": "5 notificaciones marcadas como leídas"
}
```

---

### 5. Obtener Notificaciones Recientes (Dropdown)

```bash
GET /api/notifications/recent/
Authorization: Bearer {token}
```

**Response**: Últimas 10 notificaciones

**Uso en Frontend**:

```javascript
// Dropdown de notificaciones en header
const NotificationsDropdown = () => {
  const { data: notifications } = useQuery('notifications-recent', fetchRecent);
  
  return (
    <Dropdown>
      {notifications.map(notif => (
        <NotificationItem 
          key={notif.id}
          notification={notif}
          onClick={() => handleClick(notif)}
        />
      ))}
    </Dropdown>
  );
};
```

---

### 6. Crear Notificación Personalizada

```python
from apps.notifications.services import NotificationService

# Crear notificación custom
NotificationService.create_notification(
    user=user,
    type='mensaje',
    title='Mensaje del Sistema',
    message='Tienes una nueva actualización disponible',
    priority='normal',
    action_url='/dashboard',
    data={
        'version': '2.0.0',
        'features': ['Nueva UI', 'Performance mejorado']
    }
)
```

---

## Admin de Django

### NotificationAdmin

**Ubicación**: admin.py

#### Características

- **Lista**: title, user, type, priority, is_read, created_at
- **Filtros**: type, priority, is_read, created_at
- **Búsqueda**: Por title, message, user email
- **Read-only**: id, created_at, read_at
- **Fieldsets**: Agrupados por Información, Relaciones, Estado, Sistema

---

## Estructura de Carpetas

```
apps/notifications/
├── __init__.py
├── admin.py              # Admin de Django
├── apps.py              # Configuración de la app
├── models.py            # Modelo Notification
├── serializers.py       # NotificationSerializer
├── services.py          # NotificationService
├── urls.py              # Rutas de la API
└── views.py             # NotificationViewSet
```

---

## Casos de Uso

### Caso 1: Propietario Recibe Aprobación de Lote

**Flujo**:
1. Admin verifica lote
2. Sistema crea notificación con prioridad alta
3. Propietario ve badge en header (1)
4. Propietario abre dropdown y ve notificación
5. Propietario hace clic → Se marca como leída y navega al lote

---

### Caso 2: Developer Recibe Recomendación

**Flujo**:
1. Nuevo lote se publica que coincide con perfil de developer
2. Signal detecta match y crea notificación
3. Developer ve badge en header
4. Developer revisa notificación con detalles del match
5. Developer hace clic y ve el lote recomendado

---

### Caso 3: Admin Recibe Nueva Solicitud de Análisis

**Flujo**:
1. Propietario solicita análisis urbanístico
2. Sistema notifica a todos los admins activos
3. Admin ve badge y revisa solicitud
4. Admin hace clic y accede al panel de análisis pendientes

---

## Best Practices

### 1. Usar Métodos Específicos

```python
# ✅ Correcto: Usar método específico
NotificationService.notify_lote_aprobado(lote)

# ❌ Incorrecto: Crear notificación manualmente
Notification.objects.create(
    user=lote.owner,
    type='lote_aprobado',
    ...
)
```

### 2. Incluir Action URLs

```python
# ✅ Correcto: Siempre incluir action_url
NotificationService.create_notification(
    user=user,
    type='documento_validado',
    title='Documento Validado',
    message='...',
    action_url=f'/owner/lote/{lote.id}/documentos'  # ✅
)

# ❌ Incorrecto: Sin action_url
NotificationService.create_notification(
    user=user,
    type='documento_validado',
    title='Documento Validado',
    message='...'
    # ❌ Falta action_url
)
```

### 3. Agregar Metadata

```python
# ✅ Correcto: Incluir metadata relevante
NotificationService.create_notification(
    user=user,
    type='lote_aprobado',
    title='Lote Aprobado',
    message='...',
    data={
        'lote_nombre': lote.nombre,
        'lote_area': str(lote.area),
        'fecha_aprobacion': timezone.now().isoformat()
    }
)
```

---

## Troubleshooting

### Problema: Notificaciones no aparecen

**Causa**: Usuario no está autenticado o no tiene notificaciones.

**Solución**: Verificar que el token sea válido y que haya notificaciones para ese usuario.

---

### Problema: Badge no se actualiza

**Causa**: Frontend no está polling el endpoint de unread_count.

**Solución**: Configurar polling cada 30 segundos o usar WebSockets.

---

### Problema: Action URL no funciona

**Causa**: URL mal formada o recurso no existe.

**Solución**: Verificar que el formato de action_url sea correcto según el frontend routing.

---

## Próximas Mejoras

- [ ] **WebSockets**: Notificaciones en tiempo real con Django Channels
- [ ] **Email Notifications**: Enviar notificaciones importantes por email
- [ ] **Push Notifications**: Notificaciones push para móviles
- [ ] **Preferences**: Usuarios pueden configurar qué notificaciones recibir
- [ ] **Agrupación**: Agrupar notificaciones similares
- [ ] **Historial**: Ver historial completo de notificaciones

---

**Última actualización**: 2024-01-15


Made changes.