/**
 * The source of truth for `registry.json`, which `scripts/build-registry.ts`
 * writes and `shadcn build` then compiles into `apps/docs/public/r/*.json`.
 *
 * Same arrangement as shadcn/ui itself (`apps/v4/registry/*.ts` → `registry.json`),
 * and for the same reason: the theme item's `cssVars` are DERIVED from
 * `@velobits/tokens` here rather than typed twice. A palette change flows into
 * the registry on the next build, and `test/registry.test.ts` fails if
 * `registry.json` is stale.
 *
 * ## The two halves of the distribution
 *
 * Every path below is also a tsup entry point for `@velobits/ui` (generated from
 * this same list), so a component is authored once and shipped both ways:
 *
 *   npm      import { Button } from '@velobits/ui'
 *   shadcn   npx shadcn@latest add https://ui.velobits.dev/r/button.json
 *
 * Which one a consumer should use is not a matter of taste:
 *   - FixMyText MUST use npm. Module Federation needs `@velobits/ui` to be a
 *     real singleton package so the shell's TooltipProvider context reaches
 *     into each remote; copied files cannot be shared across remote boundaries.
 *   - The Keycloak login theme MUST use neither for components — it takes
 *     tokens only, via `@velobits/tokens/keycloakify.css`.
 *   - Greenfield apps and one-off surfaces are better served by the CLI, where
 *     owning the source beats carrying a dependency.
 */
import { dark, light } from '@velobits/tokens';

export type RegistryItemType =
  'registry:style' | 'registry:theme' | 'registry:ui' | 'registry:lib' | 'registry:hook';

export interface RegistryFile {
  path: string;
  type: RegistryItemType | 'registry:file';
  /** Where it lands in the consumer's tree. Required for `registry:file`. */
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: RegistryItemType;
  title?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  css?: Record<string, unknown>;
}

/** camelCase token key → CSS custom-property name, minus the `--`. */
function cssVarName(key: string): string {
  if (key === 'bg2') return 'bg2';
  if (/^chart[1-5]$/.test(key)) return `chart-${key.slice(-1)}`;
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * Generic over the token object rather than typed `Record<string, string>`:
 * `SemanticTokens` is an interface with no index signature, so it is not
 * assignable to a Record even though every one of its values is a string.
 */
function toCssVars<T extends object>(tokens: T): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [cssVarName(key), String(value)]),
  );
}

const RADIX = 'radix-ui';
const CVA = 'class-variance-authority';

/* ── Tier 0 ────────────────────────────────────────────────────────────────── */

const lib: RegistryItem[] = [
  {
    name: 'cn',
    type: 'registry:lib',
    title: 'cn',
    description:
      'Tailwind-aware class merger. Signature must stay twMerge(clsx(...)) — ToggleFlow points components.json `utils` at it.',
    dependencies: ['clsx', 'tailwind-merge'],
    files: [{ path: 'registry/velobits/lib/cn.ts', type: 'registry:lib' }],
  },
  {
    name: 'theme',
    type: 'registry:lib',
    title: 'Theme resolution',
    description:
      'React-free light/dark resolution, storage and the blocking init script. Storage key is required, never defaulted.',
    files: [{ path: 'registry/velobits/lib/theme.ts', type: 'registry:lib' }],
  },
];

const hooks: RegistryItem[] = [
  {
    name: 'use-theme',
    type: 'registry:hook',
    title: 'useTheme',
    description: 'ThemeProvider + useTheme. Honours the existing fmx_theme_mode and tf.theme keys.',
    registryDependencies: ['theme'],
    files: [{ path: 'registry/velobits/hooks/use-theme.tsx', type: 'registry:hook' }],
  },
  {
    name: 'use-media-query',
    type: 'registry:hook',
    title: 'useMediaQuery',
    description:
      'Media query subscription plus usePrefersReducedMotion. Import breakpoints from @velobits/tokens — ADR-0017.',
    files: [{ path: 'registry/velobits/hooks/use-media-query.ts', type: 'registry:hook' }],
  },
];

const providers: RegistryItem[] = [
  {
    name: 'velobits-provider',
    type: 'registry:ui',
    title: 'VelobitsProvider',
    description:
      'Mount once at the shell root: ThemeProvider + TooltipProvider + MotionConfig reducedMotion="user".',
    dependencies: ['framer-motion'],
    registryDependencies: ['use-theme', 'tooltip'],
    files: [{ path: 'registry/velobits/providers/velobits-provider.tsx', type: 'registry:ui' }],
  },
];

/* ── Tier 1 ────────────────────────────────────────────────────────────────── */

const ui: RegistryItem[] = [
  {
    name: 'alert',
    type: 'registry:ui',
    title: 'Alert',
    description:
      'Status panel. Defaults to polite role="status"; escalate to "alert" deliberately.',
    dependencies: [CVA],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/alert.tsx', type: 'registry:ui' }],
  },
  {
    name: 'avatar',
    type: 'registry:ui',
    title: 'Avatar',
    dependencies: [RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/avatar.tsx', type: 'registry:ui' }],
  },
  {
    name: 'badge',
    type: 'registry:ui',
    title: 'Badge',
    description: 'Soft washes pair with the matching text token, never with the solid fill.',
    dependencies: [CVA, RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/badge.tsx', type: 'registry:ui' }],
  },
  {
    name: 'button',
    type: 'registry:ui',
    title: 'Button',
    description:
      'Controls are radius-md. No variant paints --primary as text; `link` uses --primary-text.',
    dependencies: [CVA, RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/button.tsx', type: 'registry:ui' }],
  },
  {
    name: 'card',
    type: 'registry:ui',
    title: 'Card',
    description:
      'Writes border-border explicitly, so it survives an app that skipped the base layer.',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/card.tsx', type: 'registry:ui' }],
  },
  {
    name: 'checkbox',
    type: 'registry:ui',
    title: 'Checkbox',
    description: 'Includes the indeterminate state bulk-selection headers need.',
    dependencies: [RADIX, '@velobits/icons'],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/checkbox.tsx', type: 'registry:ui' }],
  },
  {
    name: 'field',
    type: 'registry:ui',
    title: 'Field',
    description:
      'Label/description/error wiring. Keeps BOTH ids in aria-describedby when a field has an error and a hint.',
    registryDependencies: ['cn', 'label'],
    files: [{ path: 'registry/velobits/ui/field.tsx', type: 'registry:ui' }],
  },
  {
    name: 'glass-surface',
    type: 'registry:ui',
    title: 'GlassSurface',
    description: 'The overlay tier’s shared panel. Never for page backgrounds or table rows.',
    registryDependencies: ['cn', 'velobits-theme'],
    files: [{ path: 'registry/velobits/ui/glass-surface.tsx', type: 'registry:ui' }],
  },
  {
    name: 'input',
    type: 'registry:ui',
    title: 'Input',
    description: 'border-input maps to --field-border, the half WCAG 1.4.11 gates.',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/input.tsx', type: 'registry:ui' }],
  },
  {
    name: 'kbd',
    type: 'registry:ui',
    title: 'Kbd',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/kbd.tsx', type: 'registry:ui' }],
  },
  {
    name: 'label',
    type: 'registry:ui',
    title: 'Label',
    description:
      'A real <label>, so htmlFor resolves. Non-control roots need aria-labelledby instead.',
    dependencies: [RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/label.tsx', type: 'registry:ui' }],
  },
  {
    name: 'native-select',
    type: 'registry:ui',
    title: 'NativeSelect',
    description:
      'A cva-styled native <select>. Deliberately NOT Radix Select, which is undriveable under happy-dom.',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/native-select.tsx', type: 'registry:ui' }],
  },
  {
    name: 'separator',
    type: 'registry:ui',
    title: 'Separator',
    description: 'Decorative, so it uses --border and is exempt from 1.4.11.',
    dependencies: [RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/separator.tsx', type: 'registry:ui' }],
  },
  {
    name: 'skeleton',
    type: 'registry:ui',
    title: 'Skeleton',
    description:
      'aria-hidden; pair with ONE sr-only live region rather than announcing each block.',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/skeleton.tsx', type: 'registry:ui' }],
  },
  {
    name: 'spinner',
    type: 'registry:ui',
    title: 'Spinner',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/spinner.tsx', type: 'registry:ui' }],
  },
  {
    name: 'switch',
    type: 'registry:ui',
    title: 'Switch',
    description: 'Applies immediately. Thumb translation is mirrored explicitly for RTL.',
    dependencies: [RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/switch.tsx', type: 'registry:ui' }],
  },
  {
    name: 'textarea',
    type: 'registry:ui',
    title: 'Textarea',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/textarea.tsx', type: 'registry:ui' }],
  },
  {
    name: 'tooltip',
    type: 'registry:ui',
    title: 'Tooltip',
    description:
      'TooltipProvider is required — Radix throws without it, and under Module Federation it must be a singleton.',
    dependencies: [RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/tooltip.tsx', type: 'registry:ui' }],
  },
];

/* ── Theme ─────────────────────────────────────────────────────────────────── */

const themes: RegistryItem[] = [
  {
    name: 'velobits-theme',
    type: 'registry:theme',
    title: 'VeloBits theme',
    description:
      'The full token layer as CSS variables. Every colour pair here is contrast-verified in both themes by the @velobits/tokens test suite.',
    cssVars: {
      // Static scales. `@theme` in a consumer's CSS, so these become utilities.
      theme: {
        'radius-sm': '4px',
        'radius-md': '6px',
        'radius-lg': '10px',
        'radius-xl': '14px',
        'radius-2xl': '20px',
        'radius-pill': '999px',
        'container-page': '72rem',
        'duration-micro': '120ms',
        'duration-enter': '180ms',
        'duration-overlay': '240ms',
        'duration-page': '320ms',
        'ease-out': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      light: toCssVars(light),
      dark: toCssVars(dark),
    },
  },
];

/* ── The style that installs everything at once ────────────────────────────── */

const styles: RegistryItem[] = [
  {
    name: 'velobits',
    type: 'registry:style',
    title: 'VeloBits',
    description:
      'The base style: tokens, the cn util, the provider stack and every Tier-1 primitive. Start here.',
    dependencies: [CVA, 'clsx', 'tailwind-merge', RADIX, 'framer-motion', '@velobits/icons'],
    devDependencies: ['tw-animate-css'],
    registryDependencies: [
      'velobits-theme',
      'cn',
      'theme',
      'use-theme',
      'use-media-query',
      'velobits-provider',
      ...ui.map((i) => i.name),
    ],
    files: [],
  },
];

export const registry = {
  name: 'velobits',
  homepage: 'https://ui.velobits.dev',
  items: [...styles, ...themes, ...lib, ...hooks, ...providers, ...ui],
} as const;

/** Every item that maps to a real source file — what the tsup entry map is built from. */
export const buildableItems = [...lib, ...hooks, ...providers, ...ui];
