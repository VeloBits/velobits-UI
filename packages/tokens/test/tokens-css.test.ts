import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { neutral } from '../src/palette';
import { glass } from '../src/glass';
import { themes, type SemanticTokens, type ThemeName } from '../src/semantic';

/**
 * `css/tokens.css` and `src/semantic.ts` describe the same values in two
 * languages, so they can drift , and a drift is invisible, because each half
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
  /**
   * Strip comments first so a commented-out example is never read as a value,
   * then split on `;` , NOT on newlines.
   *
   * A line-based parse silently drops any declaration prettier has wrapped, and
   * it wraps anything past 100 characters, which the three-stop tier-S shadows
   * are. "Silently" is the whole problem: a wrapped token disappears from this
   * parity check AND from the "no token escapes measurement" sweep at the same
   * time, so the CSS could drift from the TS with every test still green. Cost
   * paid once, 2026-08-06.
   */
  for (const declaration of body.replace(/\/\*[\s\S]*?\*\//g, '').split(';')) {
    const m = /^\s*(--[a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/i.exec(declaration);
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
    const themeIndependent = new Set(['--glass-blur', '--page-texture-grid']);
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
      '--glass-surface-bg-top',
      '--glass-surface-bg-bottom',
      '--glass-surface-border',
      '--glass-surface-highlight',
      '--glass-surface-shadow',
      '--shadow-sm',
      '--shadow-md',
      '--shadow-lg',
      '--shadow-overlay',
      // The page texture. Gated in `texture-css.test.ts` rather than here , it is
      // measured against a different thing from everything else in this file (the
      // page it REPLACES, per channel and per direction), because it is the only
      // token group that can invalidate other tokens' numbers without changing
      // their values. Listing it here says "has a TypeScript counterpart", which
      // is what this test actually checks; `src/texture.ts` is that counterpart.
      '--page-texture-dot',
      '--page-texture-field',
      '--page-texture-grid',
      // The control material. Gated in `controls-css.test.ts` , it is edge, light
      // and depth rather than a fill, so what needs asserting there is the
      // `none`-in-a-shadow-list trap and the light-mode asymmetry, not a ratio
      // against a surface. `src/controls.ts` is the TypeScript counterpart.
      '--control-lit',
      '--control-inset',
      '--control-shadow',
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

  /**
   * `.glass-elevated` lives in glass.css rather than as a `--glass-*` variable in
   * tokens.css, so the loop above cannot reach it , both of its values have to be
   * named here or they drift silently. That is not hypothetical: the tier was a
   * plum until 2026-08-26, and the BORDER moved with the surface when it became a
   * near-black (0.14 → 0.18, because a near-black panel leans on its edge in a way
   * a 60/255 plum did not).
   */
  it('the elevated tier surface is declared in glass.css', () => {
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8');
    expect(normalise(glassCss)).toContain(
      normalise(rgba(glass.darkElevated.surface, glass.darkElevated.alpha)),
    );
  });

  it('the elevated tier border is declared in glass.css', () => {
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8');
    expect(normalise(glassCss)).toContain(normalise(glass.darkElevated.border));
  });

  /**
   * The tier is dark-only by design , a light popover is plain tier-O white glass
   * , so the rule must never appear outside a `.dark` scope. A bare
   * `.glass-elevated` selector would repaint every light overlay.
   */
  it('the elevated tier is scoped to dark only', () => {
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8');
    // Comments first , this file documents `.glass-elevated` in prose several
    // times over, and a selector match that swallows a comment block is how this
    // assertion would quietly stop asserting anything.
    const rules = glassCss.replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = [...rules.matchAll(/([^{}]*\.glass-elevated[^{}]*)\{/g)].map((m) =>
      m[1]!.trim(),
    );
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      for (const part of selector.split(',')) {
        expect(part.trim()).toMatch(/(^|\s)(\.dark|body\.dark)(\s|\.)/);
      }
    }
  });

  it('blur radii agree', () => {
    expect(cssLight['--glass-blur']).toBe(glass.light.blur);
  });

  /**
   * Tier S is five variables per theme rather than tier O's three, and the
   * loop above only walks `SemanticTokens` , so none of them are auto-discovered
   * and each has to be named here. The `known` set in the test above is what
   * stops the reverse mistake (a CSS-only variable that never reaches the TS
   * layer and so escapes the contrast and perceptibility gates).
   */
  const SURFACE_THEMES = [
    ['light', cssLight, glass.surfaceLight],
    ['dark', cssDark, glass.surfaceDark],
  ] as const;

  for (const [theme, declarations, tier] of SURFACE_THEMES) {
    it(`${theme} --glass-surface-bg-top matches the tier-S near stop`, () => {
      expect(normalise(declarations['--glass-surface-bg-top']!)).toBe(
        normalise(rgba(tier.surface, tier.alpha)),
      );
    });

    it(`${theme} --glass-surface-bg-bottom matches the tier-S far stop`, () => {
      expect(normalise(declarations['--glass-surface-bg-bottom']!)).toBe(
        normalise(rgba(tier.surfaceBottom, tier.alpha)),
      );
    });

    it(`${theme} --glass-surface-border matches`, () => {
      expect(normalise(declarations['--glass-surface-border']!)).toBe(normalise(tier.border));
    });

    it(`${theme} --glass-surface-highlight matches`, () => {
      expect(normalise(declarations['--glass-surface-highlight']!)).toBe(normalise(tier.highlight));
    });

    it(`${theme} --glass-surface-shadow matches`, () => {
      expect(normalise(declarations['--glass-surface-shadow']!)).toBe(normalise(tier.shadow));
    });
  }

  it('glass.css composes BOTH sheen stops into the tier-S gradient', () => {
    /**
     * The two stops are gated individually, which is the point of them being two
     * variables , but a stop that is declared and never referenced is gated and
     * invisible at the same time, which is worse than an ungated one: the suite
     * goes green while the surface renders as a flat fill of whichever stop the
     * gradient does mention.
     */
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    expect(glassCss).toContain('linear-gradient(');
    for (const stop of ['--glass-surface-bg-top', '--glass-surface-bg-bottom']) {
      expect(glassCss, `${stop} is declared in tokens.css but never painted`).toContain(
        `var(${stop})`,
      );
    }
  });

  it('both degradation paths neutralise the sheen, not just the blur', () => {
    /**
     * The degradation blocks fall the tier back to an opaque `--panel`. They do
     * that with the `background` SHORTHAND, which resets `background-image` to
     * `none` and takes the gradient with it.
     *
     * Spelled `background-color` instead, the translucent gradient would survive
     * on top of the opaque colour and the fallback would render as glass over
     * panel , for users on a browser without `backdrop-filter`, or users who
     * explicitly asked for less transparency. Both are the cases the fallback
     * exists for, and neither would be seen by anyone developing on Chrome with
     * default settings.
     */
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    for (const marker of ['@supports not', 'prefers-reduced-transparency']) {
      const start = glassCss.indexOf(marker);
      const body = glassCss.slice(start, glassCss.indexOf('\n}', start));
      expect(
        /(^|[\s;{])background:\s*var\(--panel\)/.test(body),
        `the ${marker} block must use the \`background\` shorthand to clear the sheen gradient; ` +
          `\`background-color\` would leave the translucent stops painted over it`,
      ).toBe(true);
    }
  });

  it('no tier-S shadow is spelled `none`', () => {
    /**
     * `.glass-surface` composes `--glass-surface-highlight` and
     * `--glass-surface-shadow` into ONE comma-separated `box-shadow`, and `none`
     * inside a shadow list is invalid CSS , the browser drops the whole
     * declaration, so dark mode would silently lose its specular top edge, its
     * only material. Dark's "no shadow" is therefore `0 0 0 transparent`.
     */
    for (const [theme, declarations, tier] of SURFACE_THEMES) {
      expect(tier.shadow, `glass.surface${theme} shadow`).not.toBe('none');
      expect(declarations['--glass-surface-shadow'], `${theme} --glass-surface-shadow`).not.toBe(
        'none',
      );
    }
  });

  it('glass.css declares the tier-S classes and does NOT blur the plain one', () => {
    /**
     * The performance half of the two-tier model, asserted rather than trusted:
     * `.glass-surface` goes on repeated components (a list of Cards), so it must
     * be background + border + shadow with no `backdrop-filter`. Only
     * `.glass-surface-blur` , sticky bars, sidebars , pays for a backdrop
     * snapshot.
     */
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8');
    const rules = glassCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).toContain('.glass-surface');
    expect(rules).toContain('.glass-surface-blur');

    // The only rule that may mention backdrop-filter alongside .glass-surface is
    // the blurred variant and the two degradation blocks (which set it to none).
    const blurring = rules
      .split('}')
      .filter((r) => /backdrop-filter:\s*blur/.test(r))
      .map((r) => r.split('{')[0]!.trim());
    for (const selector of blurring) {
      expect(
        /(^|,)\s*\.glass-surface\s*(,|$)/.test(selector),
        `"${selector}" applies a blur to the plain .glass-surface, which is used on repeated ` +
          `components , every instance becomes a live backdrop snapshot.`,
      ).toBe(false);
    }
  });

  it('both degradation paths cover every glass class', () => {
    /**
     * A new glass class that nobody added to these two blocks keeps its
     * translucency for users who asked for less of it, and reads as a
     * washed-out panel with page content bleeding through on browsers without
     * `backdrop-filter`. The tier degrades as ONE material , a sticky bar going
     * opaque while the cards under it stay translucent is worse than either.
     */
    // Comments stripped first: glass.css documents both markers in prose, and
    // a raw indexOf finds the sentence ABOUT the block before the block itself.
    const glassCss = readFileSync(join(here, '../css/glass.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    for (const marker of ['@supports not', 'prefers-reduced-transparency']) {
      const start = glassCss.indexOf(marker);
      expect(start, `${marker} block is missing from glass.css`).toBeGreaterThan(-1);
      const body = glassCss.slice(start, glassCss.indexOf('\n}', start));
      for (const cls of ['.glass', '.glass-surface', '.glass-surface-blur']) {
        expect(body, `${cls} is not covered by the ${marker} block`).toContain(cls);
      }
      expect(body).toContain('var(--panel)');
    }
  });
});

describe('the dark selector list covers both toggle conventions', () => {
  it('matches body.dark (apps) AND bare .dark (Keycloak html.dark)', () => {
    /**
     * the editor app and the dashboard app toggle `body.dark`; the Keycloak login theme
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
     * trap 1, and the single most expensive mistake in this file. A
     * `@theme` variable is emitted as a real `:root` declaration, so
     * `var(--color-border)` resolves against `:root` , the light value , and
     * then inherits everywhere, so `body.dark` never reaches it.
     */
    const themeCss = readFileSync(join(here, '../css/theme.css'), 'utf8');
    expect(themeCss).toContain('border-color: var(--border, currentColor)');
    expect(themeCss).not.toContain('border-color: var(--color-border');
  });
});
