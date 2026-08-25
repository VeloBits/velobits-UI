/**
 * The icon playground's model: what can be configured, and what each
 * configuration produces.
 *
 * Deliberately free of React and of any DOM read, so the two things most worth
 * getting right , the emitted snippets and the contrast verdict , are plain
 * functions over a plain object. `icon-detail-dialog.tsx` owns the state and the
 * `getComputedStyle` calls that resolve tokens to real channel values; this file
 * only ever sees numbers and strings.
 *
 * ## What is actually configurable, and why it is more than `size`
 *
 * `createIcon` spreads `{...props}` AFTER its own `strokeWidth`, `strokeLinecap`,
 * `strokeLinejoin` and `aria-hidden`, so every one of those is overridable from a
 * call site. Only `viewBox` and `stroke="currentColor"` are effectively fixed ,
 * and `currentColor` is not a limitation, it is the colour mechanism: an icon
 * takes the `color` of whatever it sits in, which is why the colour control here
 * emits a text utility or a `color` style rather than a `stroke` prop.
 */

/* ── Sizes ────────────────────────────────────────────────────────────────── */

/**
 * `13`–`18` is the range the geometry was drawn for, per `createIcon`'s sizing
 * contract, so those four lead. `24` is the grid's own unit (1:1, no scaling at
 * all) and `32`/`48`/`64` are here because people do reach for a large glyph in
 * an empty state , showing what that actually looks like is more useful than
 * pretending the range stops at 24.
 *
 * `64` is also `DEFAULT_CONFIG.size`, which needs saying because it looks like a
 * contradiction: the playground opens FOUR TIMES above the range the glyphs were
 * drawn for. That is on purpose and it is an inspection default, not a
 * recommendation , the stage exists to show geometry, and at 16px a reader cannot
 * see what a stroke width or an end style or a fill actually did. The honest
 * answer to "what does this look like where it ships" is `TRUE_SIZE_STRIP`,
 * which sits directly under the stage for exactly that reason and is never
 * driven by this value.
 */
export const SIZE_PRESETS = [13, 14, 16, 18, 24, 32, 48, 64] as const;

/** The slider's range, and the clamp on anything else that sets a size. */
export const SIZE_MIN = 8;
export const SIZE_MAX = 128;

/* ── Colours ──────────────────────────────────────────────────────────────── */

export interface ColorChoice {
  /** Stable key for the control's state. */
  id: string;
  label: string;
  /** The Tailwind text utility, or `null` for `currentColor` (emit nothing). */
  className: string | null;
  /** Shown under the swatch when the choice has a caveat worth reading. */
  note?: string;
}

/**
 * The token colours worth offering, in the order a reader should meet them.
 *
 * `currentColor` is first and is the default, because it is what the package
 * actually does and what almost every call site should keep: an icon beside a
 * label inherits that label's colour and stays correct when the surface changes.
 *
 * Two entries carry notes rather than being omitted, because omitting them would
 * hide a real asymmetry in the palette:
 *
 *  - **`primary`** is the blue FILL. As text it measures 3.86:1 on the page and
 *    fails AA's 4.5:1 (4.51:1 is the other direction , WHITE on primary, which
 *    is what makes it a fill), so `button.tsx` documents that no variant paints
 *    it as text and `link` (`--primary-text`) exists instead. An icon is a
 *    non-text graphic and gated at 3:1 by WCAG 1.4.11, which 3.86 clears , so
 *    `primary` is legitimate here, which is exactly the sort of thing that reads
 *    as an inconsistency unless it is written down.
 *  - **`brand`** is lime, a fill token with no text pairing at all: on the cream
 *    page it measures ~1.1:1. It is listed so the contrast readout can say so
 *    out loud, which teaches the rule better than its absence would.
 */
export const COLOR_CHOICES: ColorChoice[] = [
  { id: 'current', label: 'currentColor', className: null, note: 'Inherits. The default.' },
  { id: 'fg', label: 'fg', className: 'text-fg' },
  { id: 'muted', label: 'muted', className: 'text-muted-foreground' },
  {
    id: 'primary',
    label: 'primary',
    className: 'text-primary',
    note: 'Fill token, 3:1 as a glyph',
  },
  { id: 'link', label: 'link', className: 'text-link', note: 'The text-safe blue' },
  { id: 'success', label: 'success', className: 'text-success' },
  { id: 'warning', label: 'warning', className: 'text-warning' },
  { id: 'danger', label: 'danger', className: 'text-danger' },
  { id: 'info', label: 'info', className: 'text-info' },
  { id: 'brand', label: 'brand', className: 'text-brand', note: 'Lime. Needs a dark surface' },
];

/**
 * ⚠️ A FILL IS A KNOCKOUT, AND THE SURFACE IS PART OF THE PAINT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `createIcon` writes `fill="none"` then spreads `{...props}`, so `fill` is
 * overridable from a call site. The obvious thing to do with that ,
 * `fill="currentColor"` , is a trap on its own, and the shape of the trap is
 * what this whole model is built around.
 *
 * A `fill` on the `<svg>` root inherits into EVERY child. Around forty glyphs in
 * this set are drawn as a container plus its contents, e.g. `Adler32Icon`:
 *
 *     <rect x="3" y="3" width="18" height="18" rx="3" />   ← closed container
 *     <path d="M8 16l2-8 2 8" />                            ← the "A"
 *     <path d="M9 14h2" />
 *     <path d="M16 8v4h-2" />
 *
 * The rect is closed, so a solid fill turns it into an 18x18 slab. The inner
 * paths DO paint on top of it , they are later in document order , but in the
 * IDENTICAL colour, so they disappear into it. A plain rounded square: not a
 * degraded icon, an erased one.
 *
 * ## The previous answer, and why it was replaced (2026-08-25)
 *
 * This shipped for two releases as a DUOTONE WASH: `fill-opacity: 0.2` with the
 * stroke at full alpha. SVG paints fill before stroke on the same element, so
 * the linework always survived on top of its own tint. It was safe for all three
 * shapes the set contains and it was never what anyone meant by "filled" , the
 * glyph stayed the same colour it already was and gained a faint bloom behind
 * it. Reported as "fill is not working as expected", and correctly so.
 *
 * ## What replaced it
 *
 * A KNOCKOUT. The closed geometry takes the selected colour at FULL alpha, and
 * the open geometry is stroked in the colour of the SURFACE the glyph sits on,
 * so it reads as cut out of the block:
 *
 *   container glyphs   a solid slab with the contents punched through it
 *   closed glyphs      a solid silhouette
 *
 * `Adler32Icon` becomes a solid rounded square with a surface-coloured "A" cut
 * out of it, which is what every solid icon family (Material, Phosphor) ships ,
 * they DRAW that as separate geometry, because "which regions are interior" is a
 * design decision an outline does not contain. This derives it instead, from the
 * one structural fact the outline DOES contain: closed vs open.
 *
 * ## The surface is now load-bearing, and that is the cost
 *
 * A knockout is only a knockout against the thing it was cut from. The stroke
 * paints `--bg`/`--panel`/`--code`/`--brand` per `SurfaceChoice.knockoutClass`,
 * so the emitted snippet carries the surface it was configured on, and dropping
 * that snippet onto a different background shows the wrong colour in the cut.
 * That is why the knockout is a TOKEN utility and not the hex read off the DOM:
 * a token still tracks the theme, so at least light/dark cannot drift. The `.svg`
 * export has no stylesheet and therefore has no choice , see `toSvgMarkup`.
 *
 * ## What this genuinely breaks, counted rather than hand-waved
 *
 * 97 of 198 glyphs have both fillable and open geometry. In 56 of them the open
 * geometry is nested INSIDE the fillable shape , the `Adler32Icon` case , and
 * the knockout is exactly right. In the other 41 it sits OUTSIDE, so it is
 * knocked out against a surface it was never over, and simply vanishes:
 *
 *   `SunIcon`      r=4 disc plus 8 rays      → the rays go, leaving a dot
 *   `UserIcon`     head circle plus shoulders → the shoulders go, leaving a disc
 *   `SearchIcon`   r=8 lens plus the handle   → the handle goes
 *   `LockIcon`     body rect plus the shackle → indistinguishable from `PasswordIcon`
 *
 * Roughly 18 of the 41 collapse to a dot or a bar; the rest keep a readable
 * silhouette and lose a feature. Two further cases are fillable-inside-fillable
 * rather than open-inside-fillable and so are not in that count: `ToggleIcon` /
 * `ToggleMarkIcon` lose the knob into the pill, and `CircleHalfIcon` , the set's
 * one hand-authored duotone , fills to a complete disc and stops being half.
 *
 * Fixing these needs per-element containment (does this open path lie inside
 * that filled shape?), which a selector cannot ask and which would have to be
 * emitted as `nth-child` rules pinned to the package's internal child order.
 * That is a worse thing to hand a reader than a preview that shows the problem,
 * so the toggle stays live for these and the stage tells the truth immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/**
 * How the CSS asks "is this path closed?", and the JS mirror of it.
 *
 * ⚠️ THE `i` FLAG IS NOT OPTIONAL, AND `_` IS HOW TAILWIND SPELLS THE SPACE.
 *
 * Attribute-value matching is case-sensitive for `d` (SVG attributes are not on
 * HTML's case-insensitive list), and this set closes paths BOTH ways: 14 end in
 * `Z`, 17 end in `z`. `[d$=Z]` therefore reads 55% of the closed geometry as
 * open and knocks it out , and because those 17 include single-path glyphs
 * (`ShieldIcon`, `DropletIcon`, `FlameIcon`, `WrenchIcon`) it does not degrade
 * them, it deletes them. `AlertTriangleIcon` and `RulerIcon` are the same
 * triangle drawn twice with different casing, which is the whole bug in one
 * pair.
 *
 * Verified against the built stylesheet rather than assumed: Tailwind turns the
 * `_` into a space and Lightning CSS preserves the flag, emitting
 * `>path:not([d$=Z i])`. Both quoted spellings normalise to the same rule, so
 * the unquoted one is used.
 *
 * Counted across the set (198 icons, `packages/icons/src/icons.tsx`):
 *
 *   rect 59, circle 63, ellipse 1, polygon 3   126 shapes, ALWAYS closed
 *   path ending in Z or z                       31 paths, genuinely closed
 *   path without one                           347 paths, fill invents a chord
 *   polyline                                    19, also fills a chord
 *   line                                        27, no area, never fills
 *
 * Every closed path holds exactly one `Z`/`z`, as its final character, with no
 * trailing whitespace , checked, because `$=` would miss all three variations.
 */
export const CLOSED_PATH_SELECTOR = '[d$=Z_i]';

/**
 * The JS mirror of `CLOSED_PATH_SELECTOR`, for the two places CSS cannot reach:
 * `hasFillableGeometry` and the `.svg` export.
 *
 * Kept deliberately equivalent , attribute value ends with `Z` or `z`, nothing
 * after it , because a preview and a downloaded file that disagree about which
 * paths are closed is precisely the drift `gradientRender` exists to prevent.
 */
export const CLOSED_PATH_PATTERN = /<path\b[^>]*\bd="[^"]*[Zz]"/;

/** The same test against one element's attribute string, for the exporter. */
export function isClosedPath(attributes: string): boolean {
  return /\bd="[^"]*[Zz]"/.test(attributes);
}

/**
 * ⚠️ A FILL MAY ONLY TOUCH GENUINELY CLOSED GEOMETRY.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `fill` on the root inherits into EVERY child, and on an open path SVG fills
 * the region as if the path were closed , the chord. That region is not in the
 * drawing. `BrainfuckDecIcon` is two open chevrons, `M8 8l3 4-3 4` and
 * `M16 8l-3 4 3 4`; filled, each closes into a solid triangle that the designer
 * never drew. At the old 20% wash that was a faint wedge. At full alpha it is
 * the glyph.
 *
 * So the fill is kept off `polyline` outright, and off any `path` that does not
 * close , which since `CLOSED_PATH_SELECTOR` exists is a question a selector CAN
 * now ask. The 31 closed paths keep their fill: `AlertTriangleIcon`'s triangle
 * is one, and 26 icons become fillable for the first time because a closed path
 * was the only area they ever had.
 *
 * `<line>` is absent here on purpose: it encloses no area, so it never fills,
 * and naming it would add a class that does nothing. It DOES appear in
 * `SurfaceChoice.knockoutClass`, because a line very much can be knocked out.
 *
 * ## Why this is a class and not a prop
 *
 * There is no prop that reaches a child. `createIcon` renders fixed `children`,
 * so the only lever from outside is a CSS selector , which a `className` can
 * carry into the copied snippet. A CSS `fill` also beats the inherited `fill`
 * presentation attribute, so `fill: none` on the child wins over
 * `fill="currentColor"` on the root without `!important` , and, usefully, over
 * the 21 elements in the package that hardcode `fill="currentColor"
 * stroke="none"` for a solid mark.
 *
 * The `:not()` spelling is doing one more job than it looks. Suppressing every
 * `path` and then winning the closed ones back with a second, more specific
 * class would work for a flat colour and would BREAK a gradient: the win-back
 * rule has to name a paint, and naming `currentColor` overrides the `url(#…)`
 * the root is carrying. Excluding closed paths from the rule instead leaves them
 * with no rule at all, so they inherit whatever the root paints , a colour or a
 * paint server, without the class having to know which.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/**
 * The utilities that keep a fill off every open shape.
 *
 * ⚠️ WRITTEN OUT AS A LITERAL, AND IT HAS TO BE.
 *
 * This was `['path', 'polyline'].map((e) => `[&>${e}]:fill-none`).join(' ')`,
 * which is tidier, produces the identical string at runtime, and generated NO
 * CSS AT ALL. Tailwind v4 scans source files as PLAIN TEXT , it never evaluates
 * them , so a class name assembled from a template literal is invisible to the
 * scanner. The classes reached the DOM, `fill-none` appeared zero times in the
 * stylesheet, and every open path stayed filled: the bug looked unfixed.
 *
 * Same family as the trap `native-select.tsx` documents (a class harvested out of
 * a COMMENT, because comments are text too) and as the dead
 * variant-over-a-hand-written-class in `controls.css`. The rule underneath all
 * three: if Tailwind cannot see the finished string sitting in a source file,
 * there is no rule, and nothing anywhere reports it.
 *
 * Which is also why `CLOSED_PATH_SELECTOR` is spelled out again here instead of
 * being interpolated. The two must stay in step by inspection, not by
 * construction , the constant is for the exporter, this literal is for Tailwind,
 * and only one of them is allowed to be computed.
 */
export const FILL_SUPPRESS_CLASS = '[&>path:not([d$=Z_i])]:fill-none [&>polyline]:fill-none';

/**
 * The same element list, PARSED BACK OUT of the literal above.
 *
 * The SVG export cannot use a class , a standalone file has no stylesheet , so it
 * needs these names to write `fill="none"` per element. Deriving them from the
 * one string that Tailwind actually reads means the two can never disagree,
 * which a hand-maintained second copy would eventually do silently: the preview
 * would be right and every downloaded file would carry the chord wedge.
 *
 * Safe to compute, unlike the class: this value is never a class name, so
 * nothing here has to survive a plain-text scan.
 *
 * ⚠️ The capture stops at the element name and does NOT require a closing `]`.
 * It used to, and the moment `path` grew its `:not([d$=Z_i])` qualifier that
 * anchor silently dropped `path` from this list , leaving `polyline` alone, and
 * every exported `.svg` carrying a chord wedge through every open path while the
 * preview, which uses the class, stayed correct.
 */
export const FILL_SUPPRESSED_ELEMENTS = [...FILL_SUPPRESS_CLASS.matchAll(/\[&>(\w+)/g)].map(
  (match) => match[1]!,
);

/**
 * The element types a fill is allowed to paint unconditionally.
 *
 * A `<path>` is not here and cannot be: whether it encloses anything depends on
 * its `d`, which is what `CLOSED_PATH_PATTERN` asks.
 */
export const FILLABLE_ELEMENTS = ['rect', 'circle', 'ellipse', 'polygon'] as const;

/**
 * Whether this glyph has anything a fill could legitimately paint.
 *
 * Read from the icon's own serialised markup rather than a lookup table, for the
 * same reason the colours are read from `getComputedStyle`: a second copy of the
 * icon package's geometry would go stale silently. The glyphs made entirely of
 * open paths have no fillable shape at all , the dialog disables the toggle for
 * those and says why, rather than offering a control that appears to do nothing.
 *
 * A closed `<path>` counts, which it did not before: 26 icons , `ShieldIcon`,
 * `HeartIcon`, `AlertTriangleIcon`, `FolderIcon` and the rest of the single-path
 * silhouettes , own no rect or circle and were therefore reported as unfillable
 * while being the glyphs a solid fill suits best.
 */
export function hasFillableGeometry(markup: string): boolean {
  return (
    FILLABLE_ELEMENTS.some((element) => markup.includes(`<${element}`)) ||
    CLOSED_PATH_PATTERN.test(markup)
  );
}

/** The id the colour control uses for "not a token, a literal hex". */
export const CUSTOM_COLOR_ID = 'custom';

export const DEFAULT_CUSTOM_COLOR = '#7c3aed';

/**
 * The id for "stroke this with a two-stop gradient".
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## A GRADIENT CANNOT BE A PROP, AND THAT SHAPES EVERY PART OF THIS
 *
 * An SVG stroke takes a paint server: `stroke="url(#some-id)"` pointing at a
 * `<linearGradient>`. The def does NOT have to be inside the same `<svg>` , it
 * only has to exist somewhere in the document , which is the fact that makes any
 * of this possible from the outside.
 *
 * But `createIcon` renders a fixed `children` and spreads `{...props}` onto the
 * `<svg>`. There is no slot for a `<defs>`, so an icon can never carry its own
 * gradient. That splits cleanly into three cases, and they are NOT equally
 * clean , which is the honest thing to say rather than paper over:
 *
 *   PREVIEW   fine. The dialog renders one hidden `<svg><defs>` of its own and
 *             every preview glyph points at it.
 *   EXPORT    fine, and fully self-contained: `toSvgMarkup` builds the whole file
 *             here, so it writes its own `<defs>` and the gradient travels with
 *             the file into Figma, an `<img>`, or a `background-image`.
 *   JSX       two parts. The consumer renders the def once, anywhere, and the
 *             icon references it by id. `toGradientDefsJsx` emits that half and
 *             the snippet shows both together, because a copied one-liner that
 *             silently renders a black glyph is worse than a snippet that is
 *             visibly two things.
 *
 * At icon sizes a gradient is also nearly free of meaning: across a 16px glyph
 * with a 2px stroke it resolves to a handful of perceptible steps. It earns its
 * place at export sizes and on marketing surfaces, not at 13-18px , which is
 * why it is one swatch among twelve rather than a mode the dialog is built
 * around.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const GRADIENT_COLOR_ID = 'gradient';

export type GradientKind = 'linear' | 'radial';

export interface GradientStop {
  /**
   * Stable identity for the editor's list.
   *
   * Not the array index: stops are reordered whenever an offset is dragged past
   * a neighbour, and a keyed-by-index colour input would carry its DOM state
   * (including an open OS colour picker) onto whichever stop slid into that
   * slot.
   */
  id: string;
  color: string;
  /** 0–100, as a percentage along the gradient line. */
  offset: number;
}

export interface GradientConfig {
  kind: GradientKind;
  /**
   * Degrees in the CSS convention: 0 points to the top, 90 to the right,
   * measured clockwise. Linear only , a radial gradient has no direction.
   *
   * CSS is the convention rather than SVG's because it is the one people can
   * predict, and because it is what the swatch preview uses. `gradientVector`
   * does the conversion; see the trig there.
   */
  angle: number;
  stops: GradientStop[];
}

export const DEFAULT_GRADIENT: GradientConfig = {
  kind: 'linear',
  // 135°, i.e. corner to corner, top-left to bottom-right. The one angle at
  // which the gradient line covers the glyph's full diagonal.
  angle: 135,
  stops: [
    { id: 'a', color: '#007ACC', offset: 0 },
    { id: 'b', color: '#C8F135', offset: 100 },
  ],
};

/**
 * Ready-made pairs, built from the palette's THEME-PINNED values.
 *
 * Every gradient is a literal by construction , a paint server takes stop
 * colours, not `var(--primary)` resolved per theme , so a preset built from a
 * token that differs across themes would silently freeze one theme's value into
 * both. `--primary` (#007ACC), `--brand` (#C8F135) and `--code` (#101828) are
 * the same in light and dark, and `--elevated`'s plum (#592941) is dark-only but
 * is the brand's non-blue seed rather than a surface, so it reads deliberately
 * on either. Those four are the whole vocabulary here, which is the honest
 * boundary: a curated gradient can be on-brand, it cannot be theme-aware.
 */
export const GRADIENT_PRESETS: { id: string; label: string; stops: [string, string] }[] = [
  { id: 'signature', label: 'Primary → Brand', stops: ['#007ACC', '#C8F135'] },
  { id: 'plum', label: 'Plum → Brand', stops: ['#592941', '#C8F135'] },
  { id: 'deep', label: 'Deep → Primary', stops: ['#101828', '#007ACC'] },
  { id: 'sky', label: 'Brand → Sky', stops: ['#C8F135', '#4AACFF'] },
];

/** How many stops the editor allows. Two is a gradient; past six it is a mess. */
export const GRADIENT_MIN_STOPS = 2;
export const GRADIENT_MAX_STOPS = 6;

/**
 * The id the emitted snippet uses, and the one the export writes.
 *
 * A readable literal rather than the dialog's live `useId()` value: the preview
 * needs a document-unique id (several dialogs could exist), but a SNIPPET is
 * going into someone else's file, where `«r3»` would be both baffling and
 * fragile. React 19's `useId` output is not a valid CSS identifier either, so
 * the two ids were never going to be the same string.
 */
export const GRADIENT_SNIPPET_ID = 'velobits-icon-gradient';

/**
 * The grid every glyph in the set is drawn on, and the coordinate system every
 * gradient here is expressed in. `createIcon` hard-codes `viewBox="0 0 24 24"`,
 * so this is a constant of the icon package rather than a choice made here.
 */
export const ICON_GRID = 24;

/**
 * ⚠️ EVERY GRADIENT MUST BE `userSpaceOnUse`. NEVER `objectBoundingBox`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `objectBoundingBox` is SVG's DEFAULT, and it silently deletes parts of icons.
 *
 * It resolves a paint server against the **referencing element's own bounding
 * box**. Two consequences, and the first one is a disappearing glyph:
 *
 *  1. **A degenerate bbox means the element is not rendered AT ALL.** Per the
 *     spec, if the bounding box has zero width or zero height, the paint server
 *     cannot be resolved and the element is dropped , not fallback-coloured,
 *     dropped. `ArrowDownIcon`'s shaft is `M12 4v16`: a perfectly vertical line,
 *     so its bbox width is exactly 0. Under `objectBoundingBox` the arrow
 *     rendered as a bare chevron with no shaft, and the same fate awaits every
 *     axis-aligned path in the set , `PlusIcon`, `MinusIcon`, dividers, the
 *     stems of most arrows. Measured, not inferred: `getBBox().width === 0` and
 *     `getBoundingClientRect().width === 0` on that path.
 *
 *  2. **Per-element resolution is the wrong picture anyway.** Each child gets
 *     its own independent copy of the full ramp, so a two-path glyph shows the
 *     gradient twice at different scales rather than once across the whole
 *     shape , which is not what anyone means by a gradient icon.
 *
 * `userSpaceOnUse` fixes both: coordinates are in the current user space, i.e.
 * the `0 0 24 24` viewBox, so they are independent of any element's geometry AND
 * shared by every path in the glyph. It stays size-independent because the
 * viewBox maps onto whatever `width`/`height` the icon is rendered at, so the
 * same numbers are correct at 13px and at 512px.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const GRADIENT_UNITS = 'userSpaceOnUse';

/**
 * A CSS angle, as the SVG vector a `<linearGradient>` actually takes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SVG has no angle attribute. It has `x1,y1 → x2,y2`, and under
 * `GRADIENT_UNITS` those are user-space coordinates on the 24x24 grid.
 *
 * The conversion, with y pointing DOWN as it does on screen:
 *
 *   dx =  sin θ        0° → (0,-1) up      90° → (1,0) right
 *   dy = -cos θ      180° → (0, 1) down   270° → (-1,0) left
 *
 * and the line has to be long enough to cover the box rather than just its
 * centre. For a square that length is (|sin θ| + |cos θ|) × 24 , the box's own
 * width and height projected onto the gradient direction , which is the same
 * rule CSS uses to size a gradient line. Half of it either side of the centre:
 *
 *   (x1,y1) = 12 − d · L/2      (x2,y2) = 12 + d · L/2
 *
 * Sanity: 135° gives exactly (0,0) → (24,24), the full diagonal, and 90° gives
 * (0,12) → (24,12), edge to edge across the middle. Both are what a reader would
 * draw by hand, which is the point of doing the trig rather than exposing four
 * coordinate fields.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function gradientVector(angle: number): { x1: string; y1: string; x2: string; y2: string } {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.sin(radians);
  const dy = -Math.cos(radians);
  const centre = ICON_GRID / 2;
  const half = ((Math.abs(dx) + Math.abs(dy)) * ICON_GRID) / 2;

  // Three decimals: enough that 135° lands on a clean 0 and 24, short enough
  // that the emitted snippet stays readable.
  const round = (value: number) => String(Number(value.toFixed(3)));
  return {
    x1: round(centre - dx * half),
    y1: round(centre - dy * half),
    x2: round(centre + dx * half),
    y2: round(centre + dy * half),
  };
}

/**
 * Everything the three renderers need, computed once.
 *
 * The live preview (React elements), the JSX snippet (a string) and the SVG
 * export (a different string) all describe the same `<defs>`. Three hand-written
 * emitters over the raw config is three chances for the copied code to disagree
 * with what is on screen , which is the single worst failure a playground can
 * have. They each render THIS instead.
 */
export interface GradientRender {
  kind: GradientKind;
  /** Always `userSpaceOnUse` , see GRADIENT_UNITS for why this is not optional. */
  units: string;
  /** Linear only. User-space coordinates on the 24x24 grid. */
  vector: { x1: string; y1: string; x2: string; y2: string };
  /** Radial only , centred on the grid, reaching its corners. */
  radial: { cx: string; cy: string; r: string };
  stops: { offset: string; color: string }[];
}

export function gradientRender(gradient: GradientConfig): GradientRender {
  return {
    kind: gradient.kind,
    units: GRADIENT_UNITS,
    vector: gradientVector(gradient.angle),
    /*
     * The radial is centred with r = 0.5, and none of that is configurable.
     *
     * A focal point (`fx`/`fy`) and a radius are real `<radialGradient>`
     * attributes, and on a 16px glyph drawn from 2px strokes they are
     * invisible , the stroke samples the gradient along a line a few pixels
     * wide. Offering them would be an SVG reference rather than a design
     * control, which is the same call `END_STYLES` makes about exposing all
     * five linecap/linejoin values.
     */
    radial: {
      cx: String(ICON_GRID / 2),
      cy: String(ICON_GRID / 2),
      /*
       * Reaches the CORNERS, not the edge midpoints , 12·√2 ≈ 16.971 rather
       * than 12. That is CSS's `farthest-corner`, which is what
       * `radial-gradient(circle at center, …)` defaults to, and `gradientCss`
       * previews with exactly that. Using 12 here would make the swatch and the
       * glyph disagree about where the last stop lands, which is the one thing
       * this descriptor exists to prevent.
       */
      r: String(Number(((ICON_GRID / 2) * Math.SQRT2).toFixed(3))),
    },
    /*
     * Sorted, because SVG does not sort for you , it CLAMPS. A stop whose
     * offset is lower than the one before it is silently rendered at the
     * previous stop's offset, so dragging one stop past another produces a hard
     * edge instead of a reorder, and nothing anywhere reports it.
     */
    stops: [...gradient.stops]
      .sort((a, b) => a.offset - b.offset)
      .map((stop) => ({ offset: `${stop.offset}%`, color: stop.color })),
  };
}

/** The `background-image` that previews a gradient in the DOM, for the swatches. */
export function gradientCss(gradient: GradientConfig): string {
  const stops = [...gradient.stops]
    .sort((a, b) => a.offset - b.offset)
    .map((stop) => `${stop.color} ${stop.offset}%`)
    .join(', ');
  /*
   * CSS and SVG agree on the angle here because `GradientConfig.angle` is stored
   * in CSS's convention and only converted at the SVG boundary. A radial in CSS
   * needs `circle at center` spelled out, or it defaults to an ellipse that
   * matches the swatch's box rather than the circle the SVG will paint.
   */
  return gradient.kind === 'radial'
    ? `radial-gradient(circle at center, ${stops})`
    : `linear-gradient(${gradient.angle}deg, ${stops})`;
}

/* ── Animation ────────────────────────────────────────────────────────────── */

export interface AnimationChoice {
  id: string;
  label: string;
  /** The utility to emit, or `null` for "no animation". */
  className: string | null;
  /** Shown under the control when the choice needs a caveat. */
  note?: string;
}

/**
 * The animations on offer, and why they are CSS classes rather than Framer.
 *
 * `framer-motion` is a required peer of `@velobitsio/ui` and `motion.tsx` exists,
 * so reaching for it would have been defensible. It is the wrong tool here for
 * two reasons that both favour the copied snippet:
 *
 *  1. **The emitted code stays one attribute.** A Framer version means importing
 *     `motion`, wrapping the icon, and handing it a variants object , four lines
 *     that teach nothing about the icon.
 *  2. **Reduced motion is already handled, globally and for free.** The token
 *     layer's base block clamps `animation-duration` to 0.01ms and
 *     `animation-iteration-count` to 1 under
 *     `@media (prefers-reduced-motion: reduce)`, with `!important`. So every
 *     entry below honours the preference with no JS, no `usePrefersReducedMotion`
 *     call, and no `MotionConfig` in the consumer's tree. (That hook stays what
 *     `motion.tsx` says it is for: imperative decisions Framer cannot see.)
 *
 * `animate-spin`, `animate-pulse` and `animate-bounce` are Tailwind's own.
 * `animate-wiggle` and `animate-draw` are added by the token layer , see the
 * "icon motion" block in `@velobitsio/tokens/theme.css` , so a consumer who
 * copies the snippet gets them from the same `@import` that gives them the
 * palette, rather than from a keyframe they have to go and define.
 */
export const ANIMATION_CHOICES: AnimationChoice[] = [
  { id: 'none', label: 'None', className: null },
  {
    id: 'spin',
    label: 'Spin',
    className: 'animate-spin',
    note: 'For work in progress. Pair with a Spinner instead if that is all it means.',
  },
  { id: 'pulse', label: 'Pulse', className: 'animate-pulse', note: 'Live, recording, unsaved.' },
  { id: 'bounce', label: 'Bounce', className: 'animate-bounce' },
  {
    id: 'wiggle',
    label: 'Wiggle',
    className: 'animate-wiggle',
    note: 'Invalid input. Loops, so drive it from state rather than leaving it on.',
  },
  {
    id: 'draw',
    label: 'Draw on',
    className: 'animate-draw',
    /*
     * The caveat is real and belongs on screen, not only in a docblock. Even
     * timing needs `pathLength="1"` on every path so each one is normalised to
     * the same nominal length , and `createIcon` renders fixed children, so
     * there is no prop that can add it. The utility picks a dasharray longer
     * than any glyph in the set instead, which means a short path finishes early
     * and a long one late. Fine for a flourish, wrong for choreography.
     */
    note: 'Runs once. Timing varies by glyph , see the docs page.',
  },
  {
    id: 'hover-scale',
    label: 'Scale on hover',
    // The most useful of the set, and the only one that is a genuine affordance
    // rather than decoration: an idle animation in a toolbar is noise, a hover
    // response tells you the thing is interactive.
    className: 'transition-transform duration-micro ease-out hover:scale-125',
  },
  {
    id: 'hover-spin',
    label: 'Spin on hover',
    className: 'transition-transform duration-enter ease-out hover:rotate-180',
  },
];

export const DEFAULT_ANIMATION_ID = 'none';

export function findAnimation(id: string): AnimationChoice | undefined {
  return ANIMATION_CHOICES.find((choice) => choice.id === id);
}

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

export interface SurfaceChoice {
  id: string;
  label: string;
  className: string;
  /**
   * Text colour for the captions painted ON this surface.
   *
   * `--code` and `--brand` are pinned , the same value in both themes , so
   * `text-muted-foreground` is theme-correct and surface-wrong on them: muted
   * grey on the near-black code surface, and on lime in dark mode it is
   * light-grey-on-lime. Each surface names its own contrast pair, which is the
   * `--on-code` / `--on-brand` tokens' entire reason for existing.
   */
  labelClassName: string;
  /**
   * The knockout paint, as `stroke-*` utilities aimed at this surface's own
   * token, applied to every open element when `IconConfig.filled` is on.
   *
   * ⚠️ FOUR LITERALS, NOT ONE TEMPLATE. Tailwind reads source files as plain
   * text and never evaluates them, so `` `[&>line]:stroke-${token}` `` generates
   * nothing at all while looking perfect in the DOM. See `FILL_SUPPRESS_CLASS`
   * for the same trap and the two other places this codebase has hit it.
   *
   * The token, not the resolved hex, and that is the whole reason a knockout is
   * survivable at all: `stroke-bg` compiles to `stroke: var(--bg)`, so the cut
   * still follows the theme toggle. It cannot follow a change of SURFACE , the
   * snippet names one , which is the cost the knockout docblock above
   * `CLOSED_PATH_SELECTOR` spells out.
   *
   * `line` is here and absent from `FILL_SUPPRESS_CLASS`, deliberately: a line
   * encloses no area so it can never be filled, and is knocked out like any
   * other open geometry. `rect`/`circle`/`ellipse`/`polygon` are absent from
   * both , they are the shapes being cut FROM, and keep the root's paint.
   */
  knockoutClass: string;
}

/*
 * ── WHY THERE IS NO `dividerClassName` ANY MORE (2026-08-20) ─────────────────
 *
 * Each surface used to name a hairline for the rule between the hero preview and
 * the true-size strip: `border-border` on Page and Panel, `border-on-code/20` and
 * `border-on-brand/20` on the two pinned surfaces.
 *
 * It was reported as "the Brand stage shows two different colours". Sampling the
 * rendered pixels says otherwise, and the real answer is more interesting than
 * the bug report: the interior is ONE fill, rgb(200,241,53), 109,572 pixels of
 * it, and exactly one 1px row of rgb(168,202,50) , which is `--on-brand`
 * charcoal at α 0.20 composited over lime, to the integer. Neither the hero nor
 * the strip paints a background at all; both are transparent over `bg-brand`.
 *
 * So nothing was two colours. What the eye did was read one dark rule across a
 * large flat field as a boundary between two SURFACES, because on a saturated
 * fill a 20%-charcoal hairline is the strongest edge in the frame , far firmer
 * than `border-border` looks on Page. The divider was correct in code, correct
 * in intent, and wrong in effect on exactly the two surfaces that needed it
 * least.
 *
 * The strip is now separated by whitespace and by its own captions, which is
 * enough: it is a row of glyphs with numbers under them, and nothing about it
 * reads as continuous with the hero above. One surface, one colour, no rule.
 * (The fill toggle was never involved , `filled` only ever touched the icons.)
 */

/** The default, and `findSurface`'s fallback , named so neither is an index. */
export const PAGE_SURFACE: SurfaceChoice = {
  id: 'page',
  label: 'Page',
  className: 'bg-bg',
  labelClassName: 'text-muted-foreground',
  knockoutClass: '[&>path:not([d$=Z_i])]:stroke-bg [&>polyline]:stroke-bg [&>line]:stroke-bg',
};

/**
 * What the glyph is previewed on.
 *
 * A `currentColor` stroke has no appearance of its own, so "what colour is this
 * icon" is only answerable together with what it sits on. These four are the
 * surfaces the system actually paints: the page, the opaque panel every control
 * uses, the pinned-dark code surface, and the lime fill.
 *
 * Note this is the opposite call from `ComponentPreview`, which refuses to show a
 * component on anything but `--bg` , there, a `bg-panel` frame kills the fill the
 * component paints on itself and the demo stops corroborating the contrast gate.
 * Here the surface IS the variable under test, and the icon paints no fill to
 * cancel, so switching it is the point rather than a hazard.
 */
export const SURFACE_CHOICES: SurfaceChoice[] = [
  PAGE_SURFACE,
  {
    id: 'panel',
    label: 'Panel',
    className: 'bg-panel',
    labelClassName: 'text-muted-foreground',
    knockoutClass:
      '[&>path:not([d$=Z_i])]:stroke-panel [&>polyline]:stroke-panel [&>line]:stroke-panel',
  },
  {
    id: 'code',
    label: 'Code',
    className: 'bg-code',
    labelClassName: 'text-on-code',
    knockoutClass:
      '[&>path:not([d$=Z_i])]:stroke-code [&>polyline]:stroke-code [&>line]:stroke-code',
  },
  {
    id: 'brand',
    label: 'Brand',
    className: 'bg-brand',
    labelClassName: 'text-on-brand',
    knockoutClass:
      '[&>path:not([d$=Z_i])]:stroke-brand [&>polyline]:stroke-brand [&>line]:stroke-brand',
  },
];

/**
 * The element types a knockout paints, PARSED BACK OUT of one of those literals.
 *
 * Same contract as `FILL_SUPPRESSED_ELEMENTS`, for the same consumer: the `.svg`
 * export has no stylesheet and has to write the knockout onto each element by
 * hand. Reading it off the literal Tailwind actually compiles means the file on
 * disk and the glyph on screen cannot disagree about which shapes get cut.
 */
export const KNOCKOUT_ELEMENTS = [...PAGE_SURFACE.knockoutClass.matchAll(/\[&>(\w+)/g)].map(
  (match) => match[1]!,
);

/**
 * The sizes the "true size" strip renders at.
 *
 * The stage above it shows the configured size, which is usually large enough to
 * inspect the geometry and therefore tells you nothing about whether the glyph
 * survives at the size it ships at. This row is the honest one: 13–18 is the
 * tuned range, and 24 is the grid 1:1 for comparison.
 */
export const TRUE_SIZE_STRIP = [13, 14, 16, 18, 24] as const;

/* ── Strokes ──────────────────────────────────────────────────────────────── */

export const STROKE_WIDTHS = [1, 1.5, 2, 2.5, 3] as const;

/** `createIcon`'s own value. Anything else has to be emitted explicitly. */
export const DEFAULT_STROKE_WIDTH = 2;

/**
 * The two ends presets.
 *
 * Cap and join are one control rather than two on purpose: they are not
 * independent choices in practice, they are one decision about whether the glyph
 * reads as drawn-with-a-nib or as cut-from-a-plate, and every icon in the package
 * makes it once (`round`/`round`). Exposing `butt`/`square`/`bevel`/`miter` as
 * five separate dropdowns would be an SVG reference, not a design control.
 */
export const END_STYLES = {
  round: { linecap: 'round', linejoin: 'round', label: 'Round' },
  sharp: { linecap: 'butt', linejoin: 'miter', label: 'Sharp' },
} as const;

export type EndStyle = keyof typeof END_STYLES;

/* ── The configuration ────────────────────────────────────────────────────── */

export interface IconConfig {
  size: number;
  /** A `ColorChoice.id`, or `CUSTOM_COLOR_ID`, or `GRADIENT_COLOR_ID`. */
  colorId: string;
  /** The literal hex, used only when `colorId === CUSTOM_COLOR_ID`. */
  customColor: string;
  /** The paint server, used only when `colorId === GRADIENT_COLOR_ID`. */
  gradient: GradientConfig;
  /** An `AnimationChoice.id`. */
  animationId: string;
  strokeWidth: number;
  ends: EndStyle;
  /**
   * Paint the closed geometry solid in the selected colour and knock the open
   * geometry out in the surface colour. See `CLOSED_PATH_SELECTOR`'s neighbouring
   * docblock for what that costs on the ~41 glyphs whose open geometry sits
   * outside the shape being filled.
   */
  filled: boolean;
  surfaceId: string;
  /**
   * `true` when the glyph carries meaning on its own and must therefore opt out
   * of `aria-hidden`. See `describeAccessibility` for why this is a switch rather
   * than just a label field.
   */
  meaningful: boolean;
  /** The accessible name. Only meaningful when `meaningful` is `true`. */
  label: string;
}

export const DEFAULT_CONFIG: IconConfig = {
  size: 64,
  colorId: 'current',
  customColor: DEFAULT_CUSTOM_COLOR,
  gradient: DEFAULT_GRADIENT,
  animationId: DEFAULT_ANIMATION_ID,
  strokeWidth: DEFAULT_STROKE_WIDTH,
  ends: 'round',
  filled: false,
  surfaceId: 'page',
  meaningful: false,
  label: '',
};

export function findColor(colorId: string): ColorChoice | undefined {
  return COLOR_CHOICES.find((choice) => choice.id === colorId);
}

export function findSurface(surfaceId: string): SurfaceChoice {
  return SURFACE_CHOICES.find((choice) => choice.id === surfaceId) ?? PAGE_SURFACE;
}

/** `true` when the stroke is a paint server rather than a colour. */
export function isGradient(config: IconConfig): boolean {
  return config.colorId === GRADIENT_COLOR_ID;
}

/**
 * The `className` the preview and the emitted JSX both use, if any.
 *
 * Colour and animation are one string because they land on one attribute. A
 * gradient contributes no colour class , it paints through `stroke`, not through
 * the inherited `color` , so only the animation survives in that branch.
 */
export function iconClassName(config: IconConfig): string | undefined {
  const parts = [
    config.colorId === CUSTOM_COLOR_ID || isGradient(config)
      ? undefined
      : findColor(config.colorId)?.className,
    findAnimation(config.animationId)?.className,
    // Only when a fill is actually on , the classes are inert otherwise, and an
    // inert class in a copied snippet is a question the reader has to answer.
    config.filled ? FILL_SUPPRESS_CLASS : undefined,
    /*
     * The knockout, and the one place the SURFACE leaks into the icon's own
     * className. It has to: a cut-out is only a cut-out against the thing it was
     * cut from, so the snippet has to name a background, and the surface control
     * is where the reader said which one.
     */
    config.filled ? findSurface(config.surfaceId).knockoutClass : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : undefined;
}

/** The inline `color` the preview and the emitted JSX both use, if any. */
export function colorStyle(config: IconConfig): { color: string } | undefined {
  return config.colorId === CUSTOM_COLOR_ID ? { color: config.customColor } : undefined;
}

/**
 * The `stroke` (and `fill`) override a gradient needs, pointed at `id`.
 *
 * Two ids in play on purpose: the live preview passes a `useId()`-derived one so
 * two dialogs cannot collide, and the snippet passes `GRADIENT_SNIPPET_ID`
 * because it is going into someone else's file.
 *
 * `createIcon` writes `stroke="currentColor"` and `fill="none"` BEFORE spreading
 * `{...props}`, so both are overridable from a call site , the same mechanism
 * the `aria-hidden` opt-out relies on.
 */
export function gradientPaint(
  config: IconConfig,
  id: string,
): { stroke: string; fill?: string } | undefined {
  if (!isGradient(config)) return undefined;
  const paint = `url(#${id})`;
  /*
   * Full alpha, like every other colour choice. A gradient survives the knockout
   * without a special case because `FILL_SUPPRESS_CLASS` and `knockoutClass`
   * both EXCLUDE the closed geometry rather than repainting it , so a closed
   * path keeps inheriting `url(#…)` from the root, and only the open geometry is
   * overridden to the surface token.
   */
  return config.filled ? { stroke: paint, fill: paint } : { stroke: paint };
}

/* ── Code generation ──────────────────────────────────────────────────────── */

export const PACKAGE_NAME = '@velobitsio/icons';

export function importLine(name: string): string {
  return `import { ${name} } from '${PACKAGE_NAME}';`;
}

/**
 * Escapes a user-typed accessible name for a double-quoted JSX attribute.
 *
 * The label comes from a text input, so it can contain a `"` , and a snippet
 * that silently produces `aria-label="Delete "flag""` is worse than no snippet,
 * because it looks right in the box and breaks on paste. `&` first, or it would
 * double-escape the entities introduced after it.
 */
function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * The three props that make an icon meaningful, and the reason they travel
 * together.
 *
 * `aria-label` alone does nothing: `aria-hidden="true"` is already on the element
 * and it wins, so the name is never announced. Clearing `aria-hidden` alone is
 * not enough either , a bare `<svg>` has no role, so there is nothing for a name
 * to attach to. All three or none, which is why the dialog offers a switch that
 * emits the set rather than an `aria-label` field that emits one prop.
 */
function accessibilityProps(config: IconConfig): string[] {
  if (!config.meaningful) return [];
  return [
    'aria-hidden={undefined}',
    'role="img"',
    `aria-label="${escapeAttribute(accessibleName(config))}"`,
  ];
}

/** Stands in for an empty label, so the snippet never emits `aria-label=""`. */
export const LABEL_PLACEHOLDER = 'Describe what this icon means';

/**
 * The name the icon will actually carry.
 *
 * Shared by the emitted snippet and by the live preview , the stage icon really
 * does opt out of `aria-hidden` when the switch is on, so the two cannot disagree
 * about what a screen reader would say.
 */
export function accessibleName(config: IconConfig): string {
  return config.label.trim() || LABEL_PLACEHOLDER;
}

/**
 * The JSX for the current configuration.
 *
 * Only non-defaults are emitted, with one exception: `size` is always written
 * out. Everything else omitted means "the package's own value", but `size` is the
 * one prop the docs actively tell people to set , the geometry is tuned per size
 * and a Tailwind `size-*` utility scales the rendered box away from it , so a
 * snippet that leaves it implicit teaches the wrong habit even when 16 is what
 * you wanted.
 *
 * Note this makes the UNTOUCHED snippet read `size={64}`, four times the
 * package's own default, because the stage now opens at an inspection size. That
 * is the correct trade: the snippet's job is to reproduce what is on the stage,
 * and a snippet that quietly said 16 while the preview showed 64 would be the
 * one real lie this panel could tell. See `SIZE_PRESETS`.
 */
export function toJsx(name: string, config: IconConfig): string {
  const props = [`size={${config.size}}`];

  if (config.strokeWidth !== DEFAULT_STROKE_WIDTH) {
    props.push(`strokeWidth={${config.strokeWidth}}`);
  }

  if (config.ends !== 'round') {
    const { linecap, linejoin } = END_STYLES[config.ends];
    props.push(`strokeLinecap="${linecap}"`, `strokeLinejoin="${linejoin}"`);
  }

  if (isGradient(config)) {
    /*
     * The paint server, by id. `stroke` and `fill` both point at the def the
     * block above the snippet renders , NOT at `currentColor`, which is the one
     * case in this dialog where the icon stops inheriting its colour.
     */
    const paint = `url(#${GRADIENT_SNIPPET_ID})`;
    props.push(`stroke="${paint}"`);
    if (config.filled) props.push(`fill="${paint}"`);
  } else if (config.filled) {
    /*
     * `currentColor`, not the resolved hex: in JSX the fill should track whatever
     * colour the icon inherits, which is what the stroke already does.
     *
     * No `fillOpacity` beside it any more. It used to be mandatory , the fill was
     * a 20% wash and at full alpha it erased every container glyph , and the
     * knockout in `className` is what makes full alpha safe now. If you are
     * reading this because a glyph went solid and lost its contents, the missing
     * piece is the class, not the opacity.
     */
    props.push('fill="currentColor"');
  }

  const className = iconClassName(config);
  if (className) props.push(`className="${className}"`);

  const style = colorStyle(config);
  if (style) props.push(`style={{ color: '${style.color}' }}`);

  props.push(...accessibilityProps(config));

  const oneLine = `<${name} ${props.join(' ')} />`;
  // 100 is the repo's Prettier `printWidth`, so a snippet that would have been
  // reformatted on paste is broken here instead of pretending it fits.
  const element =
    oneLine.length <= 100
      ? oneLine
      : `<${name}\n${props.map((prop) => `  ${prop}`).join('\n')}\n/>`;

  return isGradient(config) ? `${toGradientDefsJsx(config)}\n\n${element}` : element;
}

/**
 * The half of a gradient snippet that is NOT the icon.
 *
 * Emitted above the element rather than hidden behind a "you'll also need…"
 * note, because the failure mode of forgetting it is silent and confusing: an
 * unresolvable `url(#id)` paints the shape BLACK in most engines rather than
 * falling back to `currentColor`, so the icon looks broken in a way that does
 * not point at a missing def.
 *
 * `width={0} height={0}` with `position: absolute` rather than `display: none`:
 * a display-none subtree is not rendered, and Chrome has historically refused to
 * resolve paint servers inside one. Zero-sized and out of flow costs no layout
 * and always resolves.
 */
export function toGradientDefsJsx(config: IconConfig): string {
  const { kind, units, vector, radial, stops } = gradientRender(config.gradient);

  /*
   * `gradientUnits` is written out explicitly and must stay that way. Omitting
   * it takes SVG's default, `objectBoundingBox`, which DELETES any path whose
   * bounding box is degenerate , the vertical shaft of an arrow, a plus, a
   * divider. See GRADIENT_UNITS.
   */
  const open =
    kind === 'radial'
      ? `    <radialGradient id="${GRADIENT_SNIPPET_ID}" gradientUnits="${units}" cx="${radial.cx}" cy="${radial.cy}" r="${radial.r}">`
      : `    <linearGradient id="${GRADIENT_SNIPPET_ID}" gradientUnits="${units}" x1="${vector.x1}" y1="${vector.y1}" x2="${vector.x2}" y2="${vector.y2}">`;

  return [
    '{/* Render this ONCE, anywhere in the app. The icon below points at it by id. */}',
    '<svg width={0} height={0} aria-hidden="true" style={{ position: \'absolute\' }}>',
    '  <defs>',
    open,
    // `stopColor`, camelCase , this half is JSX. The SVG export writes the
    // hyphenated `stop-color`, which is why the two emitters are not one.
    ...stops.map((stop) => `      <stop offset="${stop.offset}" stopColor="${stop.color}" />`),
    kind === 'radial' ? '    </radialGradient>' : '    </linearGradient>',
    '  </defs>',
    '</svg>',
  ].join('\n');
}

/**
 * The `<defs>` block for the EXPORTED file.
 *
 * Nearly the same shape as `toGradientDefsJsx` and deliberately not shared with
 * it: SVG attributes are hyphenated (`stop-color`) while JSX props are camelCase
 * (`stopColor`), and the indentation differs because one sits inside a `<svg>`
 * the exporter is building and the other inside a snippet the reader will paste.
 * Both take their numbers from `gradientRender`, which is the part that must not
 * drift.
 */
function toGradientDefsSvg(config: IconConfig): string {
  const { kind, units, vector, radial, stops } = gradientRender(config.gradient);

  const open =
    kind === 'radial'
      ? `    <radialGradient id="${GRADIENT_SNIPPET_ID}" gradientUnits="${units}" cx="${radial.cx}" cy="${radial.cy}" r="${radial.r}">`
      : `    <linearGradient id="${GRADIENT_SNIPPET_ID}" gradientUnits="${units}" x1="${vector.x1}" y1="${vector.y1}" x2="${vector.x2}" y2="${vector.y2}">`;

  return [
    '  <defs>',
    open,
    ...stops.map((stop) => `      <stop offset="${stop.offset}" stop-color="${stop.color}" />`),
    kind === 'radial' ? '    </radialGradient>' : '    </linearGradient>',
    '  </defs>',
  ].join('\n');
}

/**
 * A standalone SVG file for the current configuration.
 *
 * `resolvedColor` is a real channel value read off the live preview rather than
 * the token name, and it has to be: a `.svg` opened in Figma, mailed, or set as a
 * `background-image` has no `--fg` and no ancestor to inherit `color` from, so
 * `stroke="currentColor"` in an exported file renders black on every surface. The
 * one place the copy button resolves a token to a literal is here, and it is
 * because the file leaves the page.
 *
 * `paths` is the icon's own `innerHTML`, read from the DOM: the geometry lives in
 * a `ReactNode` passed to `createIcon` and there is no serialiser for that on the
 * client short of pulling in `react-dom/server`.
 */
export function toSvgMarkup(
  config: IconConfig,
  paths: string,
  resolvedColor: string,
  resolvedSurfaceColor: string,
): string {
  const { linecap, linejoin } = END_STYLES[config.ends];

  /*
   * A gradient stroke is a paint server reference, and the def travels INSIDE
   * the file. This is the one output where a gradient costs nothing extra: the
   * exported `.svg` is self-contained, so it renders correctly in Figma, in an
   * `<img>`, and as a `background-image` , none of which can see a def that
   * lives elsewhere in a React tree. Contrast `toGradientDefsJsx`, which has to
   * hand the consumer a second thing to render.
   */
  const gradient = isGradient(config);
  const paint = gradient ? `url(#${GRADIENT_SNIPPET_ID})` : resolvedColor;

  const attributes = [
    'xmlns="http://www.w3.org/2000/svg"',
    /*
     * ── THE EXPORT KEEPS ITS INTRINSIC SIZE, AND THAT IS A DECISION ──────────
     *
     * Opening this file straight in a browser renders a `config.size` glyph in
     * the corner of a full-size tab , 64px at the default, and smaller still if
     * the slider was moved down , which reads as a nearly blank page. That is
     * real, and it is still the right output.
     *
     * `width`/`height` are what make an SVG behave like an image everywhere it
     * is actually USED: an `<img src="…">` takes its intrinsic size from them,
     * and without them the replaced element falls back to 300x150 and the glyph
     * is scaled up 12x. Dropping them to make a browser tab look better would
     * trade the common case for the diagnostic one.
     *
     * `viewBox` is present alongside, so the file still scales cleanly whenever
     * a container does constrain it. Both, not either.
     */
    `width="${config.size}"`,
    `height="${config.size}"`,
    'viewBox="0 0 24 24"',
    // The fill is a literal when it is on, for the same reason the stroke is: a
    // standalone file has nothing to inherit `currentColor` from. Full alpha ,
    // the knockout written onto each open element below is what keeps a solid
    // fill from erasing the container glyphs.
    `fill="${config.filled ? paint : 'none'}"`,
    `stroke="${paint}"`,
    `stroke-width="${config.strokeWidth}"`,
    `stroke-linecap="${linecap}"`,
    `stroke-linejoin="${linejoin}"`,
  ];

  const defs = gradient ? `${toGradientDefsSvg(config)}\n` : '';

  /*
   * `paths` arrives as one line of DOM-serialised markup, and it needs two passes
   * rather than one, because `innerHTML` does not give back the JSX that was
   * written.
   *
   *  1. **Collapse empty elements.** `<path d="…" />` in the source serialises as
   *     `<path d="…"></path>`. Splitting on the element boundary first put the
   *     open and close tags on separate lines , valid SVG, and it looked like a
   *     bug in the exporter.
   *  2. **One tag per line.** Every child here is a flat, empty shape element
   *     (`path`, `circle`, `rect`, `line`, `polyline`, `polygon`, `ellipse` , the
   *     package uses no `<g>`), so a flat indent is correct for all of them.
   */
  let body = paths.replace(/><\/[a-zA-Z]+>/g, ' />');

  /*
   * The open-geometry suppression, as ATTRIBUTES rather than as a class.
   *
   * The preview and the JSX snippet do this with `FILL_SUPPRESS_CLASS`, because a
   * className is the only lever that reaches a child of `createIcon`. An exported
   * `.svg` has no stylesheet , that is the entire point of it , so the same rule
   * has to be written onto each element here. Skipping this step would put the
   * chord wedge back into every downloaded file while the preview looked right,
   * which is the exact preview-vs-output drift `gradientRender` exists to stop.
   *
   * Inserted immediately after the tag name so it precedes `d`, and so a
   * subsequent attribute of the element's own cannot be shadowed by it. That
   * ordering is load-bearing for the 21 elements in the package that hardcode
   * `fill="currentColor" stroke="none"` for a solid mark: duplicate attributes
   * resolve to the FIRST occurrence, so writing ours ahead of theirs reproduces
   * what CSS does in the preview, where a stylesheet beats a presentation
   * attribute.
   *
   * The surface colour is resolved here rather than named as a token for the
   * same reason `resolvedColor` is: an exported `.svg` has no `--bg` and no
   * stylesheet. It is the one output where the knockout is frozen to one theme
   * on one surface, and that is inherent to handing someone a standalone file.
   */
  if (config.filled) {
    const candidates = [...new Set([...FILL_SUPPRESSED_ELEMENTS, ...KNOCKOUT_ELEMENTS])].join('|');
    body = body.replace(
      new RegExp(`<(${candidates})\\b([^>]*)`, 'g'),
      (match, tag: string, attributes: string) => {
        /*
         * A closed path is the shape being cut FROM, not a cut. It takes no
         * attribute at all so it keeps inheriting the root's `fill`/`stroke` ,
         * which is a colour or a `url(#…)` paint server, and this branch is not
         * allowed to care which. Exactly the reasoning behind the `:not()` in
         * `FILL_SUPPRESS_CLASS`, transposed to attributes.
         */
        if (tag === 'path' && isClosedPath(attributes)) return match;
        /*
         * `line` encloses no area, so writing `fill="none"` onto it would be a
         * no-op attribute in a file someone is going to read.
         */
        const knockout =
          tag === 'line'
            ? ` stroke="${resolvedSurfaceColor}"`
            : ` fill="none" stroke="${resolvedSurfaceColor}"`;
        return `<${tag}${knockout}${attributes}`;
      },
    );
  }

  body = body
    .replace(/>(?=<)/g, '>\n')
    .split('\n')
    .map((line) => `  ${line.trim()}`)
    .join('\n');

  return `<svg\n  ${attributes.join('\n  ')}\n>\n${defs}${body}\n</svg>`;
}

/** `TrashIcon` → `trash-icon.svg`, for the download. */
export function toFileName(name: string): string {
  return `${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.svg`;
}

/* ── Contrast ─────────────────────────────────────────────────────────────── */

/**
 * WCAG 1.4.11's threshold for a non-text graphic, which is what an icon is.
 *
 * Not 4.5:1. Text contrast is a legibility requirement at a given font size;
 * 1.4.11 covers "the visual presentation required to identify a control or
 * graphic" and asks for 3:1. Gating this readout at 4.5 would fail choices that
 * are correct , `text-primary` on the page, for one , and gating it at nothing
 * would pass lime on cream.
 */
export const GRAPHIC_CONTRAST_MIN = 3;

/**
 * Parses what `getComputedStyle` actually returns.
 *
 * Every token in `@velobitsio/tokens` is an opaque hex, so in practice this sees
 * `rgb(r, g, b)`. Modern Chrome can also hand back `color(srgb …)` or `oklch(…)`
 * for values it did not have to convert, which this does not attempt to parse ,
 * hence the `null` return and the readout's "unavailable" branch, rather than a
 * confident number computed from a failed parse.
 */
export function parseRgb(value: string): [number, number, number] | null {
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(value.trim());
  if (!match) return null;
  const channels = [Number(match[1]), Number(match[2]), Number(match[3])] as const;
  if (channels.some((channel) => !Number.isFinite(channel))) return null;
  return [channels[0], channels[1], channels[2]];
}

/**
 * Parses `#rrggbb`, which is what the two gradient stops are.
 *
 * A gradient stroke never reaches `getComputedStyle` , the glyph's `color` stays
 * whatever it inherited while `stroke` points at a paint server , so the
 * contrast readout cannot read the rendered colour back off the DOM the way it
 * does for every other choice. It has to measure the stops directly, which means
 * parsing the literal rather than an `rgb()` string.
 */
export function parseHex(value: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const int = parseInt(match[1]!, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** Undoes the sRGB transfer function for one 0–255 channel. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * sRGB relative luminance, per WCAG 2.x.
 *
 * Written out per channel rather than mapped over an array: under
 * `noUncheckedIndexedAccess` the destructured result of a `.map` is
 * `number | undefined` three times over, and silencing that with assertions
 * would be noise around six characters of arithmetic.
 */
function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(
  foreground: [number, number, number],
  background: [number, number, number],
): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** `[255, 0, 128]` → `#ff0080`, for the SVG export. */
export function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}
