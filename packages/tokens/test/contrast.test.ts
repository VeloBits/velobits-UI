import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, hexToRgb, round2 } from '../src/color';
import { GLASS_ALPHA_FLOOR, GLASS_SPECULAR_ALPHA, glass } from '../src/glass';
import { worstCaseBackdrops } from '../src/palette';
import { themes, type SemanticTokens, type ThemeName } from '../src/semantic';
import {
  CONTRAST_EXEMPT,
  CONTRAST_PAIRS,
  GLASS_OVERLAY_PAIRS,
  GLASS_SURFACE_PAIRS,
  PERCEPTIBILITY_FLOOR,
  SOFT_CHIP_PAIRS,
  TARGET,
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

/** Skip translucent values — a contrast ratio needs an opaque colour. */
const isOpaqueHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

describe('semantic pairs meet their WCAG target', () => {
  for (const theme of THEMES) {
    describe(theme, () => {
      for (const pair of CONTRAST_PAIRS) {
        const resolved = resolvePair(pair, theme);
        if (!resolved) continue;

        const suffix = pair.note ? ` — ${pair.note}` : '';
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
   * is underneath — so the colour the 12px text actually sits on is dominated
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
                `12px, so the large-text discount does not apply — retune the text token or ` +
                `thin the wash; do not lower the target.`,
            ).toBeGreaterThanOrEqual(TARGET.text);
          });
        }
      }
    });
  }
});

describe('the specific claims the palette was designed around', () => {
  /**
   * These are not redundant with the pair sweep — they are the measurements the
   * palette's *shape* rests on. If any of them moves, a documented design
   * decision has silently changed meaning.
   */
  it('blue fails as text on cream, which is why --primary-text exists', () => {
    // 3.90:1 — the whole reason `primary` is a fill-only token.
    expect(round2(contrastRatio('#007ACC', '#F4EDEA'))).toBe(3.9);
    expect(contrastRatio('#007ACC', '#F4EDEA')).toBeLessThan(TARGET.text);
  });

  it('blue works as a fill with white on it', () => {
    expect(round2(contrastRatio('#FFFFFF', '#007ACC'))).toBe(4.51);
  });

  it('lime is text-safe ONLY against charcoal', () => {
    expect(round2(contrastRatio('#C8F135', '#2A2B2A'))).toBe(10.89);
    // White on lime is the mistake this number exists to forbid.
    expect(round2(contrastRatio('#FFFFFF', '#C8F135'))).toBe(1.31);
    // And lime is never text, never a border, never a focus ring in light mode.
    expect(round2(contrastRatio('#C8F135', '#F4EDEA'))).toBe(1.13);
  });

  it('a lime fill cannot be a lone graphical indicator in light mode', () => {
    /**
     * 1.13:1 against the cream page — far below the 3:1 that WCAG 1.4.11 asks of
     * a graphical object conveying information. So in LIGHT mode:
     *
     *   fine    a badge or button, where the charcoal text inside (10.89:1) is
     *           what identifies the element
     *   NOT fine a status dot, an indicator bar, an unlabelled chart mark — any
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
    expect(round2(contrastRatio('#582840', '#F4EDEA'))).toBe(10.12);
  });

  it('the blue text steps clear AA in their own theme', () => {
    expect(contrastRatio('#0062B3', '#F4EDEA')).toBeGreaterThanOrEqual(TARGET.text);
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
   * lighter and flips failing muted text into passing — see the note on
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
        expect(ratio, `${round2(ratio)}:1 — needs ≥${TARGET.text}:1`).toBeGreaterThanOrEqual(
          TARGET.text,
        );
      });

      it(`${tierName}: muted-on-glass over ${backdrop} (composite ${surface})`, () => {
        const ratio = contrastRatio(themes[theme].mutedOnGlass, surface);
        expect(ratio, `${round2(ratio)}:1 — needs ≥${TARGET.text}:1`).toBeGreaterThanOrEqual(
          TARGET.text,
        );
      });
    }
  }

  it('the ordinary muted token is NOT safe on glass — this is why mutedOnGlass exists', () => {
    /**
     * A guard against someone "simplifying" the two tokens back into one.
     *
     * Note the failure is a WORST-CASE result, not a lime-specific one: over a
     * lime backdrop `mutedFg` actually measures a comfortable 5.40:1, and it is
     * the DARK backdrops that sink it to 3.09:1 — a white glass at the alpha
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

/** Parse `rgba(r, g, b, a)` — the only translucent spelling these tokens use. */
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

describe('THE PERCEPTIBILITY GATE — tier-S glass is not an opaque panel in disguise', () => {
  /**
   * The one gate in this file that is not about accessibility.
   *
   * Everything above asks "can you read this". This asks "can you SEE it at
   * all", and nothing above would ever have caught the failure: an invisible
   * glass card has *better* text contrast than a visible one, so the whole WCAG
   * sweep reports green while the feature does nothing.
   *
   * The failure being prevented is specific and was the first attempt at this
   * tier: white at α 0.85 over the cream page composites to #FDFCFC, 3/255 from
   * the opaque #FFFFFF panel, and #2C2D2C at α 0.85 over the dark page gives
   * #292A29, also 3/255 off its panel. Blurring a uniform page returns that same
   * uniform page, so the browser pays for a backdrop repaint per surface and the
   * pixels do not move.
   */
  for (const pair of GLASS_SURFACE_PAIRS) {
    const r = resolveGlassSurface(pair);
    const tier = glass[pair.tier];

    describe(`${pair.label} — ${tier.surface} @α${tier.alpha} → ${r.composite}`, () => {
      it(`differs from --panel by ≥${PERCEPTIBILITY_FLOOR}/255 on some channel`, () => {
        const delta = maxChannelDelta(r.composite, r.panel);
        expect(
          delta,
          `Tier-S glass (${tier.surface} @α${tier.alpha}) composites over the page to ` +
            `${r.composite}, which is ${delta}/255 from the opaque --panel (${r.panel}).\n\n` +
            `THAT MEANS THE GLASS IS VISUALLY IDENTICAL TO AN OPAQUE PANEL: the blur costs a ` +
            `backdrop repaint per surface for no visual change, and blurring a uniform page ` +
            `returns that same uniform page.\n\n` +
            `Fix it by TINTING the tier-S surface further off the panel — not by lowering the ` +
            `alpha, which makes the composite drift over any backdrop that is not the page ` +
            `(--panel at α 0.50 lands on the same colour and drifts 11/255 in light, 31/255 ` +
            `in dark, against this tier's 3/255).`,
        ).toBeGreaterThanOrEqual(PERCEPTIBILITY_FLOOR);
      });

      it(`differs from --bg by ≥${PERCEPTIBILITY_FLOOR}/255 on some channel`, () => {
        const delta = maxChannelDelta(r.composite, r.bg);
        expect(
          delta,
          `Tier-S glass composites to ${r.composite}, only ${delta}/255 off the page ` +
            `(${r.bg}) it is drawn on. A surface that matches the page is not a surface — ` +
            `the card boundary would be carried entirely by its 1px border.`,
        ).toBeGreaterThanOrEqual(PERCEPTIBILITY_FLOOR);
      });

      it('reads as RAISED off the page, not recessed into it', () => {
        /**
         * Direction matters as much as magnitude. A tier-S composite DARKER than
         * the page satisfies both deltas above and still looks wrong — a card is
         * elevation, and elevation reads lighter in both themes. Light lands at
         * +9/+11/+11 over cream, dark at +9/+9/+9 over the charcoal page.
         */
        const lift = channels(r.composite).map((v, i) => v - channels(r.bg)[i]!);
        expect(
          Math.min(...lift),
          `${r.composite} sits BELOW the page ${r.bg} on some channel (${lift.join('/')}), ` +
            `so the surface reads as a well rather than a card.`,
        ).toBeGreaterThan(0);
      });

      it(`body text clears AA on the composite (≥${TARGET.text}:1)`, () => {
        const ratio = contrastRatio(r.fg, r.composite);
        expect(ratio, `${round2(ratio)}:1 on ${r.composite}`).toBeGreaterThanOrEqual(TARGET.text);
      });

      it(`--muted-fg clears AA on the composite, so --muted-on-glass is NOT needed here`, () => {
        /**
         * The load-bearing difference between the tiers. Tier O has to step muted
         * text up to `--muted-on-glass` because its backdrop is unknown and the
         * ordinary token sinks to 3.09:1 against the worst of them. Tier S knows
         * its backdrop, and the ordinary token measures 5.57:1 (light) / 6.19:1
         * (dark) — so `.glass-surface` deliberately does NOT set the override,
         * and darkening every secondary label in the product is not the price of
         * this retrofit.
         */
        const ratio = contrastRatio(r.mutedFg, r.composite);
        expect(
          ratio,
          `--muted-fg (${r.mutedFg}) on ${r.composite} = ${round2(ratio)}:1. If this drops ` +
            `below ${TARGET.text}:1, .glass-surface has to start overriding --muted-fg the ` +
            `way .glass does — see css/glass.css.`,
        ).toBeGreaterThanOrEqual(TARGET.text);
      });

      it('the hairline border stays visible against its own surface', () => {
        /**
         * NOT a 1.4.11 gate: `--border` is CONTRAST_EXEMPT because a card
         * outline is decorative, and the tier-S border is the same kind of line.
         * It is asserted anyway because in LIGHT mode it is most of the material
         * — measured 1.60:1, tuned to match what the opaque `--border` shows on
         * `--panel` (1.61:1), where the tier-O border at α 0.10 would give only
         * 1.21:1. Dark measures 1.50:1 against the opaque pairing's 1.15:1.
         */
        const { hex, alpha } = parseRgba(tier.border);
        const line = compositeOver(hex, r.composite, alpha);
        const ratio = contrastRatio(line, r.composite);
        expect(
          ratio,
          `border ${tier.border} over ${r.composite} = ${line}, ${round2(ratio)}:1`,
        ).toBeGreaterThan(1.4);
      });
    });
  }

  for (const pair of GLASS_OVERLAY_PAIRS) {
    const r = resolveGlassOverlay(pair);
    const tier = glass[pair.tier];

    it(`${pair.label} differs from the page by ≥${PERCEPTIBILITY_FLOOR}/255`, () => {
      /**
       * The tier-O half of this gate, added 2026-08-06 after the dark overlay
       * was found composting to 0/255 — literally the page colour — because its
       * surface token WAS the page token. See {@link GLASS_OVERLAY_PAIRS} for
       * why this measures against `--bg` only and never `--panel`.
       */
      const delta = maxChannelDelta(r.composite, r.bg);
      expect(
        delta,
        `Tier-O glass (${tier.surface} @α${tier.alpha}) composites over the page to ` +
          `${r.composite}, only ${delta}/255 off the page (${r.bg}) it floats above.\n\n` +
          `A Dialog survives this because --overlay scrims its backdrop first, but a Popover, ` +
          `DropdownMenu, CommandPalette or Toast has no scrim — it would be carried entirely ` +
          `by its 1px border.\n\n` +
          `Fix it by TINTING the tier-O surface off the page, not by lowering the alpha, and ` +
          `re-check the seven-backdrop legibility sweep above: lifting the dark surface as far ` +
          `as --panel reaches 20/255 but sinks --muted-on-glass to 4.20:1, under AA.`,
      ).toBeGreaterThanOrEqual(PERCEPTIBILITY_FLOOR);
    });
  }

  it('the specular highlight is a DARK-MODE-ONLY material — you cannot lighten white', () => {
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
     */
    const [light, dark] = GLASS_SURFACE_PAIRS.map((p) => resolveGlassSurface(p).composite);
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

  it('tier S keeps tier O’s alpha — the tint carries it, not the transparency', () => {
    /**
     * Dropping the alpha is the tempting way to make tier S visible, and it is
     * wrong: `--panel` at α 0.50 lands on an almost identical composite, then
     * drifts 11/255 (light) and 31/255 (dark) the moment the surface sits over
     * anything but the page — a `bg2` well, a selected row, the plum
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
