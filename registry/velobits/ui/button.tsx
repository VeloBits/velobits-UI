'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '../lib/cn';

/**
 * ## Why there is no `primary`-coloured text variant
 *
 * `--primary` (#007ACC) measures 3.90:1 on the cream page — fine as a fill
 * behind white text (4.51:1), failing AA as text. The `link` variant therefore
 * uses `text-link` (`--primary-text`, 4.68:1), and no variant paints
 * `--primary` on a page background.
 *
 * ## Radius
 *
 * Controls are `--radius-md` (6px) system-wide. The Keycloak login theme's
 * vended `button.tsx` hardcodes `rounded-full`, so adopting this shared radius
 * is what makes login buttons stop being pills — an accepted consequence,
 * reversible by overriding `--keycloakify-shadcn-radius`.
 *
 * ## RTL
 *
 * Tailwind v4's `px-*` and `gap-*` are already logical, so nothing here needs
 * mirroring under `dir="rtl"`. A directional icon *child* still does.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-md text-sm font-medium',
    'transition-colors duration-micro ease-out',
    // The visible ring comes from the token layer's global :focus-visible rule.
    // This adds the soft halo; `outline-none` only suppresses the UA default.
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
    'disabled:pointer-events-none disabled:opacity-50',
    // Size any icon child once, rather than at every call site.
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
        /**
         * The lime brand fill. `text-on-brand` is charcoal at 10.89:1 — the only
         * sanctioned pairing on lime. White on lime is 1.31:1, which is why no
         * white-on-brand variant exists to reach for by mistake.
         */
        brand: 'bg-brand text-on-brand shadow-sm hover:brightness-95',
        secondary: 'border border-field-border bg-panel text-fg hover:bg-highlight',
        ghost: 'text-fg hover:bg-highlight',
        destructive: 'bg-danger text-on-primary shadow-sm hover:brightness-95',
        link: 'text-link underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-10 px-6',
        /** Square, for an icon-only button — which needs an `aria-label`. */
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /**
   * Render the single child element instead of a `<button>`, forwarding these
   * classes onto it — for wrapping a router `<Link>` without nesting an anchor
   * inside a button.
   */
  asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    // `data-slot` is how shadcn's generated code targets sub-parts; keeping it
    // means anything `npx shadcn add` writes composes with these primitives.
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
