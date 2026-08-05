import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows how to resolve a conflict between classes it
 * recognises. Our `@theme` adds scale values it has never heard of, and for
 * those it silently keeps BOTH classes — after which the winner is decided by
 * the order rules happen to appear in the generated stylesheet, not by the order
 * you passed them. `<Button className="rounded-pill">` kept `rounded-md` too and
 * came out a rounded rectangle about half the time.
 *
 * Registering the custom values is what makes `cn` actually override. Only
 * genuinely custom scales need listing — custom *colours* (`bg-panel`,
 * `text-link`) already work, because tailwind-merge treats the colour position
 * in `bg-*` / `text-*` as free-form.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // --radius-pill, which is not one of Tailwind's built-in radius steps.
      rounded: [{ rounded: ['pill'] }],
      // The z-index ladder, added as @utility rules rather than theme values.
      z: [
        {
          z: [
            'base',
            'raised',
            'sticky',
            'dropdown',
            'overlay',
            'modal',
            'popover',
            'toast',
            'tooltip',
          ],
        },
      ],
      // Named durations, likewise @utility rules.
      duration: [{ duration: ['micro', 'enter', 'overlay', 'page'] }],
    },
  },
});

/**
 * Merge class names, Tailwind-aware: later utilities win over earlier
 * conflicting ones.
 *
 * The signature is `twMerge(clsx(...))` and must stay that way. ToggleFlow's
 * `components.json` points `utils` at `@/ui/cn`, so anything `npx shadcn add`
 * generates in that app calls exactly this function — changing the shape here
 * breaks every vendored primitive there at once.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
