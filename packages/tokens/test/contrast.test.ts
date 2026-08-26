import { describe, expect, it } from 'vitest';

import {
  compositeOver,
  contrastRatio,
  hexToOklch,
  hexToRgb,
  relativeLuminance,
  round2,
} from '../src/color';
import { GLASS_ALPHA_FLOOR, GLASS_SPECULAR_ALPHA, glass } from '../src/glass';
import { neutral, worstCaseBackdrops } from '../src/palette';
import { themes, type SemanticTokens, type ThemeName } from '../src/semantic';
import {
  CHROME_COMPOSITE_PAIRS,
  CONTRAST_EXEMPT,
  CONTRAST_PAIRS,
  DISTINCT_ROLE_PAIRS,
  GLASS_OVERLAY_PAIRS,
  GLASS_SURFACE_PAIRS,
  PERCEPTIBILITY_FLOOR,
  ROLE_DISTINCTION_FLOOR,
  SOFT_CHIP_PAIRS,
  TARGET,
  resolveChromeComposite,
  resolveGlassOverlay,
  resolveGlassSurface,
  resolvePair,
  resolveSoftChip,
  type ContrastPair,
} from '../src/contrast-pairs';

/**
 * THE HEADLINE GATE.
 *
 * Every documented semantic pairing is asserted against its WCAG target in both
 * themes, and every glass tier against the seven worst-case backdrops in the
 * palette. A palette edit that breaks contrast fails here rather than shipping.
 *
 * If you are here because a test went red: the fix is almost never to lower a
 * target. Adjust the token, or add a new step to the ramp the way `neutral-750`
 * and `--muted-on-glass` were both added for exactly this reason.
 */

const THEMES: ThemeName[] = ['light', 'dark'];

/** Skip translucent values , a contrast ratio needs an opaque colour. */
const isOpaqueHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

describe('semantic pairs meet their WCAG target', () => {
  for (const theme of THEMES) {
    describe(theme, () => {
      for (const pair of CONTRAST_PAIRS) {
        const resolved = resolvePair(pair, theme);
        if (!resolved) continue;

        const suffix = pair.note ? ` , ${pair.note}` : '';
        it(`${pair.label} (≥${TARGET[pair.target]}:1)${suffix}`, () => {
          const ratio = contrastRatio(resolved.fg, resolved.bg);
          expect(
            ratio,
            `${pair.fg} (${resolved.fg}) on ${pair.bg} (${resolved.bg}) = ${round2(ratio)}:1, ` +
              `needs ≥${resolved.target}:1`,
          ).toBeGreaterThanOrEqual(resolved.target);
        });
      }
    });
  }
});

describe('no semantic token escapes measurement', () => {
  /**
   * The loophole this closes: adding a colour token and simply not adding a
   * contrast pair for it. Every key of SemanticTokens must appear as the `fg` of
   * at least one pair, or carry a written exemption.
   */
  const measured = new Set<string>(CONTRAST_PAIRS.map((p: ContrastPair) => p.fg));

  for (const key of Object.keys(themes.light) as (keyof SemanticTokens)[]) {
    it(`${key} is either contrast-gated or has a documented exemption`, () => {
      const covered = measured.has(key) || key in CONTRAST_EXEMPT;
      expect(
        covered,
        `Token "${key}" is neither the foreground of a CONTRAST_PAIRS entry nor listed ` +
          `in CONTRAST_EXEMPT. Add a pair, or add an exemption WITH A REASON.`,
      ).toBe(true);
    });
  }

  it('every exemption refers to a token that still exists', () => {
    const live = new Set(Object.keys(themes.light));
    const stale = Object.keys(CONTRAST_EXEMPT).filter((k) => !live.has(k));
    expect(stale, `CONTRAST_EXEMPT lists tokens that no longer exist: ${stale.join(', ')}`).toEqual(
      [],
    );
  });
});

describe('soft chips clear AA on every surface they sit on', () => {
  /**
   * Badge's `*-soft` variants (and StatusChip, which composes them) put a TEXT
   * token over a translucent wash, and the wash barely moves whatever surface
   * is underneath , so the colour the 12px text actually sits on is dominated
   * by the backdrop, not the wash. Each pairing is flattened over the page, the
   * panel and the tier-S glass composite, and asserted at the full 4.5:1.
   *
   * This suite is what the `*Soft` entries in CONTRAST_EXEMPT point at: the
   * washes are exempt from a FLAT pair because a flat ratio against a
   * translucent value is meaningless, not because they are unmeasured.
   */
  for (const theme of THEMES) {
    describe(theme, () => {
      for (const pair of SOFT_CHIP_PAIRS) {
        const resolved = resolveSoftChip(pair, theme);
        for (const { name, composite } of resolved.backdrops) {
          it(`${pair.label} on ${name} (≥${TARGET.text}:1)`, () => {
            const ratio = contrastRatio(resolved.fg, composite);
            expect(
              ratio,
              `${pair.fg} (${resolved.fg}) over ${pair.wash} flattened onto the ${name} ` +
                `(${composite}) = ${round2(ratio)}:1, needs ≥${TARGET.text}:1. Chip text is ` +
                `12px, so the large-text discount does not apply , retune the text token or ` +
                `thin the wash; do not lower the target.`,
            ).toBeGreaterThanOrEqual(TARGET.text);
          });
        }
      }
    });
  }
});

describe('TWO ROLES ARE NEVER THE SAME COLOUR', () => {
  /**
   * The gate that every other gate in this file is structurally blind to.
   *
   * Everything else measures a token against a SURFACE , is it readable, is it
   * visible. Nothing else measures a token against ANOTHER TOKEN, and that is how
   * `--info` shipped as the exact bytes of `--primary-text` (`#0062B3` light,
   * `#4AACFF` dark) with a fully green suite: both were individually legible
   * everywhere, so nothing was wrong by any question being asked.
   *
   * Measured in OKLab ΔE rather than contrast ratio on purpose , see
   * {@link ROLE_DISTINCTION_FLOOR}. Contrast ratio cannot answer this question at
   * all: two colours of equal lightness and opposite hue have a ratio of ~1.0,
   * which is what "identical" also scores.
   */
  const deltaE = (a: string, b: string): number => {
    // OKLab, not OKLCH, for the distance: hue is angular and undefined at zero
    // chroma, so a polar distance misreports near-neutral pairs.
    const toLab = (hex: string) => {
      const { l, c, h } = hexToOklch(hex);
      const rad = (h * Math.PI) / 180;
      return [l, c * Math.cos(rad), c * Math.sin(rad)] as const;
    };
    const [l1, a1, b1] = toLab(a);
    const [l2, a2, b2] = toLab(b);
    return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
  };

  for (const theme of THEMES) {
    describe(theme, () => {
      for (const pair of DISTINCT_ROLE_PAIRS) {
        it(`${pair.label} are different colours`, () => {
          const a = themes[theme][pair.a];
          const b = themes[theme][pair.b];

          expect(
            a,
            `--${pair.a} and --${pair.b} are the SAME VALUE (${a}) in ${theme} mode.\n\n` +
              `${pair.because}\n\n` +
              `No other gate in this file can catch this: both tokens are individually legible ` +
              `against every surface they sit on, which is all the WCAG sweep and the ` +
              `perceptibility gate measure.`,
          ).not.toBe(b);

          const distance = deltaE(a, b);
          expect(
            round2(distance),
            `--${pair.a} (${a}) and --${pair.b} (${b}) are ${distance.toFixed(3)} apart in OKLab ` +
              `ΔE, below the ${ROLE_DISTINCTION_FLOOR} collision floor, in ${theme} mode.\n\n` +
              `${pair.because}`,
          ).toBeGreaterThanOrEqual(ROLE_DISTINCTION_FLOOR);
        });
      }
    });
  }

  it('every registered role pair refers to tokens that still exist', () => {
    /**
     * The registry names tokens as strings through `keyof SemanticTokens`, so a
     * rename is caught by the compiler , but a token being DELETED while its pair
     * stays behind would leave an entry silently comparing two undefineds.
     */
    for (const pair of DISTINCT_ROLE_PAIRS) {
      for (const key of [pair.a, pair.b]) {
        expect(themes.light[key], `${key} in role pair "${pair.label}"`).toBeDefined();
        expect(themes.dark[key], `${key} in role pair "${pair.label}"`).toBeDefined();
      }
    }
  });
});

describe('the specific claims the palette was designed around', () => {
  /**
   * These are not redundant with the pair sweep , they are the measurements the
   * palette's *shape* rests on. If any of them moves, a documented design
   * decision has silently changed meaning.
   */
  it('blue fails as text on the page, which is why --primary-text exists', () => {
    // 3.86:1 , the whole reason `primary` is a fill-only token. Written against
    // `themes.light.bg` rather than a hex literal: the claim is about the PAGE, and
    // a literal here is how this assertion came to quote a page colour that had
    // been replaced (it read `#F4EDEA` for a release after the seed changed name).
    expect(round2(contrastRatio(themes.light.primary, themes.light.bg))).toBe(3.86);
    expect(contrastRatio(themes.light.primary, themes.light.bg)).toBeLessThan(TARGET.text);
  });

  it('blue works as a fill with white on it', () => {
    expect(round2(contrastRatio('#FFFFFF', '#007ACC'))).toBe(4.51);
  });

  it('lime is text-safe ONLY against charcoal', () => {
    expect(round2(contrastRatio('#C8F135', '#2A2B2A'))).toBe(10.89);
    // White on lime is the mistake this number exists to forbid.
    expect(round2(contrastRatio('#FFFFFF', '#C8F135'))).toBe(1.31);
    // And lime is never text, never a border, never a focus ring in light mode.
    expect(round2(contrastRatio(themes.light.brand, themes.light.bg))).toBe(1.12);
  });

  it('a lime fill cannot be a lone graphical indicator in light mode', () => {
    /**
     * 1.12:1 against the light page , far below the 3:1 that WCAG 1.4.11 asks of
     * a graphical object conveying information. So in LIGHT mode:
     *
     *   fine    a badge or button, where the charcoal text inside (10.89:1) is
     *           what identifies the element
     *   NOT fine a status dot, an indicator bar, an unlabelled chart mark , any
     *           lime shape that is the only carrier of meaning. Those need an
     *           outline or a darker companion colour.
     *
     * In dark mode the same fill measures 13.24:1 and has no such restriction,
     * which is why the `brand fill vs page` pair above is dark-only.
     */
    expect(contrastRatio(themes.light.brand, themes.light.bg)).toBeLessThan(TARGET.nonText);
    expect(contrastRatio(themes.dark.brand, themes.dark.bg)).toBeGreaterThanOrEqual(TARGET.nonText);
    // The escape hatch that makes a lime indicator legal in light mode.
    expect(contrastRatio(themes.light.fieldBorder, themes.light.bg)).toBeGreaterThanOrEqual(
      TARGET.nonText,
    );
  });

  it('plum is a dark SURFACE, not a dark accent', () => {
    expect(round2(contrastRatio('#592941', '#2A2B2A'))).toBe(1.23);
    // Its real light-mode job:
    expect(round2(contrastRatio(themes.light.accentText, themes.light.bg))).toBe(10.03);
  });

  it('the blue text steps clear AA in their own theme', () => {
    expect(contrastRatio(themes.light.primaryText, themes.light.bg)).toBeGreaterThanOrEqual(
      TARGET.text,
    );
    expect(contrastRatio('#4AACFF', themes.dark.bg)).toBeGreaterThanOrEqual(TARGET.text);
  });

  it('field-border clears 1.4.11 in BOTH themes from a single value', () => {
    // The property that let one token serve both themes; if a future edit
    // breaks it, the two need to split again.
    expect(themes.light.fieldBorder).toBe(themes.dark.fieldBorder);
    for (const theme of THEMES) {
      const t = themes[theme];
      expect(contrastRatio(t.fieldBorder, t.panel)).toBeGreaterThanOrEqual(TARGET.nonText);
      expect(contrastRatio(t.fieldBorder, t.bg)).toBeGreaterThanOrEqual(TARGET.nonText);
    }
  });
});

describe('glass tiers stay legible over every worst-case backdrop', () => {
  /**
   * Composited in GAMMA-encoded sRGB, which is what browsers do. Measuring this
   * in linear light reports a white glass over charcoal as ~38 8-bit steps
   * lighter and flips failing muted text into passing , see the note on
   * `compositeOver`.
   */
  const tiers: [name: keyof typeof glass, theme: ThemeName][] = [
    ['light', 'light'],
    ['dark', 'dark'],
    ['darkElevated', 'dark'],
  ];

  for (const [tierName, theme] of tiers) {
    const tier = glass[tierName];

    it(`${tierName}: alpha ${tier.alpha} is at or above the measured floor`, () => {
      expect(tier.alpha).toBeGreaterThanOrEqual(GLASS_ALPHA_FLOOR);
    });

    for (const backdrop of worstCaseBackdrops) {
      const surface = compositeOver(tier.surface, backdrop, tier.alpha);

      it(`${tierName}: body text over ${backdrop} (composite ${surface})`, () => {
        const ratio = contrastRatio(themes[theme].fg, surface);
        expect(ratio, `${round2(ratio)}:1 , needs ≥${TARGET.text}:1`).toBeGreaterThanOrEqual(
          TARGET.text,
        );
      });

      it(`${tierName}: muted-on-glass over ${backdrop} (composite ${surface})`, () => {
        const ratio = contrastRatio(themes[theme].mutedOnGlass, surface);
        expect(ratio, `${round2(ratio)}:1 , needs ≥${TARGET.text}:1`).toBeGreaterThanOrEqual(
          TARGET.text,
        );
      });
    }
  }

  it('the ordinary muted token is NOT safe on glass , this is why mutedOnGlass exists', () => {
    /**
     * A guard against someone "simplifying" the two tokens back into one.
     *
     * Note the failure is a WORST-CASE result, not a lime-specific one: over a
     * lime backdrop `mutedFg` actually measures a comfortable 5.40:1, and it is
     * the DARK backdrops that sink it to 3.09:1 , a white glass at the alpha
     * floor over near-black is still translucent enough for the page to darken
     * it. Testing only the most colourful backdrop would have reported this pair
     * as safe.
     */
    for (const [theme, tier] of [
      ['light', glass.light],
      ['dark', glass.dark],
    ] as const) {
      const worst = (fg: string) =>
        Math.min(
          ...worstCaseBackdrops.map((bd) =>
            contrastRatio(fg, compositeOver(tier.surface, bd, GLASS_ALPHA_FLOOR)),
          ),
        );
      expect(worst(themes[theme].mutedFg), `${theme}: mutedFg`).toBeLessThan(TARGET.text);
      expect(worst(themes[theme].mutedOnGlass), `${theme}: mutedOnGlass`).toBeGreaterThanOrEqual(
        TARGET.text,
      );
    }
  });

  it('glass borders are the ONLY translucent line tokens', () => {
    for (const theme of THEMES) {
      expect(isOpaqueHex(themes[theme].border)).toBe(true);
      expect(isOpaqueHex(themes[theme].fieldBorder)).toBe(true);
    }
    for (const tier of Object.values(glass)) {
      expect(tier.border.startsWith('rgba(')).toBe(true);
    }
  });
});

/* ── tier S ────────────────────────────────────────────────────────────────── */

/** 0-255 channels, the units perceptibility is argued in. */
const channels = (hex: string) => hexToRgb(hex).map((c) => Math.round(c * 255));

/** Largest single-channel separation between two opaque colours, in 8-bit steps. */
function maxChannelDelta(a: string, b: string): number {
  const [x, y] = [channels(a), channels(b)];
  return Math.max(...x.map((v, i) => Math.abs(v - y[i]!)));
}

/** Parse `rgba(r, g, b, a)` , the only translucent spelling these tokens use. */
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

describe('THE PERCEPTIBILITY GATE , tier-S glass is not an opaque panel in disguise', () => {
  /**
   * The one gate in this file that is not about accessibility.
   *
   * Everything above asks "can you read this". This asks "can you SEE it at
   * all", and nothing above would ever have caught the failure: an invisible
   * glass card has *better* text contrast than a visible one, so the whole WCAG
   * sweep reports green while the feature does nothing.
   *
   * The failure being prevented is specific and was the first attempt at this
   * tier: white at α 0.85 over the light page composites to #FDFCFC, 3/255 from
   * the opaque #FFFFFF panel, and the dark panel at α 0.85 over the dark page
   * lands 3/255 off its own panel. Blurring a uniform page returns that same
   * uniform page, so the browser pays for a backdrop repaint per surface and the
   * pixels do not move.
   */
  for (const pair of GLASS_SURFACE_PAIRS) {
    const r = resolveGlassSurface(pair);
    const tier = glass[pair.tier];

    /**
     * EVERY assertion below runs once PER SHEEN STOP.
     *
     * Tier S paints a two-stop gradient, and a gate that measured one colour
     * would leave the other unmeasured , specifically the far stop, which is the
     * one that approaches a wall in both themes (light's bottom lands on the
     * floor exactly; dark's bottom is the stop nearest the page). Both stops are
     * real surfaces that real text sits on, so both owe every measurement the
     * flat fill used to owe.
     */
    for (const { name: stopName, composite } of r.stops) {
      describe(`${pair.label} , ${stopName} stop @α${tier.alpha} → ${composite}`, () => {
        it(`differs from --panel by ≥${PERCEPTIBILITY_FLOOR}/255 on some channel`, () => {
          const delta = maxChannelDelta(composite, r.panel);
          expect(
            delta,
            `The ${stopName} stop of the tier-S sheen composites over the page to ` +
              `${composite}, which is ${delta}/255 from the opaque --panel (${r.panel}).\n\n` +
              `THAT MEANS THE GLASS IS VISUALLY IDENTICAL TO AN OPAQUE PANEL: the blur costs a ` +
              `backdrop repaint per surface for no visual change, and blurring a uniform page ` +
              `returns that same uniform page.\n\n` +
              `Fix it by TINTING that stop further off the panel , not by lowering the ` +
              `alpha, which makes the composite drift over any backdrop that is not the page ` +
              `(--panel at α 0.50 lands on the same colour and drifts 11/255 in light, 31/255 ` +
              `in dark, against this tier's 3/255).`,
          ).toBeGreaterThanOrEqual(PERCEPTIBILITY_FLOOR);
        });

        it(`differs from --bg by ≥${PERCEPTIBILITY_FLOOR}/255 on some channel`, () => {
          const delta = maxChannelDelta(composite, r.bg);
          expect(
            delta,
            `The ${stopName} stop composites to ${composite}, only ${delta}/255 off the page ` +
              `(${r.bg}) it is drawn on. A surface that matches the page is not a surface , ` +
              `the card boundary would be carried entirely by its 1px border.\n\n` +
              `Light's BOTTOM stop sits on this floor by design: it is the widest sheen light ` +
              `mode has. If you are here after moving --bg or --panel, the sheen has to narrow, ` +
              `not the floor.`,
          ).toBeGreaterThanOrEqual(PERCEPTIBILITY_FLOOR);
        });

        it('reads as RAISED off the page, not recessed into it', () => {
          /**
           * Direction matters as much as magnitude. A tier-S composite DARKER than
           * the page satisfies both deltas above and still looks wrong , a card is
           * elevation, and elevation reads lighter in both themes.
           *
           * This is the assertion the sheen is most likely to break, and the
           * reason the gradient darkens toward the BOTTOM rather than fading out:
           * a far stop pushed past the page turns the lower half of every card
           * into a well.
           */
          const lift = channels(composite).map((v, i) => v - channels(r.bg)[i]!);
          expect(
            Math.min(...lift),
            `${composite} sits BELOW the page ${r.bg} on some channel (${lift.join('/')}), ` +
              `so the ${stopName} of the surface reads as a well rather than a card.`,
          ).toBeGreaterThan(0);
        });

        it(`body text clears AA on the composite (≥${TARGET.text}:1)`, () => {
          const ratio = contrastRatio(r.fg, composite);
          expect(ratio, `${round2(ratio)}:1 on ${composite}`).toBeGreaterThanOrEqual(TARGET.text);
        });

        it(`--muted-fg clears AA on the composite, so --muted-on-glass is NOT needed here`, () => {
          /**
           * The load-bearing difference between the tiers. Tier O has to step muted
           * text up to `--muted-on-glass` because its backdrop is unknown and the
           * ordinary token sinks to 3.09:1 against the worst of them. Tier S knows
           * its backdrop, and the ordinary token clears AA on both stops , so
           * `.glass-surface` deliberately does NOT set the override, and darkening
           * every secondary label in the product is not the price of this retrofit.
           */
          const ratio = contrastRatio(r.mutedFg, composite);
          expect(
            ratio,
            `--muted-fg (${r.mutedFg}) on ${composite} = ${round2(ratio)}:1. If this drops ` +
              `below ${TARGET.text}:1, .glass-surface has to start overriding --muted-fg the ` +
              `way .glass does , see css/glass.css.`,
          ).toBeGreaterThanOrEqual(TARGET.text);
        });

        it('the hairline border stays visible against its own surface', () => {
          /**
           * NOT a 1.4.11 gate: `--border` is CONTRAST_EXEMPT because a card
           * outline is decorative, and the tier-S border is the same kind of line.
           * It is asserted anyway because in LIGHT mode it is most of the material
           * , measured 1.60:1, tuned to match what the opaque `--border` shows on
           * `--panel` (1.61:1), where the tier-O border at α 0.10 would give only
           * 1.21:1. Dark measures 1.50:1 against the opaque pairing's 1.15:1.
           *
           * One border serves both stops, so it is measured against both: the edge
           * runs the full height of the surface and cannot be tuned per stop.
           */
          const { hex, alpha } = parseRgba(tier.border);
          const line = compositeOver(hex, composite, alpha);
          const ratio = contrastRatio(line, composite);
          expect(
            ratio,
            `border ${tier.border} over the ${stopName} stop ${composite} = ${line}, ` +
              `${round2(ratio)}:1`,
          ).toBeGreaterThan(1.4);
        });
      });
    }

    it(`${pair.label}: the sheen's two stops are actually different colours`, () => {
      /**
       * The gradient's own no-op check, and the mirror image of the gate above.
       *
       * Everything else here asks whether each stop is distinguishable from the
       * page and the panel. Nothing else asks whether the stops are
       * distinguishable from EACH OTHER , and two identical stops satisfy every
       * assertion in this file while rendering exactly the flat fill the sheen
       * replaced. Same failure shape as an invisible glass card: green suite,
       * absent feature.
       *
       * Deliberately asserted as ≥2/255 rather than the perceptibility floor of 8.
       * A sheen is a RAMP across a whole surface, not an edge between two
       * adjacent patches, and gradient detection runs well below step-edge
       * detection , 8/255 is simply not available here (the legal maximum is 5 in
       * light and 4 in dark, both walls being spent twice). 2/255 is the floor
       * below which the ramp is arithmetic rather than something a person sees.
       */
      const [top, bottom] = r.stops;
      const separation = maxChannelDelta(top!.composite, bottom!.composite);
      expect(
        separation,
        `Both sheen stops composite to within ${separation}/255 of each other ` +
          `(${top!.composite} → ${bottom!.composite}), so .glass-surface renders as a flat ` +
          `fill and the gradient is decoration in the stylesheet only.`,
      ).toBeGreaterThanOrEqual(2);
    });
  }

  for (const pair of GLASS_OVERLAY_PAIRS) {
    const r = resolveGlassOverlay(pair);
    const tier = glass[pair.tier];

    it(`${pair.label} differs from the page by ≥${PERCEPTIBILITY_FLOOR}/255`, () => {
      /**
       * The tier-O half of this gate, added 2026-08-06 after the dark overlay
       * was found composting to 0/255 , literally the page colour , because its
       * surface token WAS the page token. See {@link GLASS_OVERLAY_PAIRS} for
       * why this measures against `--bg` only and never `--panel`.
       */
      const delta = maxChannelDelta(r.composite, r.bg);
      expect(
        delta,
        `Tier-O glass (${tier.surface} @α${tier.alpha}) composites over the page to ` +
          `${r.composite}, only ${delta}/255 off the page (${r.bg}) it floats above.\n\n` +
          `A Dialog survives this because --overlay scrims its backdrop first, but a Popover, ` +
          `DropdownMenu, CommandPalette or Toast has no scrim , it would be carried entirely ` +
          `by its 1px border.\n\n` +
          `Fix it by TINTING the tier-O surface off the page, not by lowering the alpha, and ` +
          `re-check the seven-backdrop legibility sweep above: lifting the dark surface as far ` +
          `as --panel reaches 20/255 but sinks --muted-on-glass to 4.20:1, under AA.`,
      ).toBeGreaterThanOrEqual(PERCEPTIBILITY_FLOOR);
    });
  }

  /**
   * The elevated tier is excluded from {@link GLASS_OVERLAY_PAIRS} on the grounds
   * that its backdrop is another overlay rather than the page , true of the case
   * it was designed for (a Popover inside a Dialog) and false of how it actually
   * ships, because `PopoverContent` and `DropdownMenuSubContent` carry
   * `.glass-elevated` unconditionally. Most dark-mode popovers in the product open
   * straight over the page.
   *
   * So it is measured against BOTH backdrops here. While the tier was the plum
   * seed neither number was in any danger (60/255 and 54/255) and nothing needed
   * this; the moment it became a lightness step on 2026-08-26 both became live
   * constraints, and the obvious candidate , `neutral[950]`, the ramp's own last
   * step , fails the page half at 6/255. That is the same defect class the tier-O
   * gate above was added for, and nothing else in this file would have caught it.
   */
  describe('the elevated tier is perceptible against BOTH of its backdrops', () => {
    const tier = glass.darkElevated;
    const page = themes.dark.bg;
    /** What tier O itself composites to over the page , the surface a stacked
     *  Popover or a submenu is actually sitting on. */
    const beneath = compositeOver(glass.dark.surface, page, glass.dark.alpha);

    for (const [what, backdrop] of [
      ['the page it opens over', page],
      ['the tier-O glass it stacks on', beneath],
    ] as const) {
      it(`differs from ${what} by ≥${PERCEPTIBILITY_FLOOR}/255`, () => {
        const composite = compositeOver(tier.surface, backdrop, tier.alpha);
        const delta = maxChannelDelta(composite, backdrop);
        expect(
          delta,
          `Elevated glass (${tier.surface} @α${tier.alpha}) composites over ${what} ` +
            `(${backdrop}) to ${composite} , only ${delta}/255 apart, so the panel is ` +
            `carried entirely by its 1px border.\n\n` +
            `This tier separates by LIGHTNESS (it was the plum seed until 2026-08-26 and ` +
            `separated by hue), and the two backdrops pull in opposite directions: the page ` +
            `is neutral-925 and tier O composites 8/255 ABOVE it, so going darker is the ` +
            `direction with room. neutral[950] is NOT far enough , 6/255 off the page.`,
        ).toBeGreaterThanOrEqual(PERCEPTIBILITY_FLOOR);
      });
    }

    /**
     * The direction, asserted, because "make it a bit lighter" is the intuitive
     * dark-mode elevation move and it is the one that breaks here: `--panel` is
     * `neutral-800`, so upward the tier collides with an opaque Card (neutral-750
     * lands 7/255 from it) while the whole range below neutral-950 is empty.
     */
    it('sits BELOW the page, not above it', () => {
      const composite = compositeOver(tier.surface, page, tier.alpha);
      expect(relativeLuminance(composite)).toBeLessThan(relativeLuminance(page));
    });

    it('carries no brand hue , it is a neutral, and that is the whole point', () => {
      const [r, , b] = channels(tier.surface);
      expect(Math.abs(r! - b!)).toBeLessThanOrEqual(4);
    });
  });

  it('the specular highlight is a DARK-MODE-ONLY material , you cannot lighten white', () => {
    /**
     * The measurement the whole asymmetry rests on, and the reason light mode
     * gets a firmer border and a bottom-weighted shadow instead of a lit edge.
     * White at α 0.35:
     *
     *   light  over #FDF8F5 → #FEFAF9, 1.02:1   invisible
     *   dark   over #232423 → #707170, 3.18:1   clearly a lit edge
     *
     * If a future palette edit ever made the light figure meaningful, this test
     * failing is the signal to give light mode a highlight too.
     *
     * Measured against the TOP stop of the sheen, and only that one: the
     * highlight is an `inset 0 1px 0` box-shadow, so the single row of pixels it
     * paints is the top edge of the surface. It is also the lightest stop, which
     * makes it the hardest place for a white highlight to show , so light mode
     * failing to be invisible here would mean it is visible everywhere.
     */
    const [light, dark] = GLASS_SURFACE_PAIRS.map(
      (p) => resolveGlassSurface(p).stops.find((s) => s.name === 'top')!.composite,
    );
    const lit = (base: string) =>
      contrastRatio(compositeOver('#FFFFFF', base, GLASS_SPECULAR_ALPHA), base);

    expect(round2(lit(light!)), 'light: a white highlight on a near-white surface').toBeLessThan(
      1.05,
    );
    expect(round2(lit(dark!)), 'dark: the highlight IS the material').toBeGreaterThanOrEqual(
      TARGET.nonText,
    );

    // And the tokens encode that asymmetry rather than paying for the no-op.
    expect(glass.surfaceLight.highlight).toBe('transparent');
    expect(parseRgba(glass.surfaceDark.highlight).alpha).toBe(GLASS_SPECULAR_ALPHA);
  });

  it('tier S keeps tier O’s alpha , the tint carries it, not the transparency', () => {
    /**
     * Dropping the alpha is the tempting way to make tier S visible, and it is
     * wrong: `--panel` at α 0.50 lands on an almost identical composite, then
     * drifts 11/255 (light) and 31/255 (dark) the moment the surface sits over
     * anything but the page , a `bg2` well, a selected row, the plum
     * `--elevated`. The tinted surfaces at α 0.85 drift 3/255.
     */
    for (const pair of GLASS_SURFACE_PAIRS) {
      const tier = glass[pair.tier];
      const theme = themes[pair.theme];
      expect(tier.alpha, `${pair.tier} alpha`).toBeGreaterThanOrEqual(GLASS_ALPHA_FLOOR);
      expect(tier.alpha, `${pair.tier} alpha matches the overlay tier`).toBe(
        glass[pair.theme].alpha,
      );

      const overPage = compositeOver(tier.surface, theme.bg, tier.alpha);
      for (const backdrop of [theme.panel, theme.bg2] as const) {
        const drift = maxChannelDelta(compositeOver(tier.surface, backdrop, tier.alpha), overPage);
        expect(
          drift,
          `${pair.tier} drifts ${drift}/255 between the page and ${backdrop}; a tier-S surface ` +
            `has to look the same wherever a card is placed.`,
        ).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe('the chrome composites , a fill and a text token that must move together', () => {
  /**
   * The app bar's two translucent washes, measured over `--chrome` rather than in
   * isolation, in the same spirit as the soft-chip suite.
   *
   * The entry worth reading is the hover one. Both `chromeMutedFg` and
   * `chromeHighlight` pass every flat pair they belong to, and the combination
   * still fails: the wash lifts the bar to #3E3E3D, where muted chrome text is
   * 4.25:1. The rule that resolves it , hover promotes the label to `chromeFg` ,
   * is a relationship between two tokens, which is exactly the class of bug
   * `DISTINCT_ROLE_PAIRS` exists for and which no single-token gate can see.
   */
  for (const pair of CHROME_COMPOSITE_PAIRS) {
    for (const theme of THEMES) {
      it(`${theme}: ${pair.label} , ${pair.because}`, () => {
        const { fg, composite } = resolveChromeComposite(pair, theme);
        expect(round2(contrastRatio(fg, composite))).toBeGreaterThanOrEqual(TARGET.text);
      });
    }
  }

  it('EVERY chrome foreground survives the hover wash , the slack plum bought', () => {
    /**
     * The near-black version of this tier could not say this. Its `neutral-400`
     * muted step measured 4.25:1 over the wash, so promoting a hovered label to
     * `chromeFg` was mandatory rather than optional. Plum plus `neutral-300`
     * clears all three, and this is the assertion that stops that slack being
     * spent again without anyone noticing.
     */
    for (const theme of THEMES) {
      const t = themes[theme];
      const wash = parseRgba(t.chromeHighlight);
      const hovered = compositeOver(wash.hex, t.chrome, wash.alpha);
      for (const key of ['chromeFg', 'chromeMutedFg', 'chromeAccent'] as const) {
        expect(
          contrastRatio(t[key], hovered),
          `${key} over the chrome hover wash`,
        ).toBeGreaterThanOrEqual(TARGET.text);
      }
    }
  });

  it('the theme tokens do NOT work on chrome , which is why the tier has its own', () => {
    // 1.23 / 1.84 / 1.87:1. The mistakes this tier exists to make impossible.
    for (const key of ['fg', 'mutedFg', 'primaryText'] as const) {
      expect(contrastRatio(themes.light[key], themes.light.chrome), key).toBeLessThan(TARGET.text);
    }
    // And the one that looks safest of all: the dark-theme blue step, which a grey
    // bar would have had to use, manages only 4.75:1 on plum , lime is 8.85:1.
    expect(contrastRatio(themes.light.chromeAccent, themes.light.chrome)).toBeGreaterThan(
      contrastRatio('#4AACFF', themes.light.chrome),
    );
  });

  it('the chrome FOREGROUNDS are theme-invariant , only the surface flips', () => {
    /**
     * The tier shipped fully invariant. `chrome` itself no longer is: plum in
     * light, black in dark. The six foregrounds still are, and that is the
     * property worth pinning , it is what lets a call site write
     * `text-chrome-muted-fg` with no `dark:` variant beside it and be right in
     * both themes, which is the whole ergonomic argument for the tier.
     */
    for (const key of [
      'chromeFg',
      'chromeMutedFg',
      'chromeBorder',
      'chromeHighlight',
      'chromeAccent',
      'chromeAccentSoft',
    ] as const) {
      expect(themes.light[key], key).toBe(themes.dark[key]);
    }
    expect(themes.light.chrome).not.toBe(themes.dark.chrome);
  });

  it('chrome is DARKER than its own page in both themes , the tier is a well, not a card', () => {
    /**
     * The direction of separation is the invariant that survived, and it is the
     * one that carries the meaning: chrome is never lighter than the document it
     * frames. Light gets 196/255 of it, dark 22/255 , which is why
     * `chromeBorder` is load-bearing in dark and merely tidy in light.
     */
    for (const theme of THEMES) {
      const t = themes[theme];
      expect(relativeLuminance(t.chrome), `${theme}: chrome vs page`).toBeLessThan(
        relativeLuminance(t.bg),
      );
    }
  });

  it('dark chrome is off the ramp on purpose , neutral-950 would not separate', () => {
    /**
     * `#0F0F0E` is the palette's darkest neutral and the obvious "use an existing
     * entry" choice. Against the `neutral-925` page it is 7/255, i.e. a bar found
     * only by its border. This asserts the gap the literal buys, so nobody
     * "tidies" the hex back onto the ramp without seeing the number.
     */
    const toByte = (hex: string) => parseInt(hex.slice(1, 3), 16);
    const page = toByte(themes.dark.bg);
    expect(page - toByte(themes.dark.chrome)).toBeGreaterThanOrEqual(20);
    expect(page - toByte(neutral[950])).toBeLessThan(10);
  });
});
