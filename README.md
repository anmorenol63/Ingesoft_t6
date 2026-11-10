# Sistema de gestión de inventario farmacéutico

Proyecto desarrollado para la asignatura **Ingeniería de Software I** de la **Universidad Nacional de Colombia, sede Bogotá**.

El sistema busca facilitar el control del inventario de productos farmacéuticos mediante el seguimiento de productos, lotes, existencias y fechas de vencimiento.


## Alcance

Las funcionalidades previstas son:

- **Gestión de productos y lotes:** registrar y consultar los productos y sus lotes.
- **Entradas y salidas:** registrar movimientos del inventario y actualizar las cantidades disponibles.
- **Control de vencimientos:** identificar lotes vencidos y próximos a vencer.
- **Alertas de existencias:** identificar productos con cantidades inferiores al mínimo establecido.
- **Bloqueo de lotes:** impedir la salida de unidades de un lote bloqueado.
- **Control de acceso:** autenticar usuarios y aplicar un bloqueo temporal después de cinco intentos fallidos consecutivos.

El proyecto se limita al control del inventario. No incluye ventas, compras, gestión de proveedores, facturación ni contabilidad.


## Tecnologías

| Área | Tecnología |
|---|---|
| Frontend | React |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL |
| Control de versiones | Git |
| Repositorio y colaboración | GitHub |


## Estado del proyecto

El repositorio contiene la documentación de requisitos, diseño y decisiones de arquitectura.

El siguiente paso es construir el primer incremento de **CU-03**, correspondiente al bloqueo temporal del acceso. Decidimos desarrollarlo mediante **Vertical Slice**, implementando un comportamiento que conecte la interfaz, la lógica del backend y la base de datos.

Este incremento permitirá comprobar que:

- El quinto intento fallido consecutivo activa un bloqueo de cinco minutos.
- Durante el bloqueo se rechazan nuevos intentos sin extender su duración.
- Al finalizar el periodo de bloqueo se puede evaluar un nuevo intento.
- El contador de fallos y la fecha de finalización del bloqueo permanecen almacenados en PostgreSQL.


## Organización del repositorio


### Documentación actual

| Ruta | Contenido |
|---|---|
| `docs/decisions/` | Registros de decisiones de arquitectura (ADR). |
| `docs/design/` | Diseño arquitectónico, detallado, de interacción y de datos. |
| `docs/design/diagrams/` | Imágenes de los diagramas del sistema. |
| `docs/req/` | Documentos de requisitos funcionales. |
| `docs/requirements/` | Documentación adicional de requisitos y casos de uso. |
| `rfc_template.md` | Plantilla para propuestas de cambios. |


### Estructura prevista para la implementación

Estas carpetas se incorporarán conforme avance la construcción:

| Ruta | Contenido |
|---|---|
| `frontend/src/` | Interfaz de usuario desarrollada con React. |
| `backend/src/` | API, lógica de negocio y acceso a los datos. |
| `database/` | Scripts de PostgreSQL y datos de prueba. |
| `tests/` | Pruebas del comportamiento del sistema. |


## Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Variables, parámetros, funciones y métodos | `camelCase` | `registrarFallo` |
| Carpetas | `kebab-case` | `datos-prueba` |
| Archivos de código | `camelCase` | `servicioAutenticacion.js` |
| Clases y componentes de React | `PascalCase` | `FormularioLogin` |
| Tablas y columnas | `snake_case` | `intentos_fallidos` |
| Constantes del sistema | `UPPER_SNAKE_CASE` | `MAX_INTENTOS_FALLIDOS` |

Los documentos académicos conservarán los nombres establecidos para sus entregas. También se respetarán los nombres especiales de las herramientas, como `package.json` y `README.md`.


## Instalación y ejecución

Las instrucciones de instalación, configuración de PostgreSQL y ejecución se añadirán cuando esté disponible el primer incremento ejecutable.


## Integrantes

- Junior Andrés Arrieta Tabaco
- Kevin Alexis Bermúdez Caicedo
- Edgar Mauricio Montufar Molano
- Antonio José Moreno López


## Uso académico

Este proyecto se desarrolla con fines educativos como parte de la asignatura Ingeniería de Software I. Su propósito es aplicar los conocimientos de requisitos, diseño, construcción y pruebas de software.

Esta declaración describe la finalidad académica del proyecto y no constituye una licencia de software.
