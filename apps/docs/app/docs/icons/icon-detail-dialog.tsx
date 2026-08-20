'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import {
  AlertTriangleIcon,
  CircleCheckIcon,
  DownloadIcon,
  RotateCcwIcon,
  type Icon as IconComponent,
} from '@velobitsio/icons';
import {
  Badge,
  Button,
  CodeBlock,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  NativeSelect,
  SegmentedControl,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  useTheme,
} from '@velobitsio/ui';

import {
  COLOR_CHOICES,
  CUSTOM_COLOR_ID,
  DEFAULT_CONFIG,
  END_STYLES,
  GRAPHIC_CONTRAST_MIN,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_PRESETS,
  STROKE_WIDTHS,
  SURFACE_CHOICES,
  TRUE_SIZE_STRIP,
  accessibleName,
  colorClassName,
  colorStyle,
  contrastRatio,
  findColor,
  findSurface,
  importLine,
  parseRgb,
  toFileName,
  toHex,
  toJsx,
  toSvgMarkup,
  type EndStyle,
  type IconConfig,
} from './icon-config';

/**
 * The three output formats, declared once.
 *
 * The header and the panels are two loops over this rather than two hand-written
 * lists of three: a fourth format, or a renamed one, would otherwise have to be
 * added in both places, and the failure mode of missing one is a tab that selects
 * nothing.
 */
const OUTPUT_TABS = [
  { value: 'jsx', label: 'JSX', language: 'tsx', wrap: true },
  { value: 'import', label: 'Import', language: 'tsx', wrap: true },
  /*
   * No `wrap` on the SVG. `wrap` is `break-all`, which is right for an opaque
   * key with no word boundaries and wrong for markup , it would break attribute
   * names mid-word. The panel scrolls instead.
   */
  { value: 'svg', label: 'SVG', language: 'svg', wrap: false },
] as const;

export interface IconDetailDialogProps {
  name: string;
  Icon: IconComponent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The icon playground.
 *
 * Replaces what a grid tile used to do on click , copy `import { TrashIcon }` and
 * flip to a tick , with the thing that copy was standing in for: seeing the glyph
 * at the size, colour and weight you are about to ship it at, and copying a
 * snippet that already says so. The import line is still here, on its own tab.
 *
 * ## Why the configuration outlives the dialog
 *
 * State lives in this component, and `IconGrid` never keys it by icon name or
 * unmounts it, so your size, colour and stroke survive a close and reopen. That
 * is deliberate: picking a glyph is usually the second half of a decision whose
 * first half was already "20px, danger", and comparing two candidates means
 * comparing them under one configuration rather than re-dialling it each time.
 *
 * ## Why three DOM reads instead of a lookup table
 *
 * The colour swatches emit Tailwind utilities (`text-danger`), which resolve
 * through `--danger`, which is redefined by `.dark`. The SVG export needs a
 * literal, and the contrast readout needs both channel values. Hard-coding the
 * palette here would be a second copy of `@velobitsio/tokens` that goes stale
 * silently, so `resolved` reads what the browser actually computed: the icon's
 * `color`, the surface's `background-color`, and the glyph's own path markup ,
 * which has no client-side serialiser at all, since the geometry is a `ReactNode`
 * handed to `createIcon`.
 */
export function IconDetailDialog({ name, Icon, open, onOpenChange }: IconDetailDialogProps) {
  const [config, setConfig] = useState<IconConfig>(DEFAULT_CONFIG);

  /*
   * The hex as raw text, mirrored out of `config`.
   *
   * `#7c3af` is a legitimate thing to have typed and an illegal colour, so the
   * text is what the field edits and it is promoted into `config` only once it
   * parses; `onBlur` snaps it back to the committed value so an abandoned edit
   * does not sit there looking applied.
   *
   * Size needs no such mirror. It used to , a controlled `<input type="number">`
   * cannot be emptied, because `Number('')` is `0` and the field snapped to zero
   * the moment you cleared it to type a new value , but a slider and a `<select>`
   * can only ever produce a valid number, so the intermediate state that needed
   * mirroring no longer exists.
   */
  const [customText, setCustomText] = useState(DEFAULT_CONFIG.customColor);

  /*
   * The stage node in STATE, not in a ref, and the difference is a bug that
   * shipped for about ten minutes.
   *
   * A `useRef` + `useEffect` pair looks equivalent and is not: Radix mounts the
   * dialog content through `Portal` and `Presence`, so on the commit where `open`
   * first becomes `true` the effect runs with `ref.current === null`. It bailed,
   * nothing in its dependency list ever changed again, and it never re-ran , so
   * the contrast badge read "unavailable" and Download SVG stayed disabled for
   * the entire life of the dialog, with the DOM sitting right there fully
   * rendered.
   *
   * A callback ref re-renders when the node attaches, which makes "the stage
   * exists" a dependency the effect can actually watch instead of a precondition
   * it has to guess at. It also handles the reverse: on close React calls this
   * with `null`, the effect bails, and `resolved` keeps its last value , which is
   * what lets the code panels stay populated through the exit animation.
   */
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const { theme } = useTheme();

  const sizeLabelId = useId();
  const strokeLabelId = useId();
  const endsLabelId = useId();
  const filledId = useId();
  const surfaceLabelId = useId();
  const colorRadioName = useId();
  const meaningfulId = useId();
  const labelFieldId = useId();

  const surface = findSurface(config.surfaceId);
  const iconClassName = colorClassName(config);
  const iconStyle = colorStyle(config);

  /*
   * Every attribute the previews share, derived once.
   *
   * The stage icon and the five strip icons were repeating six props each, which
   * is how the strip ends up a version behind the hero after an edit , exactly the
   * drift a "true size" row exists to rule out.
   *
   * `fill: undefined` rather than `'none'` when the toggle is off: `createIcon`
   * already writes `fill="none"`, and passing `undefined` leaves it alone instead
   * of restating it.
   */
  const shapeProps = {
    strokeWidth: config.strokeWidth,
    strokeLinecap: END_STYLES[config.ends].linecap,
    strokeLinejoin: END_STYLES[config.ends].linejoin,
    fill: config.filled ? 'currentColor' : undefined,
    className: iconClassName,
    style: iconStyle,
  };

  /*
   * The accessibility opt-out, applied to the STAGE icon for real.
   *
   * `aria-hidden: undefined` is not a no-op: `createIcon` writes
   * `aria-hidden="true"` and then spreads `{...props}` over it, so an explicit
   * `undefined` is what removes the attribute. That is the exact mechanism the
   * emitted snippet relies on, and rendering it here means the preview cannot
   * claim one thing while the snippet says another.
   *
   * Only the stage icon takes these. The size strip below it stays decorative ,
   * five more copies of the same name is a worse dialog for a screen-reader user
   * than one, and those five are demonstrating size, not meaning.
   */
  const stageAccessibility = config.meaningful
    ? { 'aria-hidden': undefined, role: 'img', 'aria-label': accessibleName(config) }
    : {};

  const setSize = useCallback((size: number) => {
    setConfig((previous) => ({ ...previous, size }));
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setCustomText(DEFAULT_CONFIG.customColor);
  }, []);

  /*
   * The dropdown's options: the presets, plus the current size when the slider
   * has landed between them.
   *
   * Injecting the off-preset value is what keeps the select honest. The
   * alternative , a fixed preset list , leaves the select displaying whichever
   * option happens to match nothing, so it silently shows the first one and
   * claims 13px while the slider says 20. Every option here is a size you could
   * actually be on.
   */
  const sizeOptions = useMemo(
    () => [...new Set<number>([...SIZE_PRESETS, config.size])].sort((a, b) => a - b),
    [config.size],
  );

  /*
   * What the browser computed, re-read whenever anything upstream of it moved.
   *
   * `theme` is in the deps and has to be: none of the config values change when
   * the site's theme toggle is used, but every token behind them does. Reading it
   * here is safe rather than a frame late, because `ThemeProvider` calls
   * `setTheme` and `applyTheme` in the SAME effect , so by the time `theme` has
   * changed, `.dark` is already on the document and these values are the new ones.
   */
  const [resolved, setResolved] = useState<{
    paths: string;
    iconColor: string;
    surfaceColor: string;
  } | null>(null);

  useEffect(() => {
    const svg = stage?.querySelector('svg');
    if (!stage || !svg) return;

    setResolved({
      // The geometry, exactly as rendered. `innerHTML` on an SVG element gives
      // the child shapes without the wrapper, which is what the export rebuilds
      // around with its own attributes.
      paths: svg.innerHTML,
      iconColor: getComputedStyle(svg).color,
      surfaceColor: getComputedStyle(stage).backgroundColor,
    });
  }, [stage, name, config.colorId, config.customColor, config.surfaceId, theme]);

  const contrast = useMemo(() => {
    if (!resolved) return null;
    const foreground = parseRgb(resolved.iconColor);
    const background = parseRgb(resolved.surfaceColor);
    if (!foreground || !background) return null;
    return contrastRatio(foreground, background);
  }, [resolved]);

  const jsx = toJsx(name, config);

  const svgMarkup = useMemo(() => {
    if (!resolved) return '';
    const foreground = parseRgb(resolved.iconColor);
    /*
     * `currentColor` as the fallback is deliberate. If the parse failed we do not
     * know the colour, and inventing black would be a wrong answer that looks
     * like a right one , `currentColor` at least keeps the file inheriting, which
     * is what the package does anyway.
     */
    return toSvgMarkup(config, resolved.paths, foreground ? toHex(foreground) : 'currentColor');
  }, [config, resolved]);

  /*
   * The SVG panel is never empty, and never claims to be finished when it is not.
   *
   * `svgMarkup` is '' until the first `getComputedStyle` pass lands, which is one
   * commit after open. A `CodeBlock` with an empty string renders a bare box, and
   * the copy button beside it would copy nothing without saying so.
   */
  const svgOutput = svgMarkup || 'Rendering…';

  /* The one place the literal-stroke caveat lives, now that it is not a
     paragraph: it names the region for AT and titles the copy button. */
  const svgLabel = `${name} SVG, stroke resolved to a literal so the file needs no --fg to inherit`;

  const download = useCallback(() => {
    if (!svgMarkup) return;
    const url = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = toFileName(name);
    link.click();
    // Revoked on the next task, not inline: Safari reads the href asynchronously
    // after the synthetic click, and revoking first cancels the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [name, svgMarkup]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        /*
         * `gap-3` overrides the `gap-4` in `dialogContentVariants`. Safe and
         * deliberate rather than a fight: `cn` is tailwind-merge, so the later
         * value in the same property group wins predictably. Four gaps between
         * five children at 4px less each is 16px, which is real when the whole
         * exercise is getting the footer above the fold.
         *
         * Note this is a `gap`, not a `bg-*` , the dialog's docblock is explicit
         * that a background utility here silently replaces the glass surface.
         */
        className="gap-3"
      >
        <DialogHeader>
          <DialogTitle className="font-mono">{name}</DialogTitle>
          <DialogDescription>
            Drawn on a 24×24 grid. Set it up below , the snippet updates as you go.
          </DialogDescription>
        </DialogHeader>{' '}
        {/*
         * Two columns, and the height budget is why the surface control sits
         * under the preview rather than with the other controls.
         *
         * The first pass put all six controls in the right-hand column and the
         * dialog came out 1000px tall against a 905px viewport , it scrolled, so
         * the JSX output and the footer were both below the fold on the laptop
         * this was built on. A playground you have to scroll to read the result
         * of is not a playground. What fixed it was moving one control to the
         * shorter column, pairing every heading row with the control that belongs
         * on it, and deleting four separators and three explanatory paragraphs
         * whose content is already on the page around them.
         *
         * Surface is also the control that most belongs next to the thing it
         * changes, so the constraint and the layout agreed.
         */}
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          {/* ── Preview ──────────────────────────────────────────────────── */}
          {/*
           * `flex` + `flex-1` rather than a block with `space-y`: grid items
           * stretch, so this column is already as tall as the controls beside it,
           * and under a block layout the surplus showed up as ~190px of empty
           * page between the surface row and the tabs. Letting the stage absorb it
           * puts the space where a preview wants it , around the glyph.
           */}
          <div className="flex flex-col gap-3">
            <div
              ref={setStage}
              className={cn(
                'flex flex-1 flex-col overflow-hidden rounded-xl border border-border',
                surface.className,
              )}
            >
              {/* The hero takes the slack; the strip below is a fixed tray. That
                  split is what makes the airiness read as a canvas rather than as
                  a box someone forgot to fill. */}
              <div className="flex flex-1 items-center justify-center p-6">
                <Icon size={config.size} {...shapeProps} {...stageAccessibility} />
              </div>

              {/* The row that actually answers "does this survive at 13px". */}
              <div
                className={cn(
                  'flex flex-wrap items-end justify-center gap-5 border-t px-4 py-3',
                  surface.dividerClassName,
                )}
              >
                {TRUE_SIZE_STRIP.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-1.5">
                    <Icon size={size} {...shapeProps} />
                    <span
                      className={cn(
                        'font-mono text-[0.625rem] tabular-nums',
                        surface.labelClassName,
                      )}
                    >
                      {size}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Surface and its verdict on one row: the control and the number it
                moves have no reason to be two rows apart. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span id={surfaceLabelId} className="text-sm font-medium text-fg">
                  Surface
                </span>
                <SegmentedControl
                  aria-labelledby={surfaceLabelId}
                  value={config.surfaceId}
                  onValueChange={(value) =>
                    setConfig((previous) => ({ ...previous, surfaceId: value }))
                  }
                  options={SURFACE_CHOICES.map((choice) => ({
                    value: choice.id,
                    label: choice.label,
                  }))}
                />
              </div>

              {contrast === null ? (
                <Badge variant="neutral">Contrast unavailable</Badge>
              ) : (
                <Badge
                  variant={contrast >= GRAPHIC_CONTRAST_MIN ? 'success' : 'danger'}
                  aria-live="polite"
                  className="tabular-nums"
                  /* The threshold is in the name, not in a paragraph beside it:
                     the number means nothing without the bar it is being held to,
                     and a badge is read as a unit. */
                  title="WCAG 1.4.11 asks 3:1 for a non-text graphic, not the 4.5:1 text is held to"
                >
                  {contrast >= GRAPHIC_CONTRAST_MIN ? <CircleCheckIcon /> : <AlertTriangleIcon />}
                  {contrast.toFixed(2)}:1 · needs 3:1
                </Badge>
              )}
            </div>
          </div>

          {/* ── Controls ─────────────────────────────────────────────────── */}
          {/*
           * One rhythm for every control: a `text-sm font-medium` name on the
           * left, the control itself on the right, `ControlRow` for the ones that
           * fit on a line and a stacked pair for the two that do not. The first
           * pass mixed a `<legend>` above its control with label-beside-control
           * rows and read as a form dump; consistent alignment is most of what
           * separates a panel from a pile of inputs.
           */}
          <div className="space-y-3.5">
            {/*
             * Size , a dropdown for the sizes worth naming, a slider for the rest.
             *
             * This was a 7-segment `SegmentedControl` plus a number field. Both
             * halves were awkward: seven two-digit segments in a 19rem column left
             * each one about 38px wide, and the number input needed a mirrored
             * text state purely so it could be emptied while you typed. A
             * `<select>` names the tuned sizes without spending a row on them, and
             * a range input is the right control for "somewhere between 8 and 128"
             * , dragging it is how you find out that a glyph stops reading at 11px.
             *
             * The slider is a native `<input type="range">` because there is no
             * `Slider` in `@velobitsio/ui` (39 components; this is not one of
             * them). That is a deliberate choice rather than a gap being papered
             * over: the native control is keyboard-operable, announces its value,
             * and is styled here through the same vendor pseudo-elements the
             * custom-colour swatch uses. Adding a real `Slider` to the library is
             * a library change , registry entry, barrel export, tsup entry,
             * exports map, size budget, tests, docs page , not a docs one.
             */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={sizeLabelId} className="text-sm font-medium text-fg">
                  Size
                </Label>
                <NativeSelect
                  id={sizeLabelId}
                  value={String(config.size)}
                  onChange={(event) => setSize(Number(event.target.value))}
                  /*
                   * No background utility may be added here.
                   *
                   * `NativeSelect` carries its chevron as a background-image data
                   * URI, and tailwind-merge would treat a second background-image
                   * class as a conflict and evict it, leaving a select with no
                   * dropdown indicator at all (`appearance-none` already removed
                   * the native one). Repositioning it is fine, since background
                   * POSITION is a different property group.
                   *
                   * The first draft of this comment spelled that data-URI utility
                   * out literally, and the build died on it: Tailwind v4 scans
                   * source files as PLAIN TEXT, so it harvested the example from
                   * the comment as a real candidate and emitted a rule whose URL
                   * was the ellipsis character. Turbopack then failed to resolve
                   * that as a module , "Module not found: Can't resolve" pointing
                   * at globals.css, thousands of columns into generated CSS, with
                   * nothing naming this file. `native-select.tsx` warns about this
                   * exact trap in its own docblock, which is why it never writes
                   * the broken form out either.
                   */
                  className="h-7 w-auto ps-2 pe-7 text-xs tabular-nums bg-[position:right_0.375rem_center]"
                >
                  {sizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size} px
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={SIZE_MIN}
                  max={SIZE_MAX}
                  value={config.size}
                  onChange={(event) => setSize(Number(event.target.value))}
                  /* The dropdown owns the visible "Size" label, so this needs its
                     own name rather than sharing that one , two controls pointing
                     at one label leaves the second one unnamed. */
                  aria-label="Size in px"
                  className={cn(
                    'h-4 w-full cursor-pointer appearance-none rounded-pill bg-transparent',
                    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                    // Track. Both vendors, because neither pseudo-element is
                    // standardised and each browser ignores the other's.
                    '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-pill',
                    '[&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border',
                    '[&::-webkit-slider-runnable-track]:bg-bg2',
                    '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-pill',
                    '[&::-moz-range-track]:border [&::-moz-range-track]:border-border',
                    '[&::-moz-range-track]:bg-bg2',
                    // Thumb. `-mt-[5px]` centres it on the track: a 6px track and
                    // a 16px thumb differ by 10px, and WebKit aligns the thumb's
                    // top edge to the track's, not its centre.
                    '[&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-4',
                    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
                    '[&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-primary',
                    '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full',
                    '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary',
                  )}
                />
                <span className="w-10 shrink-0 text-end font-mono text-xs tabular-nums text-muted-foreground">
                  {config.size}px
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span id={strokeLabelId} className="text-sm font-medium text-fg">
                Stroke
              </span>
              <SegmentedControl
                aria-labelledby={strokeLabelId}
                value={String(config.strokeWidth)}
                onValueChange={(value) =>
                  setConfig((previous) => ({ ...previous, strokeWidth: Number(value) }))
                }
                options={STROKE_WIDTHS.map((width) => ({ value: String(width), label: width }))}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span id={endsLabelId} className="text-sm font-medium text-fg">
                Ends
              </span>
              <SegmentedControl
                aria-labelledby={endsLabelId}
                value={config.ends}
                onValueChange={(value) =>
                  setConfig((previous) => ({ ...previous, ends: value as EndStyle }))
                }
                options={Object.entries(END_STYLES).map(([id, style]) => ({
                  value: id,
                  label: style.label,
                }))}
              />
            </div>

            {/* Fill , grouped with the two stroke controls, because all three
                change the shape rather than the colour or the size. Expect it to
                look wrong on open paths; `IconConfig.filled` records why, and the
                preview shows it immediately, which is the point. */}
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={filledId} className="text-sm font-medium text-fg">
                Fill
              </Label>
              <Switch
                id={filledId}
                checked={config.filled}
                onCheckedChange={(checked) =>
                  setConfig((previous) => ({ ...previous, filled: checked }))
                }
              />
            </div>

            {/*
             * Colour , a native radio group, so arrow keys and announcements come
             * from the platform rather than from hand-rolled ARIA. A `<fieldset>`
             * also names the group without the dangling-`htmlFor` hazard
             * `SegmentedControl` documents.
             *
             * ## Round filled swatches, and the name printed once
             *
             * The first pass drew each option as a 2px rule , the glyph's actual
             * stroke , over a 10px caption, eleven times. It was faithful and it
             * looked like debug output: eleven tiny cards, every caption at the
             * threshold of legibility, and `warning` truncated. Filled dots with
             * the SELECTED name printed next to the group's own label says the same
             * thing in one legible place instead of eleven illegible ones, and
             * every dot keeps its `title` and its radio name for the rest.
             */}
            <fieldset className="min-w-0 space-y-1.5 border-0 p-0">
              <div className="flex items-center justify-between gap-2">
                <legend className="text-sm font-medium text-fg">Colour</legend>
                <code className="truncate text-xs text-muted-foreground">
                  {config.colorId === CUSTOM_COLOR_ID
                    ? config.customColor
                    : (findColor(config.colorId)?.className ?? 'currentColor')}
                </code>
              </div>

              {/*
               * A fixed 6-column grid, `w-fit`, rather than `flex-wrap`. Eleven
               * 24px dots with 8px gaps measure 344px against a 304px column, so
               * flex-wrap broke them 9 + 2 , a full row and an orphan. Six and
               * five is a block.
               *
               * And they stay 24px: WCAG 2.2's 2.5.8 sets 24×24 CSS px as the
               * minimum target, so shrinking them to 20px to win a single row was
               * not on the table.
               */}
              <div className="grid w-fit grid-cols-6 gap-2">
                {COLOR_CHOICES.map((choice) => (
                  <label
                    key={choice.id}
                    title={choice.note ? `${choice.label} , ${choice.note}` : choice.label}
                    className="cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={colorRadioName}
                      value={choice.id}
                      checked={config.colorId === choice.id}
                      onChange={() =>
                        setConfig((previous) => ({ ...previous, colorId: choice.id }))
                      }
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        'block size-6 rounded-full',
                        'transition-[box-shadow,border-color] duration-micro ease-out',
                        /*
                         * Selection is an OUTLINE at an offset; focus is a RING
                         * hugging the dot. Three reasons they are not both one
                         * thing:
                         *
                         *  - Neither may be a border. A border eats into a 24px
                         *    circle, so the selected swatch would render a
                         *    different colour from the unselected ones.
                         *  - `ring-offset-*` paints the gap a SOLID colour, and
                         *    there is no solid colour here , the dialog is glass.
                         *    An outline leaves its offset transparent, so the
                         *    material shows through, which is the only correct
                         *    answer on a translucent surface.
                         *  - They must be able to coexist: a focused swatch is
                         *    usually also the selected one. `outline` is a single
                         *    property, so the second indicator has to be a ring
                         *    (a box-shadow), and putting it at a smaller radius
                         *    keeps both legible at once.
                         */
                        'peer-checked:outline-2 peer-checked:outline-offset-2 peer-checked:outline-fg',
                        'peer-focus-visible:ring-2 peer-focus-visible:ring-primary',
                        /*
                         * `currentColor` renders HOLLOW , a ring with no fill.
                         *
                         * Not decoration: inside this dialog `currentColor`
                         * resolves to `--fg`, so as a filled dot it was pixel-
                         * identical to the `fg` swatch beside it and read as a
                         * duplicate rather than as the default. "Inherits" has no
                         * colour of its own, and an unfilled swatch is the one
                         * shape that says so.
                         */
                        choice.className === null
                          ? 'border-2 border-fg bg-transparent'
                          : cn('border border-border', choice.className),
                      )}
                      style={
                        choice.className === null ? undefined : { backgroundColor: 'currentColor' }
                      }
                    >
                      <span className="sr-only">
                        {choice.id === 'current' ? 'currentColor' : choice.label}
                      </span>
                    </span>
                  </label>
                ))}

                {/*
                 * The custom swatch IS the colour input.
                 *
                 * A separate always-visible row with an OS-default colour well and
                 * a hex field beside it was the least finished-looking thing in
                 * the dialog. Styling the native input's swatch pseudo-elements
                 * turns it into the eleventh dot, so one control both selects
                 * "custom" and opens the picker , which is what reaching for it
                 * meant anyway. The hex field then only appears when it applies.
                 *
                 * Both vendor pseudo-elements are needed: WebKit paints
                 * `::-webkit-color-swatch` inside a padded wrapper, Firefox paints
                 * `::-moz-color-swatch`. Neither is reachable except as an
                 * arbitrary variant.
                 */}
                <label
                  title="A literal hex, for anything outside the palette"
                  className="relative cursor-pointer"
                >
                  <span className="sr-only">Custom colour</span>
                  <input
                    type="color"
                    aria-label="Custom icon colour"
                    value={config.customColor}
                    onChange={(event) => {
                      setCustomText(event.target.value);
                      setConfig((previous) => ({
                        ...previous,
                        colorId: CUSTOM_COLOR_ID,
                        customColor: event.target.value,
                      }));
                    }}
                    className={cn(
                      'block size-6 cursor-pointer appearance-none rounded-full border border-border bg-transparent p-0',
                      'transition-[box-shadow,outline-color] duration-micro ease-out',
                      // Same split as the token dots above, for the same reasons.
                      'outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      config.colorId === CUSTOM_COLOR_ID && 'outline-2 outline-offset-2 outline-fg',
                      '[&::-webkit-color-swatch-wrapper]:p-0',
                      '[&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0',
                      '[&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0',
                    )}
                  />
                </label>
              </div>

              {config.colorId === CUSTOM_COLOR_ID ? (
                <input
                  type="text"
                  aria-label="Custom icon colour, hex"
                  spellCheck={false}
                  value={customText}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCustomText(next);
                    if (!/^#[0-9a-f]{6}$/i.test(next)) return;
                    setConfig((previous) => ({ ...previous, customColor: next }));
                  }}
                  onBlur={() => setCustomText(config.customColor)}
                  className={cn(
                    'h-7 w-full rounded-md border border-input bg-panel px-2 font-mono text-xs text-fg',
                    'control-recessed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                  )}
                />
              ) : null}
            </fieldset>

            {/* Accessibility , a switch rather than a bare label field, because
                the three props only work as a set. See `accessibilityProps`. The
                long version of the hint is the "Decorative by default" section on
                the page behind this dialog. */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <Label htmlFor={meaningfulId} className="text-sm">
                    Carries meaning alone
                  </Label>
                </span>
                <Switch
                  id={meaningfulId}
                  checked={config.meaningful}
                  onCheckedChange={(checked) =>
                    setConfig((previous) => ({ ...previous, meaningful: checked }))
                  }
                />
              </div>
              {config.meaningful ? (
                <input
                  id={labelFieldId}
                  type="text"
                  value={config.label}
                  aria-label="Accessible name"
                  placeholder="Accessible name, e.g. Delete flag"
                  onChange={(event) =>
                    setConfig((previous) => ({ ...previous, label: event.target.value }))
                  }
                  className={cn(
                    'h-7 w-full rounded-md border border-input bg-panel px-2 text-xs text-fg',
                    'control-recessed placeholder:text-muted-foreground',
                    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                  )}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Off, it stays <code>aria-hidden</code>. On, all three opt-out props.
                </p>
              )}
            </div>
          </div>
        </div>
        {/* ── Output ───────────────────────────────────────────────────────── */}
        {/*
         * The tabs are the code panel's own header, not a control above it.
         *
         * This went wrong twice in opposite directions, and both failures were
         * about what the tabs LOOKED like rather than what they did:
         *
         *  1. `variant="line"` , a bare underline over open space , made two of
         *     the three formats invisible. The JSX block read as the only output
         *     and "Import" and "SVG" read as headings, so nobody would think to
         *     click them.
         *  2. `variant="default"` , a filled track with a raised pill , fixed the
         *     discoverability and broke the meaning: sitting directly under the
         *     Surface segmented control, an identical-looking recessed track read
         *     as a fourth SETTING rather than as a view of the code.
         *
         * The pattern that is neither is the one every editor uses: file tabs
         * along the top edge of the thing they belong to, inside its border, on
         * its fill. One box, one surface, tabs at the top , so they cannot read as
         * a setting (they are visibly part of the code panel) and cannot be missed
         * (they are the panel's chrome). That is also why no hint text is needed
         * to explain them.
         *
         * `mt-3` on top of the dialog's own `gap-3` puts 24px between this and the
         * Surface row, which is what makes it land as a separate section rather
         * than the next line of the same one.
         */}
        {/*
         * `min-w-0` is not cosmetic, it is what stops this blowing the dialog open
         * sideways.
         *
         * The SVG panel is deliberately unwrapped (`whitespace-pre`), so its
         * `<pre>` has a min-content width of the longest attribute line. A grid
         * item defaults to `min-width: auto`, which means "no narrower than my
         * content", so the item refused to shrink, the single-column dialog grid
         * widened to fit a path definition, and the controls column was pushed
         * clean off the right edge with the whole dialog scrolling horizontally.
         * The `<pre>` already carries `overflow-auto` from `codeBlockVariants` , it
         * was always ready to scroll; nothing above it would let it.
         */}
        <Tabs defaultValue="jsx" className="mt-3 min-w-0 gap-0">
          {/*
           * One box: the tab strip and the code share a border, a radius and a
           * fill, so they read as a single panel with a header rather than as a
           * control sitting above a separate block. `overflow-hidden` is what lets
           * the square-cornered strip meet the rounded frame cleanly.
           */}
          <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-bg2">
            <TabsList
              variant="line"
              className="h-9 w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0 px-1"
            >
              {OUTPUT_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  /*
                   * `flex-none` so tabs are label-width and left-aligned like files,
                   * rather than the default `flex-1` split of the full width.
                   *
                   * `after:bottom-0` moves the underline from 5px below the trigger
                   * , correct for a free-standing strip , onto the trigger's own
                   * bottom edge, where it sits on the header's dividing hairline.
                   * That is the join that makes an active tab look attached to the
                   * panel below it instead of floating over it.
                   */
                  className="h-9 flex-none rounded-none px-3 text-xs after:bottom-0"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/*
             * `[&_pre]:…` strips the CodeBlock's own frame so it becomes the body of
             * THIS panel rather than a second box inside it. `CodePanel` in this app
             * reaches through to its `<pre>` the same way, and it is the only route:
             * `className` on `CodeBlock` lands on the wrapper, while the border,
             * radius, fill and inset shadow are all on the `<pre>`.
             *
             * `shadow-none` is what removes `control-recessed`, which is an inset
             * box-shadow , the well that would otherwise read as a control.
             */}
            {OUTPUT_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="min-w-0">
                <CodeBlock
                  language={tab.language}
                  copyable
                  label={tab.label === 'SVG' ? svgLabel : `${name} ${tab.label}`}
                  wrap={tab.wrap}
                  className={cn(
                    '[&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:shadow-none',
                    '[&_pre]:p-3',
                    /*
                     * One floor for all three, one ceiling for the tall one.
                     *
                     * Without the floor the panel was the height of its content,
                     * so switching JSX → SVG grew the dialog by ~130px and the
                     * footer jumped out from under the pointer , the Download
                     * button moved after you had already aimed at it. A shared
                     * `min-h` makes the two short tabs identical, and the cap
                     * keeps a 9-attribute header from setting the dialog's height.
                     */
                    '[&_pre]:min-h-28',
                    tab.value === 'svg' && '[&_pre]:max-h-52',
                  )}
                >
                  {tab.value === 'jsx'
                    ? jsx
                    : tab.value === 'import'
                      ? importLine(name)
                      : svgOutput}
                </CodeBlock>
              </TabsContent>
            ))}
          </div>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcwIcon />
            Reset
          </Button>
          <Button variant="secondary" size="sm" onClick={download} disabled={!svgMarkup}>
            <DownloadIcon />
            Download SVG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
