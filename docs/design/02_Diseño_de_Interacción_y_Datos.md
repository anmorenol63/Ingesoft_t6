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
    participant FE as Frontend (aplicación web)
    participant API as Controlador de API
    participant SL as ServicioLote
    participant SA as ServicioAutenticacion
    participant USR as Usuario
    participant RL as RepositorioLote
    participant LOT as Lote
    participant BD as PostgreSQL

    Note over API: S2. El controlador identifica al Usuario autenticado y lo pasa a los servicios
    Note over R,BD: S8. El regente ya eligió un producto en el inventario

    R->>FE: Consulta los lotes del producto
    FE->>API: Solicitar lotes(productoId)
    API->>SL: consultarLotes(productoId)
    SL->>RL: buscarPorProducto(productoId)
    RL->>BD: Consultar lotes del producto
    BD-->>RL: Devolver lotes registrados
    RL-->>SL: Devolver lista de lotes
    SL-->>API: Devolver lista de lotes
    API-->>FE: Informar lotes registrados
    FE-->>R: Mostrar los lotes del producto

    R->>FE: Selecciona el lote que desea bloquear
    FE->>API: Solicitar consulta de lote(loteId)
    API->>SL: consultarLote(loteId)
    SL->>RL: buscarPorId(loteId)
    RL->>BD: Consultar datos del lote
    BD-->>RL: Devolver datos del lote
    RL-->>SL: Devolver lote
    SL-->>API: Devolver lote
    API-->>FE: Informar datos del lote
    FE-->>R: Mostrar la información del lote seleccionado

    R->>FE: Selecciona Bloquear lote e indica el motivo
    FE->>API: Solicitar bloqueo(loteId, motivo)
    API->>SL: bloquearLote(loteId, usuario, motivo)

    SL->>SA: autorizar(usuario, BLOQUEAR_LOTE)
    Note over SA: S3. BLOQUEAR_LOTE es el permiso asociado al rol Regente
    SA->>USR: tienePermiso(BLOQUEAR_LOTE)
    USR-->>SA: true o false
    SA-->>SL: true o false

    alt El usuario no tiene permiso
        SL-->>API: Error usuario sin permisos
        API-->>FE: Informar error de autorización
        FE-->>R: Mostrar que no tiene permiso para bloquear lotes

    else El usuario está autorizado
        SL->>RL: buscarPorId(loteId)
        RL->>BD: Consultar datos del lote
        BD-->>RL: Devolver datos del lote o resultado vacío
        RL-->>SL: Devolver lote o no encontrado

        alt El lote no se encuentra
            SL-->>API: Error lote no encontrado
            API-->>FE: Informar error
            FE-->>R: Mostrar que el lote no existe

        else El lote se encuentra
            SL->>LOT: bloquear(usuario, motivo)
            Note over LOT: Fija estado BLOQUEADO, motivoBloqueo y fechaBloqueo
            LOT-->>SL: Lote con estado actualizado

            SL->>RL: guardar(lote)
            RL->>BD: Guardar estado de bloqueo del lote

            alt Persistencia exitosa (CA-01)
                BD-->>RL: Confirmar almacenamiento
                RL-->>SL: Devolver lote bloqueado
                SL-->>API: Devolver lote bloqueado
                API-->>FE: Informar bloqueo exitoso
                FE-->>R: Confirmar que el lote fue bloqueado

                Note over R,BD: Verificación del estado (CA-02, CA-04)
                R->>FE: Consulta nuevamente el lote
                FE->>API: Solicitar consulta de lote(loteId)
                API->>SL: consultarLote(loteId)
                SL->>RL: buscarPorId(loteId)
                RL->>BD: Consultar datos del lote
                BD-->>RL: Devolver datos del lote con estado BLOQUEADO
                RL-->>SL: Devolver lote
                SL-->>API: Devolver lote
                API-->>FE: Informar datos del lote
                FE-->>R: Mostrar el lote en estado Bloqueado

            else Excepción S7. Error al guardar el estado
                BD-->>RL: Error de almacenamiento
                RL-->>SL: Informar error de persistencia
                SL-->>API: Error no se pudo bloquear el lote
                API-->>FE: Informar error del sistema
                FE-->>R: Mostrar que no fue posible bloquear el lote
            end
        end
    end

```

| Paso o flujo del caso de uso | Mensaje(s) en el diagrama | Información intercambiada | Operación definida en el Entregable 1 |
|---|---|---|---|
| Flujo principal, paso 1 | `R → FE: Consulta los lotes del producto`<br>`FE → API: Solicitar lotes(productoId)`<br>`API → SL: consultarLotes(productoId)`<br>`SL → RL: buscarPorProducto(productoId)`<br>`RL → BD: Consultar lotes del producto`<br>`R → FE: Selecciona el lote que desea bloquear`<br>`API → SL: consultarLote(loteId)`<br>`SL → RL: buscarPorId(loteId)`<br>`R → FE: Selecciona Bloquear lote e indica el motivo`<br>`API → SL: bloquearLote(loteId, usuario, motivo)`<br>`SL → SA: autorizar(usuario, BLOQUEAR_LOTE)`<br>`SL → LOT: bloquear(usuario, motivo)`<br>`SL → RL: guardar(lote)`<br>`R → FE: Consulta nuevamente el lote`<br>`FE → API: Solicitar consulta de lote(loteId)`<br>`API → SL: consultarLote(loteId)` | Identificador del producto y del lote, datos del lote seleccionado, usuario que solicita el bloqueo, motivo del bloqueo y estado actualizado del lote. Después de guardar el cambio, se consulta nuevamente el lote para verificar que permanezca en estado `BLOQUEADO`. | `ServicioLote.consultarLotes(...)`<br>`RepositorioLote.buscarPorProducto(productoId)`<br>`ServicioLote.consultarLote(loteId)`<br>`RepositorioLote.buscarPorId(loteId)`<br>`ServicioLote.bloquearLote(loteId, usuario, motivo)`<br>`ServicioAutenticacion.autorizar(usuario, permiso)`<br>`Usuario.tienePermiso(permiso)`<br>`Lote.bloquear(usuario, motivo)`<br>`RepositorioLote.guardar(lote)` |
| Flujo alternativo | `SL → SA: autorizar(usuario, BLOQUEAR_LOTE)`<br>`SA → SL: true o false`<br>`SL → API: Error usuario sin permisos`<br>`API → FE: Informar error de autorización`<br>`FE → R: Mostrar que no tiene permiso para bloquear lotes`<br><br>`SL → RL: buscarPorId(loteId)`<br>`RL → SL: Devolver lote o no encontrado`<br>`SL → API: Error lote no encontrado`<br>`API → FE: Informar error`<br>`FE → R: Mostrar que el lote no existe` | Resultado de la comprobación de permisos y resultado de la búsqueda del lote. Si el usuario no tiene autorización o el lote no existe, el sistema rechaza la solicitud y no completa el bloqueo. | `ServicioAutenticacion.autorizar(usuario, permiso)`<br>`Usuario.tienePermiso(permiso)`<br>`RepositorioLote.buscarPorId(loteId)` |
| Excepción | `BD → RL: Error de almacenamiento`<br>`RL → SL: Informar error de persistencia`<br>`SL → API: Error no se pudo bloquear el lote`<br>`API → FE: Informar error del sistema`<br>`FE → R: Mostrar que no fue posible bloquear el lote` | Error al guardar en PostgreSQL el estado actualizado del lote. El sistema informa que no fue posible completar el bloqueo y no confirma la operación como exitosa. | `RepositorioLote.guardar(lote)` |



---

## 2. Diseño de datos

### 2.1 Información principal que necesita el sistema

| Información | Necesitada por (casos de uso) | ¿Persistida? | ¿Por qué (o por qué no)? |
|---|---|---|---|
| Datos de los usuarios | CU-02, CU-03 | Sí | Permiten identificar a los usuarios del sistema y verificar sus credenciales y permisos. |
| Roles y permisos | CU-02, CU-03 | Sí | Permiten determinar qué operaciones puede realizar cada usuario, como el bloqueo de lotes. |
| Estado de autenticación | CU-03 | Sí | Permite conservar el contador de intentos fallidos y la fecha y hora hasta las que permanece bloqueado el acceso. |
| Datos de los productos | CU-02 | Sí | Permiten identificar los productos farmacéuticos y consultar su información general. |
| Datos de los lotes | CU-02 | Sí | Permiten identificar cada lote y conservar su fecha de vencimiento, cantidad disponible y estado. |
| Información del bloqueo del lote | CU-02 | Sí | Permite conservar el estado del lote, el motivo y la fecha del bloqueo, así como la relación con el usuario que realizó la operación. |
| Movimientos de inventario | CU-02 | Sí | Permiten conservar el historial de entradas, salidas y ajustes realizados sobre los lotes. |
| Resultado de autenticación | CU-03 | No, como registro independiente | `ResultadoAutenticacion` representa el resultado de una operación. El estado necesario para controlar los intentos fallidos se conserva en `EstadoAutenticacion`. |
| Información del lote mostrada en pantalla | CU-02 | No, como copia independiente | Se obtiene mediante las consultas al sistema. El frontend presenta la información recibida, pero no es responsable de mantenerla. |

### 2.2 Modelo de datos

Se utiliza un modelo relacional porque el sistema necesita conservar información estructurada sobre productos, lotes, usuarios y movimientos de inventario, manteniendo relaciones e integridad entre ellos. PostgreSQL permite almacenar estos datos de manera persistente y aplicar restricciones para proteger la consistencia del inventario y del estado de autenticación.

#### Modelo relacional

```mermaid
erDiagram
    PRODUCTO ||--o{ LOTE : tiene
    LOTE ||--o{ MOVIMIENTO_INVENTARIO : registra
    USUARIO ||--o{ MOVIMIENTO_INVENTARIO : realiza
    USUARIO ||--|| ESTADO_AUTENTICACION : posee
    ROL ||--o{ USUARIO : asignado
    ROL ||--o{ ROL_PERMISO : tiene
    PERMISO ||--o{ ROL_PERMISO : asignado
    USUARIO o|--o{ LOTE : bloquea

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
        int bloqueadoPorUsuarioId FK
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

    ROL_PERMISO {
        int rolId PK, FK
        int permisoId PK, FK
    }

    ESTADO_AUTENTICACION {
        int usuarioId PK, FK
        int intentosFallidos
        timestamp bloqueoHasta
    }
```

**Descripción del modelo:**

- `Producto` almacena la información general de cada producto farmacéutico.
- `Lote` almacena los datos específicos de cada lote, su cantidad disponible, su estado y la información asociada al bloqueo. `bloqueadoPorUsuarioId` representa la relación con el usuario que realizó el bloqueo.
- `MovimientoInventario` conserva los movimientos asociados a los lotes y a los usuarios que los realizan.
- `Usuario`, `Rol` y `Permiso` representan los usuarios y las autorizaciones del sistema.
- `RolPermiso` es una tabla intermedia que permite representar la asignación de varios permisos a un rol y de un mismo permiso a distintos roles.
- `EstadoAutenticacion` conserva el contador de intentos fallidos y la fecha y hora de finalización del bloqueo temporal.


#### Entidades y restricciones

| Entidad / tipo de documento | Significado en el sistema | Identificador | Restricciones (requeridos, únicos, valores permitidos) |
|---|---|---|---|
| `Producto` | Representa un producto farmacéutico. | `productoId` | El identificador es obligatorio. El código debe permitir identificar el producto de forma inequívoca. |
| `Lote` | Representa un lote perteneciente a un producto. | `loteId` | Debe estar asociado a un producto existente. La cantidad disponible no puede ser negativa. El estado debe ser `DISPONIBLE` o `BLOQUEADO`. Si se registra el bloqueo, la referencia al usuario, el motivo y la fecha deben corresponder a la operación realizada. |
| `MovimientoInventario` | Representa una entrada, salida o ajuste de inventario. | `movimientoId` | Debe estar asociado a un lote y al usuario que realiza la operación. La cantidad debe ser válida y el tipo debe corresponder a los valores de `TipoMovimiento`. |
| `Usuario` | Representa a una persona autorizada para utilizar el sistema. | `usuarioId` | El nombre de usuario debe ser único. Las credenciales deben conservarse mediante su hash, no como contraseña en texto plano. |
| `Rol` | Representa un conjunto de permisos asignados a los usuarios. | `rolId` | Debe tener un identificador y un nombre válidos. |
| `Permiso` | Representa una acción autorizada dentro del sistema. | `permisoId` | Debe tener un identificador y un nombre válidos. Cada permiso debe poder identificarse inequívocamente. |
| `RolPermiso` | Representa la asignación de permisos a los roles. | `rolId` y `permisoId` | Ambos campos deben referenciar registros existentes. La combinación de los dos identificadores debe ser única. |
| `EstadoAutenticacion` | Representa el estado de seguridad asociado a un usuario. | `usuarioId` | Debe estar asociado a un usuario existente. El contador de intentos fallidos no puede ser negativo. El acceso debe bloquearse durante cinco minutos después de cinco intentos consecutivos fallidos. |


### 2.3 Propiedad de los datos

| Información | Propietario autorizado (componente responsable de mantenerla) | Consumido por (lo utiliza sin ser propietario) | Acceso a través de |
|---|---|---|---|
| Datos de los usuarios | Módulo de autenticación y autorización | Módulo de lotes y módulo de control de inventario, cuando necesitan identificar o autorizar al usuario | `ServicioAutenticacion`, que utiliza `RepositorioUsuario` internamente para consultar los datos de los usuarios. |
| Roles y permisos | Módulo de autenticación y autorización | Módulo de lotes, módulo de productos y módulo de control de inventario | `ServicioAutenticacion`, que verifica los permisos solicitados. |
| Estado de autenticación | Módulo de autenticación y autorización | Frontend y controlador de API, para comunicar el resultado de la autenticación | `ServicioAutenticacion`, que utiliza `RepositorioEstadoAutenticacion` para consultar y persistir el estado. |
| Datos de los productos | Módulo de productos | Módulo de lotes y frontend | `ServicioProducto`, que utiliza `RepositorioProducto` para consultar y mantener los datos. |
| Datos y estado de los lotes | Módulo de lotes | Módulo de control de inventario y frontend | `ServicioLote`, que utiliza `RepositorioLote` para consultar y guardar los lotes. |
| Motivo y fecha de bloqueo del lote | Módulo de lotes | Frontend y módulo de control de inventario, cuando necesitan consultar el estado del lote | `ServicioLote`, mediante las operaciones de consulta de lotes. |
| Usuario asociado al bloqueo del lote | Módulo de lotes, como parte de la información asociada al bloqueo | Frontend y componentes autorizados que necesiten consultar quién realizó el bloqueo | `ServicioLote`, que utiliza `RepositorioLote` y la relación con `Usuario`. |
| Movimientos de inventario | Módulo de control de inventario | Frontend y otros componentes que necesitan consultar los movimientos | `ServicioInventario`, que utiliza `RepositorioMovimiento` para registrar los movimientos. |


### 2.4 Reglas de negocio e invariantes aplicadas a los datos

| Regla de negocio o invariante | Dónde se aplica (lógica del componente, restricción de datos o ambas) | Cómo se aplica |
|---|---|---|
| Un lote debe estar asociado a un producto existente. | Ambas | `ServicioLote` valida la operación y la base de datos debe garantizar la integridad referencial mediante una clave foránea. |
| El estado de un lote solo puede ser `DISPONIBLE` o `BLOQUEADO`. | Ambas | `Lote` gestiona su estado mediante `EstadoLote`, y la persistencia debe impedir valores no permitidos. |
| Un lote bloqueado no puede utilizarse para registrar salidas de inventario. | Lógica del componente | `ServicioInventario` consulta el estado del lote y comprueba `Lote.estaBloqueado()` y las condiciones de salida antes de registrar el movimiento. |
| El bloqueo de un lote debe conservar el motivo, la fecha y el usuario que lo realizó. | Lógica del componente y persistencia | `ServicioLote` solicita el bloqueo mediante `Lote.bloquear(usuario, motivo)` y guarda el lote con `RepositorioLote`. La relación con `Usuario` se representa mediante la clave foránea `bloqueadoPorUsuarioId`. |
| Un lote debe permanecer bloqueado mientras no exista una operación autorizada que cambie su estado. | Lógica del componente y persistencia | `ServicioLote` actualiza el estado y persiste el cambio mediante `RepositorioLote`. El alcance actual no contempla el desbloqueo. |
| Solo un usuario con el permiso correspondiente puede bloquear un lote. | Lógica del componente | `ServicioLote` solicita a `ServicioAutenticacion` la verificación del permiso antes de ejecutar el bloqueo. |
| La cantidad disponible de un lote no puede ser negativa. | Ambas | `ServicioInventario` valida las cantidades antes de registrar movimientos y la base de datos debe aplicar una restricción para impedir valores negativos. |
| El registro de una salida debe respetar el estado del lote y la cantidad disponible. | Lógica del componente y persistencia | `ServicioInventario` comprueba el bloqueo y la cantidad disponible. El descuento y el registro del movimiento deben ejecutarse en una misma transacción. |
| Los permisos asignados a los roles deben corresponder a registros existentes. | Ambas | `ServicioAutenticacion` verifica los permisos y la base de datos debe garantizar la integridad de la tabla intermedia `RolPermiso` mediante claves foráneas y una clave primaria compuesta. |
| Después de cinco intentos fallidos consecutivos, el acceso debe bloquearse durante cinco minutos. | Lógica del componente | `EstadoAutenticacion.registrarFallo(ahora)` actualiza el contador y establece `bloqueoHasta` cuando se alcanza el límite. |
| Una autenticación exitosa reinicia el contador de intentos fallidos. | Lógica del componente y persistencia | `EstadoAutenticacion.registrarExito()` reinicia el contador y `RepositorioEstadoAutenticacion.guardarEstado(...)` persiste el estado actualizado. |
| El estado de autenticación debe conservarse entre reinicios del servidor. | Persistencia | `RepositorioEstadoAutenticacion` guarda y recupera el contador de intentos fallidos y la fecha de finalización del bloqueo en PostgreSQL. |
| Los datos de productos, lotes y movimientos deben mantener relaciones consistentes. | Ambas | Los servicios validan las operaciones y la base de datos utiliza claves foráneas y transacciones para mantener la integridad de la información. |



---

## 3. Contrato de interfaz

Se selecciona la operación de bloqueo de lotes porque permite implementar el requisito RF-02, conservar la información del bloqueo y evitar que las unidades de un lote bloqueado se registren como disponibles para salida.

**Interacción seleccionada (del diagrama 1.2, mensaje `bloquearLote(loteId, usuario, motivo)`):**

`Controlador de API → ServicioLote: bloquearLote(loteId, usuario, motivo)`

| Elemento | Especificación |
|---|---|
| **Operación y propósito** | `ServicioLote.bloquearLote(loteId, usuario, motivo)` permite al regente de farmacia solicitar el bloqueo de un lote. El servicio verifica que el usuario tenga el permiso `BLOQUEAR_LOTE`, consulta el lote, actualiza su estado a `BLOQUEADO` y guarda los cambios mediante `RepositorioLote`. |
| **Entrada (parámetros y tipos)** | `loteId: Integer`: identificador del lote que se desea bloquear.<br>`usuario: Usuario`: usuario autenticado que solicita el bloqueo.<br>`motivo: String`: motivo del bloqueo. |
| **Salida (resultado exitoso y estructura de datos)** | Devuelve el objeto `Lote` con el estado actualizado a `BLOQUEADO`, el motivo y la fecha del bloqueo. La información del usuario que realizó la operación se conserva mediante la relación entre `Lote` y `Usuario`, representada en el modelo relacional mediante la clave foránea `bloqueadoPorUsuarioId`. El sistema confirma el éxito únicamente después de guardar los cambios correctamente. |
| **Precondiciones (qué debe cumplir quien invoca la operación)** | El usuario debe estar autenticado y ser identificado por el controlador de API. Deben proporcionarse el identificador del lote y el motivo del bloqueo. El lote debe estar registrado y el usuario debe contar con el permiso `BLOQUEAR_LOTE`. El servicio verifica la autorización antes de realizar la operación. |
| **Postcondiciones (qué se garantiza si la operación termina correctamente)** | El lote queda en estado `BLOQUEADO` y la información actualizada se guarda mediante `RepositorioLote`. Se conservan el motivo, la fecha del bloqueo y la relación con el usuario que realizó la operación. Mientras permanezca bloqueado, el lote no puede utilizarse para registrar unidades como disponibles para salida. El bloqueo no modifica por sí mismo la cantidad disponible ni registra un movimiento de salida. |
| **Resultados de fallo (cada fallo y estado posterior)** | **Usuario sin permiso:** se rechaza la solicitud y no se modifica el lote.<br>**Lote inexistente:** se informa que el lote no fue encontrado y no se modifica ningún lote.<br>**Error de persistencia:** se informa que no fue posible completar el bloqueo y no se confirma la operación como exitosa. La implementación debe evitar que un fallo de almacenamiento deje el estado persistido parcialmente actualizado. |
| **Invariantes y efectos secundarios (qué debe mantenerse y qué puede cambiar)** | El estado del lote debe corresponder a los valores definidos en `EstadoLote`: `DISPONIBLE` o `BLOQUEADO`. Solo los usuarios autorizados pueden realizar el bloqueo. La información del bloqueo debe conservar la relación con el usuario que lo efectuó. El bloqueo no cambia la cantidad disponible ni registra una salida de inventario. Las salidas deben comprobar el estado del lote antes de registrarse. |

### Ejemplos verificables

| Caso | Estado previo | Solicitud | Resultado esperado |
|---|---|---|---|
| Bloqueo exitoso | El lote existe, está `DISPONIBLE` y el usuario tiene el permiso correspondiente. | `bloquearLote(15, usuarioRegente, "Lote en revisión")` | El lote queda `BLOQUEADO`. Se guardan el motivo, la fecha del bloqueo y la relación con el usuario que realizó la operación. El sistema confirma el éxito. |
| Usuario sin permiso | El lote existe y está `DISPONIBLE`, pero el usuario no tiene el permiso requerido. | `bloquearLote(15, usuarioSinPermiso, "Lote en revisión")` | La solicitud se rechaza y el estado persistido del lote permanece sin cambios. |
| Lote inexistente | No existe un lote con identificador `9999`. | `bloquearLote(9999, usuarioRegente, "Lote en revisión")` | El sistema informa que el lote no fue encontrado y no modifica ningún lote. |
| Error de persistencia | El lote existe, está `DISPONIBLE` y el usuario tiene permiso, pero falla el almacenamiento. | `bloquearLote(15, usuarioRegente, "Lote en revisión")` | El sistema informa que no pudo completar el bloqueo. No confirma la operación como exitosa y el estado persistido del lote permanece consistente. |



---

## 4. Consistencia cruzada y cambios al Entregable 1

### 4.1 Lista de comprobación de consistencia

| Comprobación                                                                                                                                  | Resultado                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Todos los participantes de los diagramas de secuencia son actores, componentes, clases o sistemas externos definidos en el Entregable 1.      | **Cumple.** Los participantes de CU-02 y CU-03 corresponden a actores, componentes, clases y sistemas identificados en la arquitectura y el diagrama de clases, como `ServicioLote`, `ServicioAutenticacion`, `RepositorioLote`, `RepositorioUsuario`, `EstadoAutenticacion`, `Usuario`, `Lote`, el frontend, el controlador de API y PostgreSQL.                                                                                                                                 |
| Todos los mensajes corresponden a una capacidad, operación o contrato.                                                                        | **Cumple con observación.** Las llamadas principales utilizan las operaciones definidas en el diseño, como `autenticar(...)`, `buscarEstado(...)`, `bloquearLote(...)`, `bloquear(...)` y `guardar(...)`. Los mensajes de respuesta y error describen el comportamiento de los componentes y no representan necesariamente operaciones nuevas.                                                                                                                                    |
| Todas las entidades o tipos de documento están reflejados en los diagramas de clases, o se explica por qué no aparecen en el modelo de datos. | **Cumple.** Las entidades persistentes principales están representadas en el modelo relacional. `ResultadoAutenticacion` no se persiste como entidad independiente porque representa el resultado de una operación. `EstadoLote` y `TipoMovimiento` se representan mediante los valores permitidos de los atributos `estado` y `tipo`. La tabla `ROL_PERMISO` representa la relación entre roles y permisos en el modelo relacional, sin requerir una clase de dominio adicional. |
| Cada elemento de información persistente tiene exactamente un propietario autorizado.                                                         | **Cumple.** La sección 2.3 asigna la responsabilidad de mantener cada conjunto de datos a un único módulo: autenticación y autorización, productos, lotes o control de inventario. Los demás componentes acceden a la información mediante los servicios correspondientes.                                                                                                                                                                                                        |
| El contrato coincide con el diagrama de secuencia y con el modelo de datos, manteniendo el mismo comportamiento en las tres representaciones. | **Cumple con observación.** El contrato de `ServicioLote.bloquearLote(loteId, usuario, motivo)` coincide con el flujo de bloqueo del CU-02 y con el modelo relacional actualizado. La relación con el usuario que realizó el bloqueo se representa mediante `bloqueadoPorUsuarioId`.                                     |

### 4.2 Cambios realizados al Entregable 1 a partir de este entregable

No se han realizado modificaciones directas al diagrama de clases del Entregable 1 ni se han añadido nuevas operaciones a sus clases. Este entregable permitió precisar el comportamiento de los casos de uso, los contratos entre componentes y la representación relacional de la información.

Los principales ajustes y precisiones son los siguientes:

- **Comportamiento de RF-02:** se detallaron la verificación de permisos, la consulta del lote, la actualización a estado `BLOQUEADO`, la persistencia y la consulta posterior para verificar que el estado se mantenga.
- **Representación relacional del bloqueo:** se incorporó `bloqueadoPorUsuarioId` en `LOTE` para representar la asociación existente entre `Lote` y `Usuario` que identifica quién realizó el bloqueo. También se incorporó la tabla intermedia `ROL_PERMISO` para representar la relación entre roles y permisos.
- **Comportamiento de RF-03:** se documentaron la verificación de credenciales, el control de intentos fallidos, el bloqueo temporal de cinco minutos, el reinicio del contador después de una autenticación exitosa y la persistencia del estado de autenticación.
- **Propiedad de los datos:** se precisó qué módulo mantiene cada conjunto de información y cómo acceden los demás componentes mediante los servicios correspondientes.
- **Reglas de integridad:** se especificaron las condiciones que deben respetarse, especialmente la prohibición de registrar salidas de lotes bloqueados y la conservación del estado de autenticación.


---


## 5. Preguntas abiertas

* **Concurrencia en salidas de inventario:** 
  Aunque definimos que el descuento de unidades y el registro del movimiento se harán en una misma transacción de base de datos, ¿qué estrategia exacta de bloqueo a nivel de fila (por ejemplo, *pessimistic locking* o *optimistic locking*) usaremos en PostgreSQL para evitar errores si dos usuarios intentan sacar unidades del mismo lote exactamente al mismo tiempo?

* **Desbloqueo automático de usuarios:** 
  El modelo establece que guardaremos la fecha `bloqueoHasta` en PostgreSQL. ¿El sistema quitará este bloqueo automáticamente pasados los 5 minutos (usando un proceso en segundo plano o *cron job*), o simplemente validará el tiempo de forma dinámica cuando el usuario intente iniciar sesión de nuevo?

* **Auditoría estricta de bloqueos de lotes:** 
  Actualmente guardamos el `motivoBloqueo` y la `fechaBloqueo` directamente en la entidad `LOTE`. ¿Será necesario, por normativas farmacéuticas, crear una tabla adicional (ej. `HISTORIAL_BLOQUEO`) para tener un registro inmutable de quién y cuándo bloqueó o desbloqueó un lote en el tiempo?

---

## 6. Opcional — Reflexión sobre el diseño asistido por IA

**Recomendación de la IA:** 
Al diseñar el módulo de control de inventario, la IA sugirió implementar un patrón de "Bloqueo Optimista" (*Optimistic Locking*) agregando un campo de versión a la tabla `LOTE`. El objetivo era rechazar una salida si otro usuario modificaba la cantidad del lote un instante antes.

**Decisión del equipo (Modificada/Rechazada):** 
Decidimos **no aplicar** esa recomendación y optar por un control basado en transacciones de base de datos estrictas. Tal como documentamos, "el descuento y el registro del movimiento deben ejecutarse en una misma transacción". Consideramos que un bloqueo pesimista directo en PostgreSQL es más seguro para este dominio. Esto nos evita complejizar el código del backend con reintentos, asegurando la integridad del inventario de forma más directa y centralizada.


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
