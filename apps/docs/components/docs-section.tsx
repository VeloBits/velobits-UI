/**
 * Section scaffolding for the two pages that are neither prose nor a component
 * page , `/docs/colors` and `/docs/icons`. Both enumerate a package rather than
 * listing entries by hand, so what they need is headings and a frame, not a
 * layout engine.
 *
 * The frame is a dashed hairline on the page background and never a panel or a
 * glass surface. See the docblock on `component-preview.tsx` for the measurements:
 * `--bg` is the one value in the ramp that no component paints as its own fill,
 * so it is the only backdrop a swatch can never collide with.
 */

export function Group({
  title,
  note,
  children,
  id,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-2">
        <h2 id={id} className="scroll-mt-24 text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {note && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** A labelled block, for a demo that supplies its own container. */
export function Section({
  title,
  note,
  children,
  id,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 id={id} className="scroll-mt-24 text-lg font-semibold">
          {title}
        </h3>
        {note && <p className="mt-0.5 max-w-3xl text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** A labelled block inside a frame. */
export function Demo({
  title,
  note,
  children,
  id,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <Section title={title} note={note} id={id}>
      <div className="rounded-xl border border-dashed border-border p-6">{children}</div>
    </Section>
  );
}

/** A wrapping flex row for inline-sized content. */
export function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
