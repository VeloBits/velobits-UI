'use client';

import {
  ArchiveIcon,
  CircleCheckIcon,
  CircleHalfIcon,
  CircleSlashIcon,
  ClockIcon,
  type Icon,
} from '@velobitsio/icons';

import { cn } from '../lib/cn';
import { Badge, type BadgeProps } from './badge';

/**
 * A row's state, as one small chip: an icon, a colour and a word.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## THE ICON IS NOT DECORATION. IT IS THE SECOND CHANNEL.
 *
 * On and off are encoded here as green and red. Around 8% of men have a
 * red/green deficiency, so for one reader in twelve a colour-only chip conveys
 * *nothing* , and on-versus-off is the single most consequential distinction a
 * control plane makes. WCAG 1.4.1 is the rule; this is the case it was written
 * for.
 *
 * So every status ships a **distinct glyph**, and the glyphs are distinguishable
 * in silhouette rather than by fill: a tick, a barred circle, a half-filled
 * circle, a clock, a box. The text label is the third channel, which is why
 * there is no icon-only mode: a chip that renders as a bare coloured dot is
 * exactly the thing this component exists to stop people writing.
 *
 * **`icon` and `variant` let a caller change both of those channels, and the
 * rule survives the override.** Recolouring two statuses to the same variant, or
 * pointing two at the same glyph, rebuilds the failure by hand , the component
 * cannot detect it, because it only ever sees one chip at a time. If you
 * override, override so that the set stays distinguishable in silhouette.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ## It composes `Badge` rather than re-deriving the palette
 *
 * The hand-rolled version in the dashboard app writes `bg-*-soft text-*` pairs
 * inline. Those pairs are already `Badge`'s variants and are already gated, so
 * this maps status → variant and stops. The gate includes the composite: at
 * 12px the 4.5:1 target applies, and each text-over-wash pairing is measured
 * flattened over the page, the panel and the tier-S glass surface in both
 * themes , the soft-chip suite in `@velobitsio/tokens`. The token re-tune
 * that made those composites pass landed for `Badge` and this component at the
 * same time, precisely because there is only one set of values.
 *
 * **This is also why the colour override is `variant` and not a colour.** Every
 * value it accepts is a pairing that suite has already measured. A `color` prop
 * taking a hex or a CSS variable would let a caller invent a wash/text pair that
 * nothing gates, on a component whose entire argument is that the pair is gated
 * , and it would fail silently, because a chip that is merely hard to read still
 * looks like it works.
 *
 * ## The DOM text is sentence case; the uppercase is CSS
 *
 * `<StatusChip status="on" />` renders the text `On` and paints it `ON`.
 *
 * Literal `"ON"` in the DOM is what the hand-rolled version does, and some
 * screen readers spell a short all-caps token letter by letter , "oh en". A
 * `text-transform` changes only the glyphs, so the accessible name stays the
 * word. Free correctness; the visual result is identical.
 *
 * **The transform applies to `children` too.** `uppercase` sits on the chip, not
 * on the built-in words, so a label override is painted in caps as well:
 * `<StatusChip status="partial">Rolling out</StatusChip>` reads `ROLLING OUT`.
 * That is easy to miss, because the override this component was designed for is
 * a percentage , `25%` is case-invariant, so every example of the feature, here
 * and in the docs, happens to be one of the values that cannot show it. Pass a
 * word and it will shout. If it should not, override the class:
 * `className="normal-case"`.
 */
export type Status = 'on' | 'off' | 'partial' | 'pending' | 'archived';

const PRESENTATION: Record<
  Status,
  { icon: Icon; variant: NonNullable<BadgeProps['variant']>; label: string }
> = {
  on: { icon: CircleCheckIcon, variant: 'success', label: 'On' },
  off: { icon: CircleSlashIcon, variant: 'danger', label: 'Off' },
  /** A rollout, a partial deploy, a half-applied migration. */
  partial: { icon: CircleHalfIcon, variant: 'warning', label: 'Partial' },
  /** Queued, scheduled, awaiting approval , not yet in effect either way. */
  pending: { icon: ClockIcon, variant: 'info', label: 'Pending' },
  /**
   * Deliberately `neutral`, not a colour. Archived is not a *state of the
   * thing*, it is a statement that the thing is no longer live , giving it a
   * status colour would put it on the same axis as on/off and invite the reading
   * "archived, and also somehow off".
   */
  archived: { icon: ArchiveIcon, variant: 'neutral', label: 'Archived' },
};

/**
 * Sort order, exported because a status column has to sort by something and
 * alphabetical is meaningless here.
 *
 * `off` first: someone opening a list during an incident is looking for what is
 * switched off. `archived` last, because it is not a live state at all.
 *
 * Keyed on `status`, which is the reason `status` stays required and stays a
 * closed union even when everything it controls has been overridden: a chip
 * dressed as something else still has to sort, filter and group as the state it
 * actually is.
 */
export const STATUS_ORDER: Record<Status, number> = {
  off: 0,
  partial: 1,
  pending: 2,
  on: 3,
  archived: 4,
};

export interface StatusChipProps extends Omit<BadgeProps, 'children'> {
  status: Status;
  /**
   * Replaces the status's glyph. An **element**, not a component type ,
   * `icon={<ZapIcon />}`, matching `EmptyState` and every other icon slot in
   * the system, so a spinner for a state still resolving or a vendor logo for a
   * provider-specific one is passable too.
   *
   * Rendered inside an `aria-hidden` wrapper rather than trusting whatever is
   * passed to carry it, because the label beside it already says the state and a
   * second announcement is pure noise.
   *
   * SIZE IS SET BY CLASS, NOT BY `size`. The chip carries
   * `[&_svg:not([class*='size-'])]:size-[11px]`, so `className="size-4"` on the
   * icon opts out and `size={16}` does **not** , `size` renders `width`/`height`
   * attributes, and an SVG presentation attribute loses the cascade to any
   * author rule, so the class silently wins. (That is a live trap rather than a
   * hypothetical: this component passed `size={11}` internally from the day it
   * was written and rendered at Badge's 12 the whole time.)
   */
  icon?: React.ReactNode;
  /**
   * Replaces the status's colour.
   *
   * Deliberately `Badge`'s variant rather than a colour: every value here is a
   * wash/text pairing the soft-chip contrast suite has already measured
   * flattened over the page, the panel and glass, in both themes. See the note
   * on the palette above for why this is not a `color` prop.
   *
   * The case for it is an axis the five statuses do not carry , a staging
   * environment whose `on` should not read as production-green, a `partial` that
   * is a planned rollout rather than a warning. It is not a licence to make
   * on and off the same colour.
   */
  variant?: BadgeProps['variant'];
  /**
   * Replaces the default word. The case for it: a partial rollout should read
   * `25%`, which is strictly more information than `Partial` in the same space.
   *
   * Whatever is passed still has to *say the state* , this is a label override,
   * not a slot for extra content.
   *
   * PAINTED UPPERCASE. The chip carries `uppercase`, so it applies to whatever
   * is passed here, not only to the built-in words , `Rolling out` renders as
   * `ROLLING OUT`. Add `className="normal-case"` if that is wrong for the value.
   * Note that the case in the DOM is preserved either way, so this changes what
   * is seen and never what is announced.
   */
  children?: React.ReactNode;
}

function StatusChip({ status, icon, variant, children, className, ...props }: StatusChipProps) {
  const { icon: StatusIcon, variant: statusVariant, label } = PRESENTATION[status];

  return (
    <Badge
      data-slot="status-chip"
      data-status={status}
      variant={variant ?? statusVariant}
      className={cn(
        // `tabular-nums` so a percentage does not change width as it counts:
        // proportional digits make a column of chips ripple on every poll.
        'gap-1 px-1.5 font-semibold uppercase tabular-nums',
        /*
         * 11px rather than Badge's default 12: at this weight the glyph
         * otherwise out-measures the cap height of the text next to it and the
         * chip reads icon-first.
         *
         * It has to be a CLASS to take effect. Badge sets the same rule at
         * `size-3`, and both are author CSS on the same element, so `cn`'s
         * twMerge collapses them to this one , deterministically, rather than
         * leaving the outcome to stylesheet order.
         */
        "[&_svg:not([class*='size-'])]:size-[11px]",
        className,
      )}
      {...props}
    >
      {/*
       * `aria-hidden` on the WRAPPER, not on the glyph. Our own icons set it
       * themselves, but `icon` accepts any element , a bare `<svg>`, an `<img>`,
       * an emoji in a span , and the failure when one of those arrives without
       * it is invisible on screen and audible only to the people this component
       * was written for.
       *
       * Same reasoning and the same shape as `EmptyState`.
       */}
      <span
        aria-hidden
        data-slot="status-chip-icon"
        className="flex shrink-0 items-center justify-center"
      >
        {icon ?? <StatusIcon />}
      </span>
      {children ?? label}
    </Badge>
  );
}

export { StatusChip };
