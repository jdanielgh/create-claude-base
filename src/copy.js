import { readdir, mkdir, readFile, writeFile, stat, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Extensiones a las que se les aplica sustitución de placeholders. */
const TEMPLATED = new Set(['.md', '.json', '.sh', '.txt', '.yml', '.yaml']);

/**
 * Copia recursiva de `from` a `to`.
 *
 * Nunca sobrescribe un archivo existente salvo `force`. Es deliberado: el
 * caso normal es correr esto sobre un repo que ya tiene un CLAUDE.md a medio
 * escribir, y perderlo en silencio sería el peor fallo posible de esta
 * herramienta.
 *
 * `exclude` lleva rutas relativas a `from` que no se copian — sirve para los
 * archivos que el CLI trata aparte, como el mcp.json del preset, que se
 * fusiona con el del proyecto en vez de copiarse tal cual.
 *
 * Devuelve { written: string[], skipped: string[] } con rutas relativas.
 */
export async function copyTree(from, to, { vars = {}, force = false, exclude = [] } = {}) {
  const written = [];
  const skipped = [];
  const excluded = new Set(exclude.map((file) => path.normalize(file)));

  async function walk(srcDir, destDir) {
    const entries = await readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const src = path.join(srcDir, entry.name);
      if (excluded.has(path.normalize(path.relative(from, src)))) continue;
      const dest = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        await mkdir(dest, { recursive: true });
        await walk(src, dest);
        continue;
      }

      const rel = path.relative(to, dest).split(path.sep).join('/');

      if (existsSync(dest) && !force) {
        skipped.push(rel);
        continue;
      }

      const ext = path.extname(entry.name);
      if (TEMPLATED.has(ext)) {
        const raw = await readFile(src, 'utf8');
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, applyVars(raw, vars), 'utf8');
      } else {
        const raw = await readFile(src);
        await mkdir(path.dirname(dest), { recursive: true });
        await writeFile(dest, raw);
      }

      // Los hooks tienen que quedar ejecutables en Unix; en Windows es no-op.
      if (ext === '.sh') {
        try {
          const mode = (await stat(dest)).mode;
          await chmod(dest, mode | 0o111);
        } catch {
          // chmod no soportado: Claude Code igual los invoca con `bash <ruta>`.
        }
      }

      written.push(rel);
    }
  }

  await mkdir(to, { recursive: true });
  await walk(from, to);
  return { written, skipped };
}

/** Sustituye {{CLAVE}} por su valor. Una clave sin valor se deja intacta. */
export function applyVars(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.hasOwn(vars, key) ? String(vars[key]) : match,
  );
}

/**
 * Fusiona el .mcp.json de un preset con el que ya exista en el proyecto.
 * Un servidor ya presente gana: el usuario pudo haberlo configurado a mano.
 */
export async function mergeMcpConfig(presetFile, projectFile) {
  if (!existsSync(presetFile)) return null;

  const incoming = JSON.parse(await readFile(presetFile, 'utf8'));
  let current = { mcpServers: {} };

  if (existsSync(projectFile)) {
    try {
      current = JSON.parse(await readFile(projectFile, 'utf8'));
    } catch {
      throw new Error(
        `${path.basename(projectFile)} existe pero no es JSON válido. Arréglalo o muévelo antes de continuar.`,
      );
    }
  }

  current.mcpServers ??= {};
  const added = [];
  for (const [name, config] of Object.entries(incoming.mcpServers ?? {})) {
    if (Object.hasOwn(current.mcpServers, name)) continue;
    current.mcpServers[name] = config;
    added.push(name);
  }

  if (added.length === 0) return { added };

  await writeFile(projectFile, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
  return { added };
}
