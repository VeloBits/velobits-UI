import { Group } from '../section';
import {
  AlertDemo,
  AvatarDemo,
  BadgeDemo,
  ButtonDemo,
  CardDemo,
  CheckboxDemo,
  FieldDemo,
  GlassSurfaceDemo,
  InputDemo,
  KbdDemo,
  LabelDemo,
  NativeSelectDemo,
  SeparatorDemo,
  SkeletonDemo,
  SpinnerDemo,
  SwitchDemo,
  TextareaDemo,
  TooltipDemo,
} from './tier1-sections';
import {
  CommandPaletteDemo,
  DialogDemo,
  DropdownMenuDemo,
  PopoverDemo,
  SidePanelDemo,
  ToastDemo,
} from './overlay-sections';
import {
  AccordionDemo,
  AppShellDemo,
  BreadcrumbDemo,
  CodeBlockDemo,
  DataTableDemo,
  DiffViewerDemo,
  EmptyStateDemo,
  PaginationDemo,
  SegmentedControlDemo,
  StatusChipDemo,
  TableDemo,
  TabsDemo,
} from './composite-sections';
import { FormDemo } from './form-section';
import { RtlDemo } from './rtl-section';

export const metadata = { title: 'Components — VeloBits UI' };

/**
 * The showcase: all 37 components the system ships, grouped by tier.
 *
 * ## Why every demo sits on a transparent canvas
 *
 * See the docblock on `app/section.tsx`. Short version: `--panel` is not neutral
 * chrome, it is a fill components paint on themselves — an Input on a `bg-panel`
 * frame is 0/255 against its own backdrop in both themes, and a Tier-S surface
 * re-composited over `--panel` is no longer the composite `contrast.test.ts`
 * gates. `--bg` is the one value in the ramp no component uses as a fill, so it
 * is the only frame that can never collide.
 *
 * ## Blur budget — 5 live layers at rest, against a documented cap of ~6
 *
 *   1  SiteHeader (`.glass`, sticky)
 *   3  GlassSurfaceDemo — tier="surface" blur · tier="overlay" · tier="elevated"
 *   1  AppShellDemo's AppShellHeader (`.glass`)
 *
 * All six Tier-2 overlays are closed at rest and cost nothing until opened.
 * Card, Table, Accordion and EmptyState never blur in any `surface` mode. Adding
 * anything here that blurs means removing one of the five.
 *
 * ## Not here, deliberately
 *
 * Per-component MDX pages (Open Decision 5, deferred), and the glass TORTURE
 * targets — the 20-card grid, the sticky-under-blur scroll box, the nested
 * Dialog+Popover. Those are diagnostics, not demos, and they live on `/preview`,
 * which is the surface the verification checklist runs against.
 */
export default function ComponentsPage() {
  return (
    <div className="space-y-16">
      <div className="mt-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">Components</h1>
        <p className="max-w-3xl text-muted-foreground">
          All 37, grouped by tier. Every demo sits directly on the page background — the backdrop
          the glass material is measured against — so what you see here is what the gate asserts.
          Toggle the theme in the header and nothing below should carry a stale colour.
        </p>
      </div>

      <Group
        title="Tier 1 — primitives"
        note="Eighteen components, one job each, mostly stateless. Ordered material-first: GlassSurface, Card and Alert are what the system looks like; the controls follow."
      >
        <GlassSurfaceDemo />
        <CardDemo />
        <AlertDemo />
        <ButtonDemo />
        <BadgeDemo />
        <InputDemo />
        <TextareaDemo />
        <NativeSelectDemo />
        <CheckboxDemo />
        <SwitchDemo />
        <LabelDemo />
        <FieldDemo />
        <AvatarDemo />
        <KbdDemo />
        <SeparatorDemo />
        <SkeletonDemo />
        <SpinnerDemo />
        <TooltipDemo />
      </Group>

      <Group
        title="Tier 2 — overlays"
        note="Six components that float above the page on Tier-O glass, each managing focus. Every one opens from a real trigger — a still of an overlay proves nothing about focus, Escape or the material, which is the entire content of this tier."
      >
        <DialogDemo />
        <SidePanelDemo />
        <PopoverDemo />
        <DropdownMenuDemo />
        <ToastDemo />
        <CommandPaletteDemo />
      </Group>

      <Group
        title="Tier 3 — composites"
        note="Thirteen components assembled from the tiers below, each encoding one opinionated workflow. Product-shaped demos first."
      >
        <AppShellDemo />
        <DataTableDemo />
        <TableDemo />
        <FormDemo />
        <AccordionDemo />
        <TabsDemo />
        <SegmentedControlDemo />
        <StatusChipDemo />
        <EmptyStateDemo />
        <PaginationDemo />
        <BreadcrumbDemo />
        <CodeBlockDemo />
        <DiffViewerDemo />
      </Group>

      <Group
        title="Right-to-left"
        note="Not a tier — a property every component above already has, because the system uses logical properties throughout."
      >
        <RtlDemo />
      </Group>
    </div>
  );
}
