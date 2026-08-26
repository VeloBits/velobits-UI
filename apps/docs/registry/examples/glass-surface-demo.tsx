'use client';

import { GlassSurface } from '@velobitsio/ui';

export default function GlassSurfaceDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <GlassSurface tier="surface" className="rounded-lg p-4 text-sm">
        <p className="font-medium">tier=&quot;surface&quot;</p>
        <p className="mt-1 text-muted-foreground">Tier S. Tint, edge and elevation. No blur.</p>
      </GlassSurface>
      <GlassSurface tier="surface" blur className="rounded-lg p-4 text-sm">
        <p className="font-medium">tier=&quot;surface&quot; blur</p>
        <p className="mt-1 text-muted-foreground">
          Tier S with the blur opted in. For a sticky bar, not a card grid.
        </p>
      </GlassSurface>
      <GlassSurface tier="overlay" className="rounded-lg p-4 text-sm">
        <p className="font-medium">tier=&quot;overlay&quot;</p>
        <p className="mt-1 text-muted-foreground">
          Tier O, the default. Always blurred; muted text steps up.
        </p>
      </GlassSurface>
      <GlassSurface tier="elevated" className="rounded-lg p-4 text-sm">
        <p className="font-medium">tier=&quot;elevated&quot;</p>
        <p className="mt-1 text-muted-foreground">
          Tier O stacked on Tier O. A near-black step in dark so it clears the overlay below.
        </p>
      </GlassSurface>
    </div>
  );
}
