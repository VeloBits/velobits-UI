'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  GlassSurface,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@velobits-dev/ui';

import { Row, Section } from './section';

export function GlassSurfaceSection() {
  return (
    <Section
      title="GlassSurface"
      note="The generic primitive, one swatch per tier, directly on the page."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassSurface tier="surface" className="rounded-lg p-4 text-sm">
          tier=&quot;surface&quot; — Tier S, no blur
        </GlassSurface>
        <GlassSurface tier="surface" blur className="rounded-lg p-4 text-sm">
          tier=&quot;surface&quot; blur — Tier S, opted in
        </GlassSurface>
        <GlassSurface tier="overlay" className="rounded-lg p-4 text-sm">
          tier=&quot;overlay&quot; — Tier O
        </GlassSurface>
        <GlassSurface tier="elevated" className="rounded-lg p-4 text-sm">
          tier=&quot;elevated&quot; — Tier O on Tier O
        </GlassSurface>
      </div>
    </Section>
  );
}

export function TierSOnPageSection() {
  return (
    <Section
      title="Glass check: Tier S on the page background"
      note="Checklist target — the glass material must be visible in LIGHT mode against the plain page."
    >
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Production</CardTitle>
          <CardDescription>12 flags enabled · last deploy 4 minutes ago</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This card is the archetypal Tier-S surface. No bg-*, shadow-* or border-* utilities
          anywhere near it.
        </CardContent>
      </Card>
    </Section>
  );
}

export function TierSGridSection() {
  return (
    <Section
      title="Glass check: 20-card Tier-S grid"
      note="Checklist target — scroll this region and watch for jank. Tier S ships without backdrop-filter precisely so this grid is safe."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 20 }, (_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Card {i + 1}</CardTitle>
              <CardDescription>Tier-S surface</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Twenty of these must not cost twenty blur layers.
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function NestedOverlaySection() {
  return (
    <Section
      title="Glass check: Dialog containing a Popover"
      note="Checklist target — Tier O under the elevated tier. The popover must stay legible over the dialog's glass."
    >
      <Row>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Open dialog with popover</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nested overlay check</DialogTitle>
              <DialogDescription>
                This dialog is Tier-O glass. The popover below opens on the elevated tier.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary">Open popover (elevated)</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Elevated glass</PopoverTitle>
                    <PopoverDescription>
                      .glass + .glass-elevated — higher alpha, plum-tinted in dark mode, so it does
                      not vanish into the dialog beneath it.
                    </PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Row>
    </Section>
  );
}

export function StickyUnderBlurSection() {
  return (
    <Section
      title="Glass check: sticky element under blur"
      note="Checklist target — scroll the box; rows must pass visibly behind the blurred sticky bar."
    >
      <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
        {/*
         * Same recipe as the AppShellHeader / site header: Tier-O glass, sticky,
         * with only the hidden border edges zeroed — a documented-safe width
         * override, not a colour one.
         */}
        <GlassSurface
          tier="overlay"
          className="sticky top-0 z-sticky flex items-center gap-2 border-x-0 border-t-0 px-4 py-2 text-sm font-medium"
        >
          Sticky glass bar (Tier O, always blurred)
          <Badge variant="info">blur</Badge>
        </GlassSurface>
        <ul className="space-y-2 p-4">
          {Array.from({ length: 30 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <Badge variant={(['success', 'danger', 'warning', 'info'] as const)[i % 4]}>
                row {i + 1}
              </Badge>
              <span className="text-muted-foreground">
                Content that scrolls behind the blurred bar above.
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
