import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Width and height in px — icons are square. */
  size?: number | string;
}

/**
 * The icon factory. Byte-identical in intent to the one both source sets
 * already shared, which is what made merging them mechanical: a 24×24 grid,
 * `stroke="currentColor"`, `strokeWidth={2}`, round caps and joins, and a
 * default `size` of 16.
 *
 * ## Accessibility contract
 *
 * Icons are **decorative by default** (`aria-hidden="true"`), because the
 * overwhelming majority sit beside a text label that already names the action.
 * For the minority that carry meaning alone — an icon-only button, a status
 * glyph — opt in explicitly:
 *
 * ```tsx
 * <TrashIcon aria-hidden={undefined} role="img" aria-label="Delete flag" />
 * ```
 *
 * Passing `aria-label` on its own is NOT enough: `aria-hidden` wins, and the
 * label is never announced. That asymmetry is the single most common misuse.
 *
 * ## Sizing
 *
 * `size` sets both `width` and `height`. Prefer it over Tailwind's `size-*`
 * utilities so the rendered attribute matches what the geometry was tuned for;
 * these glyphs are drawn for 13-18px and a `size-4` class scaling a 16px SVG is
 * fine, while scaling a 24px one is not.
 */
export function createIcon(displayName: string, children: ReactNode) {
  function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export type Icon = ReturnType<typeof createIcon>;
