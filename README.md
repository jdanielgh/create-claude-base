# create-claude-base

Base de Claude Code para proyectos nuevos: `CLAUDE.md`, reglas, subagentes,
comandos, hooks y MCP, con presets según el tipo de proyecto.

```bash
npx create-claude-base
```

Sin dependencias. Escribe `.claude/` dentro del proyecto donde lo corras y
**nunca sobrescribe** un archivo que ya exista (salvo `--force`).

## Por qué

Empezar un proyecto con Claude Code sin configuración significa repetir las
mismas decisiones cada vez: que no commitee directo a `main`, que delegue
las corridas ruidosas a un subagente, que no gaste saldo de API en CI, que
no genere otra interfaz con gradiente morado y cards redondeadas.

Esto empaqueta esas decisiones. No es una colección de todo lo que existe:
es lo que sobrevivió al uso real en un proyecto.

## Uso

```bash
npx create-claude-base                      # interactivo, en el directorio actual
```

```bash
npx create-claude-base mi-app --preset=mobile
```

| Opción | Qué hace |
| --- | --- |
| `--preset=<nombre>` | `minimal`, `mobile`, `web`, `backend`, `data-rag` |
| `--name=<nombre>` | Nombre del proyecto en `CLAUDE.md` (default: el del directorio) |
| `--yes`, `-y` | Sin preguntas, valores por defecto |
| `--force` | Sobrescribe archivos existentes |
| `--install-skills` | Instala las skills externas sin preguntar |
| `--no-skills` | No instala skills externas |
| `--list` | Muestra los presets y qué trae cada uno |

## Qué instala

### Base (todos los presets)

**Reglas** — `dev-style`, `git-workflow`, `security-privacy`,
`dependency-audit`, `agents-and-context`, `ai-cost`, `task-report`.

La de `ai-cost` es la menos obvia y la que más ahorra: prohíbe llamadas
reales a la API en tests y CI, exige estimación de costo antes de una
corrida, y exige verificar idempotencia antes de gastar — para que una
corrida interrumpida no se pague dos veces. La de `dependency-audit` separa
la política de vulnerabilidades (qué bloquea, qué peso tiene cada
dependencia, la escalera de arreglo) de `security-privacy`, para que cada
archivo se pueda leer sin la otra. La de `task-report` fija qué se le
responde al usuario cuando una tarea termina: solo lo que necesita para
probar y decidir, nunca lo que ya está en el diff.

**Subagentes** — `planner` (diseño de cambios que tocan varios módulos),
`code-reviewer` (revisión puntual a mitad de camino), `pre-merge` (Opus, la
puerta final: revisa, arregla los hallazgos medium+, corre la verificación
completa y el audit de dependencias, abre el PR y entrega el guion de qué
probar a mano), `ops-runner` (Haiku, para corridas mecánicas cuya salida no
vale el contexto que ocupa).

**Comandos** — `/checkpoint`, `/verify`, `/ship` (delega en `pre-merge`).

**Hooks** — deterministas, nunca llaman al modelo:

- `session-start.sh` — lee `.claude/state/status.json` y arranca la sesión
  orientada sin releer código.
- `checkpoint.sh` — deja un marcador mecánico en `PreCompact` y
  `SessionEnd`. Tiene tres reglas anti-ruido aprendidas por las malas: no
  escribe con el árbol limpio, no duplica un estado idéntico, y conserva
  solo los últimos 20 marcadores. Escribe en `.claude/state/`, nunca en
  documentos versionados.

### Por preset

| Preset | Añade |
| --- | --- |
| `mobile` | `design-ui`, `mobile-platform`, comando `/screen`, Figma MCP, 3 skills de diseño |
| `web` | `design-ui` (web), Figma MCP, 3 skills de diseño |
| `backend` | `api-design` (contratos, errores, idempotencia, migraciones), `vendor-cost` (guardrail de tier gratuito para servicios externos, a duplicar por proveedor) |
| `data-rag` | `rag`, subagente `rag-engineer` |
| `minimal` | nada extra |

## Skills externas

Los presets `mobile` y `web` recomiendan skills de terceros. **No se copian
dentro de la plantilla a propósito**: son de otros autores y se actualizan
por su cuenta, así que duplicarlas las dejaría congeladas. El CLI ofrece
instalarlas con `npx skills add`.

| Skill | Para qué |
| --- | --- |
| [`ui-ux-pro-max`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | La única del top que cubre SwiftUI, React Native y Flutter. Paletas, tipografía y guías de UX. |
| [`minimalist-ui`](https://github.com/leonxlnx/taste-skill) | Estética editorial minimalista: monocromo cálido, sin gradientes ni sombras pesadas. |
| [`mobile-app-ui-design`](https://github.com/ceorkm/mobile-app-ui-design) | Grid de 8 pt, regla 60/30/10, thumb-zone, patrones de pantalla. (solo `mobile`) |
| [`impeccable`](https://github.com/pbakaus/impeccable) | Crítica y pulido de interfaces ya construidas. (solo `web`) |

Las reglas `design-ui.md` que sí se copian son el piso: aplican aunque
ninguna skill se dispare.

## Después de generar

1. Abre `.claude/CLAUDE.md` y completa el stack y las reglas específicas.
   Está escrito con huecos a propósito — un `CLAUDE.md` genérico se ignora
   solo.
2. Borra de `rules/` lo que no aplique. Cada regla que sobra se paga en
   contexto en cada turno.
3. Dentro de `claude`, verifica con `/agents`, `/context` y `/mcp`.

Figma MCP requiere autorizar el servidor la primera vez.

## Créditos

La estructura general toma ideas de
[everything-claude-code](https://github.com/worldflowai/everything-claude-code),
quedándose solo con lo que se usó de verdad.

MIT.
