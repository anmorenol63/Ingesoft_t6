# RNF-01. Bloquear acceso tras intentos fallidos

## 1. Requisito no funcional

**Código:** RNF-01  
**Nombre:** Bloquear acceso tras intentos fallidos

### Descripción

El sistema debe bloquear temporalmente el acceso de un usuario durante 5 minutos después de cinco intentos consecutivos de autenticación fallidos.

---

## 2. Historia de usuario

### HU-04. Bloquear acceso tras intentos fallidos — Usuario

**Quién:** Usuario del sistema  
**Qué:** Bloquear temporalmente el acceso después de cinco intentos consecutivos de autenticación fallidos.  
**Por qué:** Proteger el acceso al sistema ante múltiples intentos consecutivos de autenticación fallidos.

### Historia de usuario

Como usuario del sistema, quiero que mi acceso sea bloqueado temporalmente después de cinco intentos consecutivos de autenticación fallidos, para proteger el acceso a mi cuenta ante múltiples intentos fallidos.

---

## 3. Criterios de aceptación

### CA-01. Bloqueo después de cinco intentos fallidos

Dado que un usuario intenta autenticarse en el sistema, cuando alcanza cinco intentos consecutivos de autenticación fallidos, entonces el sistema deberá bloquear temporalmente su acceso.

### CA-02. Duración del bloqueo

Dado que el acceso de un usuario se encuentra bloqueado después de cinco intentos consecutivos de autenticación fallidos, cuando transcurren 5 minutos desde el bloqueo, entonces el sistema deberá finalizar el período de bloqueo temporal.

### CA-03. Impedimento de acceso durante el bloqueo

Dado que el acceso de un usuario se encuentra bloqueado, cuando el usuario intenta autenticarse durante el período de bloqueo, entonces el sistema deberá impedir temporalmente el acceso.

### CA-04. Bloqueo por intentos consecutivos

Dado que un usuario realiza intentos de autenticación, cuando se producen cinco intentos consecutivos de autenticación fallidos, entonces el sistema deberá aplicar el bloqueo temporal establecido.

---

## 4. Caso de uso

### CU-03. Bloquear acceso tras intentos fallidos

#### 4.1 Actor

El actor que participa en este caso de uso es:

**Usuario del sistema**

El usuario intenta autenticarse en el sistema mediante sus credenciales de acceso.

#### 4.2 Sistema

**Sistema de gestión y control de inventario para productos farmacéuticos.**

El sistema es responsable de verificar los intentos de autenticación y aplicar un bloqueo temporal de 5 minutos cuando se alcanzan cinco intentos consecutivos de autenticación fallidos.

#### 4.3 Objetivo

Proteger el acceso al sistema mediante el bloqueo temporal del acceso de un usuario después de cinco intentos consecutivos de autenticación fallidos.

---

## 5. Caso contemplado respecto al caso de uso

### Caso contemplado: Bloqueo exitoso después de cinco intentos fallidos

#### Precondiciones

Antes de ejecutar el caso de uso:

- El usuario debe encontrarse registrado en el sistema.
- El usuario debe encontrarse en el proceso de autenticación.
- El usuario debe realizar intentos de autenticación utilizando credenciales incorrectas.

#### Flujo principal

| Paso | Actor | Sistema |
|---|---|---|
| 1 | El usuario ingresa sus credenciales de autenticación. | El sistema recibe las credenciales ingresadas. |
| 2 | El usuario intenta iniciar sesión. | El sistema verifica las credenciales y determina que la autenticación es fallida. |
| 3 | El usuario realiza nuevamente un intento de autenticación fallido. | El sistema registra el intento fallido consecutivo. |
| 4 | El usuario continúa realizando intentos de autenticación fallidos. | El sistema registra los intentos fallidos consecutivos. |
| 5 | El usuario realiza el quinto intento consecutivo de autenticación fallido. | El sistema identifica que se han alcanzado cinco intentos consecutivos fallidos. |
| 6 | — | El sistema bloquea temporalmente el acceso del usuario durante 5 minutos. |
| 7 | El usuario intenta autenticarse durante el período de bloqueo. | El sistema impide temporalmente el acceso del usuario. |
| 8 | Transcurren 5 minutos desde el bloqueo. | El sistema finaliza el período de bloqueo temporal. |

#### Resultado esperado

El sistema bloquea temporalmente el acceso del usuario después de cinco intentos consecutivos de autenticación fallidos.

El bloqueo tiene una duración de 5 minutos y durante este período el usuario no puede acceder al sistema mediante autenticación.

---

## 6. Relación entre el requisito, historia de usuario, criterios de aceptación y caso de uso

| Elemento | Código | Descripción |
|---|---|---|
| Requisito no funcional | RNF-01 | Bloquear acceso tras intentos fallidos |
| Historia de usuario | HU-04 | Bloqueo temporal del acceso después de cinco intentos consecutivos fallidos |
| Criterio de aceptación | CA-01 | Bloqueo después de cinco intentos fallidos |
| Criterio de aceptación | CA-02 | Duración del bloqueo durante 5 minutos |
| Criterio de aceptación | CA-03 | Impedimento de acceso durante el bloqueo |
| Criterio de aceptación | CA-04 | Aplicación del bloqueo después de cinco intentos consecutivos |
| Caso de uso | CU-03 | Bloquear acceso tras intentos fallidos |

---

## 7. Alcance del caso de uso

Este caso de uso contempla exclusivamente el bloqueo temporal del acceso de un usuario después de cinco intentos consecutivos de autenticación fallidos y la duración del bloqueo durante 5 minutos.

No contempla:

- Registro de nuevos usuarios.
- Modificación de usuarios.
- Eliminación de usuarios.
- Recuperación de contraseñas.
- Cambio de contraseñas.
- Gestión de permisos.
- Administración de roles.
- Registro de intentos exitosos de autenticación.
- Gestión de productos.
- Gestión de lotes.
- Registro de entradas de inventario.
- Registro de salidas de inventario.
- Exportación del inventario.
- Gestión de proveedores.
- Compras.
- Ventas.
- Facturación.
- Procesos contables.

El objetivo es establecer una medida de seguridad que bloquee temporalmente el acceso de un usuario después de cinco intentos consecutivos de autenticación fallidos.
