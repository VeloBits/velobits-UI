'use client';

import {
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@velobitsio/ui';
import { FlagIcon, PlusIcon, SearchIcon } from '@velobitsio/icons';

export default function EmptyStateDemo() {
  return (
    /*
     * The two captions do not wrap to the same number of lines, so plain
     * columns would start the cards at different heights. `grid-rows-subgrid`
     * makes both columns adopt the outer grid's two rows , caption row and card
     * row , so the caption track is as tall as the taller caption and both
     * cards share a top edge. `gap-y-2` keeps the caption-to-card spacing the
     * other demos get from `space-y-2`; the column gap stays at 6.
     */
    <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-2">
      <div className="grid gap-2 lg:row-span-2 lg:grid-rows-subgrid">
        <p className="text-sm font-medium">
          surface=&quot;glass&quot;, the page-level first run, which is the case that wants it
        </p>
        <EmptyState
          surface="glass"
          icon={<FlagIcon />}
          title="No flags yet"
          description="Flags let you switch behaviour at runtime without shipping a deploy."
          headingLevel={4}
          action={
            <Button variant="primary" size="sm">
              <PlusIcon />
              Create your first flag
            </Button>
          }
        />
      </div>

      <div className="grid gap-2 lg:row-span-2 lg:grid-rows-subgrid">
        <p className="text-sm font-medium">
          The default, surface=&quot;none&quot;, in a table body
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="p-0">
                <EmptyState
                  icon={<SearchIcon />}
                  title="No flags match this filter"
                  description="Clear the search to see all eight."
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
