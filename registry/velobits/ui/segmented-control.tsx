'use client';

import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';

import { cn } from '../lib/cn';

export interface SegmentOption {
  value: string;
  label: React.ReactNode;
  /** `danger` renders the selected state in `--danger` (e.g. the Production env). */
  tone?: 'default' | 'danger';
  /** Disables this segment only; the rest of the control stays operable. */
  disabled?: boolean;
}

/**
 * A `role="radiogroup"` with no accessible name is an unlabelled control, and
 * there is no way to give this one a name from outside (see the docblock). So the
 * name is required at the type level, and it is one of the two forms that
 * actually work — never both, since `aria-labelledby` silently wins over
 * `aria-label` and having both in a call site is a lie about which text is read.
 */
type SegmentedControlName =
  | { 'aria-label': string; 'aria-labelledby'?: never }
  | { 'aria-labelledby': string; 'aria-label'?: never };

export type SegmentedControlProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentOption[];
  /**
   * Disables every segment. This is a REAL disable — see the docblock; it is not
   * `pointer-events-none`.
   */
  disabled?: boolean;
  className?: string;
} & SegmentedControlName;

/**
 * Single-select segmented control on Radix ToggleGroup. Selection can never be
 * empty: clicking the active segment is a no-op rather than a deselect, because
 * "no environment selected" is not a state the env switcher this was built for
 * can render.
 *
 * `type="single"` is what makes Radix emit `role="radiogroup"` on the root and
 * `role="radio"` + `aria-checked` on each segment, which is the correct mapping —
 * a segmented control is a radio group that looks like a row of buttons.
 *
 * ## One known gap, recorded rather than silently inherited
 *
 * Radix's roving focus MOVES focus on an arrow key without selecting; activation
 * is Enter or Space. APG's radio-group pattern says selection should follow focus.
 * Closing that would mean selecting on `focus`, which also fires on a mouse press
 * and on programmatic focus, so it is left alone deliberately — the group is one
 * tab stop either way, and the mismatch costs a keyboard user one extra keypress
 * rather than access. `segmented-control.test.tsx` pins the actual behaviour.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## TWO BUGS FIXED RELATIVE TO ToggleFlow'S `src/ui/segmented-control.tsx`
 *
 * The consumer currently relies on the broken behaviour of both, so its
 * `apps/dashboard/test/ui.test.tsx` SegmentedControl block will need updating at
 * migration.
 *
 * ### 1. `htmlFor` could never label this, and now there is a path that can
 *
 * Radix renders the root as a `<div>`. A `<div>` is not a *labelable* element,
 * so `<label htmlFor="…">` pointing at it associates with nothing — the browser
 * computes no accessible name, no click-to-focus, and **nothing warns**. It looks
 * exactly like a working label in the markup and in a screenshot.
 *
 * The fix is not to make the root labelable (a `<fieldset>`/`<legend>` would mean
 * abandoning the primitive) but to require an accessible name by one of the two
 * routes that do work on a `role="radiogroup"`:
 *
 * ```tsx
 * // A visible label element, referenced by id.
 * <span id="env-label">Environment</span>
 * <SegmentedControl aria-labelledby="env-label" … />
 *
 * // Or no visible label at all.
 * <SegmentedControl aria-label="Environment" … />
 * ```
 *
 * A dangling `aria-labelledby` (pointing at an id that is not in the document)
 * fails just as silently as the `htmlFor` did, so the accompanying test asserts
 * that the name actually *resolves*, not merely that the attribute is present.
 *
 * ### 2. `pointer-events-none` is not a disable
 *
 * It removes the mouse and nothing else. The control keeps its `tabindex`, so it
 * is still reachable by keyboard and still operable with Arrow keys; assistive
 * tech is never told it is unavailable; and the styling that usually rides along
 * (`opacity-50`) makes it *look* disabled, which is the part that convinces
 * everyone it is.
 *
 * `disabled` here sets Radix's real `disabled`, which propagates to every
 * segment as the `disabled` attribute on a real `<button>`. That is what removes
 * them from the tab order (Radix also drops them from its roving-focus
 * collection), blocks activation from any input device, and makes AT announce the
 * state. Per-segment `disabled` on a `SegmentOption` works the same way.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  disabled = false,
  className,
  ...nameProps
}: SegmentedControlProps) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="segmented-control"
      type="single"
      value={value}
      onValueChange={(next) => {
        // Radix reports the empty string when the active item is clicked again.
        // Swallowing it is what keeps the selection non-empty.
        if (next) onValueChange(next);
      }}
      disabled={disabled}
      // Styling hook only. `aria-disabled` is deliberately NOT set on the group:
      // each segment already reports its own disabled state, and a group-level
      // duplicate makes some screen readers announce it twice.
      data-disabled={disabled ? '' : undefined}
      className={cn('inline-flex rounded-md border border-border bg-bg2 p-0.5', className)}
      {...nameProps}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          data-slot="segmented-control-item"
          value={option.value}
          disabled={option.disabled}
          className={cn(
            'rounded-sm px-2.5 py-1 text-[12.5px] font-medium text-muted-foreground',
            'transition-colors duration-micro ease-out',
            'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
            'enabled:hover:text-fg',
            // A real disable needs a real cursor and a real dim. No
            // `pointer-events-none` — the `disabled` attribute already stops
            // activation, and removing pointer events would also remove the
            // `not-allowed` cursor that tells a mouse user why nothing happened.
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=on]:bg-panel data-[state=on]:shadow-sm',
            option.tone === 'danger' ? 'data-[state=on]:text-danger' : 'data-[state=on]:text-fg',
          )}
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
