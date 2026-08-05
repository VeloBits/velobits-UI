'use client';

import { cn } from '../lib/cn';

/**
 * A cva-styled NATIVE `<select>`, and that is a deliberate refusal of stock
 * shadcn's Radix-based Select.
 *
 * ADR-0031 made this call for a concrete reason: `@radix-ui/react-select` is
 * undriveable under happy-dom. It measures the trigger and viewport to position
 * its popper, and in a DOM without layout every option lands at 0×0, so a test
 * cannot click one. The choice is between a component you cannot test and a
 * native control that works everywhere, on mobile, with the platform's own
 * picker — the native control wins.
 *
 * Do not "upgrade" this to Radix Select. If a design genuinely needs rich option
 * rendering (icons, descriptions, async search), that is a Combobox — a separate
 * Tier-3 component with its own test strategy — not a change to this one.
 *
 * The chevron is a background SVG rather than an overlaid element so the whole
 * control stays a single focusable node. It is positioned with `right` in a
 * data-URI, so under `dir="rtl"` set `bg-[position:left_…]` at the call site;
 * CSS backgrounds are not direction-aware.
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'flex h-9 w-full appearance-none rounded-md border border-input bg-panel ps-3 pe-8 text-sm text-fg',
        'transition-[color,box-shadow] duration-micro ease-out',
        'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-danger aria-invalid:ring-danger/30',
        // The chevron. `currentColor` cannot be used inside a data URI, so this
        // is the muted step spelled out; it tracks the theme via two variants.
        "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23646562' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        "dark:bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a5a39f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
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
