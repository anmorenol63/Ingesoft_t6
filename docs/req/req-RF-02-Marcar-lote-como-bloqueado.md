# RF-02. Bloquear lotes de inventario

## 1. Requisito funcional

**Código:** RF-02  
**Nombre:** Bloquear lotes de inventario

### Descripción

El sistema debe permitir al regente de farmacia marcar un lote como bloqueado, impidiendo que sus unidades sean registradas como disponibles para salida mientras el lote permanezca en dicho estado.

---

## 2. Historia de usuario

### HU-03. Bloquear lote de inventario — Regente de farmacia

**Quién:** Regente de farmacia  
**Qué:** Marcar un lote de inventario como bloqueado.  
**Por qué:** Evitar que las unidades de un lote bloqueado sean registradas como disponibles para salida.

### Historia de usuario

Como regente de farmacia, quiero marcar un lote de inventario como bloqueado, para impedir que sus unidades sean registradas como disponibles para salida mientras el lote permanezca bloqueado.

---

## 3. Criterios de aceptación

### CA-01. Bloqueo del lote

Dado que el regente de farmacia se encuentra consultando un lote registrado en el inventario, cuando selecciona la opción de bloquear el lote, entonces el sistema deberá marcar el lote como bloqueado.

### CA-02. Estado del lote

Dado que el regente de farmacia ha bloqueado un lote, cuando se consulta la información del lote, entonces el sistema deberá mostrar que el lote se encuentra en estado bloqueado.

### CA-03. Restricción de salida

Dado que un lote se encuentra bloqueado, cuando se intenta registrar una salida utilizando unidades de dicho lote, entonces el sistema deberá impedir que esas unidades sean registradas como disponibles para salida.

### CA-04. Permanencia del bloqueo

Dado que un lote se encuentra en estado bloqueado, cuando se consulta nuevamente la información del lote, entonces el sistema deberá mantener el lote en estado bloqueado mientras permanezca en dicho estado.

---

## 4. Caso de uso

### CU-02. Bloquear lote de inventario

#### 4.1 Actor

El actor que puede ejecutar este caso de uso es:

**Regente de farmacia**

El regente de farmacia puede consultar los lotes registrados en el inventario y solicitar el bloqueo de un lote.

#### 4.2 Sistema

**Sistema de gestión y control de inventario para productos farmacéuticos.**

El sistema es responsable de actualizar el estado del lote seleccionado y aplicar la restricción correspondiente para impedir que sus unidades sean registradas como disponibles para salida mientras el lote permanezca bloqueado.

#### 4.3 Objetivo

Permitir al regente de farmacia marcar un lote como bloqueado para impedir que sus unidades sean registradas como disponibles para salida mientras el lote permanezca en dicho estado.

---

## 5. Caso contemplado respecto al caso de uso

### Caso contemplado: Bloqueo exitoso de un lote

#### Precondiciones

Antes de ejecutar el caso de uso:

- El regente de farmacia debe haber ingresado al sistema.
- El regente de farmacia debe tener acceso al módulo de inventario.
- Debe existir al menos un lote registrado en el inventario.
- El lote que se desea bloquear debe encontrarse registrado en el inventario.

#### Flujo principal

| Paso | Actor | Sistema |
|---|---|---|
| 1 | El regente de farmacia consulta el inventario. | El sistema muestra la información disponible del inventario. |
| 2 | El regente de farmacia consulta los lotes registrados. | El sistema muestra los lotes asociados a los productos. |
| 3 | El regente de farmacia selecciona el lote que desea bloquear. | El sistema muestra la información del lote seleccionado. |
| 4 | El regente de farmacia selecciona la opción "Bloquear lote". | El sistema recibe la solicitud de bloqueo. |
| 5 | — | El sistema actualiza el estado del lote a "Bloqueado". |
| 6 | — | El sistema aplica la restricción para impedir que las unidades del lote sean registradas como disponibles para salida. |
| 7 | El regente de farmacia consulta nuevamente el lote. | El sistema muestra el lote en estado "Bloqueado". |

#### Resultado esperado

El sistema marca correctamente el lote seleccionado como bloqueado.

El lote permanece en estado bloqueado y sus unidades no pueden ser registradas como disponibles para salida mientras permanezca en dicho estado.

---

## 6. Relación entre el requisito, historia de usuario, criterios de aceptación y caso de uso

| Elemento | Código | Descripción |
|---|---|---|
| Requisito funcional | RF-02 | Bloquear lotes de inventario |
| Historia de usuario | HU-03 | Bloqueo de un lote realizado por el regente de farmacia |
| Criterio de aceptación | CA-01 | Bloqueo del lote |
| Criterio de aceptación | CA-02 | Visualización del estado bloqueado |
| Criterio de aceptación | CA-03 | Restricción de salida para el lote bloqueado |
| Criterio de aceptación | CA-04 | Permanencia del estado bloqueado |
| Caso de uso | CU-02 | Bloquear lote de inventario |

---

## 7. Alcance del caso de uso

Este caso de uso contempla exclusivamente el bloqueo de un lote registrado en el inventario y la restricción de sus unidades para ser registradas como disponibles para salida mientras el lote permanezca bloqueado.

No contempla:

- Registro de nuevos productos.
- Modificación de productos.
- Registro de nuevos lotes.
- Registro de entradas de inventario.
- Registro de salidas de inventario.
- Desbloqueo de lotes.
- Gestión de proveedores.
- Compras.
- Ventas.
- Facturación.
- Procesos contables.

El objetivo es permitir al regente de farmacia controlar el estado de los lotes registrados en el inventario y evitar que las unidades de un lote bloqueado sean registradas como disponibles para salida.
