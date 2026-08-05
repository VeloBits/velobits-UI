'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

/**
 * ## Colour is never the only signal
 *
 * WCAG 1.4.1 (Use of Color): a red border does not tell a colour-blind or
 * screen-reader user that something failed. Every variant therefore expects an
 * icon AND a title that names the state in words. The grid below reserves the
 * icon column so callers do not have to lay it out.
 *
 * ## Why `role` is a prop rather than a hardcoded `alert`
 *
 * `role="alert"` is an assertive live region — it interrupts whatever the
 * screen reader is saying. Correct for an error that just appeared in response
 * to an action; wrong for a static informational panel rendered with the page,
 * where it announces on every navigation. Defaults to `status` (polite), and a
 * caller escalates deliberately.
 */
const alertVariants = cva(
  [
    'relative grid w-full gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-sm',
    'grid-cols-[calc(var(--spacing)*4)_1fr] items-start',
    '[&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  ],
  {
    variants: {
      variant: {
        neutral: 'border-border bg-panel text-fg',
        info: 'border-info/30 bg-info-soft text-fg',
        success: 'border-success/30 bg-success-soft text-fg',
        warning: 'border-warning/30 bg-warning-soft text-fg',
        danger: 'border-danger/30 bg-danger-soft text-fg',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface AlertProps
  extends React.ComponentProps<'div'>, VariantProps<typeof alertVariants> {}

function Alert({ className, variant, role = 'status', ...props }: AlertProps) {
  return (
    <div
      data-slot="alert"
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="alert-title" className={cn('col-start-2 font-medium', className)} {...props} />
  );
}

/**
 * `text-muted-foreground` and not a tinted variant of the status colour: inside
 * a `*-soft` wash, the status text step is no longer measured against a plain
 * panel, and stacking a tint on a tint is how a body-copy pair quietly drops
 * below AA.
 */
function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('col-start-2 text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
