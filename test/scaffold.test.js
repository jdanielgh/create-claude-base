import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { applyVars, copyTree, mergeMcpConfig } from '../src/copy.js';
import { PRESETS, PRESET_NAMES, skillCommand } from '../src/presets.js';

const ROOT = path.resolve(import.meta.dirname, '..');

async function tempDir() {
  return mkdtemp(path.join(tmpdir(), 'ccb-'));
}

test('applyVars sustituye lo conocido y deja intacto lo demás', () => {
  const out = applyVars('{{PROJECT_NAME}} usa {{STACK}}', { PROJECT_NAME: 'demo' });
  assert.equal(out, 'demo usa {{STACK}}');
});

test('la base se copia con los placeholders resueltos', async () => {
  const dir = await tempDir();
  const { written } = await copyTree(path.join(ROOT, 'template', 'base'), dir, {
    vars: { PROJECT_NAME: 'demo', PRESET: 'minimal', DATE: '2026-08-06' },
  });

  assert.ok(written.length > 0);
  assert.ok(existsSync(path.join(dir, '.claude', 'settings.json')));
  assert.ok(existsSync(path.join(dir, '.claude', 'hooks', 'checkpoint.sh')));

  const claudeMd = await readFile(path.join(dir, '.claude', 'CLAUDE.md'), 'utf8');
  assert.match(claudeMd, /# Proyecto: demo/);
  assert.doesNotMatch(claudeMd, /\{\{PROJECT_NAME\}\}/);
});

test('settings.json de la plantilla es JSON válido', async () => {
  const raw = await readFile(path.join(ROOT, 'template', 'base', '.claude', 'settings.json'), 'utf8');
  assert.doesNotThrow(() => JSON.parse(raw));
});

test('no sobrescribe un archivo existente salvo force', async () => {
  const dir = await tempDir();
  await mkdir(path.join(dir, '.claude'), { recursive: true });
  await writeFile(path.join(dir, '.claude', 'CLAUDE.md'), 'MIO', 'utf8');

  const first = await copyTree(path.join(ROOT, 'template', 'base'), dir, { vars: { PROJECT_NAME: 'x' } });
  assert.ok(first.skipped.includes('.claude/CLAUDE.md'));
  assert.equal(await readFile(path.join(dir, '.claude', 'CLAUDE.md'), 'utf8'), 'MIO');

  await copyTree(path.join(ROOT, 'template', 'base'), dir, { vars: { PROJECT_NAME: 'x' }, force: true });
  assert.notEqual(await readFile(path.join(dir, '.claude', 'CLAUDE.md'), 'utf8'), 'MIO');
});

test('gitignore de la plantilla se copia como .gitignore', async () => {
  // npm no publica archivos llamados `.gitignore`: si la plantilla lo
  // guardara con punto, el proyecto generado desde npm se quedaría sin él
  // y .claude/state/ terminaría versionado.
  assert.ok(!existsSync(path.join(ROOT, 'template', 'base', '.claude', '.gitignore')));

  const dir = await tempDir();
  await copyTree(path.join(ROOT, 'template', 'base'), dir, { vars: { PROJECT_NAME: 'x' } });

  const written = path.join(dir, '.claude', '.gitignore');
  assert.ok(existsSync(written));
  assert.match(await readFile(written, 'utf8'), /^state\/$/m);
  assert.ok(!existsSync(path.join(dir, '.claude', 'gitignore')));
});

test('los hooks se copian con shebang y sin CRLF', async () => {
  const dir = await tempDir();
  await copyTree(path.join(ROOT, 'template', 'base'), dir, { vars: { PROJECT_NAME: 'x' } });

  for (const hook of ['checkpoint.sh', 'session-start.sh']) {
    const content = await readFile(path.join(dir, '.claude', 'hooks', hook), 'utf8');
    assert.ok(content.startsWith('#!/usr/bin/env bash'), `${hook} sin shebang`);
    // Un \r en el shebang rompe el hook en Linux/macOS con "bad interpreter".
    assert.ok(!content.includes('\r'), `${hook} tiene CRLF`);
  }
});

test('mergeMcpConfig respeta un servidor ya configurado', async () => {
  const dir = await tempDir();
  const target = path.join(dir, '.mcp.json');
  await writeFile(target, JSON.stringify({ mcpServers: { figma: { url: 'mio' } } }), 'utf8');

  const result = await mergeMcpConfig(path.join(ROOT, 'template', 'presets', 'mobile', 'mcp.json'), target);
  assert.deepEqual(result.added, []);

  const merged = JSON.parse(await readFile(target, 'utf8'));
  assert.equal(merged.mcpServers.figma.url, 'mio');
});

test('mergeMcpConfig añade el servidor del preset cuando no hay archivo', async () => {
  const dir = await tempDir();
  const target = path.join(dir, '.mcp.json');

  const result = await mergeMcpConfig(path.join(ROOT, 'template', 'presets', 'mobile', 'mcp.json'), target);
  assert.deepEqual(result.added, ['figma']);
  assert.ok(JSON.parse(await readFile(target, 'utf8')).mcpServers.figma);
});

test('cada preset con directorio propio se copia sin dejar placeholders', async () => {
  for (const name of PRESET_NAMES) {
    const presetDir = path.join(ROOT, 'template', 'presets', name);
    if (!existsSync(presetDir)) continue;

    const dir = await tempDir();
    const { written } = await copyTree(presetDir, dir, {
      vars: { PROJECT_NAME: 'demo', PRESET: name, DATE: '2026-08-06' },
      exclude: ['mcp.json'],
    });

    // El mcp.json del preset se fusiona en .mcp.json; copiarlo tal cual
    // dejaría un archivo suelto que Claude Code no lee.
    assert.ok(!existsSync(path.join(dir, 'mcp.json')), `${name} copió mcp.json en vez de fusionarlo`);

    for (const file of written) {
      if (!file.endsWith('.md')) continue;
      const content = await readFile(path.join(dir, file), 'utf8');
      assert.doesNotMatch(content, /\{\{PROJECT_NAME\}\}/, `${name}/${file} quedó con placeholder`);
    }
  }
});

test('el comando de instalación de skills está bien formado', () => {
  for (const skill of PRESETS.mobile.skills) {
    assert.match(skillCommand(skill), /^npx -y skills add \S+ --skill \S+ --agent claude-code$/);
  }
});
