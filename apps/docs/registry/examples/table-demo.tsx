'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@velobitsio/ui';

export default function TableDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">Default — surface=&quot;glass&quot;, on the page</p>
        <Table>
          <TableCaption>Flag counts by environment.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Environment</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Development</TableCell>
              <TableCell className="tabular-nums">31</TableCell>
              <TableCell className="tabular-nums">18</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Staging</TableCell>
              <TableCell className="tabular-nums">27</TableCell>
              <TableCell className="tabular-nums">16</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Production</TableCell>
              <TableCell className="tabular-nums">24</TableCell>
              <TableCell className="tabular-nums">12</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="tabular-nums">82</TableCell>
              <TableCell className="tabular-nums">46</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">
          The nested case — surface=&quot;none&quot; inside a Card
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Environments</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {/*
             * The Card is already Tier S. Leaving Table on its `glass` default
             * here composites glass over glass — ~2/255 apart, both layers gone.
             * This is the call site that made `surface` a prop.
             */}
            <Table surface="none">
              <TableHeader>
                <TableRow>
                  <TableHead>Environment</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Development</TableCell>
                  <TableCell className="tabular-nums">31</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Staging</TableCell>
                  <TableCell className="tabular-nums">27</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Production</TableCell>
                  <TableCell className="tabular-nums">24</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
