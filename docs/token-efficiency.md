# Eficiencia de tokens

Por qué el flujo de [`agent-workflow.md`](./agent-workflow.md) está diseñado
así, con números. Dos tipos de cifra conviven acá y están marcadas por
separado:

- **Publicadas** — benchmarks de Anthropic sobre sus propios mecanismos
  (caching, context editing, aislamiento de subagentes). Aplican a
  cualquier proyecto que use Claude Code, no son específicas de esta base.
- **Estimadas** — un cálculo propio, con los supuestos a la vista, sobre
  cuánto ahorra el rediseño concreto de `pre-merge` (delegación a
  `ops-runner` + no repetir la verificación si nada cambió). Es una
  estimación porque **todavía no hay una corrida real con esta versión**
  para medir — ver la sección final para cómo reemplazarla por un número
  real más adelante.

## Los mecanismos publicados que ya aprovecha esta base

**Prompt caching — 90% de descuento en tokens de input repetidos.**
El system prompt, las tools y `CLAUDE.md`/`rules/` son estáticos entre
turnos de una misma sesión, así que Claude Code los cachea sin que haga
falta configurar nada. Confirmado en la [página oficial de precios](https://claude.com/pricing):
la lectura de cache cuesta el 10% del input normal en los tres modelos.

**Aislamiento de subagentes — resúmenes de ~1.000-2.000 tokens en vez de
la exploración completa.** Un subagente recibe solo el contexto de su
tarea y devuelve una conclusión condensada; la exploración, los tool
calls y el ruido de llegar a esa conclusión nunca tocan la conversación
principal. Es la razón de ser de `ops-runner` y de por qué `pre-merge` es
un subagente y no un paso de la sesión principal
(`rules/agents-and-context.md`).

**Context editing y memory tool — hasta 84% menos tokens en tareas
largas con muchas herramientas.** Anthropic mide una reducción de hasta
84% en un benchmark de 100 turnos de búsqueda limpiando resultados de
tool calls viejos del contexto, y una mejora de fiabilidad de +29% (+39%
combinado con un memory tool) en tareas largas que persisten notas fuera
del contexto activo en vez de cargar todo. El ledger de
`rules/resumable-tasks.md` es la versión de este proyecto de esa segunda
idea: progreso persistido en archivo, leído solo cuando hace falta, en
vez de mantenido en el contexto de una sesión que puede cortarse.

Fuentes: [Anthropic — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents),
[Anthropic — Managing context on the Claude Developer Platform](https://claude.com/blog/context-management),
[claude.com/pricing](https://claude.com/pricing).

## Precios actuales (septiembre 2026)

De la [página oficial de precios](https://claude.com/pricing), por millón de tokens:

| Modelo | Input | Output | Input cacheado (lectura) |
| --- | --- | --- | --- |
| Opus | \$5 | \$25 | \$0.50 (10%) |
| Sonnet | \$2 | \$10 | \$0.20 (10%) |
| Haiku | \$1 | \$5 | \$0.10 (10%) |

Dos cosas se leen directo de esta tabla: Opus cuesta **5× más que
Haiku** por token de input, y **2.5× más que Sonnet**. Cada token que
`pre-merge` delega en vez de leer directo es, como mínimo, ese
multiplicador de diferencia.

## Estimación: delegar la parte mecánica de `pre-merge`

Esto es un cálculo con supuestos explícitos, no una medición de un
proyecto real — marcado así a propósito.

**Supuesto de tamaño.** Un proyecto chico/mediano con typecheck + lint +
tests + build genera del orden de **10.000-15.000 tokens** de salida de
texto cuando todo pasa (nombres de test, resúmenes de cobertura, output
del bundler). Sumale un audit de dependencias (`npm audit --json` o
equivalente) para un `package.json` con unas pocas docenas de
dependencias: otros **~5.000 tokens**. Usamos 20.000 tokens totales como
cifra redonda — ajustable a la baja o al alza según el proyecto real.

**Antes del rediseño** (commit `7115d83` de esta base, el `pre-merge`
importado de un proyecto real sin las optimizaciones posteriores):
Opus leía esa salida **directo**, y la línea base más el cierre la
corrían completa dos veces incluso sin ningún hallazgo que arreglar (el
problema que describe el commit `9a796fc`).

```
20.000 tokens × 2 corridas × $5/MTok (Opus, input) = $0.20 por pre-merge
```

**Después** (commits `5177e1a` y `9a796fc`): la regla de "no repetir si
nada cambió" deja la corrida en una sola vez, y esa lectura la hace
`ops-runner` en Haiku — Opus solo recibe el veredicto condensado.

```
20.000 tokens × 1 corrida × $1/MTok (Haiku, input)     = $0.020
     150 tokens de veredicto × $5/MTok (Opus, input)   = $0.00075
                                              total  ≈ $0.021 por pre-merge
```

**≈ 90% menos** en esta porción puntual (de \$0.20 a \$0.021), combinando
dos cambios independientes: eliminar la corrida redundante (2×→1×, la
mitad) y mover la lectura del texto pesado a un modelo 5× más barato por
token (la otra mitad del efecto). Ninguno de los dos alcanzaba solo para
el mismo resultado — es la combinación la que compone.

Esto **no incluye** el resto del consumo de un `pre-merge` real (leer el
diff, razonar sobre hallazgos, escribir el informe) — esa parte es
juicio, se queda en Opus a propósito, y no se intentó reducir. La
estimación es solo sobre la porción mecánica que sí se pudo mover.

## Cómo reemplazar esto por un número real

Cuando esta versión de `pre-merge` corra sobre un proyecto real (por
ejemplo, al portarla a WaveMark), Claude Code expone el consumo real por
sesión — con eso se arma la misma tabla con datos medidos en vez de
supuestos:

- El comando `/cost` dentro de una sesión de Claude Code.
- El export de uso de la [consola de Anthropic](https://console.anthropic.com/),
  filtrado por el rango de tiempo de una corrida de `pre-merge`.

Vale la pena repetir esta comparación una vez que haya una corrida real:
si el supuesto de 20.000 tokens de salida estaba lejos de la realidad del
proyecto, el porcentaje de ahorro cambia — pero la dirección del efecto
(delegar lo mecánico a un modelo más barato, no repetir lo que no
cambió) no depende del tamaño del proyecto.
