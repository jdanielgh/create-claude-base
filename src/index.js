import path from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { PRESETS, PRESET_NAMES, DEFAULT_PRESET, isPreset, skillCommand } from './presets.js';
import { copyTree, mergeMcpConfig } from './copy.js';
import { ask, confirm, select, isInteractive, closePrompts } from './prompt.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(ROOT, 'template');

const HELP = `
  create-claude-base — base de Claude Code para un proyecto nuevo

  Uso:
    npx create-claude-base [directorio] [opciones]

  Opciones:
    --preset=<nombre>   ${PRESET_NAMES.join(' | ')}
    --name=<nombre>     Nombre del proyecto para CLAUDE.md (default: el del directorio)
    --yes, -y           Sin preguntas, usa los valores por defecto
    --force             Sobrescribe archivos existentes (por defecto los respeta)
    --install-skills    Instala las skills externas del preset sin preguntar
    --no-skills         No instala skills externas ni pregunta
    --list              Muestra los presets y qué trae cada uno
    --help, -h          Esta ayuda
`;

export async function main(argv) {
  const flags = parseArgs(argv);

  if (flags.help) {
    console.log(HELP);
    return;
  }

  if (flags.list) {
    printPresets();
    return;
  }

  const version = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8')).version;
  console.log(`\n  create-claude-base v${version}\n`);

  const interactive = isInteractive() && !flags.yes;

  try {
    const targetDir = path.resolve(process.cwd(), flags.dir ?? '.');
    const defaultName = path.basename(targetDir);

    const preset = await resolvePreset(flags, interactive);
    const projectName = flags.name ?? (interactive ? await ask('Nombre del proyecto', defaultName) : defaultName);

    const vars = {
      PROJECT_NAME: projectName,
      PRESET: preset,
      DATE: new Date().toISOString().slice(0, 10),
    };

    console.log(`\n  Preset: ${preset}`);
    console.log(`  Destino: ${targetDir}\n`);

    const base = await copyTree(path.join(TEMPLATE, 'base'), targetDir, { vars, force: flags.force });
    const presetDir = path.join(TEMPLATE, 'presets', preset);
    const extra = existsSync(presetDir)
      ? await copyTree(presetDir, targetDir, { vars, force: flags.force, exclude: ['mcp.json'] })
      : { written: [], skipped: [] };

    const written = [...base.written, ...extra.written];
    const skipped = [...base.skipped, ...extra.skipped];

    // .mcp.json se fusiona, no se copia: puede existir uno del usuario.
    const mcp = await mergeMcpConfig(path.join(presetDir, 'mcp.json'), path.join(targetDir, '.mcp.json'));

    report(written, skipped, mcp);
    await maybeInstallSkills(PRESETS[preset].skills, flags, interactive, targetDir);
    printNextSteps(preset, targetDir);
  } finally {
    closePrompts();
  }
}

async function resolvePreset(flags, interactive) {
  if (flags.preset) {
    if (!isPreset(flags.preset)) {
      throw new Error(`Preset desconocido: "${flags.preset}". Disponibles: ${PRESET_NAMES.join(', ')}`);
    }
    return flags.preset;
  }
  if (!interactive) return DEFAULT_PRESET;

  return select(
    '¿Qué tipo de proyecto es?',
    PRESET_NAMES.map((value) => ({ value, label: PRESETS[value].label })),
    DEFAULT_PRESET,
  );
}

async function maybeInstallSkills(skills, flags, interactive, cwd) {
  if (skills.length === 0) return;

  console.log(`\n  El preset recomienda ${skills.length} skills externas:\n`);
  for (const skill of skills) {
    console.log(`   · ${skill.name} — ${skill.why}`);
  }
  console.log('');

  if (flags.noSkills) {
    console.log('  Omitidas (--no-skills). Para instalarlas después:\n');
    for (const skill of skills) console.log(`    ${skillCommand(skill)}`);
    return;
  }

  let install = flags.installSkills;
  if (!install) {
    if (!interactive) {
      console.log('  Sin TTY: no se instalan. Corre estos comandos cuando quieras:\n');
      for (const skill of skills) console.log(`    ${skillCommand(skill)}`);
      return;
    }
    install = await confirm('¿Instalarlas ahora? (descarga desde npm)', true);
  }

  if (!install) {
    console.log('\n  Saltadas. Comandos para después:\n');
    for (const skill of skills) console.log(`    ${skillCommand(skill)}`);
    return;
  }

  for (const skill of skills) {
    console.log(`\n  → instalando ${skill.name}`);
    const result = spawnSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['-y', 'skills', 'add', skill.source, '--skill', skill.name, '--agent', 'claude-code'],
      { cwd, stdio: 'inherit', shell: process.platform === 'win32' },
    );
    if (result.status !== 0) {
      console.log(`  ⚠ falló ${skill.name}. Reintenta a mano:\n    ${skillCommand(skill)}`);
    }
  }
}

function report(written, skipped, mcp) {
  console.log(`  ${written.length} archivos escritos.`);
  if (mcp?.added?.length) {
    console.log(`  .mcp.json: añadidos ${mcp.added.join(', ')}.`);
  }
  if (skipped.length > 0) {
    console.log(`\n  ${skipped.length} respetados porque ya existían (usa --force para sobrescribir):`);
    for (const file of skipped.slice(0, 10)) console.log(`   · ${file}`);
    if (skipped.length > 10) console.log(`   · … y ${skipped.length - 10} más`);
  }
}

function printPresets() {
  console.log('\n  Presets disponibles:\n');
  for (const name of PRESET_NAMES) {
    const preset = PRESETS[name];
    console.log(`  ${name}`);
    console.log(`    ${preset.description}`);
    if (preset.skills.length > 0) {
      console.log(`    skills: ${preset.skills.map((s) => s.name).join(', ')}`);
    }
    console.log('');
  }
}

function printNextSteps(preset, targetDir) {
  console.log(`
  Listo. Siguientes pasos:

    1. Abre .claude/CLAUDE.md y completa el stack y las reglas del proyecto.
       Está escrito con huecos a propósito — un CLAUDE.md genérico no sirve.
    2. Revisa .claude/rules/ y borra lo que no aplique. Cada regla que sobra
       es contexto que se paga en cada turno.
    3. Corre \`claude\` en ${path.basename(targetDir)} y verifica con /agents,
       /context y /mcp que todo cargó.
`);
  if (preset === 'mobile' || preset === 'web') {
    console.log(`  El preset ${preset} añadió Figma como MCP en .mcp.json.
  Requiere autorizar el servidor la primera vez (/mcp dentro de Claude Code).
`);
  }
}

function parseArgs(argv) {
  const flags = { dir: null };
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg === '--list') flags.list = true;
    else if (arg === '--yes' || arg === '-y') flags.yes = true;
    else if (arg === '--force') flags.force = true;
    else if (arg === '--install-skills') flags.installSkills = true;
    else if (arg === '--no-skills') flags.noSkills = true;
    else if (arg.startsWith('--preset=')) flags.preset = arg.slice('--preset='.length);
    else if (arg.startsWith('--name=')) flags.name = arg.slice('--name='.length);
    else if (arg.startsWith('-')) throw new Error(`Opción desconocida: ${arg}`);
    else flags.dir ??= arg;
  }
  return flags;
}
