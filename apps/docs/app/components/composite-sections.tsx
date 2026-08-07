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
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  CodeBlock,
  DataTable,
  DiffViewer,
  diffLines,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
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
import {
  ArchiveIcon,
  BarChart3Icon,
  ClockIcon,
  EllipsisIcon,
  FlagIcon,
  HomeIcon,
  KeyIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  UsersIcon,
} from '@velobits-dev/icons';

import { Demo, Row } from '../section';

/* ── AppShell ─────────────────────────────────────────────────────────────── */

const SHELL_NAV = [
  { label: 'Flags', icon: FlagIcon, active: true },
  { label: 'Environments', icon: LayersIcon, active: false },
  { label: 'Segments', icon: UsersIcon, active: false },
  { label: 'Insights', icon: BarChart3Icon, active: false },
  { label: 'API keys', icon: KeyIcon, active: false },
  { label: 'Audit log', icon: ClockIcon, active: false },
] as const;

/*
 * BLUR BUDGET: AppShellHeader is Tier-O glass and therefore one live backdrop
 * layer, mounted for as long as this page is open. It is one of the five.
 */
export function AppShellDemo() {
  return (
    <Demo
      title="AppShell"
      note="Embedded at a fixed height. The header is Tier-O glass, the rail is Tier S. `sidebar` is a prop rather than a child because it renders twice — below the md breakpoint the same nav becomes a real SidePanel drawer behind the hamburger, which buys the focus trap and, the part hand-rolled drawers miss, focus restoration to the trigger."
    >
      <div className="h-[26rem] overflow-hidden rounded-lg">
        <AppShell
          className="h-full"
          sidebarLabel="Control plane"
          header={
            <AppShellHeader>
              <AppShellSidebarTrigger />
              <span className="text-sm font-semibold">Acme · Control plane</span>
              <Badge variant="info" className="ms-2">
                Production
              </Badge>
              <Button variant="ghost" size="icon" aria-label="Search" className="ms-auto">
                <SearchIcon />
              </Button>
            </AppShellHeader>
          }
          sidebar={
            <nav className="space-y-1 p-3 text-sm">
              {SHELL_NAV.map(({ label, icon: Icon, active }) => (
                <Button
                  key={label}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon />
                  {label}
                </Button>
              ))}
            </nav>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold">Flags</h4>
              <Button variant="primary" size="sm">
                <PlusIcon />
                New flag
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Total', value: '82' },
                { label: 'Enabled', value: '46' },
                { label: 'Rolling out', value: '7' },
              ].map((stat) => (
                <Card key={stat.label} surface="panel">
                  <CardHeader>
                    <CardTitle className="text-2xl tabular-nums">{stat.value}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{stat.label}</CardContent>
                </Card>
              ))}
            </div>
            {/*
             * `surface="none"` — this Table is inside the shell's main region,
             * which sits over the Tier-S rail's material. Defaulting it to glass
             * here would be the nested case.
             */}
            <Table surface="none">
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {FLAG_ROWS.slice(0, 5).map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <code>{flag.key}</code>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={flag.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {Array.from({ length: 8 }, (_, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                The main region scrolls under the sticky glass header — scroll it and watch content
                pass behind the blur.
              </p>
            ))}
          </div>
        </AppShell>
      </div>
    </Demo>
  );
}

/* ── DataTable ────────────────────────────────────────────────────────────── */

interface FlagRow {
  id: string;
  key: string;
  status: Status;
  env: string;
  owner: string;
  updated: string;
}

const FLAG_ROWS: readonly FlagRow[] = [
  {
    id: '1',
    key: 'new-checkout',
    status: 'partial',
    env: 'Production',
    owner: 'Payments',
    updated: '2026-08-05',
  },
  {
    id: '2',
    key: 'dark-mode-rollout',
    status: 'on',
    env: 'Production',
    owner: 'Platform',
    updated: '2026-08-03',
  },
  {
    id: '3',
    key: 'beta-search',
    status: 'pending',
    env: 'Staging',
    owner: 'Discovery',
    updated: '2026-08-05',
  },
  {
    id: '4',
    key: 'legacy-export',
    status: 'off',
    env: 'Staging',
    owner: 'Platform',
    updated: '2026-07-28',
  },
  {
    id: '5',
    key: 'inline-editing',
    status: 'partial',
    env: 'Development',
    owner: 'Editor',
    updated: '2026-08-06',
  },
  {
    id: '6',
    key: 'usage-quotas',
    status: 'on',
    env: 'Production',
    owner: 'Billing',
    updated: '2026-08-01',
  },
  {
    id: '7',
    key: 'old-onboarding',
    status: 'archived',
    env: 'Production',
    owner: 'Growth',
    updated: '2026-06-14',
  },
  {
    id: '8',
    key: 'webhook-retries',
    status: 'off',
    env: 'Development',
    owner: 'Platform',
    updated: '2026-07-19',
  },
];

interface FlagTableContext {
  selection: RowSelection;
}

const FLAG_COLUMNS: readonly DataTableColumn<FlagRow, FlagTableContext>[] = [
  {
    id: 'select',
    // `hideHeader`, never an empty <th> — axe `empty-table-header`, and a screen
    // reader would otherwise announce every checkbox with no idea what it does.
    header: 'Select row',
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
  {
    id: 'key',
    header: 'Key',
    sortKey: 'key',
    cell: (row) => <code className="font-medium">{row.key}</code>,
  },
  {
    id: 'status',
    header: 'State',
    sortKey: 'status',
    cell: (row) => <StatusChip status={row.status} />,
  },
  { id: 'env', header: 'Environment', sortKey: 'env', cell: (row) => row.env },
  { id: 'owner', header: 'Owner', sortKey: 'owner', cell: (row) => row.owner },
  {
    id: 'updated',
    header: 'Updated',
    sortKey: 'updated',
    cell: (row) => <span className="tabular-nums">{row.updated}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    hideHeader: true,
    interactive: true,
    className: 'w-10',
    cell: (row) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={`Actions for ${row.key}`}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger">Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function DataTableDemo() {
  const [sort, setSort] = useState<SortState>({ key: 'updated', dir: 'desc' });
  const [query, setQuery] = useState('');
  const [activated, setActivated] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? FLAG_ROWS.filter(
          (row) =>
            row.key.toLowerCase().includes(needle) || row.owner.toLowerCase().includes(needle),
        )
      : FLAG_ROWS;

    return [...filtered].sort((a, b) => {
      const key = sort.key as keyof FlagRow;
      const result = String(a[key]).localeCompare(String(b[key]));
      return sort.dir === 'asc' ? result : -result;
    });
  }, [query, sort]);

  const selection = useRowSelection(rows, (row) => row.id);
  const context = useMemo(() => ({ selection }), [selection]);

  return (
    <Demo
      title="DataTable"
      note="A column registry, deliberately not TanStack — this is the shape the dashboard's flags table arrived at independently. Selection is DERIVED (stored set ∩ rows on screen), so filter the list while rows are selected and the count follows: a bulk action can never point at a row nobody can see."
    >
      <div className="space-y-3">
        <Row>
          <Input
            className="max-w-xs"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by key or owner…"
            aria-label="Filter flags"
          />
          <Button variant="secondary" size="sm">
            <SlidersIcon />
            Columns
          </Button>
          <Button variant="primary" size="sm" className="ms-auto">
            <PlusIcon />
            New flag
          </Button>
        </Row>

        {/*
         * The bulk bar appears only with a selection, which is also the honest
         * demo of `useRowSelection` — clear it by filtering the rows away.
         */}
        {selection.count > 0 && (
          <div
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-primary-soft px-3 py-2 text-sm"
            role="status"
          >
            <span className="font-medium text-primary-text">
              {selection.count} flag{selection.count === 1 ? '' : 's'} selected
            </span>
            <Button variant="secondary" size="sm">
              Enable
            </Button>
            <Button variant="secondary" size="sm">
              <ArchiveIcon />
              Archive
            </Button>
            <Button variant="ghost" size="sm" className="ms-auto" onClick={selection.clear}>
              Clear
            </Button>
          </div>
        )}

        {/*
         * No `containerClassName` border here. `Table` defaults to
         * `surface="glass"`, and a `border-*` utility on that wrapper wins the
         * cascade over `.glass-surface`'s own translucent edge — silently
         * swapping the material's border for the opaque one.
         */}
        <DataTable
          label="Flags in Acme · all environments"
          columns={FLAG_COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          context={context}
          sort={sort}
          onSortChange={(next) => setSort(next)}
          onRowActivate={(row) => setActivated(row.key)}
          rowLabel={(row) => `Open ${row.key}`}
          isRowSelected={(row) => selection.isSelected(row.id)}
          empty={
            <EmptyState
              size="compact"
              icon={<SearchIcon />}
              title="No flags match that filter"
              description="Try a shorter search, or clear it to see all eight."
              action={
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear filter
                </Button>
              }
            />
          }
        />

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {rows.length} of {FLAG_ROWS.length} shown · {selection.count} selected
          {activated ? ` · last opened: ${activated}` : ''}
        </p>
      </div>
    </Demo>
  );
}

/* ── Table ────────────────────────────────────────────────────────────────── */

export function TableDemo() {
  return (
    <Demo
      title="Table"
      note="The wrapper carries the surface and defaults to glass; rows use opaque washes, because a translucent row over a translucent shell is the nested case. The wrapper never blurs in any mode — it is the scroll container, and .glass-surface-blur there re-samples its backdrop every frame."
    >
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
               * here composites glass over glass — ~2/255 apart, both layers
               * gone. This is the call site that made `surface` a prop.
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
    </Demo>
  );
}

/* ── Accordion ────────────────────────────────────────────────────────────── */

export function AccordionDemo() {
  return (
    <Demo
      title="Accordion"
      note="Defaults to glass, like Table — both are normally the outermost thing on a page. Radix unmounts collapsed panels, so a surface that needs its answers crawlable wants a hand-rolled aria-hidden + inert version instead."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Accordion type="single" collapsible defaultValue="what">
          <AccordionItem value="what">
            <AccordionTrigger>What is a flag?</AccordionTrigger>
            <AccordionContent>
              A named switch, evaluated at request time rather than at build time.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="envs">
            <AccordionTrigger>How do environments inherit?</AccordionTrigger>
            <AccordionContent>
              A child environment falls back to its parent&apos;s state until it sets its own.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="rollouts">
            <AccordionTrigger>What is a partial rollout?</AccordionTrigger>
            <AccordionContent>
              A stable percentage of traffic sees the flag on, bucketed by a seed so the same user
              keeps the same answer.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion type="multiple" surface="panel">
          <AccordionItem value="a">
            <AccordionTrigger>
              surface=&quot;panel&quot;, type=&quot;multiple&quot;
            </AccordionTrigger>
            <AccordionContent>
              The opaque variant, and more than one panel can be open at once.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>When to reach for it</AccordionTrigger>
            <AccordionContent>
              Inside a Card, inside a Dialog — anywhere the parent is already glass.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Demo>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

export function TabsDemo() {
  return (
    <Demo
      title="Tabs"
      note="The inactive trigger is text-muted-foreground. The obvious spelling — foreground at 60% — measures about 3:1, which is under AA for text."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <Tabs defaultValue="targeting">
          <TabsList>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="targeting" className="pt-3 text-sm text-muted-foreground">
            Rules are evaluated top to bottom; the first match wins.
          </TabsContent>
          <TabsContent value="history" className="pt-3 text-sm text-muted-foreground">
            Every state change is written to the audit log with its actor.
          </TabsContent>
          <TabsContent value="settings" className="pt-3 text-sm text-muted-foreground">
            Key, description and owning team.
          </TabsContent>
        </Tabs>

        <Tabs defaultValue="one">
          <TabsList variant="line">
            <TabsTrigger value="one">Overview</TabsTrigger>
            <TabsTrigger value="two">Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="one" className="pt-3 text-sm text-muted-foreground">
            The `line` variant, for a page-level tab bar.
          </TabsContent>
          <TabsContent value="two" className="pt-3 text-sm text-muted-foreground">
            Evaluations over the last 24 hours.
          </TabsContent>
        </Tabs>
      </div>
    </Demo>
  );
}

/* ── SegmentedControl ─────────────────────────────────────────────────────── */

export function SegmentedControlDemo() {
  const [env, setEnv] = useState('dev');
  const [scope, setScope] = useState('all');

  return (
    <Demo
      title="SegmentedControl"
      note='Segments are role="radio" in a role="radiogroup", so arrow keys move the selection. It takes the NATIVE aria-* spelling — aria-labelledby, aria-describedby — not a camelCase prop, so a dangling id is the caller&apos;s to notice.'
    >
      <div className="space-y-4">
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
          <span className="text-sm text-muted-foreground">
            selected: {env} · Staging is disabled · Production carries the danger tone
          </span>
        </Row>
        <Row>
          <SegmentedControl
            aria-label="Scope"
            value={scope}
            onValueChange={setScope}
            options={[
              { value: 'all', label: 'All' },
              { value: 'mine', label: 'Mine' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </Row>
      </div>
    </Demo>
  );
}

/* ── StatusChip ───────────────────────────────────────────────────────────── */

const ALL_STATUSES: readonly Status[] = ['on', 'off', 'partial', 'pending', 'archived'];

export function StatusChipDemo() {
  return (
    <Demo
      title="StatusChip"
      note="Five statuses, each with a DISTINCT glyph — colour alone fails 1.4.1, and these five have to be told apart at a glance in a column. Sentence case in the DOM, uppercase in CSS, so a screen reader is not spelling out letters."
    >
      <div className="space-y-3">
        <Row>
          {ALL_STATUSES.map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </Row>
        <Row>
          <StatusChip status="partial">40%</StatusChip>
          <StatusChip status="partial">5%</StatusChip>
          <span className="text-sm text-muted-foreground">
            The label override — a percentage is strictly more information than
            &ldquo;Partial&rdquo; in the same space, and it still says the state.
          </span>
        </Row>
      </div>
    </Demo>
  );
}

/* ── EmptyState ───────────────────────────────────────────────────────────── */

export function EmptyStateDemo() {
  return (
    <Demo
      title="EmptyState"
      note='The one surface-bearing component that defaults to surface="none", and the default is the point: its documented homes — a table body, a card body — are ALREADY glass, so defaulting it to glass would ship the nested case at its commonest call site.'
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            surface=&quot;glass&quot; — the page-level first run, which is the case that wants it
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
    </Demo>
  );
}

/* ── Pagination ───────────────────────────────────────────────────────────── */

export function PaginationDemo() {
  const [page, setPage] = useState(6);
  const pageCount = 20;

  return (
    <Demo
      title="Pagination"
      note="Numbers are links, prev/next are buttons. The range returns a CONSTANT slot count so the control never reflows, and it never hides a lone page behind an ellipsis — the textbook bounds render `1 … 4 5 6 … 8` at page 5 of 8, where the second ellipsis stands in for page 7 and nothing else."
    >
      <div className="space-y-3">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {/*
               * `disabled` here sets aria-disabled, not the attribute: at the
               * ends of the range the focused element must not vanish, so the
               * click guard is what actually stops the activation.
               */}
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
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          Page {page} of {pageCount}
        </p>
      </div>
    </Demo>
  );
}

/* ── Breadcrumb ───────────────────────────────────────────────────────────── */

export function BreadcrumbDemo() {
  return (
    <Demo
      title="Breadcrumb"
      note='A named landmark around an ordered list. The leaf is a plain span with aria-current="page" — shadcn&apos;s role="link" aria-disabled announces static text as a broken link.'
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">
              <HomeIcon />
              Acme
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Production</BreadcrumbLink>
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
    </Demo>
  );
}

/* ── CodeBlock ────────────────────────────────────────────────────────────── */

export function CodeBlockDemo() {
  return (
    <Demo
      title="CodeBlock"
      note="The `terminal` variant sits on --code / --on-code, which are deliberately THEME-INVARIANT: a revealed secret has to be transcribed exactly, and a surface that flips changes which characters are easy to misread. The copy button presence-checks navigator.clipboard, which is absent — the whole object, not just the method — on an insecure origin."
    >
      <div className="max-w-2xl space-y-4">
        <CodeBlock language="json" copyable label="Flag payload">
          {
            '{\n  "key": "new-checkout",\n  "type": "boolean",\n  "state": "partial",\n  "rollout": 40\n}'
          }
        </CodeBlock>
        <CodeBlock variant="terminal" wrap copyable label="API key">
          vb_live_4f8a2c91d7e35b06a1c9f2e8d4b7a350
        </CodeBlock>
      </div>
    </Demo>
  );
}

/* ── DiffViewer ───────────────────────────────────────────────────────────── */

const DIFF_BEFORE = `{
  "key": "new-checkout",
  "state": "off",
  "rollout": 0
}`;

const DIFF_AFTER = `{
  "key": "new-checkout",
  "state": "partial",
  "rollout": 40,
  "seed": "checkout-2026"
}`;

export function DiffViewerDemo() {
  return (
    <Demo
      title="DiffViewer"
      note="The +/− gutter is the PRIMARY channel and the soft washes are the second — a diff carried by red and green alone fails 1.4.1 for the readers who most need to trust it. `diffLines` ships with an O(n·m) memory guard."
    >
      <div className="max-w-2xl">
        <DiffViewer lines={diffLines(DIFF_BEFORE, DIFF_AFTER)} label="Config v3 → v4" />
      </div>
    </Demo>
  );
}
