'use client';

import { cn } from '../lib/cn';

/**
 * `border-input` maps to `--field-border`, NOT `--border`.
 *
 * The two are split because they want different weights: a table separator
 * should recede, a field must announce where you can type. It is also the half
 * WCAG 1.4.11 gates — a control's edge is "required to identify" the control, so
 * it needs 3:1, while a decorative divider does not. `--field-border` is
 * `neutral-500`, the only ramp step clearing 3:1 in both themes.
 *
 * `aria-invalid` styling is driven by the attribute rather than a prop, so
 * whatever form library the app uses (react-hook-form + zod, in ToggleFlow's
 * case) gets error styling by setting the attribute it already sets.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-md border border-input bg-panel px-3 py-1 text-sm text-fg',
        'transition-[color,box-shadow] duration-micro ease-out',
        'placeholder:text-muted-foreground',
        'selection:bg-primary selection:text-on-primary',
        'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // File inputs get their own text treatment; the UA button is styled by
        // the ::file-selector-button reset in the token layer.
        'file:me-3 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'aria-invalid:border-danger aria-invalid:ring-danger/30',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
