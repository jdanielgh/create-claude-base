/**
 * Registro de presets.
 *
 * `skills` lista skills externas que NO se copian: se instalan con el CLI
 * `npx skills add`, porque son de terceros y se actualizan por su cuenta.
 * Duplicarlas dentro de esta plantilla las dejaría congeladas en la versión
 * del día que se copiaron.
 */

export const PRESETS = {
  minimal: {
    label: 'minimal — solo la base (rules, agents, commands, hooks)',
    description: 'Sin nada específico de stack. Punto de partida para algo que no encaja en los otros presets.',
    skills: [],
  },

  mobile: {
    label: 'mobile — app móvil (React Native / SwiftUI / Flutter)',
    description: 'Diseño moderno y minimalista, convenciones nativas de iOS/Android, accesibilidad.',
    skills: [
      {
        name: 'ui-ux-pro-max',
        source: 'nextlevelbuilder/ui-ux-pro-max-skill',
        why: 'Único del top que cubre SwiftUI, React Native y Flutter. Paletas, tipografía y guías de UX.',
      },
      {
        name: 'minimalist-ui',
        source: 'leonxlnx/taste-skill',
        why: 'Estética editorial minimalista: monocromo cálido, sin gradientes ni sombras pesadas.',
      },
      {
        name: 'mobile-app-ui-design',
        source: 'ceorkm/mobile-app-ui-design',
        why: 'Grid de 8pt, regla 60/30/10, thumb-zone. Patrones de pantalla concretos.',
      },
    ],
  },

  web: {
    label: 'web — frontend / dashboard',
    description: 'Mismo criterio visual que mobile, pero orientado a web y componentes.',
    skills: [
      {
        name: 'ui-ux-pro-max',
        source: 'nextlevelbuilder/ui-ux-pro-max-skill',
        why: 'Base de estilos, paletas y pares tipográficos por stack.',
      },
      {
        name: 'minimalist-ui',
        source: 'leonxlnx/taste-skill',
        why: 'Evita el look genérico de interfaz generada por IA.',
      },
      {
        name: 'impeccable',
        source: 'pbakaus/impeccable',
        why: 'Crítica y pulido de interfaces ya construidas, no solo generación.',
      },
    ],
  },

  backend: {
    label: 'backend — API / servicio',
    description: 'Diseño de API, modelo de datos, migraciones y errores.',
    skills: [],
  },

  'data-rag': {
    label: 'data-rag — pipeline de datos con recuperación semántica',
    description: 'Ingesta, embeddings, recuperación y control de costo de IA.',
    skills: [],
  },
};

export const PRESET_NAMES = Object.keys(PRESETS);
export const DEFAULT_PRESET = 'minimal';

export function isPreset(name) {
  return Object.hasOwn(PRESETS, name);
}

/** Comando `npx skills add` para una skill del registro. */
export function skillCommand(skill) {
  return `npx -y skills add ${skill.source} --skill ${skill.name} --agent claude-code`;
}
