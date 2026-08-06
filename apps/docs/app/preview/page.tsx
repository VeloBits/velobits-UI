import { Group } from '../section';
import { PreviewThemeToggle } from './theme-toggle';
import {
  GlassSurfaceSection,
  NestedOverlaySection,
  StickyUnderBlurSection,
  TierSGridSection,
  TierSOnPageSection,
} from './glass-sections';

export const metadata = { title: 'Preview — VeloBits UI' };

/**
 * The glass verification harness. NOT documentation, and deliberately absent
 * from the site nav.
 *
 * ## What this is for, and what it deliberately is not
 *
 * It was a kitchen sink while `/components` showed 17 of the 37 — there was
 * nowhere else the whole system could be seen at once. `/components` now covers
 * all 37 correctly, so the duplicated component sections were removed rather
 * than left to drift; what remains is the part `/components` cannot carry.
 *
 * These four are DIAGNOSTICS, not demos. A 20-card grid and a scroll-jank box
 * make a page read as a test rig, which is the opposite of what a showcase is
 * for — and each exists to answer a question no ordinary demo asks:
 *
 *   Tier-S on the page   the predicted failure, isolated with nothing else in
 *                        frame: is the material visible in LIGHT mode?
 *   20-card Tier-S grid  scroll jank. It only means anything because Tier S
 *                        ships with no backdrop-filter; twenty cards must not
 *                        cost twenty blur layers.
 *   sticky under blur    does content visibly pass BEHIND a blurred bar? This
 *                        is the check that would have caught the prefix bug,
 *                        had anyone looked before 2026-08-06.
 *   Dialog + Popover     the elevated tier — the only place `.glass-elevated`
 *                        is exercised.
 *
 * Plus `GlassSurface`'s four tier swatches, as the reference against which the
 * four above are read.
 *
 * Everything here sits directly on the page background, with no frame of any
 * kind between a surface and `--bg`. That is not a style choice: it is what
 * makes a measurement taken on this page mean the same thing as the numbers in
 * `packages/tokens/test/contrast.test.ts`.
 *
 * Checklist items 1–5 in VELOBITS_UI_IMPLEMENTATION_PLAN.md run against this
 * page plus `/components` — item 1 ("every surface") belongs on `/components`,
 * which is the page that now has every surface.
 */
export default function PreviewPage() {
  return (
    <div className="space-y-16">
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Glass verification</h1>
          <p className="max-w-2xl text-muted-foreground">
            The four targets the material was measured for, plus the tier swatches they are read
            against. Scaffolding, not documentation — every component the system ships is on{' '}
            <a href="/components" className="text-link underline underline-offset-2">
              /components
            </a>
            . Check each target in BOTH themes.
          </p>
        </div>
        <PreviewThemeToggle />
      </div>

      <Group
        title="Glass verification targets"
        note="All surfaces here sit directly on the page background, with no frame in between — that is what makes a reading taken here comparable to the gated values."
      >
        <TierSOnPageSection />
        <GlassSurfaceSection />
        <TierSGridSection />
        <NestedOverlaySection />
        <StickyUnderBlurSection />
      </Group>
    </div>
  );
}
