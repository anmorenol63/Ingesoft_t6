ADR-0004: Primer incremento de CU-03 mediante Vertical Slice

Autores:
- Junior Andrés Arrieta Tabaco
- Edgar Mauricio Montufar Molano
- Kevin Alexis Bermúdez Caicedo
- Antonio José Moreno López
Fecha: 2026-11-05
Estado
Aceptado
Contexto

El proyecto cuenta con requisitos, diagramas de clases y secuencia, modelo de datos y contratos de interfaz. Todavía no se ha incorporado al repositorio una implementación ejecutable de la aplicación, por lo que necesitamos definir cómo comenzar su construcción.

Seleccionamos CU-03, correspondiente al bloqueo temporal del acceso después de cinco intentos fallidos consecutivos. Este comportamiento está definido en RF-03 y permite trabajar con las tres capas del sistema: presentación, lógica de negocio y acceso a datos.

El diagrama de secuencia parte de un usuario registrado y activo que ya tiene cuatro fallos guardados. El siguiente intento incorrecto activa un bloqueo de cinco minutos. Durante ese periodo, el sistema debe rechazar nuevos intentos de autenticación.

El ADR-0002 establece React para el frontend, Node.js con Express para el backend y PostgreSQL como base de datos. El diseño también incorpora la persistencia de los intentos fallidos y la fecha de finalización del bloqueo, documentada en el ADR-0003.
Decisión
Decidimos construir el primer incremento de CU-03 mediante Vertical Slice. Implementaremos una parte pequeña del caso de uso que funcione desde la interacción del usuario hasta el almacenamiento y la respuesta en pantalla.

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

Consideraremos terminado el incremento cuando podamos comprobar que:
- Una contraseña incorrecta, con cuatro fallos previos, registra el quinto fallo y activa el bloqueo de cinco minutos.
- Un intento durante el bloqueo es rechazado.
- Al finalizar el periodo, puede evaluarse un nuevo intento.
- El contador y la fecha de bloqueo se conservan después de reiniciar el backend.
- Si falla una consulta o un guardado necesario, se informa el error y no se concede acceso.
Alternativas consideradas
Walking Skeleton
Consiste en construir una versión mínima ejecutable para comprobar la comunicación entre los componentes. Por ejemplo, conectar el formulario con la API y el servicio, utilizando una respuesta fija de prueba.

Esta opción permitiría detectar problemas de configuración e integración antes de desarrollar las reglas de autenticación. Sin embargo, esa primera versión todavía no demostraría que el quinto fallo activa un bloqueo real.

Decidimos no elegirla como objetivo del primer incremento porque buscamos comprobar el comportamiento de bloqueo definido en RF-03.
Vertical Slice
Permite implementar y comprobar un comportamiento concreto atravesando las capas necesarias del sistema.

Decidimos utilizar esta alternativa porque CU-03 ya tiene un flujo delimitado, responsabilidades identificadas y contratos definidos. Queremos utilizar ese diseño para comprobar el bloqueo real desde el primer incremento.

La preparación del entorno y las comprobaciones de conexión seguirán siendo necesarias como parte de la construcción.
Consecuencias
Positivas
- Obtendremos un comportamiento real que podremos demostrar y probar.
- Comprobaremos desde el inicio la integración entre React, Express y PostgreSQL.
- Podremos detectar diferencias entre el diseño y la implementación mientras el alcance todavía es pequeño.
- El formulario, el servicio y los repositorios servirán como base para completar los demás escenarios de CU-03.
Negativas
- El primer incremento requerirá más trabajo que una conexión con respuestas simuladas.
- Necesitaremos preparar desde el comienzo la base de datos, la cuenta de prueba y la verificación de contraseñas.
- Las pruebas deberán revisar tanto las reglas del bloqueo como la comunicación entre las capas y la persistencia.
- Tendremos que mantener el alcance acordado para evitar que el primer incremento termine incluyendo todo el módulo de autenticación.
