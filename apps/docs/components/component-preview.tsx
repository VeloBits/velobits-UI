'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@velobits-dev/ui';

import { examples } from '@/lib/generated/examples';

import { CodePanel } from './code-panel';

/**
 * A live example and its source, in two tabs.
 *
 * ── WHY THE PREVIEW FRAME HAS NO BACKGROUND ────────────────────────────────
 *
 * The obvious frame for a demo is an opaque panel, and it is wrong for this
 * system. `--panel` is not neutral chrome here: it is a fill that components
 * paint on THEMSELVES. Measured across the library —
 *
 *   bg-panel  Input · Textarea · NativeSelect · Checkbox · Button "secondary" ·
 *             the Switch thumb · the DiffViewer container
 *   bg-bg2    Badge "neutral" · Kbd · TabsList · SegmentedControl track ·
 *             AvatarFallback · CodeBlock "panel"  — and in DARK MODE
 *             `--bg2` IS `--panel` (both #2c2d2c)
 *
 * Measured as max-channel distance from the frame the component sits on:
 *
 *                        on the `--bg` canvas      on a `bg-panel` frame
 *   bg-panel fills       21 light · 23 dark        0 · 0        ← dead, both
 *   bg-bg2 fills          2 light · 23 dark       23 · 0        ← dead in dark
 *   Tier-S composite     11 light · 12 dark        7 · 8
 *
 * The `bg-panel` row is the decisive one: an Input on a panel frame survives on
 * `border-input` alone, in both themes. Tier S is not killed outright at 7/8, but
 * it has lost a third of its separation — and `#fffbf8` is no longer the
 * composite anything measured. `contrast.test.ts` gates the values over `--bg`.
 * Show the material anywhere else and these pages stop corroborating the gate,
 * which is most of what they are for.
 *
 * `--bg` is the one value in the ramp that NO component paints as its own fill,
 * so it is the only backdrop that can never collide. Hence: no background, a
 * dashed hairline to say "boundary, not surface", and the page shows through.
 *
 * And never glass. A glass frame would arguably be the most honest backdrop for
 * a Button, whose real home is a Card — but the moment anyone drops a Card into
 * that demo it is nested glass, both layers ~2/255 apart, both gone. A rule that
 * holds only while nobody adds a Card to a demo is not a rule.
 */
export function ComponentPreview({
  name,
  /** Vertically centre the demo. Off for anything that supplies its own layout. */
  center = true,
}: {
  name: string;
  center?: boolean;
}) {
  const example = examples[name];

  if (!example) {
    /*
     * Unreachable in a successful build — `build-docs-data.ts` fails when a
     * content entry names an example that does not exist. It is here because the
     * alternative to a visible message is a blank rectangle, and a blank
     * rectangle in a docs site reads as a broken component rather than a broken
     * reference.
     */
    return (
      <p className="my-4 rounded-lg border border-dashed border-danger p-4 text-sm text-danger">
        No example named <code>{name}</code>.
      </p>
    );
  }

  const { Component, source, html } = example;

  return (
    <Tabs defaultValue="preview" className="my-6">
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="pt-3">
        <div
          className={[
            'rounded-xl border border-dashed border-border p-6',
            center ? 'flex min-h-[22rem] items-center justify-center' : '',
          ].join(' ')}
        >
          <div className={center ? 'w-full max-w-full' : undefined}>
            <Component />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="code" className="pt-3">
        <CodePanel html={html} source={source} label={name} maxHeight="34rem" />
      </TabsContent>
    </Tabs>
  );
}
