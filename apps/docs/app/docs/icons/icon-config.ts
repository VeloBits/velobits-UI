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
 * all) and `32`/`48` are here because people do reach for a large glyph in an
 * empty state , showing what that actually looks like is more useful than
 * pretending the range stops at 24.
 */
export const SIZE_PRESETS = [13, 14, 16, 18, 24, 32, 48] as const;

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
 *  - **`primary`** is the blue FILL. As text it measures 4.51:1 and fails AA, so
 *    `button.tsx` documents that no variant paints it as text and `link`
 *    (`--primary-text`) exists instead. An icon is a non-text graphic and gated
 *    at 3:1 by WCAG 1.4.11, so `primary` is legitimate here , which is exactly
 *    the sort of thing that reads as an inconsistency unless it is written down.
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

/** The id the colour control uses for "not a token, a literal hex". */
export const CUSTOM_COLOR_ID = 'custom';

export const DEFAULT_CUSTOM_COLOR = '#7c3aed';

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
   * The hairline between the hero preview and the size strip under it.
   *
   * Named per surface rather than left as `border-border`, and not as
   * `border-current/15` either , `current` inside the strip is the ICON's colour,
   * so a lime icon on the lime surface would have drawn an invisible divider. The
   * on-* tokens exist precisely because they are the one colour guaranteed to be
   * legible on their surface.
   */
  dividerClassName: string;
}

/** The default, and `findSurface`'s fallback , named so neither is an index. */
export const PAGE_SURFACE: SurfaceChoice = {
  id: 'page',
  label: 'Page',
  className: 'bg-bg',
  labelClassName: 'text-muted-foreground',
  dividerClassName: 'border-border',
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
    dividerClassName: 'border-border',
  },
  {
    id: 'code',
    label: 'Code',
    className: 'bg-code',
    labelClassName: 'text-on-code',
    dividerClassName: 'border-on-code/20',
  },
  {
    id: 'brand',
    label: 'Brand',
    className: 'bg-brand',
    labelClassName: 'text-on-brand',
    dividerClassName: 'border-on-brand/20',
  },
];

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
  /** A `ColorChoice.id`, or `CUSTOM_COLOR_ID`. */
  colorId: string;
  /** The literal hex, used only when `colorId === CUSTOM_COLOR_ID`. */
  customColor: string;
  strokeWidth: number;
  ends: EndStyle;
  /**
   * Paint the interior as well as the stroke.
   *
   * `createIcon` writes `fill="none"` and then spreads `{...props}`, so this is
   * overridable exactly like the stroke attributes are. Worth exposing, and worth
   * expecting to look wrong about half the time: the set is drawn as strokes, and
   * only glyphs whose outline is a CLOSED path fill into a solid shape. An open
   * path , a chevron, a plus, most arrows , has no interior, so SVG closes it
   * implicitly and fills the chord, which reads as a blob. Watching that happen
   * teaches the difference faster than being prevented from trying it.
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
  size: 24,
  colorId: 'current',
  customColor: DEFAULT_CUSTOM_COLOR,
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

/** The `className` the preview and the emitted JSX both use, if any. */
export function colorClassName(config: IconConfig): string | undefined {
  if (config.colorId === CUSTOM_COLOR_ID) return undefined;
  return findColor(config.colorId)?.className ?? undefined;
}

/** The inline `color` the preview and the emitted JSX both use, if any. */
export function colorStyle(config: IconConfig): { color: string } | undefined {
  return config.colorId === CUSTOM_COLOR_ID ? { color: config.customColor } : undefined;
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

  // `currentColor`, not the resolved hex: in JSX the fill should track whatever
  // colour the icon inherits, which is what the stroke already does.
  if (config.filled) props.push('fill="currentColor"');

  const className = colorClassName(config);
  if (className) props.push(`className="${className}"`);

  const style = colorStyle(config);
  if (style) props.push(`style={{ color: '${style.color}' }}`);

  props.push(...accessibilityProps(config));

  const oneLine = `<${name} ${props.join(' ')} />`;
  // 100 is the repo's Prettier `printWidth`, so a snippet that would have been
  // reformatted on paste is broken here instead of pretending it fits.
  if (oneLine.length <= 100) return oneLine;
  return `<${name}\n${props.map((prop) => `  ${prop}`).join('\n')}\n/>`;
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
export function toSvgMarkup(config: IconConfig, paths: string, resolvedColor: string): string {
  const { linecap, linejoin } = END_STYLES[config.ends];
  const attributes = [
    'xmlns="http://www.w3.org/2000/svg"',
    `width="${config.size}"`,
    `height="${config.size}"`,
    'viewBox="0 0 24 24"',
    // The fill is a literal when it is on, for the same reason the stroke is: a
    // standalone file has nothing to inherit `currentColor` from.
    `fill="${config.filled ? resolvedColor : 'none'}"`,
    `stroke="${resolvedColor}"`,
    `stroke-width="${config.strokeWidth}"`,
    `stroke-linecap="${linecap}"`,
    `stroke-linejoin="${linejoin}"`,
  ];

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
  const body = paths
    .replace(/><\/[a-zA-Z]+>/g, ' />')
    .replace(/>(?=<)/g, '>\n')
    .split('\n')
    .map((line) => `  ${line.trim()}`)
    .join('\n');

  return `<svg\n  ${attributes.join('\n  ')}\n>\n${body}\n</svg>`;
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
