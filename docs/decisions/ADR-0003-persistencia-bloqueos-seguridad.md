# ADR-0003: Guardar los bloqueos de seguridad en la base de datos

Autores:

- Junior Andrés Arrieta Tabaco
- Edgar Mauricio Montufar Molano
- Kevin Alexis Bermúdez Caicedo
- Antonio José Moreno López

## Estado

Propuesto

## Contexto

El sistema debe bloquear el inicio de sesión durante 5 minutos después de 5 intentos fallidos consecutivos, según el requisito RF-03. Además, cuando el usuario inicia sesión correctamente, el contador de intentos fallidos debe reiniciarse.

Si esta información se guarda únicamente en la memoria del servidor, podría perderse cuando el servidor se reinicie. Esto permitiría que un usuario bloqueado volviera a intentar iniciar sesión antes de que terminara el tiempo de bloqueo.

Por esta razón, es necesario definir una forma de guardar los intentos fallidos y el tiempo de bloqueo para que la información se conserve.

## Decisión

Guardar en PostgreSQL los intentos fallidos y la fecha y hora hasta la que el usuario permanece bloqueado.

Para ello, se utilizarán `RepositorioEstadoAutenticacion` y `EstadoAutenticacion`, incluidos en el modelo de clases.

El sistema también deberá reiniciar el contador cuando la autenticación sea exitosa y comprobar si el usuario continúa bloqueado antes de permitir otro intento.

## Alternativas consideradas

- **Guardar los intentos en la memoria del servidor:** es una opción sencilla, pero la información podría perderse al reiniciar el servidor.
- **Guardar los intentos en PostgreSQL:** permite conservar la información aunque el servidor se reinicie. Esta es la opción seleccionada porque ayuda a mantener el bloqueo de seguridad.

## Consecuencias

**Positivas:**

- Los intentos fallidos y el tiempo de bloqueo se conservan aunque el servidor se reinicie.
- El sistema puede comprobar si un usuario todavía está bloqueado antes de permitirle iniciar sesión.
- Se mantiene el control de los intentos fallidos en el backend.

**Negativas:**

- Será necesario consultar y actualizar la base de datos durante la autenticación.
- Estas consultas añaden trabajo al sistema y pueden afectar el tiempo de respuesta.
- Si PostgreSQL no está disponible, el sistema deberá manejar el error sin permitir que se omita el control de seguridad.

