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
# Tres reglas para que no acumule ruido:
#   1. Árbol limpio = nada en vuelo que perder. No escribe.
#   2. Estado idéntico al último marcador = no aporta. No duplica.
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

STATUS="$(git -C "$PROJECT_DIR" status --short)"

# Regla 1
if [ -z "$STATUS" ]; then
  echo "Checkpoint omitido: no hay cambios sin commitear."
  exit 0
fi

mkdir -p "$STATE_DIR"

# Regla 2
if [ -f "$LAST_STATUS_FILE" ] && [ "$STATUS" = "$(cat "$LAST_STATUS_FILE")" ]; then
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
mano o con `/checkpoint`, que sí razona sobre lo discutido.
HEADER
fi

BRANCH="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")"
LAST_COMMIT="$(git -C "$PROJECT_DIR" log --oneline -1 2>/dev/null || echo "(sin commits)")"

{
  echo ""
  echo "## $TIMESTAMP ($TRIGGER)"
  echo ""
  echo "Rama \`$BRANCH\`, último commit: $LAST_COMMIT"
  echo ""
  echo '```text'
  echo "$STATUS"
  echo '```'
} >> "$CHECKPOINT_FILE"

printf '%s' "$STATUS" > "$LAST_STATUS_FILE"

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
