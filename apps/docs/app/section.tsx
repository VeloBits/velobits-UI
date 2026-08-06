/**
 * Layout scaffolding shared by `/components` (the showcase) and `/preview` (the
 * glass verification harness). One copy, deliberately — the two pages have
 * different jobs but the same skeleton, and a second copy is a second thing to
 * keep in step.
 *
 * ── WHY `Demo` HAS NO BACKGROUND ────────────────────────────────────────────
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
 * `border-input` alone, in both themes, which is what the previous version of
 * `/components` shipped. Tier S is not killed outright on a panel frame, but at
 * 7/8 it has lost a third of its separation — and, more to the point, `#fffbf8`
 * is no longer the composite anything measured. `contrast.test.ts` gates
 * `#fdf8f5` / `#212221`, the values over `--bg`. Show the material anywhere else
 * and the page stops corroborating the gate, which is most of what it is for.
 *
 * `--bg` is the one value in the ramp that NO component paints as its own fill,
 * so it is the only backdrop that can never collide. Hence: no background here,
 * a dashed hairline to say "boundary, not surface", and the page shows through.
 *
 * `--highlight` was the other candidate and fails the same way — it composites
 * to #222322 in dark, 1/255 from the Tier-S dark composite #212221.
 *
 * ── AND WHY IT IS NEVER GLASS ───────────────────────────────────────────────
 *
 * A glass frame would arguably be the most honest backdrop for a Button, whose
 * real home is a Card. But the moment anyone drops a Card into that demo it is
 * nested glass — both layers ~2/255 apart, both gone. A rule that holds only
 * while nobody adds a Card to a demo is not a rule.
 */

export function Group({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-10">
      <div className="border-b border-border pb-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {note && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** A labelled block with no frame. What `/preview` uses, so nothing sits between a surface and the page. */
export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {note && <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * A labelled block inside a demo canvas. What `/components` uses. See the
 * docblock above for why the canvas is transparent.
 */
export function Demo({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <Section title={title} note={note}>
      <div className="rounded-xl border border-dashed border-border p-6">{children}</div>
    </Section>
  );
}

/** A wrapping flex row for inline-sized demos. */
export function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
