import { Badge } from '@velobitsio/ui';

import { InlineMarkup } from '@/components/inline-markup';
import type { DocPropGroup } from '@/lib/generated/props';

/**
 * The API reference, extracted from the TypeScript types by
 * `scripts/build-docs-data.ts` rather than written here.
 *
 * A hand-written table for 39 components is 39 places for the documentation to
 * disagree with the code, and it disagrees *silently* , which is the worst way
 * for documentation to be wrong, because a reader has no way to tell.
 *
 * What you will not find in these tables is every prop the component accepts.
 * The extractor drops anything declared in React's or Radix's own types, because
 * a table listing `onCopy`, `onCut` and 240 other DOM handlers hides the three
 * props that are actually this component's. The page says so above, once.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## THIS IS NOT A TABLE, AND THAT IS THE POINT
 *
 * It was four columns , Prop, Type, Default, Description , until 2026-08-26,
 * and it overflowed horizontally on a desktop viewport, which put the
 * Description column *entirely off screen*. Two properties of the content make
 * that unfixable by tuning widths:
 *
 *  1. **The types are long.** `Badge`'s `variant` union is 90 characters and
 *     `Form`'s reach 153. In a 30%-wide column a union that long wraps into a
 *     narrow ribbon of pipes that is harder to read than the scroll was.
 *  2. **The descriptions are long.** These are the docblocks from the source,
 *     and this system writes them in paragraphs , up to 720 characters. A cell
 *     sharing a row with a 90-character type has nothing like the measure for
 *     that, so the prose sets in a column four or five words wide.
 *
 * A table earns its geometry when a reader compares cells *down* a column. Here
 * nobody does: you look up one prop and read about it. So each prop gets a
 * block, the type gets the full width, and the prose gets a real measure.
 *
 * ⚠️ **`TableCell` carries `whitespace-nowrap`**, which is what made the old
 * version scroll rather than wrap. That is correct for `Table` , a datum should
 * not fold mid-value , and it is the reason this component no longer uses it,
 * rather than a bug to fix there.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function PropsTable({ groups }: { groups: DocPropGroup[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.displayName} className="space-y-4">
          <h3
            className="scroll-mt-24 font-mono text-base font-semibold"
            id={`api-${group.displayName}`}
          >
            {group.displayName}
          </h3>

          <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {group.props.map((prop) => (
              <div key={prop.name} className="space-y-3 p-4">
                {/*
                 * `<dt>`/`<dd>` rather than divs: this IS a description list,
                 * and the pairing is what lets a screen reader jump prop to
                 * prop. The visual grouping below is a grid inside the `<dt>`,
                 * so the semantics do not bend to the layout.
                 */}
                <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <code className="font-mono text-sm font-semibold text-fg">{prop.name}</code>

                  {prop.required && (
                    <Badge variant="danger" className="align-middle">
                      required
                    </Badge>
                  )}

                  {/*
                   * The default sits on the name line rather than in a column
                   * of its own. It is one short token for the minority of props
                   * that have one, and a whole column for it was mostly empty ,
                   * which is also how it came to render a stray comma as its
                   * "no default" placeholder for every row.
                   */}
                  {prop.defaultValue ? (
                    <span className="text-xs text-muted-foreground">
                      default <code className="text-fg">{prop.defaultValue}</code>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">no default</span>
                  )}
                </dt>

                <dd className="space-y-3">
                  {/*
                   * `break-words` as well as wrapping: a union has no spaces
                   * inside a member, so `"brailleroledescription"`-class tokens
                   * would still push the box wide on a narrow viewport.
                   */}
                  <code className="block font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
                    {prop.type}
                  </code>

                  {prop.description && (
                    <div className="max-w-prose space-y-2 text-sm leading-6 text-muted-foreground">
                      {/*
                       * JSDoc is written in paragraphs and arrives with its
                       * newlines intact. Rendering it without honouring them
                       * runs the paragraphs together into one wall.
                       */}
                      {prop.description
                        .split('\n\n')
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={index}>
                            <InlineMarkup text={paragraph} />
                          </p>
                        ))}
                    </div>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
