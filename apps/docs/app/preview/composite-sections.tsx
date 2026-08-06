'use client';

import { useMemo, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AppShell,
  AppShellHeader,
  AppShellSidebarTrigger,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Checkbox,
  CodeBlock,
  DataTable,
  DiffViewer,
  diffLines,
  EmptyState,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
  SegmentedControl,
  StatusChip,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useRowSelection,
  type DataTableColumn,
  type RowSelection,
  type SortState,
  type Status,
} from '@velobits-dev/ui';
import { FlagIcon, PlusIcon } from '@velobits-dev/icons';

import { Row, Section } from './section';

export function AccordionSection() {
  return (
    <Section title="Accordion">
      <Accordion type="single" collapsible className="max-w-md">
        <AccordionItem value="what">
          <AccordionTrigger>What is a flag?</AccordionTrigger>
          <AccordionContent>A named switch evaluated at runtime.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="envs">
          <AccordionTrigger>How do environments inherit?</AccordionTrigger>
          <AccordionContent>Children fall back to their parent&apos;s state.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="rollouts">
          <AccordionTrigger>What is a partial rollout?</AccordionTrigger>
          <AccordionContent>A percentage of traffic sees the flag on.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Section>
  );
}

export function AppShellSection() {
  return (
    <Section
      title="AppShell"
      note="Embedded at a fixed height. The header is Tier-O glass; the rail is Tier S. Below the md breakpoint the rail becomes a drawer behind the hamburger."
    >
      <div className="h-96 overflow-hidden rounded-lg border border-border">
        <AppShell
          className="h-full"
          sidebarLabel="Preview navigation"
          header={
            <AppShellHeader>
              <AppShellSidebarTrigger />
              <span className="text-sm font-semibold">Preview shell</span>
            </AppShellHeader>
          }
          sidebar={
            <ul className="space-y-1 p-3 text-sm">
              {['Flags', 'Environments', 'Audit log', 'Settings'].map((item) => (
                <li key={item}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    {item}
                  </Button>
                </li>
              ))}
            </ul>
          }
        >
          <div className="space-y-3">
            {Array.from({ length: 20 }, (_, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                Scrollable main content, paragraph {i + 1}.
              </p>
            ))}
          </div>
        </AppShell>
      </div>
    </Section>
  );
}

export function BreadcrumbSection() {
  return (
    <Section title="Breadcrumb">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Flags</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>new-checkout</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Section>
  );
}

export function CodeBlockSection() {
  return (
    <Section title="CodeBlock" note="Panel variant, plus the theme-invariant terminal variant.">
      <div className="max-w-2xl space-y-4">
        <CodeBlock language="json" copyable label="Flag payload">
          {'{\n  "key": "new-checkout",\n  "type": "boolean",\n  "state": "on"\n}'}
        </CodeBlock>
        <CodeBlock variant="terminal" wrap copyable label="API key">
          vb_live_4f8a2c91d7e35b06a1c9f2e8d4b7a350
        </CodeBlock>
      </div>
    </Section>
  );
}

interface FlagRow {
  id: string;
  key: string;
  status: Status;
  env: string;
  updated: string;
}

const FLAG_ROWS: readonly FlagRow[] = [
  { id: '1', key: 'new-checkout', status: 'on', env: 'Production', updated: '2026-08-01' },
  {
    id: '2',
    key: 'dark-mode-rollout',
    status: 'partial',
    env: 'Production',
    updated: '2026-08-03',
  },
  { id: '3', key: 'legacy-export', status: 'off', env: 'Staging', updated: '2026-07-28' },
  { id: '4', key: 'beta-search', status: 'pending', env: 'Development', updated: '2026-08-05' },
  { id: '5', key: 'old-onboarding', status: 'archived', env: 'Production', updated: '2026-06-14' },
];

interface FlagTableContext {
  selection: RowSelection;
}

const FLAG_COLUMNS: readonly DataTableColumn<FlagRow, FlagTableContext>[] = [
  {
    id: 'select',
    header: 'Select',
    hideHeader: true,
    interactive: true,
    className: 'w-10',
    headerCell: (ctx) => (
      <Checkbox
        aria-label="Select all rows"
        checked={
          ctx.selection.allSelected ? true : ctx.selection.someSelected ? 'indeterminate' : false
        }
        onCheckedChange={() => ctx.selection.toggleAll()}
      />
    ),
    cell: (row, ctx) => (
      <Checkbox
        aria-label={`Select ${row.key}`}
        checked={ctx.selection.isSelected(row.id)}
        onCheckedChange={() => ctx.selection.toggle(row.id)}
      />
    ),
  },
  { id: 'key', header: 'Key', sortKey: 'key', cell: (row) => <code>{row.key}</code> },
  {
    id: 'status',
    header: 'State',
    sortKey: 'status',
    cell: (row) => <StatusChip status={row.status} />,
  },
  { id: 'env', header: 'Environment', cell: (row) => row.env },
  { id: 'updated', header: 'Updated', sortKey: 'updated', cell: (row) => row.updated },
];

export function DataTableSection() {
  const [sort, setSort] = useState<SortState>({ key: 'key', dir: 'asc' });
  const [activated, setActivated] = useState<string | null>(null);

  const rows = useMemo(() => {
    const sorted = [...FLAG_ROWS].sort((a, b) => {
      const key = sort.key as 'key' | 'status' | 'updated';
      const result = String(a[key]).localeCompare(String(b[key]));
      return sort.dir === 'asc' ? result : -result;
    });
    return sorted;
  }, [sort]);

  const selection = useRowSelection(rows, (row) => row.id);
  const context = useMemo(() => ({ selection }), [selection]);

  return (
    <Section
      title="DataTable"
      note="Sortable headers, row activation, and selection via useRowSelection."
    >
      <div className="space-y-2">
        <DataTable
          label="Flags in Production"
          columns={FLAG_COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          context={context}
          sort={sort}
          onSortChange={setSort}
          onRowActivate={(row) => setActivated(row.key)}
          rowLabel={(row) => row.key}
          isRowSelected={(row) => selection.isSelected(row.id)}
          containerClassName="rounded-lg border border-border"
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {selection.count} selected
          {activated ? ` · last activated: ${activated}` : ''}
        </p>
        {selection.count > 0 && (
          <Button variant="ghost" size="sm" onClick={selection.clear}>
            Clear selection
          </Button>
        )}
      </div>
    </Section>
  );
}

const DIFF_BEFORE = `{
  "key": "new-checkout",
  "state": "off",
  "rollout": 0
}`;

const DIFF_AFTER = `{
  "key": "new-checkout",
  "state": "on",
  "rollout": 40,
  "seed": "checkout-2026"
}`;

export function DiffViewerSection() {
  return (
    <Section title="DiffViewer">
      <div className="max-w-2xl">
        <DiffViewer lines={diffLines(DIFF_BEFORE, DIFF_AFTER)} label="Config v3 → v4" />
      </div>
    </Section>
  );
}

export function EmptyStateSection() {
  return (
    <Section title="EmptyState">
      <div className="max-w-lg rounded-lg border border-dashed border-border">
        <EmptyState
          icon={<FlagIcon />}
          title="No flags yet"
          description="Flags let you switch behaviour at runtime without a deploy."
          action={
            <Button variant="primary" size="sm">
              <PlusIcon />
              Create your first flag
            </Button>
          }
        />
      </div>
    </Section>
  );
}

export function PaginationSection() {
  const [page, setPage] = useState(6);
  const pageCount = 20;

  return (
    <Section title="Pagination" note={`Page ${page} of ${pageCount} — constant-width range.`}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
          </PaginationItem>
          {paginationRange({ page, pageCount }).map((slot, index) => (
            <PaginationItem key={slot === 'ellipsis' ? `gap-${index}` : slot}>
              {slot === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href={`#page-${slot}`}
                  isActive={slot === page}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(slot);
                  }}
                >
                  {slot}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Section>
  );
}

export function SegmentedControlSection() {
  const [env, setEnv] = useState('dev');

  return (
    <Section title="SegmentedControl">
      <Row>
        <SegmentedControl
          aria-label="Environment"
          value={env}
          onValueChange={setEnv}
          options={[
            { value: 'dev', label: 'Development' },
            { value: 'staging', label: 'Staging', disabled: true },
            { value: 'prod', label: 'Production', tone: 'danger' },
          ]}
        />
        <span className="text-sm text-muted-foreground">selected: {env}</span>
      </Row>
    </Section>
  );
}

const ALL_STATUSES: readonly Status[] = ['on', 'off', 'partial', 'pending', 'archived'];

export function StatusChipSection() {
  return (
    <Section title="StatusChip" note="All five statuses, plus a label override.">
      <Row>
        {ALL_STATUSES.map((status) => (
          <StatusChip key={status} status={status} />
        ))}
        <StatusChip status="partial">40%</StatusChip>
      </Row>
    </Section>
  );
}

export function TableSection() {
  return (
    <Section title="Table">
      <Table containerClassName="max-w-lg rounded-lg border border-border">
        <TableCaption>Plain table primitives.</TableCaption>
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
            <TableCell>31</TableCell>
            <TableCell>18</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Staging</TableCell>
            <TableCell>27</TableCell>
            <TableCell>16</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Production</TableCell>
            <TableCell>24</TableCell>
            <TableCell>12</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>82</TableCell>
            <TableCell>46</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Section>
  );
}

export function TabsSection() {
  return (
    <Section title="Tabs" note="Default and line variants.">
      <div className="max-w-md space-y-6">
        <Tabs defaultValue="targeting">
          <TabsList>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="targeting" className="text-sm text-muted-foreground">
            Targeting rules panel.
          </TabsContent>
          <TabsContent value="history" className="text-sm text-muted-foreground">
            Change history panel.
          </TabsContent>
          <TabsContent value="settings" className="text-sm text-muted-foreground">
            Settings panel.
          </TabsContent>
        </Tabs>
        <Tabs defaultValue="one">
          <TabsList variant="line">
            <TabsTrigger value="one">Line one</TabsTrigger>
            <TabsTrigger value="two">Line two</TabsTrigger>
          </TabsList>
          <TabsContent value="one" className="text-sm text-muted-foreground">
            First line-variant panel.
          </TabsContent>
          <TabsContent value="two" className="text-sm text-muted-foreground">
            Second line-variant panel.
          </TabsContent>
        </Tabs>
      </div>
    </Section>
  );
}
