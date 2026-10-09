<!--
HOW TO USE THIS TEMPLATE
------------------------
1. Copy this file and rename it to the requirement's ID, e.g. REQ-01.md.
2. Fill in every section. If a section genuinely does not apply to this
   requirement (not every requirement has a Business Rule or a Constraint),
   write "N/A — none identified" and say why in one line. Never invent
   content to fill a blank cell — that breaks the rule we've followed since
   Class 8: specification is not invention.
3. If something is unknown rather than inapplicable, use the Open
   Questions section instead of guessing.
4. See REQ-07_Example.md (Food Delivery System) for a fully filled-in
   reference before you start.
-->

# REQ-RNF-01 — Bloquear acceso tras intentos fallidos

| Atributo | Detalle |
|---|---|
| **Estado** | Evaluado |
| **Equipo / Autores** | Junior Andrés Arrieta Tabaco, Kevin Alexis Bermúdez Caicedo, Edgar Mauricio Montufar Molano y Antonio José Moreno López |
| **Fecha** | 2026-10-9 |
| **Historia de usuario / Criterios de aceptación vinculados** | HU-04, CA-01, CA-02, CA-03, CA-04 |

---

## 1. Descripción general

**Declaración de requisitos**

> El sistema debe bloquear temporalmente el acceso de un usuario durante cinco minutos después de cinco intentos consecutivos de autenticación fallidos. Durante este período, el sistema debe impedir que el usuario vuelva a autenticarse.

**Tipo:** No funcional (*Seguridad*).

Este requisito busca proteger el acceso al sistema mediante un mecanismo de bloqueo temporal después de múltiples intentos consecutivos de autenticación fallidos. Aunque establece un comportamiento específico que puede verificarse mediante pruebas, su propósito principal es fortalecer la seguridad del sistema.

**Fuente / evidencia**

> Documentación de requisitos del proyecto — RNF-01: «Bloquear acceso tras intentos fallidos», HU-04 y criterios de aceptación CA-01, CA-02, CA-03 y CA-04.

El requisito fue definido por el equipo durante la elaboración de los requisitos del sistema como una medida de seguridad para proteger el acceso de los usuarios. No se realizaron entrevistas para identificar esta necesidad.

**Necesidad**

> Proteger el acceso a las cuentas de usuario y limitar los intentos de autenticación después de cinco intentos consecutivos fallidos.

**Valor / Justificación**

> Reducir el riesgo de intentos reiterados de acceso no autorizado mediante el bloqueo temporal de la autenticación después de cinco intentos consecutivos fallidos.

---
## 2. Contexto (Context)

**Reglas de negocio (Business Rules)**
> **BR-01 (Límite de autenticación de usuario):** Una cuenta de usuario solo puede acumular un máximo de 5 intentos fallidos de autenticación consecutivos antes de ser restringida temporalmente para evitar accesos no autorizados.
> **BR-02 (Reinicio del conteo por evento exitoso):** Un intento de autenticación exitoso restablece inmediatamente a cero el contador de intentos fallidos acumulados previamente por el usuario.

**Restricciones (Constraints)**
> **CONS-01 (Gestión en el servidor / Backend):** La lógica del temporizador de 5 minutos, el contador de intentos y el bloqueo deben ser procesados y validados exclusivamente en el lado del servidor (*backend*) para evitar que el cliente o navegador pueda omitir la restricción alterando datos locales.

**Supuestos (Assumptions)**
> **ASM-01 (Sincronización horaria del servidor):** Se asume que el servidor cuenta con un servicio de tiempo (NTP) activo y sincronizado para calcular con precisión la ventana de bloqueo de 5 minutos.
> **ASM-02 (Existencia previa de la cuenta):** Se asume que los intentos de autenticación evaluados corresponden a usuarios previamente registrados y activos en el sistema farmacéutico.

**Dependencias (Dependencies)**
> **DEP-01 (Servicio de Autenticación):** El mecanismo de bloqueo depende directamente del servicio central de autenticación/login encargado de procesar y validar las credenciales de entrada.

**Riesgos (Risks)**

| Riesgo | Probabilidad | Impacto | Mitigación (opcional) |
|---|---|---|---|
| **Ataque de Denegación de Servicio (DoS) dirigido a usuarios legítimos:** Un atacante puede forzar intencionadamente 5 intentos fallidos con el correo de un usuario válido para denegarle el acceso. | Media | Alto | Implementar validación tipo CAPTCHA después del 3.ᵉʳ intento fallido y enviar una notificación por correo electrónico al usuario informando sobre el bloqueo. |
| **Inconsistencia en el tiempo de bloqueo por almacenamiento en caché:** Que el estado de bloqueo no se actualice de inmediato en la sesión del usuario tras cumplir los 5 minutos. | Baja | Medio | Manejar la expiración del bloqueo directamente con marcas de tiempo en formato UTC en la base de datos o almacenamiento en memoria (Redis). |

**Preguntas abiertas (Open Questions)**
> N/A — Ninguna identificada.


## 3. Priority & Estimation

**Priority model used:** MoSCoW / Kano / RICE / WSJF / Value-Effort *(pick the one that fits the decision you're actually making — see Class 10's comparison if you need to decide which)*

**Priority assigned:**
> Because [the situation/signal from your project], we assigned [priority value], accepting the trade-off of [what you're giving up by not prioritizing it higher/lower]. We considered [alternative priority] and didn't use it because [reason].

**Estimate (confidence):** High / Medium / Low
> How sure are we about the size and shape of this work? *(This is a confidence tag, not a technique-based number — named estimation techniques like story points are Ingeniería de Software II content, not this course.)*

---

## 4. Representaciones — El requisito no es la representación

### 4.1 Historia de usuario

> Como usuario del sistema, quiero que mi acceso sea bloqueado temporalmente después de cinco intentos consecutivos de autenticación fallidos, para proteger el acceso a mi cuenta ante múltiples intentos fallidos.

*Verificación:* La historia de usuario expresa el objetivo de seguridad que necesita el usuario, mientras que el bloqueo durante cinco minutos después de cinco intentos fallidos establece el comportamiento esperado del sistema.

### 4.2 Criterios de aceptación

**Escenario 1 — Bloqueo después de cinco intentos fallidos**

> Dado que un usuario intenta autenticarse en el sistema, cuando alcanza cinco intentos consecutivos de autenticación fallidos, entonces el sistema bloquea temporalmente su acceso durante cinco minutos.

**Escenario 2 — Intento de autenticación durante el bloqueo**

> Dado que el acceso de un usuario se encuentra bloqueado, cuando intenta autenticarse durante el período de bloqueo, entonces el sistema impide temporalmente el acceso.

**Escenario 3 — Finalización del bloqueo**

> Dado que el acceso de un usuario se encuentra bloqueado, cuando transcurren cinco minutos desde el inicio del bloqueo, entonces el sistema finaliza el período de bloqueo temporal y permite que el usuario vuelva a intentar autenticarse.

**Escenario 4 — Persistencia del bloqueo durante el período establecido**

> Dado que un usuario ha alcanzado cinco intentos consecutivos de autenticación fallidos, cuando intenta autenticarse antes de que finalicen los cinco minutos de bloqueo, entonces el sistema mantiene la restricción de acceso.

### 4.3 Caso de uso

| **Campo** | **Descripción** |
|---|---|
| **Nombre del caso de uso** | Bloquear acceso tras intentos fallidos |
| **Actor** | Usuario del sistema |
| **Objetivo** | Proteger el acceso al sistema mediante un bloqueo temporal después de cinco intentos consecutivos de autenticación fallidos. |
| **Desencadenante** | El usuario realiza un intento de autenticación. |
| **Precondición** | El usuario se encuentra registrado en el sistema y está intentando autenticarse. |

**Flujo principal**

1. El usuario ingresa sus credenciales de autenticación.
2. El sistema recibe las credenciales ingresadas.
3. El sistema verifica las credenciales y determina que la autenticación es fallida.
4. El sistema registra el intento fallido consecutivo.
5. El usuario continúa realizando intentos de autenticación fallidos.
6. El sistema registra los intentos fallidos consecutivos.
7. El usuario realiza el quinto intento consecutivo de autenticación fallido.
8. El sistema identifica que se han alcanzado cinco intentos consecutivos fallidos.
9. El sistema bloquea temporalmente el acceso del usuario durante cinco minutos.
10. El sistema informa que el acceso se encuentra temporalmente bloqueado.

**Flujo alternativo**

> **Autenticación exitosa antes de alcanzar cinco intentos fallidos:** si el usuario ingresa credenciales válidas antes de alcanzar cinco intentos consecutivos fallidos, el sistema permite el acceso y reinicia el contador de intentos fallidos a cero.

**Excepción**

> **Intento de autenticación durante el bloqueo:** si el usuario intenta autenticarse antes de que transcurran los cinco minutos, el sistema impide el acceso y mantiene el bloqueo temporal.

**Postcondición**

> El acceso del usuario permanece bloqueado durante cinco minutos después de alcanzar cinco intentos consecutivos de autenticación fallidos. Una vez finalizado el período, el sistema permite que el usuario vuelva a intentar autenticarse.


**Diagrama de flujo**

```mermaid
flowchart TD
    A([Inicio: usuario intenta autenticarse]) --> B[El sistema verifica las credenciales]
    B --> C{¿Credenciales válidas?}

    C -- Sí --> D[El sistema permite continuar con la autenticación]
    D --> E([Fin])

    C -- No --> F[El sistema registra el intento fallido]
    F --> G{¿Alcanza cinco intentos fallidos consecutivos?}

    G -- No --> H[El sistema informa que las credenciales son incorrectas]
    H --> I([Fin del intento])

    G -- Sí --> J[El sistema bloquea el acceso durante cinco minutos]
    J --> K{¿Han transcurrido cinco minutos?}

    K -- No --> L[EXCEPCIÓN: el sistema impide la autenticación]
    L --> K

    K -- Sí --> M[El sistema finaliza el bloqueo temporal]
    M --> N[El usuario puede intentar autenticarse nuevamente]
    N --> E

    classDef principal fill:#1f3a70,color:#ffffff,stroke:#14284d
    classDef alternativo fill:#f0ad4e,color:#000000,stroke:#b87916
    classDef excepcion fill:#c9302c,color:#ffffff,stroke:#8b1e1a

    class A,B,F,G,J,K,M,N principal
    class D,H alternativo
    class L excepcion
```

---
## 5. Traceability & Impact

*(Class 10. Conceptual, not a formal matrix.)*

**Backward — why does this requirement exist?**

> HU-04 — Necesidad de proteger el acceso a la cuenta frente a múltiples intentos fallidos → RNF-01 — Bloquear acceso tras intentos fallidos → CA-01, CA-02, CA-03 y CA-04 → CU-03 — Bloquear acceso tras intentos fallidos.

La trazabilidad hacia atrás se considera documentada porque la historia de usuario explica el propósito de seguridad, los criterios de aceptación detallan el comportamiento esperado y el caso de uso describe el flujo del bloqueo. El ADR-0001 establece el alcance del sistema de inventario farmacéutico, pero no menciona directamente el mecanismo de bloqueo. Por eso, no se utiliza como evidencia específica del origen de esta necesidad.

**Forward — what will this affect?**

> RNF-01 → Diseño futuro (mecanismo de autenticación, contador de intentos fallidos y control temporal del bloqueo) → Implementación futura (lógica de autenticación y gestión del estado de bloqueo) → Pruebas (verificación de los cinco intentos fallidos, el bloqueo durante cinco minutos y la recuperación del acceso).

**Impact Analysis — if this requirement changes, what else might need to change?**

- [x] Business Rules
- [x] Constraints
- [x] Dependencies
- [x] Risks
- [x] Acceptance Criteria
- [ ] Estimate
- [ ] Priority
- [x] Future Design
- [x] Future Tests

> Si cambia el mecanismo de autenticación o la política de bloqueo temporal, las reglas de negocio, las restricciones, las dependencias y los riesgos deberán revisarse. También podrían cambiar los criterios de aceptación si se modifica el número de intentos fallidos o la duración del bloqueo. El diseño futuro y las pruebas deberán actualizarse para mantener el comportamiento esperado. La estimación y la prioridad se dejan sin marcar porque no se cuenta con una estimación previa ni con una decisión de priorización documentada que permita afirmar que cambiarían.

---

## 6. Validation — Quality Gate

*(Class 9 + Class 10. Self-audit before you commit this file. Check honestly — a "no" here means the requirement isn't ready yet, not that you should force a checkmark.)*

- [x] **Valid?** Does it reflect a real, evidenced need — not an invented one?
- [x] **Clear / Unambiguous?** Is there only one reasonable interpretation?
- [x] **Atomic?** Is this one independently testable expectation, not several bundled together?
- [x] **Necessary?** Does removing it actually break something real?
- [x] **Feasible?** Can this realistically be built with what the team has?
- [x] **Verifiable?** Can you demonstrate, concretely, whether it's satisfied?
- [x] **Consistent?** Does it conflict with any other requirement in your set?
- [x] **Complete enough?** Are there important functions or constraints still missing?
- [x] **Traceable?** Can every part of this document be traced back to real evidence — not invented to fill a section?

> El requisito cuenta con una necesidad documentada en la HU-04, un objetivo de seguridad explícito y una relación directa con los criterios de aceptación CA-01 a CA-04 y el caso de uso CU-03. Su comportamiento principal es claro, se concentra en una regla de seguridad y puede verificarse mediante pruebas basadas en los cinco intentos consecutivos fallidos y los cinco minutos de bloqueo. Además, la funcionalidad es técnicamente razonable, aunque su implementación definitiva dependerá de la arquitectura y del mecanismo de autenticación del sistema. Los elementos revisados mantienen coherencia entre sí y permiten seguir la trazabilidad interna del requisito. Se recomienda revisar los casos límite durante el diseño, como el tratamiento de intentos exitosos y el manejo del bloqueo entre sesiones, y comprobar la consistencia con el conjunto completo de requisitos antes de cerrar la validación.
