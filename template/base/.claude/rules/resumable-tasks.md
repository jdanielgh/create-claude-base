# resumable-tasks

Cómo cualquier agente de pasos largos —o la sesión principal, durante el
desarrollo— persiste su progreso para que una interrupción (te quedás sin
tokens, la sesión compacta, cerrás y volvés mañana) no signifique volver a
empezar. Vive en `.claude/state/tasks/`, fuera de git: es progreso
efímero de la tarea en curso, no una decisión de diseño (eso es
`docs/DECISIONS.md`) ni un volcado de `git status` (eso es el hook
`checkpoint.sh`, que ahora también apunta acá — ver más abajo).

## Dónde y cuándo

Un archivo por rama activa: `.claude/state/tasks/<rama>.md`, con `/`
reemplazado por `-` si la rama lo tiene (para que sea un nombre de archivo
válido). Se crea la primera vez que un agente resumible arranca sobre esa
rama.

No es para cambios chicos. Si la tarea entra en una sesión sin riesgo real
de cortarse (un fix de tres líneas, algo mecánico de `ops-runner`), no
crees el archivo — el costo de mantenerlo no se paga.

## Formato

Una sección por fase del ticket, en el orden en que ocurren. Cada fase la
escribe el agente o la sesión que la ejecuta; nadie reescribe la sección de
otro, solo la propia. **Todo ítem que registre un veredicto** (verificó,
revisó, auditó — no un archivo simplemente implementado) **lleva el HEAD
en el que era cierto**, con `@<sha-corto>`:

```markdown
# Tarea: <rama>

Iniciado <fecha> · Última actualización <fecha>

## Implementación
- [x] src/api/csv.ts — endpoint de export (commit a3f9c1)
- [ ] src/components/ExportButton.tsx — botón que lo dispara
- [ ] src/api/csv.test.ts — tests del endpoint

## pre-merge
- [x] 0. Rama confirmada, base: main
- [x] 1. Verificación base — VERDE @a3f9c1 (14:10)
- [ ] 2. Diff revisado
...
```

**`## Implementación`** la siembra `agents/planner.md` con su lista de "qué
cambia y dónde": un ítem sin marcar por archivo o cambio concreto, mismo
orden y mismo nivel de detalle con el que planner ya lo devuelve — no hace
falta inventar una granularidad nueva. La sesión que implementa marca cada
ítem **al terminarlo**, no al terminar toda la tarea: así una interrupción
a mitad de camino dice exactamente cuáles de los cambios planeados ya
están y cuáles no. Si el plan resulta incompleto o cambia sobre la marcha,
se edita el ítem o se agrega uno — el ledger dice lo que pasó de verdad,
no lo que planner adivinó al principio. Cuando no hubo `planner` (cambio
chico, sin plan previo), esta sección no existe: no se inventa
retroactivamente.

**`## pre-merge`** la siembra y actualiza `agents/pre-merge.md`, un ítem
por paso de ese documento, con el dato mínimo para no repetir trabajo (el
veredicto, no el log completo) y el commit en el que ese veredicto vale.

## Vigencia: qué pasa si el código cambió desde la última corrida

Esto es lo que separa "retomar" de "confiar en un checklist viejo". Un
ítem tildado no es una promesa permanente — es cierto **para el commit que
tiene al lado**. Si después de esa corrida hay commits nuevos en la rama
(porque el usuario pidió otro cambio, porque se atendió feedback de la
revisión, lo que sea), ese ítem ya no vale, tenga o no el casillero
marcado.

**Antes de confiar en cualquier ítem tildado de `## pre-merge`:**

1. Tomá el `@<sha>` del **último** ítem tildado y compará contra
   `git rev-parse --short HEAD`.
2. **Coinciden** → nada cambió desde esa corrida. Seguí desde el primer
   ítem sin marcar (retomar de verdad) — o, si todos los ítems ya están
   tildados y hay un PR abierto, decilo en una línea y listo: no hay diff
   nuevo que revisar.
3. **No coinciden** → hay commits que esa corrida no vio. Los ítems
   tildados **no cuentan**, aunque digan `[x]`. No los borres: agregá una
   sección nueva debajo, `### Corrida <fecha>`, y arrancá otra vez desde
   el paso 1 sobre el diff completo actualizado. La corrida anterior queda
   como historial, no como verdad vigente.
4. Si ya existía un PR de una corrida previa, la corrida nueva **lo
   reutiliza** (`gh pr edit`) — nunca abre uno segundo. Esto ya lo cubre
   la idempotencia del paso 7 de `pre-merge`.

La misma lógica vale para `## Implementación`: un archivo marcado `[x]`
sigue siendo válido aunque haya commits nuevos en *otros* archivos — lo
que invalida un ítem de esa sección es que el archivo mismo haya cambiado
de forma que ya no coincide con lo que describe, no que la rama haya
avanzado en general.

## Disciplina

1. **Actualizá al terminar la unidad de trabajo, no al final de la
   sesión.** El valor del ledger es que sobrevive a un corte que vos no
   elegiste — si solo lo actualizás al cerrar, un corte a mitad no dejó
   nada escrito.
2. **Guardá datos y el commit, no solo el casillero.** `[x] 1.
   Verificación — VERDE @a3f9c1 (14:10)` te ahorra volver a correrla al
   retomar, y te deja detectar cuándo ya no vale. `[x] 1. Verificación` a
   secas no sirve para ninguna de las dos cosas.
3. **Al arrancar, buscá el ledger de la rama actual antes que nada**, y
   aplicá la regla de vigencia de arriba antes de tratar cualquier ítem
   como hecho.
4. **No lo borres vos.** Dejalo como historial de la tarea — de cuántas
   corridas necesitó, y por qué. La limpieza es mecánica: `checkpoint.sh`
   poda los ledgers de ramas que ya no existen (se mergearon y se
   borraron), así que no hace falta que ningún agente decida cuándo un
   ledger "ya cerró de verdad".

## Integración automática

Los hooks deterministas ya enganchan esto, sin costo de modelo:

- `hooks/checkpoint.sh` (PreCompact/SessionEnd) agrega al marcador un
  puntero al ledger activo y su próximo ítem pendiente, si hay uno — así
  queda registrado incluso si te quedás sin tokens con el árbol de trabajo
  limpio (todo commiteado, esperando el paso siguiente). También poda, en
  cada corrida, los ledgers cuya rama ya no existe.
- `hooks/session-start.sh` lo lee al arrancar una sesión nueva y lo
  muestra en el readout inicial. No hace falta pedirlo: si hay una tarea a
  medias en la rama en la que estás parado, aparece solo.
