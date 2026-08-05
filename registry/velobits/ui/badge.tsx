'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '../lib/cn';

/**
 * The `*-soft` variants pair a tinted wash with the matching *text* token, never
 * with the solid fill — `bg-success-soft text-success`, not
 * `bg-success text-success`. Each text token is gated at AA against the page and
 * the panel, and the washes are low-alpha enough not to move that materially.
 *
 * `brand` is the exception that proves the palette's asymmetry: lime is a fill
 * with charcoal on it in both themes. There is no soft-lime-with-lime-text
 * variant, because lime on cream is 1.13:1.
 */
const badgeVariants = cva(
  [
    'inline-flex w-fit shrink-0 items-center justify-center gap-1',
    'rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
    'transition-colors duration-micro ease-out',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
  ],
  {
    variants: {
      variant: {
        neutral: 'border-border bg-bg2 text-fg',
        primary: 'border-transparent bg-primary-soft text-link',
        brand: 'border-transparent bg-brand text-on-brand',
        success: 'border-transparent bg-success-soft text-success',
        danger: 'border-transparent bg-danger-soft text-danger',
        warning: 'border-transparent bg-warning-soft text-warning',
        info: 'border-transparent bg-info-soft text-info',
        outline: 'border-field-border text-fg',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'span';
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
