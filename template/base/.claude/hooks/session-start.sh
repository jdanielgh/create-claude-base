#!/usr/bin/env bash
# Hook determinista, sin llamadas al modelo. Corre en SessionStart.
#
# Imprime un readout corto para que la sesión arranque orientada sin tener
# que releer código ni historial. Este hook SOLO LEE: el archivo de estado
# lo escribe la aplicación (o los scripts de mantenimiento) después de cada
# corrida.
#
# El esquema de status.json es libre: se imprime cada clave de primer nivel
# tal cual. Empieza con algo como:
#   { "last_run_at": "...", "records": 0, "pending": 0 }
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
STATUS_FILE="$PROJECT_DIR/.claude/state/status.json"
PROJECT_NAME="{{PROJECT_NAME}}"

if [ ! -f "$STATUS_FILE" ]; then
  echo "$PROJECT_NAME — sin estado registrado todavía."
  echo "Escribe .claude/state/status.json desde la app para ver un resumen acá."
  exit 0
fi

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
