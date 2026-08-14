'use client';

import {
  AppShell,
  AppShellHeader,
  AppShellSidebarTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusChip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@velobitsio/ui';
import {
  BarChart3Icon,
  ClockIcon,
  FlagIcon,
  KeyIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
} from '@velobitsio/icons';

const NAV = [
  { label: 'Flags', icon: FlagIcon, active: true },
  { label: 'Environments', icon: LayersIcon, active: false },
  { label: 'Segments', icon: UsersIcon, active: false },
  { label: 'Insights', icon: BarChart3Icon, active: false },
  { label: 'API keys', icon: KeyIcon, active: false },
  { label: 'Audit log', icon: ClockIcon, active: false },
] as const;

const ROWS = [
  { key: 'new-checkout', status: 'partial' },
  { key: 'dark-mode-rollout', status: 'on' },
  { key: 'beta-search', status: 'pending' },
  { key: 'legacy-export', status: 'off' },
  { key: 'usage-quotas', status: 'on' },
] as const;

export default function AppShellDemo() {
  return (
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
            {NAV.map(({ label, icon: Icon, active }) => (
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
           * `surface="none"` — this Table is inside the shell's main region, which
           * sits over the Tier-S rail's material. Defaulting it to glass here
           * would be the nested case.
           */}
          <Table surface="none">
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((flag) => (
                <TableRow key={flag.key}>
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
  );
}
