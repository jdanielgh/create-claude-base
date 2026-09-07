#!/usr/bin/env bash
# Hook determinista, sin llamadas al modelo. Corre en SessionStart.
#
# Imprime un readout corto para que la sesión arranque orientada sin tener
# que releer código ni historial. Este hook SOLO LEE: el status.json de la
# app lo escribe la app (o los scripts de mantenimiento) después de cada
# corrida; el ledger de tarea lo escriben los agentes resumibles
# (`rules/resumable-tasks.md`).
#
# El esquema de status.json es libre: se imprime cada clave de primer nivel
# tal cual. Empieza con algo como:
#   { "last_run_at": "...", "records": 0, "pending": 0 }
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
STATUS_FILE="$PROJECT_DIR/.claude/state/status.json"
PROJECT_NAME="{{PROJECT_NAME}}"

if [ -f "$STATUS_FILE" ]; then
  if command -v node >/dev/null 2>&1; then
    node -e '
      const fs = require("fs");
      const [file, name] = process.argv.slice(1);
      try {
        const status = JSON.parse(fs.readFileSync(file, "utf8"));
        const entries = Object.entries(status);
        if (entries.length === 0) {
          console.log(name + " — estado vacío.");
          return;
        }
        console.log(name + " — estado:");
        for (const [key, value] of entries) {
          const label = key.replace(/_/g, " ");
          console.log("  " + label + ": " + (value ?? "?"));
        }
      } catch (error) {
        console.log("Estado presente pero ilegible (" + error.message + ").");
      }
    ' "$STATUS_FILE" "$PROJECT_NAME"
  else
    echo "Estado en $STATUS_FILE (node no disponible para formatear)."
  fi
else
  echo "$PROJECT_NAME — sin estado registrado todavía."
  echo "Escribe .claude/state/status.json desde la app para ver un resumen acá."
fi

# Tarea con ledger activo en la rama actual, si hay una (rules/resumable-tasks.md).
if command -v git >/dev/null 2>&1 && git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  BRANCH="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
  if [ -n "$BRANCH" ]; then
    LEDGER_FILE="$PROJECT_DIR/.claude/state/tasks/$(echo "$BRANCH" | tr '/' '-').md"
    if [ -f "$LEDGER_FILE" ]; then
      NEXT_PENDING="$(grep -m1 '^- \[ \]' "$LEDGER_FILE" 2>/dev/null || true)"
      echo ""
      echo "Tarea activa en '$BRANCH': .claude/state/tasks/$(basename "$LEDGER_FILE")"
      if [ -n "$NEXT_PENDING" ]; then
        echo "  próximo pendiente: $NEXT_PENDING"
      else
        echo "  todos los ítems están marcados — falta cerrar el ledger."
      fi
    fi
  fi
fi
