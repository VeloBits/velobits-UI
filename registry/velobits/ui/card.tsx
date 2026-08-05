'use client';

import { cn } from '../lib/cn';

/**
 * App cards are `--radius-lg` (10px); the marketing site's larger cards use
 * `2xl` and pass it in.
 *
 * ## The bare-`border` trap
 *
 * `Card` is the component that surfaced ADR-0031's first trap. It carries both
 * `border` and a text colour, and Tailwind v4's `border` utility emits width and
 * style ONLY — the colour falls back to `currentColor`. In dark mode that
 * painted a near-white outline around every card. The token layer's
 * `@layer base` rule fixes it globally with `border-color: var(--border)`, and
 * that rule MUST reference `--border` rather than `--color-border`; the latter
 * resolves against `:root` and inherits the light value into dark mode.
 *
 * `border-border` is written explicitly here anyway, so this component is
 * correct even if dropped into an app that has not imported the base layer.
 */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border bg-panel py-4 text-fg shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A grid rather than a column flexbox, and only when there is an action to place.
 *
 * `CardAction` has to sit at the top-right of the header, vertically spanning
 * both the title and the description. In a column flexbox that is impossible:
 * `ms-auto` right-aligns it but it still occupies its own row, so the badge
 * lands *below* the description instead of beside the title.
 *
 * `has-data-[slot=card-action]:` switches to two columns only when an action is
 * actually present, so a header with just a title and description is not left
 * with a dangling empty column.
 */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min items-start gap-1 px-4',
        'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-base leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * Header-anchored actions — a badge, a kebab menu, a small button.
 *
 * `justify-self-end` rather than `ms-auto`: grid alignment is already
 * direction-aware, so `end` resolves to the right edge in LTR and the left edge
 * under `dir="rtl"` with no `rtl:` variant needed. `row-span-2` is what lifts it
 * beside the title instead of stacking below the description.
 */
function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-4', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center gap-2 px-4', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter };
