import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { neutral } from '../src/palette';
import { glass } from '../src/glass';
import { themes, type SemanticTokens, type ThemeName } from '../src/semantic';

/**
 * `css/tokens.css` and `src/semantic.ts` describe the same values in two
 * languages, so they can drift — and a drift is invisible, because each half
 * looks correct on its own. This test makes them one source of truth in effect
 * if not in form: the CSS is parsed and compared value-by-value against the TS.
 *
 * Two-way, deliberately. A token present in one and missing from the other is a
 * failure in both directions: TS-only means the CSS never ships it, CSS-only
 * means it escapes the contrast gate.
 */

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../css/tokens.css'), 'utf8');

/** Extract the declarations of one rule, given a selector that starts it. */
function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Selector not found in tokens.css: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n}', open);
  const body = css.slice(open + 1, close);

  const out: Record<string, string> = {};
  // Strip comments first so a commented-out example is never read as a value.
  for (const line of body.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')) {
    const m = /^\s*(--[a-z0-9-]+)\s*:\s*(.+?);\s*$/i.exec(line);
    if (m) out[m[1]!] = m[2]!;
  }
  return out;
}

const cssLight = block(':root {');
const cssDark = block('.dark,\nbody.dark {');

/**
 * camelCase token key → CSS custom property name. The two irregular cases are
 * spelled out rather than inferred: `bg2` keeps its digit attached, the chart
 * series separate theirs.
 */
const IRREGULAR: Partial<Record<keyof SemanticTokens, string>> = {
  bg2: '--bg2',
  chart1: '--chart-1',
  chart2: '--chart-2',
  chart3: '--chart-3',
  chart4: '--chart-4',
  chart5: '--chart-5',
};

function cssName(key: keyof SemanticTokens): string {
  return IRREGULAR[key] ?? `--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/** Canonicalise for comparison: case, whitespace and `0.10` vs `0.1`. */
function normalise(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(-?\d*\.?\d+)/g, (n) => String(Number(n)))
    .replace(/,\s*/g, ',');
}

const THEMES: [ThemeName, Record<string, string>][] = [
  ['light', cssLight],
  ['dark', cssDark],
];

describe('tokens.css agrees with semantic.ts', () => {
  for (const [theme, declarations] of THEMES) {
    describe(theme, () => {
      for (const [key, tsValue] of Object.entries(themes[theme]) as [
        keyof SemanticTokens,
        string,
      ][]) {
        const name = cssName(key);
        it(`${name} matches semantic.${theme}.${key}`, () => {
          expect(
            declarations[name],
            `${name} is missing from the ${theme} block of css/tokens.css`,
          ).toBeDefined();
          expect(normalise(declarations[name]!)).toBe(normalise(tsValue));
        });
      }
    });
  }

  it('the dark block overrides every token the light block declares', () => {
    /**
     * A token declared only on `:root` inherits its LIGHT value into dark mode
     * and looks like a palette bug. The exceptions are the static, non-colour
     * values that are genuinely theme-independent.
     */
    const themeIndependent = new Set(['--glass-blur']);
    const rampNames = Object.keys(neutral).map((s) => `--neutral-${s}`);

    const missing = Object.keys(cssLight).filter(
      (name) => !(name in cssDark) && !themeIndependent.has(name) && !rampNames.includes(name),
    );
    expect(
      missing,
      `Declared for light but never overridden for dark: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('the CSS declares no colour token that the TS layer does not know about', () => {
    const known = new Set([
      ...Object.keys(themes.light).map((k) => cssName(k as keyof SemanticTokens)),
      ...Object.keys(neutral).map((s) => `--neutral-${s}`),
      '--glass-bg',
      '--glass-blur',
      '--glass-border',
      '--shadow-sm',
      '--shadow-md',
      '--shadow-lg',
      '--shadow-overlay',
    ]);
    const unknown = Object.keys({ ...cssLight, ...cssDark }).filter((n) => !known.has(n));
    expect(
      unknown,
      `tokens.css declares variables with no TypeScript counterpart, so they escape the ` +
        `contrast gate: ${unknown.join(', ')}`,
    ).toEqual([]);
  });
});

describe('the neutral ramp is emitted verbatim', () => {
  for (const [step, hex] of Object.entries(neutral)) {
    it(`--neutral-${step} is ${hex}`, () => {
      expect(cssLight[`--neutral-${step}`]?.toUpperCase()).toBe(hex);
    });
  }
});

describe('glass CSS agrees with glass.ts', () => {
  const rgba = (hex: string, alpha: number) => {
    const n = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  it('light --glass-bg matches the light tier', () => {
    expect(normalise(cssLight['--glass-bg']!)).toBe(
      normalise(rgba(glass.light.surface, glass.light.alpha)),
    );
  });

  it('dark --glass-bg matches the dark tier', () => {
    expect(normalise(cssDark['--glass-bg']!)).toBe(
      normalise(rgba(glass.dark.surface, glass.dark.alpha)),
    );
  });

  it('the plum elevated tier is declared in glass.css', () => {
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8');
    expect(normalise(glassCss)).toContain(
      normalise(rgba(glass.darkElevated.surface, glass.darkElevated.alpha)),
    );
  });

  it('blur radii agree', () => {
    expect(cssLight['--glass-blur']).toBe(glass.light.blur);
  });
});

describe('the dark selector list covers both toggle conventions', () => {
  it('matches body.dark (apps) AND bare .dark (Keycloak html.dark)', () => {
    /**
     * FixMyText and ToggleFlow toggle `body.dark`; the Keycloak login theme
     * toggles `html.dark`. Dropping either half silently breaks dark mode for
     * one of the four surfaces.
     */
    expect(css).toContain('.dark,\nbody.dark');
  });

  it('theme.css declares the matching @custom-variant', () => {
    const themeCss = readFileSync(join(here, '../css/theme.css'), 'utf8');
    expect(themeCss).toContain('@custom-variant dark (&:where(.dark, .dark *))');
  });

  it('the base border reset uses --border, NOT --color-border', () => {
    /**
     * ADR-0031 trap 1, and the single most expensive mistake in this file. A
     * `@theme` variable is emitted as a real `:root` declaration, so
     * `var(--color-border)` resolves against `:root` — the light value — and
     * then inherits everywhere, so `body.dark` never reaches it.
     */
    const themeCss = readFileSync(join(here, '../css/theme.css'), 'utf8');
    expect(themeCss).toContain('border-color: var(--border, currentColor)');
    expect(themeCss).not.toContain('border-color: var(--color-border');
  });
});
