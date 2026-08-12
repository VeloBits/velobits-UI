import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@velobits/ui';

import type { DocPropGroup } from '@/lib/generated/props';

/**
 * The API reference, extracted from the TypeScript types by
 * `scripts/build-docs-data.ts` rather than written here.
 *
 * A hand-written table for 38 components is 38 places for the documentation to
 * disagree with the code, and it disagrees *silently* — which is the worst way
 * for documentation to be wrong, because a reader has no way to tell.
 *
 * What you will not find in these tables is every prop the component accepts.
 * The extractor drops anything declared in React's or Radix's own types, because
 * a table listing `onCopy`, `onCut` and 240 other DOM handlers hides the three
 * props that are actually this component's. The page says so above, once.
 */
export function PropsTable({ groups }: { groups: DocPropGroup[] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.displayName} className="space-y-3">
          <h3
            className="scroll-mt-24 font-mono text-base font-semibold"
            id={`api-${group.displayName}`}
          >
            {group.displayName}
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[16%]">Prop</TableHead>
                <TableHead className="w-[30%]">Type</TableHead>
                <TableHead className="w-[14%]">Default</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.props.map((prop) => (
                <TableRow key={prop.name}>
                  <TableCell className="align-top">
                    <code className="font-medium">{prop.name}</code>
                    {prop.required && (
                      <Badge variant="danger" className="ms-2 align-middle">
                        required
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <code className="text-xs text-muted-foreground">{prop.type}</code>
                  </TableCell>
                  <TableCell className="align-top">
                    {prop.defaultValue ? (
                      <code className="text-xs">{prop.defaultValue}</code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {/*
                     * JSDoc is written in paragraphs and arrives with its
                     * newlines intact. Rendering it into a cell without honouring
                     * them runs the paragraphs together into one wall.
                     */}
                    {prop.description
                      .split('\n\n')
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index} className={index > 0 ? 'mt-2' : undefined}>
                          {paragraph}
                        </p>
                      ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ))}
    </div>
  );
}
