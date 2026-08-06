import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

/** Sin dependencias a propósito: `npx` de un paquete sin deps arranca al instante. */

let rl = null;

function iface() {
  rl ??= readline.createInterface({ input: stdin, output: stdout });
  return rl;
}

export function closePrompts() {
  rl?.close();
  rl = null;
}

export function isInteractive() {
  return stdin.isTTY === true && stdout.isTTY === true;
}

export async function ask(question, fallback = '') {
  const suffix = fallback ? ` (${fallback})` : '';
  const answer = (await iface().question(`  ${question}${suffix}: `)).trim();
  return answer || fallback;
}

export async function confirm(question, fallback = true) {
  const hint = fallback ? 'S/n' : 's/N';
  const answer = (await iface().question(`  ${question} [${hint}]: `)).trim().toLowerCase();
  if (!answer) return fallback;
  return answer === 's' || answer === 'si' || answer === 'sí' || answer === 'y' || answer === 'yes';
}

/** `options` es [{ value, label }]. Devuelve el `value` elegido. */
export async function select(question, options, fallbackValue) {
  console.log(`\n  ${question}\n`);
  options.forEach((option, index) => {
    const mark = option.value === fallbackValue ? '*' : ' ';
    console.log(`   ${mark} ${index + 1}) ${option.label}`);
  });
  console.log('');

  const fallbackIndex = options.findIndex((o) => o.value === fallbackValue) + 1;
  while (true) {
    const raw = (await iface().question(`  Elige 1-${options.length} (${fallbackIndex}): `)).trim();
    if (!raw) return fallbackValue;
    const index = Number.parseInt(raw, 10);
    if (Number.isInteger(index) && index >= 1 && index <= options.length) {
      return options[index - 1].value;
    }
    console.log(`  Valor fuera de rango.`);
  }
}
