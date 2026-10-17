# Sistema de gestión y control de inventario farmacéutico — Diseño arquitectónico y detallado v1.0

| Campo | Información |
|---|---|
| **Equipo** | Equipo 6 |
| **Integrantes** | Junior Andrés Arrieta Tabaco, Edgar Mauricio Montufar Molano, Kevin Alexis Bermúdez Caicedo y Antonio José Moreno López |
| **Estado** | Listo para revisión |
| **Fecha** | 17/10/2026 |
| **Fuentes de entrada** | docs/req/, docs/requirements/ (REQ-RF-03.md) y los apuntes y materiales de las clases 11 y 12 proporcionados por el profesor. |

---

## 1. System Overview & Design Drivers

**System purpose** (2–3 sentences, in terms of the need it satisfies)
>

**Requirements that shape the structure** *(the ones that most influence the design, not all of them)*

| Requirement / Use Case ID | Why it shapes the structure | Quality attribute, constraint or business rule involved |
|---|---|---|
| | | |

---

---

## 2. Diseño arquitectónico

*(Visión externa: ¿cuáles son las partes principales, de qué es responsable cada una y cómo interactúan?)*

### 2.1 Contexto y límites del sistema

| Elemento externo al sistema | Tipo (actor / sistema externo / hardware) | Cómo interactúa el sistema con él |
|---|---|---|
| Regente de farmacia | Actor | Se autentica en la aplicación web para acceder al sistema. Puede controlar el inventario, registrar productos, añadir productos al inventario, registrar salidas de productos y marcar lotes como bloqueados. El sistema controla sus intentos fallidos de autenticación y bloquea temporalmente su acceso cuando alcanza el límite establecido. |
| Auxiliar de farmacia | Actor | Se autentica en la aplicación web. Puede registrar productos, ingresar productos al inventario y registrar salidas de productos del inventario. El sistema controla sus intentos fallidos de autenticación y bloquea temporalmente su acceso cuando alcanza el límite establecido. |

### 2.2 Componentes, responsabilidades y capacidades

El sistema contempla los requisitos funcionales RF-02 (bloqueo de lotes) y RF-03 (bloqueo temporal de acceso por intentos fallidos de autenticación). Su arquitectura cuenta con dos actores externos: el regente de farmacia y el auxiliar de farmacia. Ambos interactúan con el sistema mediante un **frontend (aplicación web)**, que se comunica con una **API** encargada de dirigir las solicitudes a los módulos. Estos módulos se conectan con una **capa de persistencia**, responsable de gestionar el acceso a la base de datos PostgreSQL.

#### Diagrama de componentes

```mermaid
flowchart TB
    R["Regente de farmacia"]
    A["Auxiliar de farmacia"]

    subgraph SYS["Sistema de gestión y control de inventario farmacéutico"]
        direction TB

        FE["Frontend (aplicación web)"]
        API["Controlador de API"]

        FE -->|"Solicitudes de la aplicación"| API

        subgraph MOD["Módulos funcionales"]
            direction LR
            AUTH["Módulo de autenticación y autorización"]
            PROD["Módulo de productos"]
            LOT["Módulo de lotes"]
            INV["Módulo de control de inventario"]
        end

        API -->|"Solicitudes de autenticación"| AUTH
        API -->|"Solicitudes de productos"| PROD
        API -->|"Solicitudes de lotes"| LOT
        API -->|"Operaciones de inventario"| INV

        PERSIST["Capa de persistencia"]

        AUTH -->|"Acceso a datos de
autenticación"| PERSIST
        PROD -->|"Acceso a datos de
productos"| PERSIST
        LOT -->|"Acceso a datos de
lotes"| PERSIST
        INV -->|"Acceso a datos de
inventario"| PERSIST
    end

    DB[("PostgreSQL")]

    R -->|"Interacción mediante
la interfaz"| FE
    A -->|"Interacción mediante
la interfaz"| FE

    PERSIST -->|"Consultas y operaciones
de datos"| DB


```


#### Responsabilidades y capacidades

| Componente | Responsabilidad principal | Requisitos / casos de uso que soporta | Capacidades proporcionadas | Capacidades requeridas | Dependencias principales |
|---|---|---|---|---|---|
| Frontend (aplicación web) | Proporcionar la interfaz de interacción entre los usuarios y el sistema. | RF-02, RF-03; CU-02, CU-03. | Presentar el inicio de sesión y permitir a ambos roles registrar productos, entradas y salidas del inventario, reflejando los cambios y mostrando confirmaciones. El regente también puede bloquear lotes. El sistema informa sobre bloqueos temporales por intentos fallidos de autenticación. | Servicios de autenticación y operaciones de inventario mediante la API. | Controlador de API. |
| Controlador de API | Recibir las solicitudes del frontend y dirigirlas al módulo correspondiente. | RF-02, RF-03; CU-02, CU-03. | Gestionar las solicitudes de autenticación, bloqueo de lotes, productos e inventario. | Operaciones ofrecidas por los módulos. | Módulo de autenticación y autorización, módulo de productos, módulo de lotes y módulo de control de inventario. |
| Módulo de autenticación y autorización | Validar las credenciales, controlar los intentos fallidos y aplicar las restricciones de acceso. | RF-03; CU-03. | Validar credenciales, controlar los intentos consecutivos fallidos y bloquear temporalmente el acceso durante cinco minutos después de cinco intentos fallidos consecutivos. | Consultar la base de datos para validar las credenciales y consultar o actualizar la cantidad de intentos fallidos y la fecha y hora hasta la que se bloquea el acceso. | Capa de persistencia. |
| Módulo de productos | Gestionar el registro y la consulta de los productos del sistema. | RF-02; CU-02. | Registrar nuevos productos y consultar la información de los productos existentes. | Guardar y consultar los datos de los productos mediante la capa de persistencia y solicitar al módulo de lotes la asociación de los lotes correspondientes. | Capa de persistencia y módulo de lotes. |
| Módulo de lotes | Gestionar la información y el estado de los lotes de productos farmacéuticos. | RF-02; CU-02. | Consultar los lotes y registrar el estado de bloqueo de un lote. | Acceso a los datos de los lotes y actualización de su estado. | Capa de persistencia. |
| Módulo de control de inventario | Gestionar las entradas y salidas de productos del inventario. | RF-02; CU-02. | Registrar entradas y salidas de productos, actualizar las existencias disponibles y verificar que los lotes bloqueados no se registren como disponibles para salida. | Consulta del estado de los lotes y acceso a los datos de inventario. | Módulo de lotes y capa de persistencia. |
| Capa de persistencia | Facilitar a los módulos del sistema el acceso a la base de datos para consultar, guardar y actualizar información. | Soporte a RF-02 y RF-03. | Consultar y almacenar información de productos, lotes, inventario y los datos necesarios para gestionar la autenticación y los bloqueos temporales. | Una base de datos que permita guardar, consultar y actualizar la información del sistema. | PostgreSQL. |
| PostgreSQL | Almacenar de forma persistente la información del sistema. | Soporte a RF-02 y RF-03. | Conservar y recuperar los datos solicitados por la capa de persistencia. | Consultas y operaciones de lectura y escritura. | Capa de persistencia. |

*Verificaciones del diseño:*

- Cada componente tiene una responsabilidad identificable y relacionada con el funcionamiento del sistema.
- El módulo de autenticación y autorización controla los intentos fallidos desde el backend, sin depender exclusivamente del navegador.
- El contador de intentos fallidos consecutivos debe reiniciarse después de una autenticación exitosa.
- El módulo de lotes administra el estado de bloqueo, mientras que el módulo de control de inventario verifica dicho estado e impide registrar como disponibles para salida las unidades pertenecientes a lotes bloqueados.
- La capa de persistencia separa el acceso a los datos de la lógica de los módulos funcionales.
- Los módulos se comunican a través del controlador de API y la capa de persistencia según las responsabilidades definidas en la arquitectura.
- La estrategia concreta para conservar el estado de los intentos fallidos y la duración del bloqueo ante un reinicio del servidor deberá definirse en el diseño detallado.

---

## 3. Detailed Design

### 3.1 Componentes seleccionados

| Componente | Justificación de la selección (riesgo, complejidad, importancia para los objetivos de diseño) |
|---|---|
| **Módulo de autenticación y autorización** | Se selecciona porque verifica la identidad de los usuarios y controla sus permisos según su rol. Debe gestionar el bloqueo temporal de cinco minutos después de cinco intentos consecutivos fallidos. Un error podría permitir accesos no autorizados o bloquear usuarios legítimos. |
| **Módulo de lotes** | Se selecciona porque administra los lotes y sus estados. Es fundamental para garantizar que los lotes bloqueados no puedan utilizarse para registrar salidas de inventario. Un error podría permitir movimientos no autorizados. |
| **Módulo de control de inventario** | Se selecciona porque gestiona las entradas, las salidas y los movimientos de inventario. Debe validar la cantidad disponible y comprobar que el lote no esté bloqueado antes de registrar una salida, evitando inconsistencias en las cantidades. |
| **Capa de persistencia** | Se selecciona porque permite almacenar y recuperar los datos mediante repositorios especializados y PostgreSQL. Es esencial para conservar la información de productos, lotes, movimientos, usuarios y estados de autenticación, evitando pérdidas e inconsistencias. |

### 3.2 Diagrama de clases

![Diagrama de clases del sistema de inventario farmacéutico](diagrama-clases.png)

### 3.3 Responsabilidades de las clases

| Clase | Componente al que pertenece | Responsabilidad | Colaboradores principales |
|---|---|---|---|
| `ServicioAutenticacion` | Módulo de autenticación y autorización | Autenticar usuarios, verificar permisos y gestionar el proceso de acceso. | `UsuarioRepository`, `RepositorioEstadoAutenticacion`, `Usuario`, `EstadoAutenticacion`, `ResultadoAutenticacion` |
| `Usuario` | Módulo de autenticación y autorización | Representar al usuario, verificar sus credenciales y consultar sus permisos. | `Rol`, `ServicioAutenticacion` |
| `Rol` | Módulo de autenticación y autorización | Agrupar los permisos asignados a un rol. | `Permiso`, `Usuario` |
| `Permiso` | Módulo de autenticación y autorización | Representar una autorización específica dentro del sistema. | `Rol` |
| `EstadoAutenticacion` | Módulo de autenticación y autorización | Registrar los intentos fallidos y determinar si el acceso está temporalmente bloqueado. | `ServicioAutenticacion`, `RepositorioEstadoAutenticacion` |
| `ResultadoAutenticacion` | Módulo de autenticación y autorización | Representar el resultado de un intento de autenticación. | `ServicioAutenticacion`, `Usuario` |
| `ServicioProducto` | Módulo de productos | Registrar y consultar productos farmacéuticos. | `ProductoRepository`, `ServicioAutenticacion`, `Producto` |
| `Producto` | Módulo de productos | Representar los datos principales de un producto farmacéutico. | `Lote`, `ServicioProducto` |
| `ServicioLote` | Módulo de lotes | Consultar lotes y gestionar el bloqueo de un lote, verificando los permisos correspondientes. | `LoteRepository`, `ServicioAutenticacion`, `Lote` |
| `Lote` | Módulo de lotes | Representar un lote, su cantidad disponible, estado y condiciones para permitir una salida. | `Producto`, `Usuario`, `EstadoLote`, `ServicioLote`, `ServicioInventario` |
| `EstadoLote` | Módulo de lotes | Definir los estados posibles de un lote: disponible o bloqueado. | `Lote` |
| `ServicioInventario` | Módulo de control de inventario | Registrar entradas y salidas, validar las condiciones del lote y generar los movimientos correspondientes. | `LoteRepository`, `ServicioLote`, `RepositorioMovimiento`, `ServicioAutenticacion`, `MovimientoInventario` |
| `MovimientoInventario` | Módulo de control de inventario | Representar cada movimiento registrado, incluyendo tipo, cantidad, fecha y observación. | `Lote`, `Usuario`, `TipoMovimiento` |
| `TipoMovimiento` | Módulo de control de inventario | Definir los tipos de movimiento contemplados en el diseño. | `MovimientoInventario` |
| `ProductoRepository` | Capa de persistencia | Definir las operaciones para guardar y consultar productos. | `Producto`, `ServicioProducto` |
| `LoteRepository` | Capa de persistencia | Definir las operaciones para buscar y guardar lotes. | `Lote`, `ServicioLote`, `ServicioInventario` |
| `RepositorioMovimiento` | Capa de persistencia | Definir la operación para guardar movimientos de inventario. | `MovimientoInventario`, `ServicioInventario` |
| `UsuarioRepository` | Capa de persistencia | Definir la operación para buscar usuarios por nombre de usuario. | `Usuario`, `ServicioAutenticacion` |
| `RepositorioEstadoAutenticacion` | Capa de persistencia | Definir las operaciones para consultar y guardar el estado de autenticación de un usuario. | `EstadoAutenticacion`, `ServicioAutenticacion` |


### 3.4 Comportamiento de una operación clave

**Operación seleccionada:** `registrarSalida(loteId, cantidad, usuario)`

**Descripción:** Registra una salida de inventario cuando el usuario tiene permiso, el lote no está bloqueado y existe una cantidad suficiente.

**Pseudocódigo:**

```text
función registrarSalida(loteId, cantidad, usuario):
    si no autorizar(usuario, "REGISTRAR_SALIDA"):
        retornar error("Usuario sin permisos")
    si cantidad <= 0:
        retornar error("Cantidad inválida")
    lote = consultarLote(loteId)
    si lote no existe:
        retornar error("Lote no encontrado")
    si lote.estaBloqueado():
        retornar error("El lote está bloqueado")
    si lote.cantidadDisponible < cantidad:
        retornar error("Cantidad insuficiente")
    iniciar transacción
    descontar cantidad del lote
    guardar cambios del lote
    movimiento = crear movimiento SALIDA
    guardar movimiento en el repositorio
    confirmar transacción
    retornar movimiento
```

**Resultado esperado:** Si las validaciones se cumplen, se registra el movimiento de salida y se actualiza la cantidad disponible. Si alguna validación falla, se devuelve un error y no se registra la salida.

---

## 4. Calidad del diseño — Cohesión, acoplamiento y ocultamiento de información

| Pregunta | Respuesta, con evidencia del diseño |
|---|---|
| **Cohesión:** ¿Las responsabilidades dentro de cada clase o componente están relacionadas entre sí? | Sí. Las responsabilidades están separadas por propósito: `ServicioAutenticacion` gestiona la autenticación y los permisos, `ServicioLote` administra los lotes y sus bloqueos, y `ServicioInventario` registra las entradas y salidas. Esta separación facilita comprender y mantener cada componente. |
| **Acoplamiento:** ¿Hasta qué punto se propagan los cambios de un elemento? ¿Dónde están las dependencias más fuertes? | Los servicios dependen de interfaces de repositorio para acceder a los datos, lo que reduce su dependencia de la implementación de la base de datos. Sin embargo, `ServicioInventario` depende de varios elementos, como `ServicioLote`, los repositorios y `ServicioAutenticacion`, por lo que sus cambios pueden afectar varias colaboraciones. |
| **Ocultamiento de información:** ¿Qué elementos se mantuvieron privados o internos y por qué? | Los atributos de las entidades, como `cantidadDisponible` en `Lote` y `credencialHash` en `Usuario`, se definen como privados. Así se evita su modificación directa desde otras clases y se centraliza el acceso mediante operaciones que protegen las reglas del sistema. |

**Hallazgo real del diseño y qué se cambió o se cambiaría:**

Se identificó que registrar una salida requiere validar el estado del lote, comprobar la cantidad disponible y guardar el movimiento. Si estas acciones se ejecutan por separado, podrían producirse inconsistencias en el inventario. Para evitarlo, se establece que la actualización de la cantidad y el registro del movimiento deben realizarse en una misma transacción, revirtiendo los cambios si ocurre un error.

---

## 5. Design Decisions & Decision Record

Two decisions are required: one architectural (Class 11 level) and one detailed-design (Class 12 level). Avoid "it is best practice", "it scales" or "it is cleaner" without project evidence.

### Decision A — Architectural

| | |
|---|---|
| **Context** (requirement, constraint or problem that motivated it) | |
| **Decision** | |
| **Rationale** (why it is reasonable here) | |
| **Trade-off accepted** | |

### Decision B — Detailed design

| | |
|---|---|
| **Context** | |
| **Decision** | |
| **Rationale** | |
| **Trade-off accepted** | |

### ADR

At least one of the two decisions above must also be recorded as an ADR (use `Plantilla_ADR_Nygard`) in `docs/decisions/`.

**ADR file:** `docs/decisions/ADR-XXX-title.md` — records Decision [A / B].

---

## 6. Traceability

| Requirement ID | Use Case | Component(s) | Class(es) |
|---|---|---|---|
| | | | |

*(Every requirement in Section 1 must appear. Every component and class should appear at least once. If an element traces to nothing, ask why it exists.)*

---

## 7. Optional — AI-Assisted Design Reflection

> One design recommendation generated by AI that the team accepted, modified or rejected, and why.

---

## 8. Consistency Checklist

- [ ] Every component in the diagram appears in the responsibilities table, and the other way around.
- [ ] Every class belongs to an identifiable component.
- [ ] Components are named by responsibility, not technology.
- [ ] Nothing inside the system boundary is something you do not control.
- [ ] Provided and required capabilities match across components (what one requires, another provides).
- [ ] Both decisions name a real cost or limitation, and at least one has an ADR.
- [ ] The traceability table has no empty rows and no orphan components or classes.
- [ ] Diagrams render correctly on GitHub (or the exported images are embedded).
