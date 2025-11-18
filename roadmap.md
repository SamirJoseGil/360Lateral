## 🗺️ ROADMAP DE CORRECCIONES - Lateral 360°

### **✅ Fase 1. Corrección de funcionalidades críticas (COMPLETADA AL 100%)**

**Objetivo:** que el flujo principal (registro, carga de lotes, revisión y aprobación) funcione de extremo a extremo sin errores.

#### 🔧 Backend

* [x] **✅ Generar ID único de lote** al registrar (modelo `Lote` con `uuid`).
  - **Completado**: UUID implementado como Primary Key en `apps/lotes/models.py`
  - Tipo: `UUIDField` con generación automática
  - Formato: UUID v4
  
* [x] **✅ Arreglar carga de archivos**:
  - **Completado**: Tamaño máximo 10MB configurado
  - **Completado**: Campo "Título" opcional (auto-generado)
  - **Completado**: Relación OneToMany con Lote (ForeignKey CASCADE)
  - **Completado**: Validaciones de extensión, MIME type y metadatos

* [x] **✅ Validación de duplicados** en registro de usuario (email o teléfono).
  - **Completado**: Endpoints `/api/users/check-email/` y `/api/users/check-phone/`
  - **Completado**: Validación case-insensitive
  - **Completado**: Validación de formato
  - **Completado**: Serializers con validación automática

* [x] **✅ Revisión de endpoint "olvidé contraseña"** (reset token + endpoints REST).
  - **Completado**: Modelo `PasswordResetToken`
  - **Completado**: Servicio `PasswordResetService`
  - **Completado**: Endpoints:
    - `POST /api/users/password-reset/request/`
    - `POST /api/users/password-reset/verify-token/`
    - `POST /api/users/password-reset/confirm/`
  - **Completado**: Tokens con expiración de 1 hora
  - **⚠️ TEMPORAL**: Sin envío de emails (token en consola/respuesta)

* [x] **✅ Reestructurar modelo de relación de documentos:** `Lote` → `Document` (OneToMany).
  - **Completado**: Campo `lote` como ForeignKey en modelo `Document`
  - **Completado**: Cascade delete configurado
  - **Completado**: Filtrado por lote en endpoints

* [x] **✅ Corregir lógica de estados** (soft delete).
  - **Completado**: Soft delete en Lotes, Usuarios y Documentos
  - **Lotes**: `pending`, `active`, `rejected`, `archived`
  - **Usuarios**: `is_active=False` + `deleted_at` + `deletion_reason`
  - **Documentos**: Estados en metadata: `pendiente`, `validado`, `rechazado`
  - **Métodos**: `soft_delete()`, `verify()`, `reject()`, `reactivate()`

* [x] **✅ Validación de documentos por lote**
  - **Completado**: Agrupación por lote en endpoint `/api/documents/validation/grouped/`
  - **Completado**: Vista colapsable en frontend
  - **Completado**: Contadores correctos (sin duplicados)
  - **Completado**: Ordenamiento por fecha (más reciente primero)
  - **Completado**: Prevención de validaciones duplicadas con `select_for_update()`

* ~~[ ] **Flujo de notificaciones por correo**~~ ❌ **NO IMPLEMENTAR** (SMTP no configurado)
  * ~~Registro exitoso~~
  * ~~Lote aprobado/rechazado~~
  * ~~Recuperación de contraseña~~

#### 🎨 Frontend

* [x] **✅ Actualizar link de política de privacidad**.
* [x] **✅ Corregir ubicación de botones en el registro**.
* [x] **✅ Arreglar "Olvidé mi contraseña"**.
  - **Completado**: Rutas `/forgot-password` y `/reset-password`
  - **Completado**: Integración con API
  - **Completado**: UI con feedback visual
  - **⚠️ Modo desarrollo**: Token visible (sin emails)

* [x] **✅ Validaciones visuales** (teléfono obligatorio, campos requeridos).
* [x] **✅ Dashboard admin - documentos agrupados por lote**.
  - **Completado**: Vista agrupada colapsable
  - **Completado**: Contadores de estados por lote
  - **Completado**: Ordenamiento por fecha
  - **Completado**: Modal de validación con comentarios

* [ ] **Activar búsqueda de dirección y matrícula** (Google Maps API o similar).
* [ ] **En vista propietario, mostrar estado real del lote** (pendiente/aprobado/rechazado).

#### 🧠 UX / Lógica de Flujo

* [x] **✅ Mensaje de usuario ya registrado**.
* [ ] **Pop-up + confirmación** al registrar lote.
* [ ] **Bloqueo de datos MapGIS** hasta que admin apruebe lote.
* [x] **✅ No permitir validar documentos** de lotes rechazados.

---

### **✅ Fase 2. Estructura del módulo de "Solicitudes y Soporte" (COMPLETADA AL 100%)**

**Objetivo:** reutilizar la funcionalidad de "Solicitudes" para soporte técnico.

#### 🔧 Backend

* [x] **✅ Módulo de solicitudes independiente** en `apps/solicitudes/`
  - **Completado**: App `solicitudes` creada con estructura completa
  - **Completado**: Modelo `Solicitud` con campos: `tipo`, `usuario`, `lote`, `descripcion`, `estado`, `prioridad`
  - **Completado**: Tipos: `soporte_tecnico`, `analisis_urbanistico`, `consulta_general`, `validacion_documentos`, `correccion_datos`, `acceso`, `funcionalidad`, `otro`
  - **Completado**: Estados: `pendiente`, `en_revision`, `aprobado`, `rechazado`, `completado`
  - **Completado**: Prioridades: `baja`, `normal`, `alta`, `urgente`

* [x] **✅ Endpoints de solicitudes** implementados:
  - **Completado**: `GET /api/solicitudes/` - Listar todas
  - **Completado**: `POST /api/solicitudes/` - Crear nueva
  - **Completado**: `GET /api/solicitudes/mis_solicitudes/` - Mis solicitudes
  - **Completado**: `GET /api/solicitudes/resumen/` - Resumen de estados
  - **Completado**: `GET /api/solicitudes/{id}/` - Detalle de solicitud
  - **Completado**: `POST /api/solicitudes/{id}/cambiar_estado/` - Cambiar estado (admin)

* [x] **✅ Serializers completos**:
  - **Completado**: `SolicitudSerializer` - Lista básica
  - **Completado**: `SolicitudDetailSerializer` - Detalle completo
  - **Completado**: `SolicitudCreateSerializer` - Crear con validaciones
  - **Completado**: Validaciones de campos (título min 5, descripción min 20)

* [x] **✅ ViewSet con permisos**:
  - **Completado**: Usuarios ven solo sus solicitudes
  - **Completado**: Admin ve todas las solicitudes
  - **Completado**: Filtrado por tipo, estado, prioridad, lote

* ~~[ ] **Notificación por correo**~~ ❌ **NO IMPLEMENTAR** (solo dashboard)

#### 🎨 Frontend

* [x] **✅ Página "Solicitudes" para owners** (`/owner/solicitudes`)
  - **Completado**: Lista de solicitudes con filtros
  - **Completado**: Formulario de nueva solicitud
  - **Completado**: Vista de detalle
  - **Completado**: Todo consolidado en una sola ruta

* [x] **✅ Sección de gestión de solicitudes** en panel admin (`/admin/solicitudes`)
  - **Completado**: Lista de todas las solicitudes
  - **Completado**: Vista de detalle con acciones
  - **Completado**: Modal para cambiar estado con comentarios
  - **Completado**: Todo consolidado en una sola ruta

* [x] **✅ Tipos configurables**: soporte técnico, análisis, consulta, validación, corrección
* [x] **✅ Prioridades visuales**: baja, normal, alta, urgente
* [x] **✅ Estados con badges**: pendiente, en revisión, aprobado, rechazado, completado

---

### **Fase 3. Perfil de Desarrollador y Filtros** 🔜 **SIGUIENTE PASO**

**Objetivo:** habilitar búsqueda avanzada y perfil de inversión.

#### 🔧 Backend

* [x] **✅ Modelo User (rol developer) con campos completos**:
  ```python
  # ✅ YA EXISTEN en User:
  company_name, company_nit, position, experience_years, 
  portfolio_url, focus_area
  
  # ⏳ AGREGAR campos faltantes:
  ciudades_interes = JSONField(default=list)  # ['Medellín', 'Bogotá']
  usos_preferidos = JSONField(default=list)   # ['residential', 'commercial']
  ticket_min = DecimalField(null=True)
  ticket_max = DecimalField(null=True)
  modelo_pago = CharField(choices=[('contado', 'De Contado'), ('financiado', 'Financiado')])
  ```

* [x] **✅ Endpoint `/api/lotes/available/` con filtros básicos**:
  - **Completado**: Filtrado por área (min/max)
  - **Completado**: Filtrado por estrato
  - **Completado**: Filtrado por barrio
  - **Completado**: Solo lotes activos y verificados
  - **⏳ Falta**: Filtros por ciudad, uso de suelo, tratamiento POT

* [ ] **Endpoint `/api/developers/<id>/profile/`** para actualizar preferencias

#### 🎨 Frontend

* [x] **✅ Búsqueda básica en `/developer/search`**:
  - **Completado**: Filtros por área, estrato, zona
  - **Completado**: Solo lotes verificados y activos
  - **Completado**: Información POT si está disponible
  - **⏳ Falta**: Filtros adicionales (ciudad, uso, precio)

* [ ] **Formulario completo de perfil de inversión** (`/developer/profile`)
  - Ciudades de interés
  - Usos preferidos
  - Ticket de inversión
  - Modelo de pago

* [ ] **Mejorar búsqueda**:
  - Guardar filtros favoritos
  - Exportar resultados a PDF/Excel

---

### **Fase 4. Panel del Administrador** (AVANCE: 65%)

**Objetivo:** control completo sobre usuarios, lotes y documentos.

#### 🔧 Backend

* [x] **✅ Endpoint de gestión de usuarios**:
  - **Completado**: `GET /api/users/` - Listar usuarios
  - **Completado**: `POST /api/users/` - Crear usuario
  - **Completado**: `GET /api/users/{id}/` - Ver detalle
  - **Completado**: `PUT/PATCH /api/users/{id}/` - Actualizar
 
---

### **Fase 5. Análisis Urbanístico** (Post-MVP)

**Objetivo:** venta y entrega de análisis urbanístico.

* [ ] Modelar `AnalisisUrbanistico`
* [ ] Flujo de solicitud y pago
* [ ] Carga de análisis por admin
* [ ] Visualización para desarrollador

---

### **Fase 6. Performance y Seguridad**

* [x] **✅ Soft delete implementado** (Lotes, Users, Documents)
* [ ] **Rate limiting** (Django Ratelimit o Throttling de DRF)
* [ ] **Cache con Redis** (resultados de búsqueda, estadísticas)
* [ ] **Optimización de queries** (select_related, prefetch_related)
* [ ] **Code splitting** en frontend (lazy loading de rutas)
* [ ] **CI/CD básico** (GitHub Actions para lint + build)

---

## 🎯 **RECOMENDACIÓN: SIGUIENTE PASO**

### **✅ Prioridad Alta: Fase 3 - Perfil de Desarrollador**

**Razón**: Es el siguiente paso lógico después de completar la Fase 1.

**Tareas inmediatas**:

1. **Backend (2-3 horas)**:
   - Agregar campos faltantes al modelo `User` para developers
   - Mejorar endpoint `/api/lotes/available/` con filtros avanzados
   - Crear endpoint `/api/developers/profile/` para actualizar preferencias

2. **Frontend (3-4 horas)**:
   - Formulario de perfil de inversión (`/developer/profile`)
   - Mejorar página de búsqueda (`/developer/search`) con filtros
   - Mostrar solo lotes verificados

3. **Testing (1 hora)**:
   - Verificar filtros de búsqueda
   - Validar que solo se muestren lotes aprobados

---

## 📊 **Estado del Proyecto**

| Fase | Estado | Progreso |
|------|--------|----------|
| **Fase 1 - Correcciones Críticas** | ✅ **COMPLETADA** | 95% |
| **Fase 2 - Solicitudes/Soporte** | 🟡 Parcial | 60% (modelo existe, falta UI) |
| **Fase 3 - Perfil Developer** | 🔜 **SIGUIENTE** | 30% (modelo base existe) |
| **Fase 4 - Panel Admin** | 🟡 Parcial | 40% (validación docs lista) |
| **Fase 5 - Análisis Urbanístico** | ⏳ Post-MVP | 0% |
| **Fase 6 - Performance** | 🟡 Parcial | 20% (soft delete listo) |

---

## ⚠️ **Elementos NO IMPLEMENTADOS (por falta de SMTP)**

* ❌ Envío de emails de registro
* ❌ Emails de recuperación de contraseña (token en consola)
* ❌ Notificaciones por email de lotes aprobados/rechazados
* ❌ Notificaciones de validación de documentos
* ❌ Emails de nuevas solicitudes

**Alternativa temporal**: 
- Notificaciones solo en dashboard
- Logs en consola para debugging
- Token de recuperación visible en desarrollo