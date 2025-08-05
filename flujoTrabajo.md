## 💼 FLUJO DE TRABAJO COLABORATIVO POR SPRINTS

**Enfocado en Pull Requests sin bloqueos entre miembros**

---

### 🏁 **Sprint 0: Diseño y Mockups** (Semana 1-2)

🧑‍🎨 **Equipo Heydi & Salomón**

* **Paralelo total**:

  * Heydi y Salomón trabajan en mockups distintos (Propietario y Admin).
  * Ambos pueden hacer PRs al repo de diseño o subir directamente a Figma compartido.
  * Ideal que Heydi haga PR con el `Design System` base antes de que Salomón haga componentes dependientes.

---

### 🧱 **Sprint 1: Modelado de Base de Datos** (Semana 2-3)

👩‍💻 **Sara** y 🧑‍💻 **Samir**

* **Paralelo parcial**:

  * Samir ya completó modelo de usuario → ✅ puede avanzar en Transacciones y Seeds sin esperar a Sara.
  * Sara trabaja en Lotes y Documentos, **evitar trabajar en el mismo archivo `models.py` al mismo tiempo**.
  * PRs separados por modelo (`feature/model-lotes`, `feature/model-transacciones`).
  * Samir revisa PRs de Sara para asegurar cohesión en migraciones.

---

### ⚙️ **Sprint 2: Backend Core** (Semana 3-5)

👨‍💻 Jose Daniel, 👨‍💻 Stiven, 👩‍💻 Sara

* **Paralelo inteligente**:

| Persona     | Tarea inicial               | Depende de                        |
| ----------- | --------------------------- | --------------------------------- |
| Jose Daniel | Autenticación               | Ya está el modelo User            |
| Stiven      | CRUD Lotes                  | Necesita modelo de Lotes (Sara) ✅ |
| Sara        | Documentos y Notificaciones | Dependen de Lotes también         |

💡 **Orden sugerido para evitar bloqueos**:

1. Sara sube modelo de Lotes → mergea.
2. Stiven arranca CRUD (branch propia), PR cuando tenga endpoints listos.
3. Jose Daniel avanza en Auth sin depender de los otros.
4. Sara sigue con Documentos una vez Lotes esté mergeado.

🧪 Testing (Stiven) puede avanzar conforme se mergeen los PRs.

---

### ⚛️ **Sprint 3: Frontend Core** (Semana 4-6)

👩‍🎨 Heydi, 👨‍🎨 Salomón, 👩‍💻 Sofía, 👨‍💻 Alejandro

* **Paralelo modular**:

  * Cada uno trabaja en secciones separadas del UI:

    * Heydi: layouts + dashboard propietario
    * Salomón: dashboard admin + charts
    * Sofía: componentes + dashboard desarrolladores
    * Alejandro: formularios + estado global

💡 **Reglas clave**:

* No trabajar al tiempo sobre el mismo layout o archivo base (`App.tsx`, `Root.tsx`, etc.).
* PRs por componente o página completa (`feature/dashboard-admin`, `feature/form-registro-lotes`).
* Sofía y Alejandro coordinan el *estado global* y la *integración con backend*.

---

### 🗺️ **Sprint 4: Funcionalidades Avanzadas** (Semana 6-8)

* **Trabajo en duplas paralelas**:

  * Mapas: Stiven (backend) + Sofía (frontend)
  * Búsqueda: Jose Daniel (backend) + Alejandro (frontend)
  * Favoritos: Sara (backend) + Heydi (frontend)

🔁 Flujo sugerido:

1. Backend primero implementa y documenta endpoints (PR + Swagger si hay).
2. Frontend clona esos endpoints para probar en local.
3. Ambos suben PRs sincronizados.

---

### 📊 **Sprint 5: Analytics y Reportes** (Semana 8-9)

* **Salomón (Frontend)** trabaja en gráficos
* **Jose Daniel (Backend)** entrega datos
* **Stiven y Sofía** hacen PDF + interfaz

💡 Aquí los PRs deben ser **por módulo visual o tipo de reporte**. Se pueden testear individualmente.

---

### 🛡️ **Sprint 6: Seguridad y Optimización** (Semana 9-10)

🧑‍💻 Samir + 👨‍💻 Jose Daniel

* **Trabajo en paralelo**:

  * Samir: Seguridad DevOps + rendimiento (infra)
  * Jose Daniel: Seguridad lógica y validación en código

💥 Cada uno puede subir PRs independientes, pero Samir hace revisión final.

---

### 🚀 **Sprint 7: Deployment y QA Final** (Semana 10-11)

👥 **Todo el equipo**

* Todos hacen pruebas de sus componentes
* Bugs se corrigen en ramas `fix/<nombre>`
* PRs de hotfixes deben revisarse rápido (máx. 24 horas)

👑 **Samir controla merges a `main`**

* Solo se permite cuando el PR esté aprobado y probado
* Ideal usar **GitHub Actions** para validar que el PR no rompa nada antes de mergear

---

## 📌 RESUMEN FLUJOS POR EQUIPO

| Semana | Backend               | Frontend                              | Diseño | DevOps          |
| ------ | --------------------- | ------------------------------------- | ------ | --------------- |
| 1-2    | No aplica             | No aplica                             | 🟢     | 🟢 (Samir)      |
| 2-3    | 🟢 (Sara, Samir)      | No aplica                             | 🔄     | 🟢              |
| 3-5    | 🟢 (Sara, Stiven, JD) | 🟡 (infraestructura UI)               | 🔄     | 🟢              |
| 4-6    | 🔄                    | 🟢 (Heydi, Sofía, Alejandro, Salomón) | ❌      | 🔄              |
| 6-8    | 🟢                    | 🟢                                    | ❌      | 🔄              |
| 8-9    | 🟢                    | 🟢                                    | ❌      | 🔄              |
| 9-10   | 🟢                    | 🔄                                    | ❌      | 🟢 (Samir full) |
| 10-11  | 🟢 (fixes)            | 🟢 (fixes)                            | ❌      | 🟢 (Deploy)     |