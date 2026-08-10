/**
 * THE CONTROL MATERIAL — the glass language, extended from surfaces to controls.
 *
 * ## The problem this solves
 *
 * Before this layer, every control in the system was a FLAT FILL. `Button`,
 * `Input`, `Textarea`, `NativeSelect`, `Checkbox` and the `Switch` thumb painted
 * `--panel`; `Kbd`, the `TabsList` track, the `SegmentedControl` track and
 * `AvatarFallback` painted `--bg2`. No lit edge, no depth, nothing that reads as
 * a material. So a Card looked like glass and everything inside it looked like
 * paper, which is the actual reason the product "did not feel glassmorphic" even
 * though the surfaces were correct.
 *
 * It also fixes a measured bug rather than only a stylistic one:
 *
 *   --panel control on a --panel surface  →  **0/255, both themes**
 *
 * An `Input` inside `<Card surface="panel">` or a `Panel` is *exactly* its
 * backdrop's colour, identified by its 1px border and nothing else. (Inside a
 * glass Card it is 9-10/255, which is fine.) A lit edge and an inset well give
 * every control an identity that does not depend on its fill differing from what
 * it sits on — which is the only fix available, because `--panel` is what both the
 * control and the surface legitimately want to be.
 *
 * ## Why this is NOT more translucency
 *
 * Because translucency cannot work here, and that is measured, not assumed.
 *
 * A tier-S surface transmits 15% of its backdrop at α 0.85, so the page texture
 * arrives inside a Card at ~2/255 — below perception. Lowering the alpha to let it
 * through breaks the perceptibility gate before it becomes visible (in light mode
 * *nothing* below 0.85 passes). The gate that makes a surface read as raised and
 * the transparency that would make it read as see-through are in direct
 * opposition.
 *
 * So the material has to come from **edge, light and depth** — none of which spend
 * any of the transmission budget, and all of which are effectively ungated because
 * a 1px inner edge is decorative under WCAG. Same conclusion the tier-S re-tune
 * reached for surfaces; this applies it to controls.
 *
 * ## The asymmetry, again, and for the same reason
 *
 * Measured against the fills these actually sit on:
 *
 *   white lit edge on --panel   light 1.00:1 at EVERY alpha   dark 1.56:1 at α 0.14
 *   dark inset on the track     light 1.16:1 at α 0.07        dark 1.13:1 at α 0.20
 *
 * Light mode's `--panel` is `#FFFFFF`. **You cannot lighten white** — the lit edge
 * is invisible there at any alpha, exactly as it is on the tier-S light surface, so
 * `light.lit` is `transparent` and light's raised material is carried by its
 * shadow. Do not "fix" this by raising the alpha; the 1.00:1 figure is what a test
 * pins.
 *
 * Dark needs the opposite: the lit edge IS the material (as on tier S), and the
 * inset needs roughly 3× light's alpha to register, because `--bg2` and `--panel`
 * are the same colour in dark mode and both are already dark.
 */
export interface ControlMaterial {
  /**
   * The lit top edge of a RAISED control — a button, the switch thumb, the active
   * tab. Applied as `inset 0 1px 0`, so it follows `border-radius` for free.
   *
   * `transparent` in light mode. See the asymmetry note above.
   */
  lit: string;
  /**
   * The inner shadow of a RECESSED control — an input, a textarea, a segmented
   * track. Applied as `inset 0 1px 2px`, i.e. a short well at the top edge, which
   * is what reads as "type into me" rather than "press me".
   */
  inset: string;
  /**
   * The drop shadow under a raised control.
   *
   * **Never `none`, in either theme**, and this is a real trap rather than a style
   * note: `.control-raised` composes this into a comma-separated `box-shadow` LIST
   * with `lit`, and `none` inside such a list is invalid CSS. The browser drops the
   * WHOLE declaration, which would silently take dark mode's lit edge — its only
   * material — with it.
   *
   * This is why the class cannot simply reuse `--shadow-sm`: that token IS `none`
   * in dark mode. An absent shadow here must be spelled `0 0 0 transparent`.
   * `controls-css.test.ts` asserts against `none`. Exactly the same hazard as
   * `--glass-surface-shadow`, and it bit for the same reason.
   */
  shadow: string;
}

export const controls = {
  light: {
    // Invisible at any alpha on a white fill — measured 1.00:1. Light's raised
    // material is the shadow below, not a highlight.
    lit: 'transparent',
    inset: 'rgba(42, 43, 42, 0.07)',
    shadow: '0 1px 2px rgba(42, 43, 42, 0.06)',
  },
  dark: {
    // 1.56:1 over --panel. The dark-mode material, same as on a tier-S surface.
    // Deliberately far below tier S's α 0.50: that lives on a large surface where
    // it reads as a lit edge, whereas on a 36px control the same value is a bright
    // white line across the top of every button.
    lit: 'rgba(255, 255, 255, 0.14)',
    // ~3x light's alpha. --bg2 IS --panel in dark mode and both are already dark,
    // so α 0.07 measures 1.04:1 here and does nothing.
    inset: 'rgba(0, 0, 0, 0.3)',
    // A REAL shadow, not `0 0 0 transparent` and not `none`. Dark mode used to
    // delineate with borders alone; the 2026-08-06 glass re-tune measured that as
    // half wrong, and the same reasoning applies at control scale.
    shadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
  },
} as const satisfies Record<'light' | 'dark', ControlMaterial>;

export type ControlMaterialName = keyof ControlMaterial;
