import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, round2 } from '../src/color';
import { glass } from '../src/glass';
import { themes, type ThemeName } from '../src/semantic';
import { TARGET } from '../src/contrast-pairs';
import {
  TEXTURE_DEPTH_CEILING,
  TEXTURE_GRID,
  texture,
  type TextureLayerName,
} from '../src/texture';

/**
 * The page texture is the only thing in this system allowed to paint the page
 * background, and the page is what every tier-S measurement is taken against.
 * That makes it the one token group that can invalidate other people's numbers
 * without touching their values , so it gets its own gate.
 *
 * The suite is built around one invariant (texture may only DARKEN) and one
 * binding constraint (`--muted-fg` where both layers stack in light mode).
 * See `src/texture.ts` for why those two, and not the glass gate, are what bites.
 */

const here = dirname(fileURLToPath(import.meta.url));
const textureCss = readFileSync(join(here, '../css/texture.css'), 'utf8');
const tokensCss = readFileSync(join(here, '../css/tokens.css'), 'utf8');

const channels = (hex: string): number[] => {
  const n = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};

const THEMES: ThemeName[] = ['light', 'dark'];
const LAYERS: TextureLayerName[] = ['dot', 'field'];

/** One texture layer flattened over the page. */
function layerOverPage(theme: ThemeName, layer: TextureLayerName): string {
  const { colour, alpha } = texture[theme][layer];
  return compositeOver(colour, themes[theme].bg, alpha);
}

/**
 * Both layers stacked , the worst case a pixel of page can be, and the case the
 * text assertions use.
 *
 * Stacked, deliberately, rather than weighted by coverage. A dot is 1px on a
 * 48px pitch (<0.2% of the page), so a coverage argument would let both layers
 * go far deeper , but the stacked case passes, so the cheap gate is also the
 * honest one and there is no argument to have.
 */
function stacked(theme: ThemeName): string {
  const field = layerOverPage(theme, 'field');
  const { colour, alpha } = texture[theme].dot;
  return compositeOver(colour, field, alpha);
}

describe('THE DARKENS-ONLY INVARIANT , texture may never lighten the page', () => {
  /**
   * The assertion the whole feature rests on.
   *
   * In both themes a tier-S glass surface composites LIGHTER than the page it
   * sits on , that is what the perceptibility gate's "reads as RAISED" test
   * means. So the direction of the texture decides whether it is free or
   * expensive:
   *
   *   darkens → the glass-vs-page gap WIDENS, every existing measurement holds
   *   lightens → the gap NARROWS, and light's bottom sheen stop is ON the 8/255
   *              floor already, so even +2/255 of page lift breaks it
   *
   * A lightening texture is therefore not a tuning choice to be re-measured
   * later; it invalidates the sheen, every soft chip and every glass pair at
   * once. Hence a hard per-channel gate rather than a note in a docblock.
   */
  for (const theme of THEMES) {
    for (const layer of LAYERS) {
      it(`${theme} ${layer}: darker than --bg on every channel`, () => {
        const composite = layerOverPage(theme, layer);
        const page = channels(themes[theme].bg);
        const lift = channels(composite).map((v, i) => v - page[i]!);

        expect(
          Math.max(...lift),
          `texture.${theme}.${layer} composites to ${composite}, which is LIGHTER than the page ` +
            `${themes[theme].bg} on some channel (Δ ${lift.join('/')}).\n\n` +
            `A lighter page narrows the gap the perceptibility gate measures between tier-S ` +
            `glass and --bg. Light's bottom sheen stop sits on the ${8}/255 floor exactly, so ` +
            `this does not degrade gracefully , it invalidates the sheen, every soft chip and ` +
            `every glass pair simultaneously.\n\n` +
            `If you want a LIT bloom in dark mode it cannot live here: put it on a component, ` +
            `where the backdrop is known. In dark, note that the plum SEED lightens this page ` +
            `(+7/+2/+4) , that is why texture.dark.field is a plum-black instead.`,
        ).toBeLessThanOrEqual(0);
      });

      it(`${theme} ${layer}: no deeper than ${TEXTURE_DEPTH_CEILING[theme]}/255 below --bg`, () => {
        /**
         * Per-theme, because the themes are bounded by different things and the
         * ceiling means something different in each.
         *
         * In light it is a formality , WCAG binds first, and the `--muted-fg`
         * assertion below is what actually fails when a light layer is deepened.
         * In dark it is the ONLY guard: darkening a near-black page raises text
         * contrast, so every accessibility assertion in this file gets *better* all
         * the way to pure black. Nothing else would stop a future edit turning the
         * charcoal page black.
         */
        const composite = layerOverPage(theme, layer);
        const page = channels(themes[theme].bg);
        const depth = Math.max(...channels(composite).map((v, i) => page[i]! - v));

        expect(
          depth,
          `texture.${theme}.${layer} sits ${depth}/255 below the page, past the ` +
            `${TEXTURE_DEPTH_CEILING[theme]}/255 ceiling for ${theme}. A layer that deep stops ` +
            `reading as detail ON the page and starts reading as a second page colour.` +
            (theme === 'dark'
              ? `\n\nNote that no accessibility assertion will catch this for you in dark mode , ` +
                `text contrast improves as the texture deepens. This ceiling is the whole guard.`
              : ''),
        ).toBeLessThanOrEqual(TEXTURE_DEPTH_CEILING[theme]);
      });
    }

    it(`${theme}: the invariant survives BOTH layers stacked`, () => {
      const composite = stacked(theme);
      const page = channels(themes[theme].bg);
      const lift = channels(composite).map((v, i) => v - page[i]!);
      expect(
        Math.max(...lift),
        `stacked texture composites to ${composite}, lighter than ${themes[theme].bg} on some ` +
          `channel (Δ ${lift.join('/')}). Two darkening layers cannot compose to a lightening ` +
          `one, so this failing means a layer's own gate is wrong.`,
      ).toBeLessThanOrEqual(0);
    });
  }
});

describe('the texture only ever HELPS the perceptibility gate', () => {
  /**
   * The pay-off from the invariant, asserted rather than asserted-in-prose.
   *
   * If this ever fails while the darkens-only gate passes, the model of how glass
   * composites over the page is wrong somewhere, and the tier-S numbers in
   * `glass.ts` need re-deriving rather than nudging.
   */
  for (const theme of THEMES) {
    const tier = glass[theme === 'light' ? 'surfaceLight' : 'surfaceDark'];
    const page = themes[theme].bg;
    const textured = stacked(theme);

    for (const [stopName, surface] of [
      ['top', tier.surface],
      ['bottom', tier.surfaceBottom],
    ] as const) {
      it(`${theme} ${stopName} stop separates further over texture than over flat --bg`, () => {
        const gap = (backdrop: string) => {
          const composite = compositeOver(surface, backdrop, tier.alpha);
          return Math.max(
            ...channels(composite).map((v, i) => Math.abs(v - channels(backdrop)[i]!)),
          );
        };
        const flat = gap(page);
        const onTexture = gap(textured);
        expect(
          onTexture,
          `over the flat page the ${stopName} stop separates by ${flat}/255; over the textured ` +
            `page only ${onTexture}/255. Darkening the page is supposed to WIDEN this.`,
        ).toBeGreaterThanOrEqual(flat);
      });
    }
  }
});

describe('text stays readable on the textured page', () => {
  /**
   * THE BINDING CONSTRAINT, and it is not the glass gate.
   *
   * Light mode measures `--muted-fg` at 4.60:1 on the stacked worst case against
   * AA's 4.5 , roughly 0.1 of margin, the tightest number the texture owns.
   * Deepening either light layer fails here first, and it fails as unreadable
   * secondary labels on the page rather than as ugly glass. Dark has room to
   * spare (7.72:1) because darkening a near-black page barely moves it.
   */
  for (const theme of THEMES) {
    const t = themes[theme];
    const worst = stacked(theme);

    it(`${theme}: --fg clears AA on the worst case (${worst})`, () => {
      const ratio = contrastRatio(t.fg, worst);
      expect(ratio, `${round2(ratio)}:1`).toBeGreaterThanOrEqual(TARGET.text);
    });

    it(`${theme}: --muted-fg clears AA on the worst case (${worst})`, () => {
      const ratio = contrastRatio(t.mutedFg, worst);
      expect(
        ratio,
        `--muted-fg (${t.mutedFg}) on the stacked texture ${worst} = ${round2(ratio)}:1.\n\n` +
          `This is the value that binds the texture depth , not the glass gate, which the ` +
          `darkens-only invariant makes free. If you are here after deepening a layer, the ` +
          `texture is too dark for secondary text, and no amount of glass tuning fixes it.`,
      ).toBeGreaterThanOrEqual(TARGET.text);
    });
  }
});

describe('texture.css and tokens.css agree with texture.ts', () => {
  const rgba = (hex: string, alpha: number) => {
    const [r, g, b] = channels(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const normalise = (v: string) =>
    v
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/(-?\d*\.?\d+)/g, (n) => String(Number(n)))
      .replace(/,\s*/g, ',');

  /** Read one declaration out of a named rule block. */
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
    for (const layer of LAYERS) {
      it(`${theme} --page-texture-${layer} matches texture.${theme}.${layer}`, () => {
        const { colour, alpha } = texture[theme][layer];
        const declared = declaration(selector, `--page-texture-${layer}`);
        expect(declared, `--page-texture-${layer} missing from the ${theme} block`).toBeDefined();
        expect(normalise(declared!)).toBe(normalise(rgba(colour, alpha)));
      });
    }
  }

  it('--page-texture-grid matches TEXTURE_GRID', () => {
    expect(declaration(':root {', '--page-texture-grid')?.trim()).toBe(TEXTURE_GRID);
  });

  it('texture.css paints every declared texture token', () => {
    /**
     * Same hazard as the sheen stops: a token that is declared, gated and never
     * referenced is invisible AND green at the same time.
     */
    for (const name of ['--page-texture-dot', '--page-texture-field', '--page-texture-grid']) {
      expect(textureCss, `${name} is declared in tokens.css but never painted`).toContain(
        `var(${name})`,
      );
    }
  });

  it('sets background-image, never the `background` shorthand', () => {
    /**
     * The shorthand would reset `background-color`, and the page's colour comes
     * from `body { background: var(--bg) }` in theme.css's base layer. Resetting
     * it leaves the dots over transparent: invisible in light mode, and
     * white-behind-dark-text in dark mode , on the consumer that opted in only.
     */
    const rules = textureCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(
      /(^|[\s;{])background:\s/.test(rules),
      'texture.css uses the `background` shorthand, which resets the page background-colour',
    ).toBe(false);
    expect(rules).toContain('background-image:');
  });

  it('honours reduced transparency and increased contrast', () => {
    /**
     * Two different user requests, two different answers, both deliberate:
     * reduced transparency drops the see-through grid but keeps the opaque bloom
     * (so the fallback is not a flat slab); increased contrast drops everything,
     * because the texture's own tightest measurement is a 0.1 margin over AA.
     */
    const rules = textureCss.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(rules).toContain('prefers-reduced-transparency: reduce');
    expect(rules).toContain('prefers-contrast: more');

    const contrastBlock = rules.slice(rules.indexOf('prefers-contrast: more'));
    expect(contrastBlock).toContain('background-image: none');
  });

  it('the grid scrolls while the bloom is fixed , the blur needs movement', () => {
    /**
     * The split is the entire point of the texture existing. A blur over a fully
     * fixed backdrop smears a static image, which reads as texture painted ON
     * the glass; a grid that scrolls underneath reads as texture seen THROUGH it.
     */
    expect(textureCss.replace(/\/\*[\s\S]*?\*\//g, '')).toContain(
      'background-attachment: fixed, scroll',
    );
  });
});
