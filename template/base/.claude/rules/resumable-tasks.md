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
rama, y se borra cuando la tarea cierra de verdad — PR abierto y entregado
el informe final. Un ledger que sobrevive a eso es ruido la próxima vez
que pisás esa rama.

No es para cambios chicos. Si la tarea entra en una sesión sin riesgo real
de cortarse (un fix de tres líneas, algo mecánico de `ops-runner`), no
crees el archivo — el costo de mantenerlo no se paga.

## Formato

Una sección por fase del ticket, en el orden en que ocurren. Cada fase la
escribe el agente o la sesión que la ejecuta; nadie reescribe la sección de
otro, solo la propia.

```markdown
# Tarea: <rama>

Iniciado <fecha> · Última actualización <fecha>

## Implementación
- [x] src/api/csv.ts — endpoint de export (commit a3f9c1)
- [ ] src/components/ExportButton.tsx — botón que lo dispara
- [ ] src/api/csv.test.ts — tests del endpoint

## pre-merge
- [x] 0. Rama confirmada, base: main
- [x] 1. Verificación base — VERDE (14:10)
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
veredicto, no el log completo).

## Disciplina

1. **Actualizá al terminar la unidad de trabajo, no al final de la
   sesión.** El valor del ledger es que sobrevive a un corte que vos no
   elegiste — si solo lo actualizás al cerrar, un corte a mitad no dejó
   nada escrito.
2. **Guardá datos, no solo el casillero.** `[x] 1. Verificación — VERDE
   (14:10)` te ahorra volver a correrla al retomar. `[x] 1. Verificación`
   a secas no.
3. **Al arrancar, buscá el ledger de la rama actual antes que nada.** Si
   existe, leelo y seguí desde el primer ítem sin terminar. No lo tomes
   como verdad ciega: confirmá contra el estado real (`git log`, `git
   diff`, qué archivos existen) antes de retomar — si el HEAD cambió de un
   modo que el ledger no explica, parás y preguntás en vez de asumir que
   sigue siendo válido.
4. **Se borra al cerrar.** No lo dejes "por las dudas": un ledger viejo
   compitiendo con uno nuevo en la misma rama es peor que no tener
   ninguno.

## Integración automática

Los hooks deterministas ya enganchan esto, sin costo de modelo:

- `hooks/checkpoint.sh` (PreCompact/SessionEnd) agrega al marcador un
  puntero al ledger activo y su próximo ítem pendiente, si hay uno — así
  queda registrado incluso si te quedás sin tokens con el árbol de trabajo
  limpio (todo commiteado, esperando el paso siguiente).
- `hooks/session-start.sh` lo lee al arrancar una sesión nueva y lo
  muestra en el readout inicial. No hace falta pedirlo: si hay una tarea a
  medias en la rama en la que estás parado, aparece solo.
