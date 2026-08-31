import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { contrastRatio, hexToOklch, oklchToHex, round2 } from '../src/color';
import { neutral } from '../src/palette';
import { themes, type ThemeName } from '../src/semantic';

/**
 * The native scrollbar has exactly two ways to go wrong, and neither one shows
 * up as a broken build, a console warning or a failing render:
 *
 *   1. Someone adds `scrollbar-width` or `scrollbar-color` outside the
 *      `@supports` gate. Chrome then discards every `::-webkit-scrollbar-*` rule
 *      for that scroller and quietly serves the platform bar , arrow buttons,
 *      filled track, the lot. The CSS still parses. The rules are still in the
 *      stylesheet. Nothing anywhere says so.
 *
 *   2. Someone puts a scroller on a surface that is dark in BOTH themes , the
 *      `--code` block, the `--chrome` bar , and the hover escalation, which mixes
 *      toward `--fg`, runs backwards in light mode: reaching for the thumb makes
 *      it harder to see. Every other gate in this repo measures a token against
 *      the surface the THEME says it is on, so none of them can see this.
 *
 * Both are pinned below, and the contrast half is computed from the percentages
 * parsed out of the CSS rather than restated here, so retuning the mix retunes
 * the test with it.
 */

const here = dirname(fileURLToPath(import.meta.url));
const scrollbarCss = readFileSync(join(here, '../css/scrollbar.css'), 'utf8');
const themeCss = readFileSync(join(here, '../css/theme.css'), 'utf8');

/** The file minus its prose, so a trap NAMED in a comment is never read as a use. */
const rules = scrollbarCss.replace(/\/\*[\s\S]*?\*\//g, '');

const THEMES: ThemeName[] = ['light', 'dark'];

/** WCAG 1.4.11. The thumb reports position and accepts a drag, so it applies. */
const NON_TEXT = 3;

/**
 * `color-mix(in oklab, …)`, to the byte.
 *
 * Verified against Chrome 150 on 2026-08-27 , all four values this file
 * computes (#5D5D5C, #434342, #ACAAA9, #CDCBC8) are the exact pixels the browser
 * paints. Polar in, cartesian to interpolate, polar out: oklab mixing is a
 * straight lerp of L, a and b, and `hexToOklch` is the only converter this
 * dependency-free package has.
 */
function mixOklab(a: string, aPercent: number, b: string): string {
  const toLab = ({ l, c, h }: { l: number; c: number; h: number }) => {
    const rad = (h * Math.PI) / 180;
    return [l, c * Math.cos(rad), c * Math.sin(rad)] as const;
  };
  const [al, aa, ab] = toLab(hexToOklch(a));
  const [bl, ba, bb] = toLab(hexToOklch(b));
  const t = aPercent / 100;
  const lerp = (x: number, y: number) => x * t + y * (1 - t);
  const x = lerp(aa, ba);
  const y = lerp(ab, bb);
  return oklchToHex({
    l: lerp(al, bl),
    c: Math.hypot(x, y),
    h: (Math.atan2(y, x) * 180) / Math.PI,
  });
}

/**
 * Pull `color-mix(in oklab, var(--fg) N%, var(--field-border))` out of the
 * declaration that carries it, so the numbers under test are the shipped ones.
 */
function escalationPercent(state: 'hover' | 'active'): number {
  const declaration = new RegExp(
    `::-webkit-scrollbar-thumb:${state}\\s*\\{[\\s\\S]*?\\}`,
    'i',
  ).exec(rules);
  expect(declaration, `No ::-webkit-scrollbar-thumb:${state} rule in scrollbar.css`).not.toBeNull();

  const mix =
    /color-mix\(\s*in oklab,\s*var\(--fg\)\s*([\d.]+)%\s*,\s*var\(--field-border\)\s*\)/.exec(
      declaration![0],
    );
  expect(
    mix,
    `The :${state} thumb must escalate as color-mix(in oklab, var(--fg) N%, var(--field-border)). ` +
      `Mixing toward --fg is what makes one expression raise contrast in BOTH themes.`,
  ).not.toBeNull();
  return Number(mix![1]);
}

/** The three default thumb colours, resolved for one theme. */
function thumbStates(theme: ThemeName) {
  const { fg, fieldBorder } = themes[theme];
  return {
    rest: fieldBorder,
    hover: mixOklab(fg, escalationPercent('hover'), fieldBorder),
    active: mixOklab(fg, escalationPercent('active'), fieldBorder),
  };
}

describe('⚠️ THE MUTUAL-EXCLUSION TRAP , standard properties delete the pseudo-elements', () => {
  /**
   * Chrome 121+ supports `scrollbar-width` and `scrollbar-color`, and setting
   * EITHER on a scroller makes it ignore `::-webkit-scrollbar-*` for that
   * element entirely. Measured 2026-08-27, Chrome 150: a box with both the
   * standard properties and the pseudo-element rules renders arrow buttons and a
   * filled track, i.e. the pseudo-elements are discarded, not merged.
   *
   * So the two spellings may never meet outside the `@supports` gate. The one
   * sanctioned exception is `scrollbar-none`, where both branches say hide and
   * whichever the engine picks gives the same answer.
   */
  const GATE = '@supports not selector(::-webkit-scrollbar)';

  it('scrollbar.css states the gate at least once', () => {
    expect(
      rules,
      'Without `@supports not selector(::-webkit-scrollbar)` the Firefox branch reaches Chrome ' +
        'too, and Chrome answers by throwing away every ::-webkit-scrollbar rule.',
    ).toContain(GATE);
  });

  for (const property of ['scrollbar-width', 'scrollbar-color'] as const) {
    it(`every \`${property}\` is inside the gate or inside scrollbar-none`, () => {
      /**
       * Walk the file brace-by-brace and record, for each occurrence, whether an
       * enclosing block opened with the gate or with `@utility scrollbar-none`.
       * A regex cannot answer "is this inside that block"; this can, and it costs
       * one pass.
       */
      const offenders: string[] = [];
      const stack: string[] = [];
      let cursor = 0;

      for (let i = 0; i < rules.length; i++) {
        const char = rules[i];
        if (char === '{') {
          stack.push(rules.slice(cursor, i).trim());
          cursor = i + 1;
        } else if (char === '}') {
          stack.pop();
          cursor = i + 1;
        } else if (rules.startsWith(property, i) && !/[a-z-]/.test(rules[i - 1] ?? '')) {
          const sheltered = stack.some(
            (selector) => selector.includes(GATE) || selector.includes('scrollbar-none'),
          );
          if (!sheltered) offenders.push(`offset ${i}: ${rules.slice(i, i + 60).split('\n')[0]}`);
        }
      }

      expect(
        offenders,
        `\`${property}\` outside the gate makes Chrome discard the whole pseudo-element ` +
          `treatment for that scroller, silently, and serve the platform bar instead:\n` +
          offenders.join('\n'),
      ).toEqual([]);
    });
  }

  it('theme.css imports scrollbar.css WITHOUT a layer, so @utility stays top-level', () => {
    const importLine = /@import '\.\/scrollbar\.css'([^;]*);/.exec(themeCss);
    expect(importLine, 'theme.css must import ./scrollbar.css').not.toBeNull();
    expect(
      importLine![1]!.trim(),
      '`@utility` inside `@layer` is invalid, and the variant forms ' +
        '(`md:scrollbar-none`) then silently stop generating , the exact bug controls.css ' +
        'documents. scrollbar.css carries its own `@layer base` block instead.',
    ).toBe('');
  });
});

describe('the look is the look ScrollArea already ships', () => {
  it('the gutter defaults to 10px, which is ScrollArea’s w-2.5', () => {
    const bar = /::-webkit-scrollbar\s*\{[\s\S]*?\}/.exec(rules);
    expect(bar).not.toBeNull();
    expect(
      bar![0],
      'One bar width for the whole system. A page that mixes a native scroller and a ' +
        'ScrollArea , which the docs site does , must not show two.',
    ).toContain('var(--scrollbar-size, 10px)');
  });

  it('the thumb is --field-border, never --border', () => {
    const thumb = /::-webkit-scrollbar-thumb\s*\{[\s\S]*?\}/.exec(rules);
    expect(thumb).not.toBeNull();
    expect(
      thumb![0],
      'WCAG 1.4.11 applies to a scrollbar (it reports position and accepts a drag) and not ' +
        'to a separator. --border is the one that is free to recede.',
    ).toContain('var(--scrollbar-thumb, var(--field-border))');
    expect(thumb![0]).not.toContain('var(--border)');
  });

  it('the track and the corner stay transparent', () => {
    const track =
      /::-webkit-scrollbar-track,\s*\n?\s*::-webkit-scrollbar-corner\s*\{[\s\S]*?\}/.exec(rules);
    expect(track, 'The track and corner must be declared together and transparent').not.toBeNull();
    expect(
      track![0],
      'A filled track is the widest block of flat colour on a long page, and is most of what ' +
        'makes a custom scrollbar look dated.',
    ).toContain('var(--scrollbar-track, transparent)');
  });

  it('the arrow buttons are gone', () => {
    expect(
      /::-webkit-scrollbar-button\s*\{[^}]*display:\s*none/.test(rules),
      'The arrow buttons are the single most dated thing on the page, present by default on ' +
        'Linux and Windows Chrome and absent on macOS.',
    ).toBe(true);
  });
});

describe('the escalation raises contrast in BOTH themes', () => {
  /**
   * Rest, hover and drag have to be three visibly different states, and each has
   * to clear 1.4.11 on the surfaces a scroller actually sits on. `--fg` inverts
   * between themes, so one `color-mix` expression darkens the thumb in light and
   * lightens it in dark , which is the whole reason it is written that way.
   */
  for (const theme of THEMES) {
    describe(theme, () => {
      const states = thumbStates(theme);

      for (const surface of ['bg', 'panel'] as const) {
        const backdrop = themes[theme][surface];

        for (const [state, thumb] of Object.entries(states)) {
          it(`${state} on --${surface} (≥${NON_TEXT}:1)`, () => {
            const ratio = contrastRatio(thumb, backdrop);
            expect(
              ratio,
              `${state} thumb ${thumb} on --${surface} ${backdrop} = ${round2(ratio)}:1`,
            ).toBeGreaterThanOrEqual(NON_TEXT);
          });
        }

        it(`rest ≤ hover ≤ drag on --${surface}`, () => {
          const r = (hex: string) => contrastRatio(hex, backdrop);
          expect(
            [round2(r(states.rest)), round2(r(states.hover)), round2(r(states.active))],
            'Reaching for the thumb must never make it harder to see.',
          ).toEqual(
            [r(states.rest), r(states.hover), r(states.active)].map(round2).sort((a, b) => a - b),
          );
        });
      }
    });
  }
});

describe('⚠️ scrollbar-on-dark, and the inversion that makes it necessary', () => {
  /**
   * `--code` is #101828 in BOTH themes. Every other gate here asks "is this token
   * legible on the surface the theme puts it on", and that question has the wrong
   * shape for a surface that ignores the theme , which is how an invisible
   * `variant="ghost"` shipped on the chrome bar.
   *
   * The first test asserts the BUG, not the fix: if the default escalation ever
   * stops inverting over `--code`, `scrollbar-on-dark` has lost its reason to
   * exist and this test says so rather than quietly passing forever.
   */
  const CODE = themes.light.code;

  it('the DEFAULT escalation inverts over --code in light mode', () => {
    const states = thumbStates('light');
    const rest = contrastRatio(states.rest, CODE);
    const hover = contrastRatio(states.hover, CODE);

    expect(
      hover,
      `Default light hover measures ${round2(hover)}:1 over --code against ${round2(rest)}:1 at ` +
        `rest. If this is no longer true, re-derive scrollbar-on-dark , do not delete it ` +
        `without checking --chrome too.`,
    ).toBeLessThan(rest);
  });

  it('--code really is theme-invariant, which is the precondition', () => {
    expect(themes.dark.code).toBe(CODE);
  });

  const onDark = (() => {
    const block = /@utility scrollbar-on-dark\s*\{[\s\S]*?\n\}/.exec(rules);
    expect(block, 'scrollbar.css must declare @utility scrollbar-on-dark').not.toBeNull();

    const read = (name: string) => {
      const m = new RegExp(`--scrollbar-${name}:\\s*var\\(--neutral-(\\d+)\\)`).exec(block![0]);
      expect(
        m,
        `scrollbar-on-dark must set --scrollbar-${name} from the neutral ramp. A theme token ` +
          `would defeat the point: this surface does not follow the theme.`,
      ).not.toBeNull();
      return neutral[Number(m![1]) as keyof typeof neutral];
    };

    return { rest: read('thumb'), hover: read('thumb-hover'), active: read('thumb-active') };
  })();

  it('leaves rest alone , the ramp step it names IS --field-border', () => {
    expect(
      onDark.rest.toLowerCase(),
      'Only the two escalated states are wrong on a dark surface; rest already measures 4.58:1 ' +
        'over --code. Moving it would put a second resting thumb colour into the system.',
    ).toBe(themes.light.fieldBorder.toLowerCase());
  });

  for (const theme of THEMES) {
    it(`${theme}: rest < hover < drag over --code, all ≥${NON_TEXT}:1`, () => {
      const ratios = (['rest', 'hover', 'active'] as const).map((s) =>
        contrastRatio(onDark[s], themes[theme].code),
      );
      for (const [i, ratio] of ratios.entries()) {
        expect(
          ratio,
          `${(['rest', 'hover', 'active'] as const)[i]} = ${round2(ratio)}:1`,
        ).toBeGreaterThanOrEqual(NON_TEXT);
      }
      expect(ratios[0]).toBeLessThan(ratios[1]!);
      expect(ratios[1]).toBeLessThan(ratios[2]!);
    });
  }

  it('also survives --chrome, the other theme-invariant surface', () => {
    /**
     * No scroller sits on the chrome bar today (AppShell's three
     * `overflow-y-auto` regions are all panel or glass). This pins the utility as
     * the right answer for the day one does, rather than leaving the next person
     * to re-derive it , note the plum bar is the harder of the two backdrops.
     */
    for (const theme of THEMES) {
      const backdrop = themes[theme].chrome;
      for (const state of ['hover', 'active'] as const) {
        const ratio = contrastRatio(onDark[state], backdrop);
        expect(
          ratio,
          `${theme} ${state} thumb ${onDark[state]} on --chrome ${backdrop} = ${round2(ratio)}:1`,
        ).toBeGreaterThanOrEqual(NON_TEXT);
      }
    }
  });
});

describe('scrollbar-none hides the bar without hiding the scroller', () => {
  it('states both spellings, which is safe precisely because both hide', () => {
    const block = /@utility scrollbar-none\s*\{[\s\S]*?\n\}/.exec(rules);
    expect(block).not.toBeNull();
    expect(block![0]).toContain('scrollbar-width: none');
    expect(
      /&::-webkit-scrollbar\s*\{[^}]*display:\s*none/.test(block![0]),
      'The one place the two spellings may coexist: whichever branch the engine takes, the ' +
        'answer is the same. This is the pair Radix injects for the ScrollArea viewport.',
    ).toBe(true);
  });
});
