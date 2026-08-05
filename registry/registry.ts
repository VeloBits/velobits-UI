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
      'Status panel. Defaults to polite role="status"; escalate to "alert" deliberately. Tier-S glass on the neutral variant only — the four soft washes would replace the tint.',
    dependencies: [CVA],
    registryDependencies: ['cn', 'velobits-theme'],
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
      'Tier-S glass by default; surface="panel" for the opaque original, which writes border-border explicitly so it survives an app that skipped the base layer.',
    registryDependencies: ['cn', 'velobits-theme'],
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
    description:
      'All three glass tiers behind one prop: surface (Tier S, no blur by default) · overlay · elevated. Never for page backgrounds, table rows, or nested glass.',
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

  /* ── Tier 2 — overlays. Every one of these is Tier-O glass, so each depends
   * on `velobits-theme` for `.glass`: a CLI consumer who copies the component
   * without the token layer gets an unstyled transparent box, not an error. ── */
  {
    name: 'command-palette',
    type: 'registry:ui',
    title: 'CommandPalette',
    description:
      'cmdk inside a Radix Dialog. The ⌘K listener is opt-in via `shortcut` — a design system must not bind a global key by merely being imported.',
    dependencies: ['cmdk', RADIX, '@velobits/icons'],
    registryDependencies: ['cn', 'velobits-theme'],
    files: [{ path: 'registry/velobits/ui/command-palette.tsx', type: 'registry:ui' }],
  },
  {
    name: 'dialog',
    type: 'registry:ui',
    title: 'Dialog',
    description:
      'The centred form modal. `focusFirstField` exists because autoFocus is silently swallowed by Radix FocusScope — ADR-0031.',
    dependencies: [CVA, RADIX, '@velobits/icons'],
    registryDependencies: ['cn', 'velobits-theme'],
    files: [{ path: 'registry/velobits/ui/dialog.tsx', type: 'registry:ui' }],
  },
  {
    name: 'dropdown-menu',
    type: 'registry:ui',
    title: 'DropdownMenu',
    description:
      'Highlight is data-[highlighted], never :hover — Radix drives keyboard focus through it. Cannot host a text input; use Dialog or Popover.',
    dependencies: [RADIX, '@velobits/icons'],
    registryDependencies: ['cn', 'velobits-theme'],
    files: [{ path: 'registry/velobits/ui/dropdown-menu.tsx', type: 'registry:ui' }],
  },
  {
    name: 'popover',
    type: 'registry:ui',
    title: 'Popover',
    description:
      'The elevated tier, for glass stacked on glass. PopoverTitle wires aria-labelledby — Radix content is role="dialog" with no Title part, so it is otherwise unnamed.',
    dependencies: [RADIX],
    registryDependencies: ['cn', 'velobits-theme'],
    files: [{ path: 'registry/velobits/ui/popover.tsx', type: 'registry:ui' }],
  },
  {
    name: 'side-panel',
    type: 'registry:ui',
    title: 'SidePanel',
    description:
      'The anchored reading sheet. Deliberately NOT Dialog and deliberately does NOT redirect focus — ADR-0032. The bottom variant needs a definite 75dvh.',
    dependencies: [CVA, RADIX, '@velobits/icons'],
    registryDependencies: ['cn', 'velobits-theme'],
    files: [{ path: 'registry/velobits/ui/side-panel.tsx', type: 'registry:ui' }],
  },
  {
    name: 'toast',
    type: 'registry:ui',
    title: 'Toast',
    description:
      'Variants use a logical border stripe, not a soft wash: bg-*-soft is a utility and beats --glass-bg from the components layer, flattening the tier.',
    dependencies: [CVA, RADIX, '@velobits/icons'],
    registryDependencies: ['cn', 'velobits-theme'],
    files: [{ path: 'registry/velobits/ui/toast.tsx', type: 'registry:ui' }],
  },

  /* ── Tier 3 — composites. ─────────────────────────────────────────────── */
  {
    name: 'accordion',
    type: 'registry:ui',
    title: 'Accordion',
    description:
      'The one sanctioned height animation: Radix measures --radix-accordion-content-height, so it does not thrash layout the way an unbounded height:auto transition would.',
    dependencies: [RADIX, '@velobits/icons'],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/accordion.tsx', type: 'registry:ui' }],
  },
  {
    name: 'segmented-control',
    type: 'registry:ui',
    title: 'SegmentedControl',
    description:
      'Radix ToggleGroup with a REAL disabled and a working accessible name — a div root makes an external htmlFor dangle, and pointer-events-none leaves the control focusable and unannounced.',
    dependencies: [RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/segmented-control.tsx', type: 'registry:ui' }],
  },
  {
    name: 'table',
    type: 'registry:ui',
    title: 'Table',
    description:
      'Rows are never glass — one backdrop-filter per row repaints its own backdrop region on every scroll. Surface treatment belongs on the container.',
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/table.tsx', type: 'registry:ui' }],
  },
  {
    name: 'tabs',
    type: 'registry:ui',
    title: 'Tabs',
    dependencies: [CVA, RADIX],
    registryDependencies: ['cn'],
    files: [{ path: 'registry/velobits/ui/tabs.tsx', type: 'registry:ui' }],
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
      'The base style: tokens, the cn util, the provider stack, and every Tier-1 primitive, Tier-2 overlay and Tier-3 composite. Start here.',
    dependencies: [
      CVA,
      'clsx',
      'tailwind-merge',
      RADIX,
      'cmdk',
      'framer-motion',
      '@velobits/icons',
    ],
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
