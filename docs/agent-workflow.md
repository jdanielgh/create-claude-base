# Flujo de desarrollo con agentes

Cómo se mueve un ticket por la base: qué agente lo toca, en qué modelo
corre cada uno, y qué archivos usa para no perder el progreso si algo
interrumpe la sesión. El detalle normativo de cada paso vive en los
propios archivos (`agents/*.md`, `rules/resumable-tasks.md`); esto es el
mapa para orientarse antes de leerlos.

## El flujo completo

```mermaid
flowchart TD
    Start(["Ticket nuevo"]) --> Gate{"¿Toca varios módulos o hay<br/>una decisión de arquitectura real?"}

    Gate -- "sí" --> Planner["planner<br/>(Sonnet · escala a Opus)"]
    Gate -- "no, es chico o mecánico" --> Dev
    Planner -- "siembra la sección<br/>Implementación del ledger" --> Dev

    Dev["Sesión principal<br/>desarrollo (Sonnet, default)"]
    Dev -- "revisión puntual a mitad<br/>de camino (opcional)" --> CR["code-reviewer<br/>(Sonnet)"]
    CR --> Dev
    Dev -- "desarrollo terminado" --> PM0

    subgraph PreMerge["pre-merge (Opus) — puerta final antes del PR"]
        PM0["0. Rama, base y ledger"] --> PM1["1. Verificación completa"]
        PM1 --> PM2["2. Revisión del diff<br/>· juicio, Opus ·"]
        PM2 --> PM3["3. Arreglo de hallazgos medium+"]
        PM3 --> PM4["4. Confirmar que el test de<br/>regresión falla sin el fix"]
        PM4 --> PM5["5. Audit de dependencias<br/>+ escalera · juicio, Opus ·"]
        PM5 --> PM6["6. Cerrar verificación<br/>(se salta si nada cambió)"]
        PM6 --> PM7["7. Commit, push, PR"]
        PM7 --> PM8["8. Screenshots si el diff toca UI"]
        PM8 --> Informe["Informe final · juicio, Opus ·"]
    end

    OR[("ops-runner<br/>Haiku por default,<br/>sonnet si la salida es ambigua")]
    PM1 -.->|"delega, recibe<br/>veredicto ~100-200 tok"| OR
    PM4 -.->|delega| OR
    PM5 -.->|"delega la corrida<br/>y la categorización"| OR
    PM6 -.->|delega| OR
    PM8 -.->|delega| OR

    Informe --> Verdict{"Veredicto"}
    Verdict -- "BLOQUEADO" --> Dev
    Verdict -- "LISTO PARA REVISIÓN<br/>FUNCIONAL" --> Human["Revisión humana<br/>(el usuario)"]
    Human -- "sí, mergear" --> Merge(["Merge<br/>· siempre manual, nunca<br/>lo hace un agente ·"])
    Human -- "pedir cambios" --> Dev
```

**Qué corre en qué modelo, y por qué** (`rules/agents-and-context.md`):

| Agente | Modelo | Rol |
| --- | --- | --- |
| `planner` | Sonnet (escala a Opus si la decisión de arquitectura lo justifica) | Diseña el plan, no escribe código. Solo para cambios que tocan varios módulos o tienen una decisión real. |
| Sesión principal | Sonnet | Desarrollo normal. Es el default de todo el sistema. |
| `code-reviewer` | Sonnet | Revisión puntual a mitad de camino, sobre un diff parcial. |
| `pre-merge` | **Opus** | Única excepción permanente al default. El juicio (clasificar hallazgos, decidir la escalera de dependencias, redactar el informe) es el producto — pagarlo en Sonnet arriesga dejar pasar exactamente lo que este agente existe para atrapar. |
| `ops-runner` | **Haiku** (`pre-merge` puede invocarlo con `model: sonnet` si la salida es ambigua) | Trabajo mecánico y desechable: correr comandos, leer su salida cruda, devolver un veredicto corto. Nunca opina. |

El punto que no es obvio a simple vista: `pre-merge` corre en Opus, pero **no lee la salida cruda de nada**. Los pasos 1, 4, 5, 6 y 8 son ejecución mecánica — los delega a `ops-runner` y solo recibe un veredicto de un par de líneas. Lo único que Opus procesa directamente es el diff (paso 2), la escalera de decisión de dependencias (paso 5) y la redacción del informe. Ver [`token-efficiency.md`](./token-efficiency.md) para cuánto pesa esa diferencia.

## Qué archivo guarda qué

Ningún agente confía en su propia memoria entre invocaciones — todo lo que necesita sobrevivir a una interrupción (quedarse sin tokens, una compactación, cerrar la sesión) queda escrito en disco. Cuatro archivos, cuatro responsabilidades distintas:

| Archivo | Quién escribe | Quién lee | ¿Se versiona? | Ciclo de vida |
| --- | --- | --- | --- | --- |
| `.claude/state/tasks/<rama>.md` | `planner` (siembra), `pre-merge` (siembra y actualiza), la sesión de desarrollo (marca ítems) | Cualquier agente resumible al arrancar; los hooks, para mostrar el próximo pendiente | No (`.claude/state/` está en `.gitignore`) | Uno por rama activa. Cada ítem con veredicto queda atado al commit en que era cierto (`@<sha>`) — ver `rules/resumable-tasks.md`, sección "Vigencia". Se poda solo cuando la rama deja de existir. |
| `.claude/state/checkpoints.md` | Hook `checkpoint.sh` (determinista, sin modelo) | La sesión, al arrancar, si quiere ver el historial | No | Marcador mecánico en `PreCompact`/`SessionEnd`: rama, último commit, `git status`, y un puntero al ledger activo. Nunca interpreta nada — eso lo hace `/checkpoint`. |
| `.claude/state/status.json` | La aplicación del proyecto (o sus scripts), no un agente de Claude Code | Hook `session-start.sh` (determinista) | No | Esquema libre. Existe para que el hook de arranque muestre un resumen del estado de la app sin releer código. |
| `docs/DECISIONS.md` | Comando `/checkpoint` (razona sobre la sesión) y `pre-merge` (solo si un fix revela una decisión de diseño) | Cualquiera, humano o agente, que necesite el porqué de una decisión pasada | **Sí** | Registro durable. A diferencia de los tres anteriores, esto es evidencia, no estado efímero — por eso vive fuera de `.claude/state/` y sí se commitea. |

```mermaid
flowchart LR
    subgraph Hooks["Hooks deterministas — sin llamadas al modelo"]
        SS["SessionStart"]
        PC["PreCompact"]
        SE["SessionEnd"]
    end

    Ledger[(".claude/state/tasks/&lt;rama&gt;.md")]
    Checkpoints[(".claude/state/checkpoints.md")]
    Status[(".claude/state/status.json")]
    Decisions[("docs/DECISIONS.md<br/>· versionado ·")]

    SS --> Status
    SS -.->|"muestra próximo pendiente<br/>si hay tarea activa"| Ledger

    PC --> Checkpoints
    SE --> Checkpoints
    Checkpoints -.->|"lee el próximo pendiente"| Ledger
    Checkpoints -.->|"poda ledgers de<br/>ramas ya cerradas"| Ledger

    Planner(["planner"]) -.->|siembra| Ledger
    PreMergeA(["pre-merge"]) -.->|"siembra y<br/>actualiza"| Ledger
    PreMergeA -.->|"solo si el fix revela<br/>una decisión"| Decisions
    CheckpointCmd(["/checkpoint"]) -.->|"razona y escribe"| Decisions
```

La separación importa: mezclar "estado efímero de sesión" con "decisión durable" en el mismo archivo es lo que hace que un documento de decisiones se llene de entradas vacías que después hay que limpiar a mano — el problema concreto que describe el comentario en `hooks/checkpoint.sh`.
