<!--
HOW TO USE THIS TEMPLATE
------------------------
1. Copy this file to docs/design/02_Interaction_and_Data_Design.md in your team repository.
2. This is v1.0 of work you started in Class 13 ("Interaction & Contracts Design v0.1").
   It builds on Deliverable 1 and must stay consistent with it. If making behavior and data
   concrete reveals a problem in Deliverable 1, update Deliverable 1 and say so in Section 4.
3. Use YOUR project. Generic examples are reference material only.
4. Sequence diagrams are derived from the Use Cases in your requirements. Do not invent
   business behavior. If something is not specified, mark it as an assumption or an Open Question.
5. If nothing in your system needs to persist, say so in Section 2.1 with your reasons. Do not
   invent a database.
6. Diagrams: Mermaid is preferred (renders on GitHub). PlantUML or another tool is accepted if
   the exported image is committed and embedded in this file.
   Optionally, also add a JPG of each diagram in docs/design/diagrams/ (the Markdown prevails if they differ).
7. Read Design_Deliverable_2_Example.md for the expected level of detail. Do not copy it.
-->

# Sistema de gestión y control de inventario para la operación de productos farmacéuticos — Diseño de Interacción y Datos v1.0

| Campo | Información |
|---|---|
| **Equipo** | Equipo 6 |
| **Integrantes** | Junior Andrés Arrieta Tabaco, Edgar Mauricio Montufar Molano, Kevin Alexis Bermúdez Caicedo y Antonio José Moreno López |
| **Estado** | Listo para revisión |
| **Fecha** | 25/10/2026 |
| **Entradas** | `docs/design/01_Architectural_and_Detailed_Design.md`, casos de uso documentados en `docs/requirements/`, requisito funcional RF-02 (bloqueo de lotes de inventario), requisito funcional RF-03 (bloqueo temporal del acceso después de cinco intentos fallidos), diagrama de clases del Entregable 1 y materiales de la Clase 13 sobre diseño de interacción, datos y contratos. |

---

## 1. Comportamiento — Casos de Uso Seleccionados

### CU-03. Autenticación de usuarios — RF-03: Bloqueo temporal del acceso después de cinco intentos fallidos

```mermaid


sequenceDiagram
    actor U as Usuario registrado en el sistema
    participant FE as Frontend (Aplicación web)
    participant API as Controlador de API
    participant SA as ServicioAutenticacion
    participant RU as RepositorioUsuario
    participant REA as RepositorioEstadoAutenticacion
    participant EA as EstadoAutenticacion
    participant BD as PostgreSQL

    U->>FE: Ingresa nombre de usuario y contraseña
    FE->>API: Solicitar autenticación(nombreUsuario, credencial)
    API->>SA: autenticar(nombreUsuario, credencial)

    SA->>RU: buscarPorNombre(nombreUsuario)
    RU->>BD: Consultar datos del usuario
    BD-->>RU: Devolver datos del usuario
    RU-->>SA: Devolver usuario

    Note over SA: Se asume que el usuario existe según la precondición de CU-03

    SA->>REA: buscarEstado(usuarioId)
    REA->>BD: Consultar intentos y fecha de bloqueo
    BD-->>REA: Devolver estado almacenado
    REA-->>SA: Devolver EstadoAutenticacion

    SA->>EA: estaBloqueado(ahora)
    EA-->>SA: true o false

    alt El usuario tiene un bloqueo vigente
        Note over SA,BD: No se validan nuevamente las credenciales ni se modifica el estado
        SA-->>API: ResultadoAutenticacion(false, acceso bloqueado)
        API-->>FE: Informar bloqueo temporal
        FE-->>U: Mostrar que debe esperar a que finalicen los cinco minutos

    else El usuario no está bloqueado
        SA->>SA: Verificar credenciales del usuario

        alt Las credenciales son correctas
            SA->>EA: registrarExito()
            EA-->>SA: Contador de intentos reiniciado

            SA->>REA: guardarEstado(usuarioId, estado)
            REA->>BD: Guardar estado actualizado
            BD-->>REA: Confirmar almacenamiento
            REA-->>SA: Confirmar persistencia

            SA-->>API: ResultadoAutenticacion(true, usuario)
            API-->>FE: Autenticación exitosa
            FE-->>U: Permitir acceso al sistema

        else Las credenciales son incorrectas
            SA->>EA: registrarFallo(ahora)
            Note over EA: Registrar el fallo y establecer bloqueoHasta al alcanzar cinco fallos consecutivos
            EA-->>SA: Estado actualizado

            SA->>REA: guardarEstado(usuarioId, estado)
            REA->>BD: Guardar contador y fecha de bloqueo

            alt Persistencia exitosa
                BD-->>REA: Confirmar almacenamiento
                REA-->>SA: Confirmar persistencia

                SA->>EA: estaBloqueado(ahora)
                EA-->>SA: true o false

                alt Se alcanzan cinco intentos fallidos consecutivos
                    SA-->>API: ResultadoAutenticacion(false, acceso bloqueado por cinco minutos)
                    API-->>FE: Informar bloqueo temporal
                    FE-->>U: Mostrar mensaje de bloqueo

                else No se alcanzan cinco intentos fallidos
                    SA-->>API: ResultadoAutenticacion(false, credenciales incorrectas)
                    API-->>FE: Informar error de autenticación
                    FE-->>U: Mostrar mensaje de credenciales incorrectas
                end

            else Excepción: error al guardar el estado
                BD-->>REA: Error de almacenamiento
                REA-->>SA: Informar error de persistencia
                SA-->>API: Error interno de autenticación
                API-->>FE: Informar error del sistema
                FE-->>U: Mostrar que no es posible completar la autenticación
            end
        end
    end


```

| Paso o flujo del caso de uso | Mensaje(s) en el diagrama | Información intercambiada | Operación definida en el Entregable 1 |
|---|---|---|---|
| Flujo principal, paso 1 | `U → FE: Ingresa nombre de usuario y contraseña`<br>`FE → API: Solicitar autenticación(nombreUsuario, credencial)`<br>`API → SA: autenticar(nombreUsuario, credencial)`<br>`SA → RU: buscarPorNombre(nombreUsuario)`<br>`SA → REA: buscarEstado(usuarioId)` | Nombre de usuario, credencial y estado de autenticación almacenado, incluidos el contador de intentos fallidos y la fecha de finalización del bloqueo. | `ServicioAutenticacion.autenticar(nombreUsuario, credencial)`<br>`RepositorioUsuario.buscarPorNombre(nombre)`<br>`RepositorioEstadoAutenticacion.buscarEstado(usuarioId)` |
| Flujo alternativo | `SA → EA: estaBloqueado(ahora)`<br>`SA → EA: registrarExito()` o `registrarFallo(ahora)`<br>`SA → REA: guardarEstado(usuarioId, estado)`<br>`SA → API: ResultadoAutenticacion(...)` | Estado del bloqueo, resultado de la validación de credenciales y actualización del contador. Si la autenticación es exitosa, se reinicia el contador; si falla, se incrementa y se establece el bloqueo al alcanzar cinco intentos consecutivos. | `EstadoAutenticacion.estaBloqueado(ahora)`<br>`EstadoAutenticacion.registrarExito()`<br>`EstadoAutenticacion.registrarFallo(ahora)`<br>`RepositorioEstadoAutenticacion.guardarEstado(usuarioId, estado)` |
| Excepción | `BD → REA: Error de almacenamiento`<br>`REA → SA: Informar error de persistencia`<br>`SA → API: Error interno de autenticación`<br>`API → FE: Informar error del sistema`<br>`FE → U: Mostrar que no es posible completar la autenticación` | Error al guardar en PostgreSQL el estado actualizado de autenticación. El sistema informa que la operación no pudo completarse y no confirma el acceso como exitoso. | `RepositorioEstadoAutenticacion.guardarEstado(usuarioId, estado)` |



### CU-02. Bloquear lote de inventario — RF-02: Bloquear lotes de inventario

```mermaid

sequenceDiagram
    actor R as Regente de farmacia
    participant FE as Frontend (Aplicación web)
    participant API as Controlador de API
    participant SL as ServicioLote
    participant SA as ServicioAutenticacion
    participant RL as RepositorioLote
    participant L as Lote
    participant BD as PostgreSQL

    R->>FE: Consultar inventario
    FE->>API: Solicitar lotes registrados
    API->>SL: consultarLotes(...)
    SL->>RL: buscarPorProducto(productoId)
    RL->>BD: Consultar lotes del producto
    BD-->>RL: Devolver lotes registrados
    RL-->>SL: Devolver lista de lotes
    SL-->>API: Devolver lista de lotes
    API-->>FE: Mostrar lotes registrados
    FE-->>R: Presentar lotes disponibles para consulta

    R->>FE: Seleccionar un lote
    FE->>API: Solicitar información del lote(loteId)
    API->>SL: consultarLote(loteId)
    SL->>RL: buscarPorId(loteId)
    RL->>BD: Consultar información del lote
    BD-->>RL: Devolver información del lote
    RL-->>SL: Devolver lote
    SL-->>API: Devolver información del lote
    API-->>FE: Mostrar información del lote
    FE-->>R: Presentar información del lote seleccionado

    R->>FE: Seleccionar opción Bloquear lote
    FE->>API: Solicitar bloqueo(loteId, usuario, motivo)
    API->>SL: bloquearLote(loteId, usuario, motivo)

    SL->>SA: autorizar(usuario, permiso)
    SA-->>SL: Resultado de autorización

    alt El usuario tiene permiso para bloquear lotes
        SL->>RL: buscarPorId(loteId)
        RL->>BD: Consultar lote seleccionado
        BD-->>RL: Devolver información del lote
        RL-->>SL: Devolver lote

        SL->>L: bloquear(usuario, motivo)
        L-->>SL: Lote actualizado a estado BLOQUEADO

        SL->>RL: guardar(lote)
        RL->>BD: Guardar estado actualizado

        alt Persistencia exitosa
            BD-->>RL: Confirmar almacenamiento
            RL-->>SL: Devolver lote guardado
            SL-->>API: Devolver lote bloqueado
            API-->>FE: Confirmar bloqueo exitoso
            FE-->>R: Mostrar lote en estado BLOQUEADO

        else Excepción: error al guardar el lote
            BD-->>RL: Error de almacenamiento
            RL-->>SL: Informar fallo de persistencia
            SL-->>API: Informar que no se pudo completar el bloqueo
            API-->>FE: Mostrar error de operación
            FE-->>R: Informar que no se pudo confirmar el bloqueo
        end

    else El usuario no tiene permiso
        SL-->>API: Rechazar solicitud de bloqueo
        API-->>FE: Informar falta de autorización
        FE-->>R: Mostrar mensaje de acceso denegado
    end

```

| Paso o flujo del caso de uso | Mensaje(s) en el diagrama | Información intercambiada | Operación definida en el Entregable 1 |
|---|---|---|---|
| Flujo principal, paso 1 | `R → FE: Consultar inventario`<br>`FE → API: Solicitar lotes registrados`<br>`API → SL: consultarLotes(...)`<br>`SL → RL: buscarPorProducto(productoId)`<br>`RL → BD: Consultar lotes del producto` | Solicitud de consulta y lista de lotes registrados en el inventario. | `ServicioLote.consultarLotes(...)` y `RepositorioLote.buscarPorProducto(productoId)` |
| Flujo alternativo | `SL → SA: autorizar(usuario, permiso)`<br>`SA → SL: Resultado de autorización`<br>`SL → API: Rechazar solicitud de bloqueo`<br>`API → FE: Informar falta de autorización`<br>`FE → R: Mostrar mensaje de acceso denegado` | Resultado de la verificación de permisos del regente para ejecutar el bloqueo del lote. Si no tiene el permiso requerido, el sistema rechaza la solicitud. | `ServicioAutenticacion.autorizar(usuario, permiso)` |
| Excepción | `BD → RL: Error de almacenamiento`<br>`RL → SL: Informar fallo de persistencia`<br>`SL → API: Informar que no se pudo completar el bloqueo`<br>`API → FE: Mostrar error de operación`<br>`FE → R: Informar que no se pudo confirmar el bloqueo` | Error al guardar el lote con su estado actualizado en PostgreSQL. El sistema informa que no pudo confirmar la operación. | `RepositorioLote.guardar(lote)` |


---

## 2. Diseño de datos

### 2.1 Información principal que necesita el sistema

| Información | Necesitada por (casos de uso) | ¿Persistida? | ¿Por qué (o por qué no)? |
|---|---|---|---|
| Datos de los usuarios | CU-02, CU-03 | Sí | Permiten identificar al usuario que realiza las operaciones y verificar sus credenciales y permisos. |
| Roles y permisos | CU-02, CU-03 | Sí | Permiten controlar las acciones autorizadas para cada usuario, incluyendo el bloqueo de lotes. |
| Estado de autenticación | CU-03 | Sí | Permite conservar el número de intentos fallidos consecutivos y la fecha y hora hasta la que permanece bloqueado el acceso, incluso si el servidor se reinicia. |
| Datos de los productos | CU-02 | Sí | Permiten identificar los productos farmacéuticos y consultar su información general. |
| Datos de los lotes | CU-02 | Sí | Permiten identificar cada lote, consultar su fecha de vencimiento y cantidad disponible, y conocer su estado. |
| Estado de bloqueo del lote | CU-02 | Sí | Permite conservar el estado disponible o bloqueado de cada lote y evitar que las unidades de un lote bloqueado se registren como disponibles para salida. |
| Motivo y fecha de bloqueo del lote | CU-02 | Sí | Permiten conservar la información asociada al bloqueo del lote, de acuerdo con los atributos definidos en la clase `Lote`. |
| Movimientos de inventario | CU-02 | Sí | Permiten conservar el historial de entradas, salidas y ajustes realizados sobre los lotes. |
| Resultado de una autenticación | CU-03 | No, como registro independiente | El resultado de cada intento se representa mediante `ResultadoAutenticacion`. El estado persistente necesario para controlar los intentos fallidos se almacena en `EstadoAutenticacion`. |
| Información del lote mostrada en pantalla | CU-02 | No, como copia independiente | Se obtiene mediante la consulta del lote almacenado. El frontend presenta la información recibida sin convertirse en propietario de esos datos. |

### 2.2 Modelo de datos

Se utiliza un modelo relacional porque el sistema necesita conservar información estructurada sobre productos, lotes, usuarios y movimientos de inventario, además de mantener relaciones e integridad entre esos datos. PostgreSQL permite almacenar esta información de forma persistente y aplicar restricciones que contribuyen a mantener la consistencia del inventario y la seguridad de la autenticación.

#### Opción A — Modelo relacional

```mermaid
erDiagram
    PRODUCTO ||--o{ LOTE : tiene
    LOTE ||--o{ MOVIMIENTO_INVENTARIO : registra
    USUARIO ||--o{ MOVIMIENTO_INVENTARIO : realiza
    USUARIO ||--|| ESTADO_AUTENTICACION : posee
    ROL ||--o{ USUARIO : asignado
    ROL }o--o{ PERMISO : concede

    PRODUCTO {
        int productoId PK
        string codigo
        string nombre
        string presentacion
        boolean controlado
        boolean activo
    }

    LOTE {
        int loteId PK
        int productoId FK
        string numeroLote
        date fechaVencimiento
        int cantidadDisponible
        string estado
        string motivoBloqueo
        timestamp fechaBloqueo
    }

    MOVIMIENTO_INVENTARIO {
        int movimientoId PK
        int loteId FK
        int usuarioId FK
        string tipo
        int cantidad
        timestamp fechaHora
        string observacion
    }

    USUARIO {
        int usuarioId PK
        int rolId FK
        string nombre
        string nombreUsuario
        string credencialHash
        boolean activo
    }

    ROL {
        int rolId PK
        string nombre
        string descripcion
    }

    PERMISO {
        int permisoId PK
        string nombre
        string descripcion
    }

    ESTADO_AUTENTICACION {
        int usuarioId PK, FK
        int intentosFallidos
        timestamp bloqueoHasta
    }
```

**Descripción del modelo:**

- `Producto` almacena la información general de cada producto farmacéutico.
- `Lote` almacena la información específica de cada lote, incluida su cantidad disponible y su estado. El atributo `estado` utiliza los valores definidos por `EstadoLote`: `DISPONIBLE` y `BLOQUEADO`.
- `MovimientoInventario` conserva los movimientos asociados a los lotes y a los usuarios que los realizan.
- `Usuario`, `Rol` y `Permiso` permiten representar a los usuarios y controlar sus autorizaciones.
- `EstadoAutenticacion` conserva el contador de intentos fallidos y la fecha y hora de finalización del bloqueo temporal.


#### Entidades y restricciones

| Entidad / tipo de documento | Significado en el sistema | Identificador | Restricciones (requeridos, únicos, valores permitidos) |
|---|---|---|---|
| `Producto` | Representa un producto farmacéutico. | `productoId` | El identificador es obligatorio. El código del producto debe permitir identificarlo de forma inequívoca. |
| `Lote` | Representa un lote perteneciente a un producto. | `loteId` | Debe estar asociado a un producto existente. La cantidad disponible no puede ser negativa. El estado debe corresponder a `DISPONIBLE` o `BLOQUEADO`. |
| `MovimientoInventario` | Representa una entrada, salida o ajuste de inventario. | `movimientoId` | Debe estar asociado a un lote y al usuario que realiza la operación. La cantidad debe ser válida para el movimiento. El tipo debe corresponder a los valores de `TipoMovimiento`. |
| `Usuario` | Representa a una persona autorizada para utilizar el sistema. | `usuarioId` | El nombre de usuario debe ser único. Las credenciales deben conservarse mediante su hash, no como contraseña en texto plano. |
| `Rol` | Representa un conjunto de permisos asignados a los usuarios. | `rolId` | Debe tener un identificador y nombre válidos. |
| `Permiso` | Representa una acción autorizada dentro del sistema. | `permisoId` | Debe tener un identificador y nombre válidos. Los nombres de permisos deben identificar inequívocamente cada autorización. |
| `EstadoAutenticacion` | Representa el estado de seguridad asociado a un usuario. | `usuarioId` | Debe asociarse a un usuario existente. El contador de intentos fallidos no puede ser negativo. El bloqueo debe durar cinco minutos después de alcanzar cinco intentos consecutivos fallidos. |

### 2.3 Propiedad de los datos 

| Información | Propietario autorizado (componente responsable de mantenerla) | Consumido por (lo utiliza sin ser propietario) | Acceso a través de |
|---|---|---|---|
| Datos de los usuarios | Módulo de autenticación y autorización | Módulo de lotes y módulo de control de inventario, cuando necesitan identificar o autorizar al usuario | `RepositorioUsuario` y servicios correspondientes |
| Roles y permisos | Módulo de autenticación y autorización | Módulo de lotes, módulo de productos y módulo de control de inventario | `ServicioAutenticacion` |
| Estado de autenticación | Módulo de autenticación y autorización | Frontend y controlador de API, para comunicar el resultado de la autenticación | `RepositorioEstadoAutenticacion` |
| Datos de los productos | Módulo de productos | Módulo de lotes y frontend | `RepositorioProducto` y `ServicioProducto` |
| Datos y estado de los lotes | Módulo de lotes | Módulo de control de inventario y frontend | `RepositorioLote` y `ServicioLote` |
| Motivo y fecha de bloqueo del lote | Módulo de lotes | Frontend y módulo de control de inventario, cuando necesitan consultar el estado del lote | `RepositorioLote` y `ServicioLote` |
| Movimientos de inventario | Módulo de control de inventario | Frontend y otros componentes que necesitan consultar los movimientos | `RepositorioMovimiento` y `ServicioInventario` |


### 2.4 Reglas de negocio e invariantes aplicadas a los datos

| Regla de negocio o invariante | Dónde se aplica (lógica del componente, restricción de datos o ambas) | Cómo se aplica |
|---|---|---|
| Un lote debe estar asociado a un producto existente. | Ambas | `ServicioLote` valida la operación y la base de datos debe garantizar la integridad referencial mediante una clave foránea. |
| El estado de un lote solo puede ser `DISPONIBLE` o `BLOQUEADO`. | Ambas | `Lote` gestiona su estado mediante `EstadoLote`, y la persistencia debe impedir valores no permitidos. |
| Un lote bloqueado no puede utilizarse para registrar salidas de inventario. | Lógica del componente | `ServicioInventario` consulta el estado del lote y comprueba `Lote.estaBloqueado()` antes de registrar la salida. |
| Un lote debe permanecer bloqueado hasta que se realice una operación autorizada que cambie su estado. | Lógica del componente y persistencia | `ServicioLote` actualiza el estado mediante `Lote.bloquear(usuario, motivo)` y guarda el cambio a través de `RepositorioLote`. El alcance actual no contempla el desbloqueo. |
| Solo un usuario con el permiso correspondiente puede bloquear un lote. | Lógica del componente | `ServicioLote` solicita a `ServicioAutenticacion` la verificación del permiso antes de ejecutar el bloqueo. |
| La cantidad disponible de un lote no puede ser negativa. | Ambas | `ServicioInventario` valida las cantidades antes de registrar movimientos y la base de datos debe aplicar una restricción para impedir valores negativos. |
| El registro de una salida debe respetar el estado del lote y la cantidad disponible. | Lógica del componente y persistencia | `ServicioInventario` comprueba el bloqueo y la cantidad disponible. El descuento y el registro del movimiento deben ejecutarse en una misma transacción. |
| Después de cinco intentos fallidos consecutivos, el acceso debe bloquearse durante cinco minutos. | Lógica del componente | `EstadoAutenticacion.registrarFallo(ahora)` actualiza el contador y establece `bloqueoHasta` cuando se alcanza el límite. |
| Una autenticación exitosa reinicia el contador de intentos fallidos. | Lógica del componente y persistencia | `EstadoAutenticacion.registrarExito()` reinicia el contador y `RepositorioEstadoAutenticacion.guardarEstado(...)` persiste el estado actualizado. |
| El estado de autenticación debe conservarse entre reinicios del servidor. | Persistencia | `RepositorioEstadoAutenticacion` guarda y recupera el contador de intentos fallidos y la fecha de finalización del bloqueo en PostgreSQL. |
| Los datos de los lotes, productos y movimientos deben mantener relaciones consistentes. | Ambas | Los servicios validan las operaciones y la base de datos utiliza claves foráneas y transacciones para mantener la integridad de la información. |



---

## 3. Interface Contract

Select **one** important interaction from your sequence diagrams and specify the agreement between the two components. Technology (REST, JSON, OpenAPI) is not required.

**Interaction chosen** (from diagram 1.X, message `...`):
>

| Element | Specification |
|---|---|
| **Operation and purpose** | |
| **Input** (parameters and types) | |
| **Output** (successful result and data structure) | |
| **Preconditions** (what the caller must satisfy before invoking) | |
| **Postconditions** (what is guaranteed on successful completion) | |
| **Failure outcomes** (each failure, and what state is left after it) | |
| **Invariants and side effects** (what must stay true, what may change) | |

**Testable examples** *(optional but recommended: concrete values make guarantees checkable)*

| Case | Before | Request | Expected |
|---|---|---|---|
| | | | |

---

## 4. Cross-Consistency & Changes to Deliverable 1

| Check | Result |
|---|---|
| Every participant in a sequence diagram is an actor, a component, a class or an external system from Deliverable 1 | |
| Every message corresponds to a capability, operation or contract | |
| Every entity or document type is reflected in the class diagrams, or the reason it is not is stated | |
| Every persisted information element has exactly one authoritative owner | |
| The contract agrees with the sequence diagram and with the data model (same behavior in all three views) | |

**Changes made to Deliverable 1 because of this deliverable** *(real designs change when behavior and data become concrete. List what you updated, or write "None" and why.)*
>

---

## 5. Open Questions

> Anything unresolved about behavior or data. List it here instead of guessing.

---

## 6. Optional — AI-Assisted Design Reflection

> One design recommendation generated by AI that the team accepted, modified or rejected, and why.

---

## 7. Consistency Checklist

- [ ] Two use cases from the project, each traceable to a Use Case written in the requirements.
- [ ] Each sequence diagram shows the main flow and at least one alternative or exception flow.
- [ ] No business behavior is invented: anything unspecified is marked as an assumption or Open Question.
- [ ] Section 2.1 explains what is NOT persisted as well as what is.
- [ ] The data model has identifiers, relationships and constraints, not only boxes.
- [ ] Every piece of principal information has one authoritative owner, and consumers are listed (Section 2.3).
- [ ] The contract defines input, output, preconditions, postconditions and failure outcomes.
- [ ] Sequence, data model and contract describe the same behavior.
- [ ] Diagrams render correctly on GitHub (or the exported images are embedded).
