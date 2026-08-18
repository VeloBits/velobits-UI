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
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">
          surface=&quot;glass&quot; , the page-level first run, which is the case that wants it
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

      <div className="space-y-2">
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
