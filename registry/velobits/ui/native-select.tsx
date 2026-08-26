'use client';

import { cn } from '../lib/cn';

/**
 * A cva-styled NATIVE `<select>`. **`Select` is the default dropdown in this
 * system; this is the escape hatch, and it is a real one.**
 *
 * ## Which of the two to reach for
 *
 * Use `Select` (Radix, `select.tsx`) for anything on a desktop-shaped surface. A
 * native `<select>` can be styled to the pixel while CLOSED and not at all while
 * OPEN , the option popup is drawn by the OS widget layer, so there is no
 * border-radius, no shadow, no padding, no check indicator, no enter animation,
 * and on Chromium a fill inherited from this element's own `background` (see the
 * data-URI warning below, which is that trap). A system that ships a beautiful
 * trigger and an OS popup looks unfinished at the exact moment the user acts.
 *
 * Use THIS when the platform's own picker IS the design:
 *
 *   - **Mobile-first forms.** iOS renders a wheel, Android a full-screen list.
 *     Both beat any panel we can draw on a 375px viewport, and both are what a
 *     user of that device expects a form to do.
 *   - **A control that must survive with no JS**, or a progressively-enhanced
 *     form whose payload comes from the markup. (`Select` also posts , Radix
 *     mirrors its value into a hidden native control inside a `<form>` , but
 *     that mirror is React-rendered.)
 *   - **One tab stop, no portal, no layer.** Occasionally that simplicity is
 *     worth more than the styling, e.g. a dense settings table.
 *
 * ## ADR-0031 refused Radix Select here, and that refusal expired 2026-08-26
 *
 * The stated ground was that `@radix-ui/react-select` is undriveable under
 * happy-dom: it measures the trigger and viewport to position its popper, and in
 * a DOM without layout every option lands at 0×0, so a test cannot click one.
 * True of the environment that ADR was written against; not true of this
 * package, whose `test/setup.ts` polyfills `ResizeObserver`,
 * `Element.prototype.scrollIntoView` and `Element.prototype.getAnimations` , the
 * whole of what Radix needs. `select.tsx` ships with `position="popper"` (the
 * measuring `item-aligned` default is the part that cannot work) and
 * `test/select.test.tsx` drives the full contract. So the decision was reversed
 * on evidence, and `NativeSelect` was KEPT rather than replaced, because the
 * three cases above are real and no longer have to be argued as a testing
 * concession.
 *
 * If a design needs rich option rendering (icons, descriptions, async search),
 * that is still a Combobox , a separate Tier-3 component with its own test
 * strategy , and not a change to either of these two.
 *
 * The chevron is a background SVG rather than an overlaid element so the whole
 * control stays a single focusable node. It is positioned with `right` in a
 * data-URI, so under `dir="rtl"` set `bg-[position:left_…]` at the call site;
 * CSS backgrounds are not direction-aware. (`Select` has none of this: a Radix
 * trigger is a `<button>` wrapping children, so its chevron is simply an `<svg>`
 * child that inherits `currentColor`. Everything the next four paragraphs warn
 * about is the price of staying a single native node.)
 *
 * ## Opaque `--panel`, deliberately, while Card and Alert are Tier-S glass
 *
 * Same call as `Input`, which documents the reasoning in full. In short: a glass
 * control inside a glass Card composites 2/255 off it and loses its well, where
 * the opaque fill sits 10/255 clear in light and 9/255 in dark; and
 * `--field-border`'s WCAG 1.4.11 margin stops being one gateable number per
 * surface (3.86:1 on `--panel` light, 3.58:1 dark) and becomes a function of the
 * ancestor chain (3.66:1–4.04:1 , passing, but not pinnable by a test).
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'flex h-9 w-full appearance-none rounded-md border border-input bg-panel ps-3 pe-8 text-sm text-fg control-recessed',
        'transition-[color,box-shadow] duration-micro ease-out',
        'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-danger aria-invalid:ring-danger/30',
        /*
         * The chevron. `currentColor` cannot be used inside a data URI, so this
         * is the muted step spelled out; it tracks the theme via two variants.
         *
         * ── NO SPACE AND NO QUOTE MAY APPEAR IN HERE. BOTH ARE LOAD-BEARING ──
         *
         * Every space is `%20` and every attribute quote is `%27`, so the whole
         * value is one unbroken, unquoted token. Two different tools each break
         * on one of those characters, and both failures are silent.
         *
         * **Spaces , `cn()` shreds the class.** `cn()` is clsx + tailwind-merge,
         * and tailwind-merge SPLITS ITS INPUT ON WHITESPACE. A literal space
         * inside an arbitrary value does not stay inside it: the class is torn
         * into fragments which are then merged against each other as if they
         * were utilities. Shipped that way, this produced two symptoms at once ,
         *
         *   1. `stroke-width='2'`, `stroke-linecap='round'` and
         *      `stroke-linejoin='round'` were deduped as conflicting `stroke-*`
         *      utilities, and Tailwind's own scanner (which also splits on
         *      whitespace) only ever saw a truncated, unterminated candidate, so
         *      it emitted NO RULE AT ALL. `background-image` computed to `none`
         *      , and `appearance-none` had already removed the native arrow, so
         *      the control had no dropdown indicator whatsoever.
         *   2. The leading fragment, up to the first space, was classified as a
         *      background-COLOR and evicted `bg-panel`, leaving a transparent
         *      fill. Chromium paints a select's option popup from the select's
         *      own background and falls back to WHITE when it is transparent,
         *      irrespective of `color-scheme`. In dark mode that put near-white
         *      `--fg` option text on a white popup , invisible.
         *
         * **Quotes , Tailwind reads the JS escape literally.** Tailwind v4 scans
         * source files as PLAIN TEXT. A double quote inside this value has to be
         * backslash-escaped for the JS string, and Tailwind sees the backslash,
         * so it emits an escaped quote into the stylesheet. Lightning CSS rejects
         * that as `BadUrl` and the WHOLE SHEET fails to parse , a 500, not a
         * missing chevron. Percent-encoding the SVG's own attribute quotes lets
         * this go unquoted, so there is no quote in the source to escape.
         *
         * The same plain-text scan is why nothing above spells the broken forms
         * out literally: a comment in this file is scanned exactly like code.
         *
         * Tailwind's usual `_`-for-space escape is not an option here: it
         * deliberately leaves underscores alone in URLs, because URLs contain
         * them.
         *
         * `primitives.test.tsx` pins this by decoding the value and checking the
         * SVG is whole.
         */
        'bg-[url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23646562%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E)]',
        'dark:bg-[url(data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23a5a39f%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E)]',
        'bg-[length:16px] bg-[position:right_0.625rem_center] bg-no-repeat',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { NativeSelect };
