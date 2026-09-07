#!/usr/bin/env bash
# Hook determinista, sin llamadas al modelo. Corre en PreCompact y SessionEnd.
#
# NO resume decisiones — eso requiere juicio y lo hace el comando
# /checkpoint. Este hook solo deja un marcador mecánico para que el trabajo
# en vuelo no se pierda de vista si una compactación corta el hilo.
#
# Escribe en .claude/state/ y NO en docs/. Un documento de decisiones que se
# versiona y se lee no debe recibir un `git status` en cada SessionEnd: se
# llena de entradas vacías que hay que limpiar a mano. Esto es estado
# efímero de sesión, no evidencia.
#
# Si hay una tarea con ledger activo (`.claude/state/tasks/<rama>.md`, ver
# rules/resumable-tasks.md), también deja un puntero a ella y a su próximo
# paso pendiente — así SessionStart lo puede mostrar sin abrir el ledger
# completo, y queda registrado aunque el árbol de trabajo esté limpio
# (todo commiteado, esperando el paso siguiente).
#
# También poda ledgers de ramas que ya no existen (se mergearon y se
# borraron). Ningún agente decide cuándo un ledger "cierra de verdad" —
# un ítem tildado puede quedar invalidado por un commit nuevo (ver
# rules/resumable-tasks.md, "Vigencia"), así que borrarlo al primer PR
# abierto sería prematuro. Esto es limpieza mecánica, atada a que la rama
# en sí ya no exista.
#
# Reglas para que no acumule ruido:
#   1. Árbol limpio y sin ledger activo = nada en vuelo que perder. No escribe.
#   2. Estado idéntico al último marcador (árbol + próximo pendiente del
#      ledger) = no aporta. No duplica.
#   3. Conserva solo los últimos MAX_ENTRIES marcadores.
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
STATE_DIR="$PROJECT_DIR/.claude/state"
CHECKPOINT_FILE="$STATE_DIR/checkpoints.md"
LAST_STATUS_FILE="$STATE_DIR/.checkpoint-last-status"
TRIGGER="${1:-unknown}"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
MAX_ENTRIES=20

if ! command -v git >/dev/null 2>&1 || ! git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  echo "Checkpoint omitido: sin repo git."
  exit 0
fi

TASKS_DIR="$STATE_DIR/tasks"
if [ -d "$TASKS_DIR" ]; then
  ACTIVE_SLUGS=" $(git -C "$PROJECT_DIR" for-each-ref --format='%(refname:short)' refs/heads | tr '/' '-' | tr '\n' ' ') "
  for f in "$TASKS_DIR"/*.md; do
    [ -f "$f" ] || continue
    slug="$(basename "$f" .md)"
    case "$ACTIVE_SLUGS" in
      *" $slug "*) ;;
      *) rm -f "$f" ;;
    esac
  done
fi

STATUS="$(git -C "$PROJECT_DIR" status --short)"
BRANCH="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")"
LEDGER_FILE="$STATE_DIR/tasks/$(echo "$BRANCH" | tr '/' '-').md"
NEXT_PENDING=""
if [ -f "$LEDGER_FILE" ]; then
  NEXT_PENDING="$(grep -m1 '^- \[ \]' "$LEDGER_FILE" 2>/dev/null || true)"
fi

# Regla 1
if [ -z "$STATUS" ] && [ ! -f "$LEDGER_FILE" ]; then
  echo "Checkpoint omitido: no hay cambios sin commitear ni tarea activa."
  exit 0
fi

mkdir -p "$STATE_DIR"

FINGERPRINT="$STATUS
---
$NEXT_PENDING"

# Regla 2
if [ -f "$LAST_STATUS_FILE" ] && [ "$FINGERPRINT" = "$(cat "$LAST_STATUS_FILE")" ]; then
  echo "Checkpoint omitido: el estado no cambió desde el último marcador."
  exit 0
fi

if [ ! -f "$CHECKPOINT_FILE" ]; then
  cat > "$CHECKPOINT_FILE" << 'HEADER'
# Checkpoints automáticos

Marcadores mecánicos escritos por `.claude/hooks/checkpoint.sh` en cada
PreCompact/SessionEnd. Estado efímero de sesión, fuera de git: solo sirve
para no perder de vista qué había en vuelo si una compactación corta el
hilo.

Las decisiones de diseño reales NO van acá — van a `docs/DECISIONS.md`, a
mano o con `/checkpoint`, que sí razona sobre lo discutido. El detalle de
una tarea en curso vive en su ledger (`.claude/state/tasks/`,
`rules/resumable-tasks.md`); acá solo queda el puntero.
HEADER
fi

LAST_COMMIT="$(git -C "$PROJECT_DIR" log --oneline -1 2>/dev/null || echo "(sin commits)")"

{
  echo ""
  echo "## $TIMESTAMP ($TRIGGER)"
  echo ""
  echo "Rama \`$BRANCH\`, último commit: $LAST_COMMIT"
  echo ""
  if [ -n "$STATUS" ]; then
    echo '```text'
    echo "$STATUS"
    echo '```'
  else
    echo "Árbol de trabajo limpio."
  fi
  if [ -f "$LEDGER_FILE" ]; then
    echo ""
    echo "Tarea activa: \`.claude/state/tasks/$(basename "$LEDGER_FILE")\`"
    if [ -n "$NEXT_PENDING" ]; then
      echo "Próximo pendiente: $NEXT_PENDING"
    else
      echo "Todos los ítems del ledger están marcados para este commit."
    fi
  fi
} >> "$CHECKPOINT_FILE"

printf '%s' "$FINGERPRINT" > "$LAST_STATUS_FILE"

# Regla 3. El encabezado usa `# `, los marcadores `## `, así que contar
# `^## ` no lo toca.
ENTRY_COUNT="$(grep -c '^## ' "$CHECKPOINT_FILE" || true)"
if [ "$ENTRY_COUNT" -gt "$MAX_ENTRIES" ]; then
  DROP=$((ENTRY_COUNT - MAX_ENTRIES))
  CUT_LINE="$(grep -n '^## ' "$CHECKPOINT_FILE" | sed -n "$((DROP + 1))p" | cut -d: -f1)"
  HEADER_END="$(($(grep -n '^## ' "$CHECKPOINT_FILE" | head -1 | cut -d: -f1) - 1))"
  {
    head -n "$HEADER_END" "$CHECKPOINT_FILE"
    tail -n "+$CUT_LINE" "$CHECKPOINT_FILE"
  } > "$CHECKPOINT_FILE.tmp"
  mv "$CHECKPOINT_FILE.tmp" "$CHECKPOINT_FILE"
fi

echo "Checkpoint registrado en .claude/state/checkpoints.md ($TRIGGER)."
