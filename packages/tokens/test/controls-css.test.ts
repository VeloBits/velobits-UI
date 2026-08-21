import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, round2 } from '../src/color';
import { controls } from '../src/controls';
import { themes, type ThemeName } from '../src/semantic';

/**
 * The control material is edge, light and depth , never a fill , so almost none of
 * it is gated by contrast. What IS worth asserting is the set of things that fail
 * SILENTLY: the `none`-in-a-shadow-list trap, the light-mode asymmetry, and the
 * degradation path.
 */

const here = dirname(fileURLToPath(import.meta.url));
const controlsCss = readFileSync(join(here, '../css/controls.css'), 'utf8');
const tokensCss = readFileSync(join(here, '../css/tokens.css'), 'utf8');
const THEMES: ThemeName[] = ['light', 'dark'];

/** Parse `rgba(r, g, b, a)`, the only translucent spelling these tokens use. */
function parseRgba(css: string): { hex: string; alpha: number } {
  const m = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(css);
  if (!m) throw new Error(`Not an rgba() colour: ${css}`);
  const hex =
    '#' +
    [1, 2, 3]
      .map((i) => Number(m[i]).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  return { hex, alpha: Number(m[4]!) };
}

describe('THE `none` TRAP , a control shadow may never be spelled `none`', () => {
  /**
   * `.control-raised` composes `--control-lit` and `--control-shadow` into ONE
   * comma-separated `box-shadow`. `none` inside such a list is invalid CSS, so the
   * browser drops the WHOLE declaration , which would take dark mode's lit edge,
   * its only material, with it.
   *
   * This is not hypothetical: `--shadow-sm` IS `none` in dark mode, which is
   * exactly why `.control-raised` cannot reuse it and why `--control-shadow` exists
   * as a separate token. Same hazard as `--glass-surface-shadow`, same reason.
   */
  for (const theme of THEMES) {
    it(`${theme}: controls.${theme}.shadow is not \`none\``, () => {
      expect(controls[theme].shadow).not.toBe('none');
    });
  }

  it('.control-raised does not compose --shadow-sm, which IS none in dark', () => {
    const rules = controlsCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(
      rules,
      '.control-raised must use --control-shadow. --shadow-sm is `none` in dark mode, and ' +
        '`none` inside a comma-separated box-shadow list invalidates the whole declaration.',
    ).not.toContain('var(--shadow-sm)');
    expect(rules).toContain('var(--control-shadow)');
  });
});

describe('THE LIGHT-MODE ASYMMETRY , you cannot lighten white', () => {
  /**
   * The measurement the whole design of this layer rests on, and the same one that
   * governs `--glass-surface-highlight`.
   *
   * Light mode's `--panel` is `#FFFFFF`. A white lit top edge over it measures
   * **1.00:1 at every alpha** , there is no value that makes it visible, so light's
   * `lit` is `transparent` and its raised material is carried entirely by the drop
   * shadow. Dark mode's `--panel` is `#2C2D2C`, where the same white reads clearly.
   *
   * If a future palette edit ever made the light figure meaningful, this test
   * failing is the signal to give light mode a lit edge too.
   */
  it('light: a white lit edge on --panel is invisible at ANY alpha', () => {
    const panel = themes.light.panel;
    for (const alpha of [0.1, 0.14, 0.2, 0.35, 0.5, 0.75]) {
      const lit = compositeOver('#FFFFFF', panel, alpha);
      expect(
        round2(contrastRatio(lit, panel)),
        `white at α${alpha} over ${panel} , if this is ever >1.05, light mode can have a lit edge`,
      ).toBeLessThan(1.05);
    }
  });

  it('light: `lit` is therefore transparent, not a small alpha', () => {
    /**
     * A tiny-but-nonzero alpha would be the tempting "consistent" choice and is
     * strictly worse: it costs a composite per control and renders identically to
     * transparent. `transparent` is the honest spelling of "this does nothing here".
     */
    expect(controls.light.lit).toBe('transparent');
  });

  it('dark: the lit edge IS visible, and is the material', () => {
    const panel = themes.dark.panel;
    const { hex, alpha } = parseRgba(controls.dark.lit);
    const lit = compositeOver(hex, panel, alpha);
    const ratio = contrastRatio(lit, panel);
    expect(round2(ratio), `${controls.dark.lit} over ${panel}`).toBeGreaterThan(1.25);
  });

  it('dark: the lit edge is far gentler than the tier-S surface highlight', () => {
    /**
     * Tier S runs its specular highlight at α 0.50, which is correct on a large
     * card and wrong on a 36px control , there it is a bright white line across the
     * top of every button. The control value is deliberately a fraction of it.
     */
    expect(parseRgba(controls.dark.lit).alpha).toBeLessThan(0.25);
  });
});

describe('the recessed inset registers in both themes', () => {
  /**
   * Asserted per theme because the fills differ enormously: light's track is
   * `#F2EBE8` and dark's is `#2C2D2C` , and in dark `--bg2` IS `--panel`, both
   * already dark, so light's α 0.07 measures 1.04:1 there and does nothing. Dark
   * needs roughly 3x the alpha, which is why these are separate values rather than
   * one shared number.
   */
  for (const theme of THEMES) {
    it(`${theme}: the inset is visible against the track fill`, () => {
      const track = themes[theme].bg2;
      const { hex, alpha } = parseRgba(controls[theme].inset);
      const inset = compositeOver(hex, track, alpha);
      const ratio = contrastRatio(inset, track);
      expect(
        round2(ratio),
        `${controls[theme].inset} over --bg2 ${track} = ${round2(ratio)}:1. Below ~1.05 the well ` +
          `is invisible and a recessed control is indistinguishable from a raised one.`,
      ).toBeGreaterThan(1.05);
    });
  }
});

describe('controls.css and tokens.css agree with controls.ts', () => {
  const normalise = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/(-?\d*\.?\d+)/g, (n) => String(Number(n)))
      .replace(/,\s*/g, ',');

  function declaration(selector: string, property: string): string | undefined {
    const start = tokensCss.indexOf(selector);
    const body = tokensCss
      .slice(start, tokensCss.indexOf('\n}', start))
      .replace(/\/\*[\s\S]*?\*\//g, '');
    return new RegExp(`${property}\\s*:\\s*([^;]+);`).exec(body)?.[1];
  }

  for (const [theme, selector] of [
    ['light', ':root {'],
    ['dark', '.dark,\nbody.dark {'],
  ] as const) {
    for (const key of ['lit', 'inset', 'shadow'] as const) {
      const cssName = `--control-${key === 'lit' ? 'lit' : key}`;
      it(`${theme} ${cssName} matches controls.${theme}.${key}`, () => {
        const declared = declaration(selector, cssName);
        expect(declared, `${cssName} missing from the ${theme} block`).toBeDefined();
        expect(normalise(declared!)).toBe(normalise(controls[theme][key]));
      });
    }
  }

  it('every declared control token is actually painted', () => {
    // Same hazard as the sheen stops and the texture layers: a token that is
    // declared and never referenced is gated and invisible at the same time.
    for (const name of ['--control-lit', '--control-inset', '--control-shadow']) {
      expect(controlsCss, `${name} is declared in tokens.css but never painted`).toContain(
        `var(${name})`,
      );
    }
  });

  it('declares both material utilities', () => {
    const rules = controlsCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).toContain('@utility control-raised');
    expect(rules).toContain('@utility control-recessed');
  });

  it('the raised edge is an INSET shadow, so it follows border-radius', () => {
    /**
     * A pseudo-element would need its own radius kept in sync, and would collide
     * with components that already use one , `Tabs` draws its active underline with
     * an `::after`.
     */
    const rules = controlsCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).toMatch(/inset 0 1px 0 var\(--control-lit\)/);
  });

  it('honours reduced transparency, keeping raised and recessed distinguishable', () => {
    /**
     * Both edge tokens are translucent by construction , they have to composite
     * over whatever fill the control carries. Under `prefers-reduced-transparency`
     * the edges go and the raised SHADOW stays, because a user who asked for less
     * transparency still needs to tell a button from an input.
     */
    const rules = controlsCss.replace(/\/\*[\s\S]*?\*\//g, '');

    /*
     * One query per utility now, rather than one shared block at the bottom of
     * the file. `@utility` bodies are templates Tailwind re-emits per variant, so
     * a bare `.control-raised` override outside them could not reach
     * `data-[state=on]:control-raised` , the degradation would apply to some
     * spellings of the material and not others.
     */
    const bodies = Object.fromEntries(
      ['control-raised', 'control-recessed'].map((name) => {
        const start = rules.indexOf(`@utility ${name}`);
        expect(start, `controls.css does not declare @utility ${name}`).toBeGreaterThan(-1);
        return [name, rules.slice(start, rules.indexOf('\n}', start))];
      }),
    ) as Record<'control-raised' | 'control-recessed', string>;

    for (const [name, body] of Object.entries(bodies)) {
      expect(body, `${name} has no reduced-transparency branch`).toContain(
        'prefers-reduced-transparency',
      );
    }

    expect(
      bodies['control-raised'].slice(bodies['control-raised'].indexOf('prefers-reduced')),
      'the raised shadow must survive so the two stay distinguishable',
    ).toContain('var(--control-shadow)');
  });

  /**
   * ## THE REGRESSION THIS FILE EXISTS TO PREVENT, AS OF 2026-08-20
   *
   * These were plain classes in a `layer(components)` import, and
   * `data-[state=on]:control-raised` in `segmented-control.tsx` therefore
   * generated NO CSS at all , a variant can only compose over a utility Tailwind
   * owns. Nothing failed: not the build, not the type-checker, not a test, not
   * the DOM (the class string is right there). Only `getComputedStyle` knew, and
   * the visible symptom was a selected segment that looked unselected.
   *
   * Two assertions, because each half fails independently: the utility form is
   * what makes variants work, and the un-layered import is what keeps `@utility`
   * legal. Re-adding `layer(components)` would silently undo the whole fix.
   */
  it('is variant-composable , @utility, and imported OUTSIDE any layer', () => {
    const rules = controlsCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(
      rules,
      'A plain `.control-raised` rule is not a Tailwind utility, so ' +
        '`data-[state=on]:control-raised` silently generates nothing.',
    ).not.toMatch(/^\s*\.control-(raised|recessed)\s*\{/m);

    const themeCss = readFileSync(join(here, '../css/theme.css'), 'utf8');
    const importLine = /@import\s+'\.\/controls\.css'([^;]*);/.exec(themeCss);
    expect(importLine, 'theme.css no longer imports controls.css').not.toBeNull();
    expect(
      importLine![1]!.trim(),
      '`@utility` must be top-level. Importing controls.css into a layer makes ' +
        'every variant form stop generating, with no error anywhere.',
    ).toBe('');
  });
});
