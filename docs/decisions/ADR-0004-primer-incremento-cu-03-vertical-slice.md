# ADR-0004: Primer incremento de CU-03 mediante Vertical Slice

**Autores:**

- Junior Andrés Arrieta Tabaco
- Kevin Alexis Bermúdez Caicedo
- Edgar Mauricio Montufar Molano
- Antonio José Moreno López

**Fecha:** 2026-11-05

## Estado

**Aceptado**

## Contexto

El proyecto cuenta con requisitos, diagramas de clases y secuencia, modelo de datos y contratos de interfaz. Todavía no se ha incorporado al repositorio una implementación ejecutable de la aplicación, por lo que necesitamos definir cómo comenzar su construcción.

Seleccionamos **CU-03**, correspondiente al bloqueo temporal del acceso después de cinco intentos fallidos consecutivos. Este comportamiento está definido en **RF-03** y permite trabajar con las tres capas del sistema: presentación, lógica de negocio y acceso a datos.

El diagrama de secuencia parte de un usuario registrado y activo que ya tiene cuatro fallos guardados. El siguiente intento incorrecto activa un bloqueo de cinco minutos. Durante ese periodo, el sistema debe rechazar nuevos intentos de autenticación.

El **ADR-0002** establece React para el frontend, Node.js con Express para el backend y PostgreSQL como base de datos. El diseño también incorpora la persistencia de los intentos fallidos y la fecha de finalización del bloqueo, documentada en el **ADR-0003**.

## Decisión

Decidimos construir el primer incremento de CU-03 mediante **Vertical Slice**. Implementaremos una parte pequeña del caso de uso que funcione desde la interacción del usuario hasta el almacenamiento y la respuesta en pantalla.

El primer incremento cubrirá el quinto intento fallido, la aplicación del bloqueo y la comprobación de su vigencia. Para probarlo, prepararemos una cuenta registrada y activa con cuatro fallos previos almacenados.

El recorrido será el siguiente:

1. El usuario ingresa su nombre de usuario y contraseña en el formulario.
2. El frontend envía la solicitud a la API.
3. ServicioAutenticacion recupera al usuario y su estado mediante los repositorios.
4. Comprueba que no exista un bloqueo vigente y solicita verificar la contraseña.
5. Si la contraseña es incorrecta, EstadoAutenticacion aumenta el contador de cuatro a cinco y establece el bloqueo por cinco minutos.
6. El servicio guarda el estado en PostgreSQL y devuelve el resultado.
7. El frontend muestra el mensaje de bloqueo.

Si el usuario vuelve a intentarlo durante el bloqueo, el backend rechazará la solicitud sin verificar nuevamente la contraseña, aumentar el contador ni extender el tiempo. Cuando se alcance la fecha de finalización, permitirá evaluar otro intento, conforme a las reglas del diseño.

Decidimos mantener las responsabilidades y los contratos existentes. El frontend recogerá los datos y mostrará los mensajes; el backend controlará la autenticación y el bloqueo; los repositorios realizarán las consultas y escrituras en PostgreSQL.

La autenticación exitosa y los demás escenarios se completarán en incrementos posteriores. Este primer incremento no representa la implementación completa de CU-03.

**Consideraremos terminado el incremento cuando podamos comprobar que:**

- Una contraseña incorrecta, con cuatro fallos previos, registra el quinto fallo y activa el bloqueo de cinco minutos.
- Un intento durante el bloqueo es rechazado.
- Al finalizar el periodo, puede evaluarse un nuevo intento.
- El contador y la fecha de bloqueo se conservan después de reiniciar el backend.
- Si falla una consulta o un guardado necesario, se informa el error y no se concede acceso.


## Convenciones a utilizar

- **Código (variables, parámetros, funciones y métodos):** utilizaremos `camelCase`, comenzando con minúscula y escribiendo con mayúscula la primera letra de cada palabra siguiente. Ejemplos: `nombreUsuario`, `intentosFallidos` y `registrarFallo()`.

- **Carpetas:** utilizaremos `kebab-case`, escribiendo los nombres en minúsculas y separando las palabras con guiones. Ejemplos: `datos-prueba` y `control-acceso`. Los nombres de una sola palabra, como `src`, `docs` y `autenticacion`, se escribirán en minúsculas. Conservaremos las rutas de documentación indicadas por el profesor.

- **Archivos de código:** utilizaremos `camelCase` y la extensión correspondiente. Ejemplos: `servicioAutenticacion.js` y `formularioLogin.jsx`. Conservaremos nombres especiales como `package.json`, `README.md` y `.gitignore`. Los documentos académicos seguirán los nombres establecidos para sus entregas.

- **Base de datos:** utilizaremos `snake_case` para los nombres de las tablas y columnas de PostgreSQL, escribiendo en minúsculas y separando las palabras con guiones bajos. Ejemplos: `estado_autenticacion`, `intentos_fallidos` y `bloqueado_hasta`. Los repositorios realizarán la correspondencia entre estos nombres y los utilizados en JavaScript.

- **Constantes:** utilizaremos mayúsculas y guiones bajos (`UPPER_SNAKE_CASE`) para los valores fijos definidos como constantes del sistema. Ejemplos: `MAX_INTENTOS_FALLIDOS` y `DURACION_BLOQUEO_MINUTOS`. Esta convención no se aplicará automáticamente a toda variable declarada con `const`.

- **Clases y componentes de React:** utilizaremos `PascalCase`, comenzando cada palabra con mayúscula. Ejemplos: `ServicioAutenticacion`, `EstadoAutenticacion` y `FormularioLogin`. Sus archivos mantendrán la convención `camelCase`, como `servicioAutenticacion.js` y `formularioLogin.jsx`.

### Estructura de carpetas

Mantendremos la documentación existente en `docs/` y añadiremos las carpetas del frontend, el backend y la base de datos en la raíz del repositorio `Ingesoft_t6`.

Dentro del código agruparemos los archivos relacionados con una misma funcionalidad. Comenzaremos con autenticación para implementar el primer incremento de CU-03.

#### Documentación existente

| Carpeta o archivo | Contenido |
|---|---|
| `docs/` | Documentación del proyecto. |
| `docs/decisions/` | Registros de decisiones de arquitectura, incluidos los ADR-0001 a ADR-0004. |
| `docs/design/` | Documentos de diseño arquitectónico, detallado, de interacción y de datos. |
| `docs/design/diagrams/` | Imágenes de los diagramas utilizados en los documentos de diseño. |
| `docs/req/` | Documentos existentes de RF-01, RF-02 y RF-03. |
| `docs/requirements/` | Documentación existente de requisitos, incluido `REQ-RF-03.md`. |
| `rfc_template.md` | Plantilla existente para propuestas de cambios. |
| `README.md` | Presentación del proyecto e instrucciones para instalarlo, configurarlo y ejecutarlo. |

Conservaremos `docs/req/` y `docs/requirements/` mientras revisamos su contenido y las referencias que reciben. Antes de unificar documentos, comprobaremos qué información aporta cada uno y actualizaremos los enlaces correspondientes.

#### Backend — Node.js y Express

| Carpeta o archivo | Contenido |
|---|---|
| `backend/` | Aplicación del servidor. |
| `backend/package.json` | Dependencias y comandos para ejecutar y probar el backend. |
| `backend/src/app.js` | Configuración de Express y registro de las rutas. |
| `backend/src/server.js` | Inicio del servidor HTTP. |
| `backend/src/config/` | Lectura de la configuración y conexión con PostgreSQL. |
| `backend/src/autenticacion/` | Rutas, controlador, servicio, entidades y repositorios necesarios para CU-03. |
| `backend/tests/unit/` | Pruebas de las reglas de bloqueo, como el contador de fallos y la fecha de finalización. |
| `backend/tests/integration/` | Pruebas de la API y de la persistencia en PostgreSQL. |

En `backend/src/autenticacion/` ubicaremos archivos como `rutasAutenticacion.js`, `controladorAutenticacion.js`, `servicioAutenticacion.js`, `usuario.js`, `estadoAutenticacion.js`, `repositorioUsuario.js` y `repositorioEstadoAutenticacion.js`.

Esta agrupación mantendrá las responsabilidades del diseño: el controlador atenderá las solicitudes HTTP, el servicio coordinará el caso de uso, las entidades aplicarán sus reglas y los repositorios consultarán y guardarán los datos.

#### Frontend — React

| Carpeta o archivo | Contenido |
|---|---|
| `frontend/` | Aplicación web desarrollada con React. |
| `frontend/package.json` | Dependencias y comandos para ejecutar y probar el frontend. |
| `frontend/src/` | Código fuente de la interfaz. |
| `frontend/src/autenticacion/` | Formulario de inicio de sesión, mensajes de bloqueo y comunicación con la API de autenticación. |
| `frontend/src/shared/` | Componentes y recursos que utilicen varias funcionalidades, cuando sean necesarios. |
| `frontend/tests/` | Pruebas del formulario y de los mensajes mostrados al usuario. |

En `frontend/src/autenticacion/` ubicaremos archivos como `formularioLogin.jsx` y `apiAutenticacion.js`.

El frontend recogerá los datos y mostrará la respuesta del servidor. La decisión de bloquear el acceso y el control de su duración permanecerán en el backend.

#### Base de datos y pruebas completas

| Carpeta o archivo | Contenido |
|---|---|
| `database/migrations/` | Scripts SQL ordenados para crear y modificar la estructura de PostgreSQL. |
| `database/datos-prueba/` | Scripts para preparar los datos de prueba, incluida la cuenta activa con cuatro fallos previos. |
| `tests/e2e/` | Pruebas del recorrido completo, desde el formulario hasta la respuesta del backend y la persistencia. |
| `.gitignore` | Reglas para excluir archivos locales, dependencias instaladas y credenciales del repositorio. |
| `backend/.env.example` | Ejemplo de las variables de configuración del backend, sin credenciales reales. |
| `frontend/.env.example` | Ejemplo de la configuración pública del frontend, como la dirección de la API. |

### Aplicación de la estructura

Esta organización se aplicará a los archivos reales del proyecto y será visible en GitHub. Cada aplicación tendrá su propio `package.json`.

Crearemos las carpetas conforme incorporamos su contenido. El primer incremento incluirá únicamente los elementos necesarios para implementar y comprobar el comportamiento acordado de CU-03.

Mantendremos separadas las pruebas del backend, las del frontend y las del recorrido completo. Las nuevas funcionalidades se incorporarán en sus propias carpetas cuando comience su implementación.


## Alternativas consideradas

### Alternativa 1 — Walking Skeleton

Consiste en construir una versión mínima ejecutable para comprobar la comunicación entre los componentes. Por ejemplo, conectar el formulario con la API y el servicio, utilizando una respuesta fija de prueba.

Esta opción permitiría detectar problemas de configuración e integración antes de desarrollar las reglas de autenticación. Sin embargo, esa primera versión todavía no demostraría que el quinto fallo activa un bloqueo real.

Decidimos no elegirla como objetivo del primer incremento porque buscamos comprobar el comportamiento de bloqueo definido en RF-03.

### Alternativa 2 — Vertical Slice

Permite implementar y comprobar un comportamiento concreto atravesando las capas necesarias del sistema.

Decidimos utilizar esta alternativa porque CU-03 ya tiene un flujo delimitado, responsabilidades identificadas y contratos definidos. Queremos utilizar ese diseño para comprobar el bloqueo real desde el primer incremento.

La preparación del entorno y las comprobaciones de conexión seguirán siendo necesarias como parte de la construcción.

## Consecuencias

### Positivas

- Obtendremos un comportamiento real que podremos demostrar y probar.
- Comprobaremos desde el inicio la integración entre React, Express y PostgreSQL.
- Podremos detectar diferencias entre el diseño y la implementación mientras el alcance todavía es pequeño.
- El formulario, el servicio y los repositorios servirán como base para completar los demás escenarios de CU-03.

### Negativas

- El primer incremento requerirá más trabajo que una conexión con respuestas simuladas.
- Necesitaremos preparar desde el comienzo la base de datos, la cuenta de prueba y la verificación de contraseñas.
- Las pruebas deberán revisar tanto las reglas del bloqueo como la comunicación entre las capas y la persistencia.
- Tendremos que mantener el alcance acordado para evitar que el primer incremento termine incluyendo todo el módulo de autenticación.
