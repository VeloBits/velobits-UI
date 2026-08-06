import { Group } from './section';
import { PreviewThemeToggle } from './theme-toggle';
import {
  AlertSection,
  AvatarSection,
  BadgeSection,
  ButtonSection,
  CardSection,
  CheckboxSection,
  FieldSection,
  InputSection,
  KbdSection,
  LabelSection,
  NativeSelectSection,
  SeparatorSection,
  SkeletonSection,
  SpinnerSection,
  SwitchSection,
  TextareaSection,
  TooltipSection,
} from './tier1-sections';
import {
  GlassSurfaceSection,
  NestedOverlaySection,
  StickyUnderBlurSection,
  TierSGridSection,
  TierSOnPageSection,
} from './glass-sections';
import {
  CommandPaletteSection,
  DialogSection,
  DropdownMenuSection,
  PopoverSection,
  SidePanelSection,
  ToastSection,
} from './overlay-sections';
import {
  AccordionSection,
  AppShellSection,
  BreadcrumbSection,
  CodeBlockSection,
  DataTableSection,
  DiffViewerSection,
  EmptyStateSection,
  PaginationSection,
  SegmentedControlSection,
  StatusChipSection,
  TableSection,
  TabsSection,
} from './composite-sections';
import { FormSection } from './form-section';

export const metadata = { title: 'Preview — VeloBits UI' };

/**
 * Kitchen-sink preview: every component the system ships, each in a labelled
 * section, so the browser verification checklist can run against one page.
 * Scaffolding only — the per-component MDX docs are deliberately deferred.
 */
export default function PreviewPage() {
  return (
    <div className="space-y-16">
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Preview</h1>
          <p className="max-w-2xl text-muted-foreground">
            Every component, one page. Sections are grouped by tier and labelled with the component
            name. Check each glass target in BOTH themes.
          </p>
        </div>
        <PreviewThemeToggle />
      </div>

      <Group
        title="Glass verification targets"
        note="The checks the material was measured for. All surfaces here sit directly on the page background."
      >
        <TierSOnPageSection />
        <GlassSurfaceSection />
        <TierSGridSection />
        <NestedOverlaySection />
        <StickyUnderBlurSection />
      </Group>

      <Group title="Tier 1 — primitives">
        <AlertSection />
        <AvatarSection />
        <BadgeSection />
        <ButtonSection />
        <CardSection />
        <CheckboxSection />
        <FieldSection />
        <InputSection />
        <KbdSection />
        <LabelSection />
        <NativeSelectSection />
        <SeparatorSection />
        <SkeletonSection />
        <SpinnerSection />
        <SwitchSection />
        <TextareaSection />
        <TooltipSection />
      </Group>

      <Group title="Tier 2 — overlays" note="Every overlay opens from a real trigger.">
        <DialogSection />
        <SidePanelSection />
        <PopoverSection />
        <DropdownMenuSection />
        <ToastSection />
        <CommandPaletteSection />
      </Group>

      <Group title="Tier 3 — composites">
        <AccordionSection />
        <AppShellSection />
        <BreadcrumbSection />
        <CodeBlockSection />
        <DataTableSection />
        <DiffViewerSection />
        <EmptyStateSection />
        <FormSection />
        <PaginationSection />
        <SegmentedControlSection />
        <StatusChipSection />
        <TableSection />
        <TabsSection />
      </Group>
    </div>
  );
}
