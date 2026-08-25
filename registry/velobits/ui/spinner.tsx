'use client';

import { cn } from '../lib/cn';

export interface SpinnerProps extends React.ComponentProps<'span'> {
  /** Matches the icon scale: 16px default. */
  size?: number;
  /**
   * Announced to assistive tech. Set to `null` when a visible label already
   * says what is loading, so it is not read twice.
   *
   * Pass `null` for EVERY spinner rendered inside a button, a link, a menu item
   * or a tab. The default is an `aria-label`, and an `aria-label` on a child
   * becomes part of its ancestor control's accessible name , so a Save button
   * that spins announces as "Loading Saving…", and its name changes the moment
   * the request starts. See the note in the file docblock.
   */
  label?: string | null;
}

/**
 * An indeterminate busy indicator.
 *
 * Drawn with a bordered box rather than an SVG so it has no icon dependency and
 * inherits `currentColor` for free.
 *
 * Reduced motion is handled by the token layer, which collapses animation
 * durations to ~0. A stopped spinner still communicates "busy" through its
 * `role="status"` label , which is exactly why the label is not optional by
 * default.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## INSIDE A CONTROL, PASS `label={null}`. THE DEFAULT IS WRONG THERE.
 *
 * ```tsx
 * <Button disabled><Spinner size={16} label={null} />Saving…</Button>
 * ```
 *
 * The default `label` is an `aria-label`, and an `aria-label` on a descendant is
 * not a private announcement , it is CONCATENATED into the accessible name of
 * whatever control contains it. So the button above, without `label={null}`,
 * announces as **"Loading Saving…"**: the word "Loading" prepended to a label
 * that already says the same thing, on the one control the user is waiting on.
 *
 * To be precise about what this does and does not fix , the button's name still
 * changes, from "Save" to "Saving…", because its visible text changed and that
 * is the point of the state. What `label={null}` removes is the duplicate: the
 * spinner restating in the accessible name what the visible label already says,
 * and doing it FIRST, so the announcement leads with the least useful word.
 *
 * Nothing catches it. It renders correctly, it passes axe , a `status` inside a
 * `button` violates no rule, verified , and the only symptom is heard, not
 * seen. The same trap in reverse is why `createIcon` marks every icon
 * `aria-hidden` by default.
 *
 * The rule, stated as a boundary rather than a list: **a spinner keeps its label
 * only when it is the thing being announced.** Standing alone in a panel, a
 * table cell, a page , label it, because nothing else says the app is busy.
 * Inside a button, a link, a menu item, a tab, an option , `label={null}`,
 * because the control already has a name and this is now part of it. `null`
 * drops both the `role="status"` and the `aria-label` and sets
 * `aria-hidden="true"`, which is what takes the glyph back out of the name
 * computation entirely.
 *
 * For a control whose visible text does NOT change while it works (an icon-only
 * button), silence the spinner the same way and put the busy state on the
 * control itself , `aria-busy` or a `disabled` state , not on a child.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function Spinner({ className, size = 16, label = 'Loading', ...props }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      role={label ? 'status' : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : 'true'}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]',
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}

export { Spinner };
