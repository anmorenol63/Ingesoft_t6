# RF-01. Exportar inventario en formato PDF

## 1. Requisito funcional

**Código:** RF-01
**Nombre:** Exportar inventario en formato PDF

### Descripción

El sistema debe permitir al usuario exportar la información del inventario en formato PDF, incluyendo el nombre del producto, lote, cantidad disponible y fecha de vencimiento.

---

# 2. Historias de usuario

## HU-01. Exportar inventario — Regente de farmacia

**Quién:** Regente de farmacia
**Qué:** Exportar la información del inventario en formato PDF.
**Por qué:** Disponer de un documento para consulta, seguimiento y realización de informes.

### Historia de usuario

> **Como** regente de farmacia,
> **quiero** exportar la información del inventario en formato PDF,
> **para** disponer de un documento con la información de los productos y lotes que facilite su consulta, seguimiento y realización de informes.

---

## HU-02. Exportar inventario — Auxiliar de farmacia

**Quién:** Auxiliar de farmacia
**Qué:** Exportar la información del inventario en formato PDF.
**Por qué:** Disponer de un documento para consulta y seguimiento de la información registrada.

### Historia de usuario

> **Como** auxiliar de farmacia,
> **quiero** exportar la información del inventario en formato PDF,
> **para** consultar y disponer de la información de los productos y lotes registrados en el inventario.

---

# 3. Criterios de aceptación

## CA-01. Generación del archivo PDF

**Dado que** el usuario se encuentra consultando el inventario,
**cuando** solicita exportar la información del inventario,
**entonces** el sistema deberá generar un archivo en formato PDF.

---

## CA-02. Nombre del producto

**Dado que** el sistema genera el archivo PDF,
**cuando** se consulta el contenido del documento,
**entonces** el PDF deberá incluir el nombre de cada producto registrado en el inventario.

---

## CA-03. Lote del producto

**Dado que** el sistema genera el archivo PDF,
**cuando** se consulta el contenido del documento,
**entonces** el PDF deberá incluir el lote correspondiente a cada producto registrado en el inventario.

---

## CA-04. Cantidad disponible

**Dado que** el sistema genera el archivo PDF,
**cuando** se consulta el contenido del documento,
**entonces** el PDF deberá incluir la cantidad disponible correspondiente a cada producto y lote.

---

## CA-05. Fecha de vencimiento

**Dado que** el sistema genera el archivo PDF,
**cuando** se consulta el contenido del documento,
**entonces** el PDF deberá incluir la fecha de vencimiento correspondiente a cada lote registrado en el inventario.

---

# 4. Caso de uso

## CU-01. Exportar inventario en formato PDF

### 4.1 Actor

Los actores que pueden ejecutar este caso de uso son:

* **Regente de farmacia**
* **Auxiliar de farmacia**

Ambos actores pueden consultar el inventario y solicitar la generación del documento en formato PDF.

---

### 4.2 Sistema

**Sistema de gestión y control de inventario para productos farmacéuticos.**

El sistema es responsable de consultar la información registrada del inventario y generar el archivo PDF solicitado por el usuario.

---

### 4.3 Objetivo

Permitir al usuario exportar la información del inventario en formato PDF, incluyendo el nombre del producto, lote, cantidad disponible y fecha de vencimiento, con el propósito de facilitar su consulta, seguimiento y realización de informes.

---

# 5. Caso contemplado respecto al caso de uso

## Caso contemplado: Exportación exitosa del inventario

### Precondiciones

Antes de ejecutar el caso de uso:

1. El usuario debe haber ingresado al sistema.
2. El usuario debe tener acceso al módulo de inventario.
3. Debe existir información registrada en el inventario.
4. El usuario debe encontrarse consultando el inventario.

### Flujo principal

| Paso | Actor                                                             | Sistema                                                                                                      |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1    | El usuario consulta el inventario.                                | El sistema muestra la información disponible del inventario.                                                 |
| 2    | El usuario selecciona la opción **"Exportar inventario en PDF"**. | El sistema recibe la solicitud de exportación.                                                               |
| 3    | —                                                                 | El sistema consulta la información registrada del inventario.                                                |
| 4    | —                                                                 | El sistema organiza la información de los productos y sus respectivos lotes.                                 |
| 5    | —                                                                 | El sistema genera el archivo en formato PDF.                                                                 |
| 6    | —                                                                 | El sistema incluye en el documento el nombre del producto, lote, cantidad disponible y fecha de vencimiento. |
| 7    | El usuario dispone del archivo generado.                          | El sistema permite al usuario obtener el archivo PDF.                                                        |

### Resultado esperado

El sistema genera correctamente un archivo PDF que contiene la información del inventario, incluyendo:

* Nombre del producto.
* Lote correspondiente.
* Cantidad disponible.
* Fecha de vencimiento.

El usuario puede disponer del documento para su consulta, seguimiento y realización de informes.

---

# 6. Relación entre el requisito, historias de usuario y caso de uso

| Elemento               | Código    | Descripción                                       |
| ---------------------- | --------- | ------------------------------------------------- |
| Requisito funcional    | **RF-01** | Exportar inventario en formato PDF                |
| Historia de usuario    | **HU-01** | Exportación realizada por el regente de farmacia  |
| Historia de usuario    | **HU-02** | Exportación realizada por el auxiliar de farmacia |
| Criterio de aceptación | **CA-01** | Generación del archivo PDF                        |
| Criterio de aceptación | **CA-02** | Inclusión del nombre del producto                 |
| Criterio de aceptación | **CA-03** | Inclusión del lote                                |
| Criterio de aceptación | **CA-04** | Inclusión de la cantidad disponible               |
| Criterio de aceptación | **CA-05** | Inclusión de la fecha de vencimiento              |
| Caso de uso            | **CU-01** | Exportar inventario en formato PDF                |

---

# 7. Alcance del caso de uso

Este caso de uso contempla exclusivamente la **exportación de la información existente del inventario en formato PDF**.

No contempla:

* Registro de nuevos productos.
* Modificación de productos.
* Registro de entradas de inventario.
* Registro de salidas de inventario.
* Gestión de proveedores.
* Compras.
* Ventas.
* Facturación.
* Procesos contables.

El objetivo es proporcionar al usuario un documento con la información registrada del inventario para facilitar su consulta, seguimiento y elaboración de informes.
