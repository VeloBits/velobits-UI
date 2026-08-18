import {
  CONTRAST_EXEMPT,
  CONTRAST_PAIRS,
  contrastRatio,
  dark,
  GLASS_ALPHA_FLOOR,
  GLASS_OVERLAY_PAIRS,
  GLASS_SPECULAR_ALPHA,
  GLASS_SURFACE_PAIRS,
  glass,
  hexToRgb,
  light,
  neutral,
  PERCEPTIBILITY_FLOOR,
  resolveGlassOverlay,
  resolveGlassSurface,
  resolvePair,
  resolveSoftChip,
  round2,
  SCALES,
  seed,
  SOFT_CHIP_PAIRS,
  TARGET,
  type SemanticTokens,
} from '@velobitsio/tokens';
import type { Metadata } from 'next';

import { Badge } from '@velobitsio/ui';

import { DocsToc, type TocEntry } from '@/components/docs-toc';

export const metadata: Metadata = {
  title: 'Colors',
  description:
    'Every semantic token, its contrast gate, and the glass composites , computed from @velobitsio/tokens at build time.',
};

/**
 * Ids are written here rather than slugified from the headings, because several
 * headings carry a computed count ("Measured pairs (43)") and a slug derived
 * from one would change the moment a pair was added , silently breaking every
 * link anyone had saved to it.
 */
const TOC: TocEntry[] = [
  { id: 'seeds', title: 'Seeds', level: 2 },
  { id: 'neutrals', title: 'Warm neutral ramp', level: 2 },
  { id: 'semantic', title: 'Semantic tokens', level: 2 },
  { id: 'exemptions', title: 'Contrast exemptions', level: 2 },
  { id: 'glass', title: 'Glass', level: 2 },
  { id: 'scales', title: 'Scales', level: 2 },
  { id: 'measured-pairs', title: 'Measured pairs', level: 2 },
  { id: 'soft-chips', title: 'Soft-chip composites', level: 2 },
  { id: 'perceptibility', title: 'Glass perceptibility', level: 2 },
];

/**
 * Every value on this page is read from `@velobitsio/tokens` at build time.
 * Nothing is transcribed, and , this is the part that was wrong before , nothing
 * is *enumerated by hand* either.
 *
 * The previous version rendered the seeds and the neutral ramp with
 * `Object.entries`, which self-extend, but listed the contrast table as an
 * eight-entry literal. So it claimed it "cannot drift from the palette" while
 * showing 8 of the 43 gated pairs, and none of the 36 semantic tokens the
 * components actually consume. Adding a pair to the gate changed nothing here.
 *
 * The rule now: if a section shows tokens, it maps over the exported registry.
 * A new token or a new pair appears on this page without anyone editing it.
 */

/* ── primitives ───────────────────────────────────────────────────────────── */

const isOpaqueHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function Swatch({ hex, name }: { hex: string; name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-9 shrink-0 rounded-md border border-border"
        style={{ background: hex }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="font-mono text-xs text-muted-foreground">{hex}</div>
      </div>
      {!isOpaqueHex(hex) && <Badge variant="outline">α</Badge>}
    </div>
  );
}

/**
 * A checkerboard sits under translucent values, so an α token reads as
 * translucent rather than as whatever the page happens to be.
 */
function Chip({ value }: { value: string }) {
  return (
    <span
      className="inline-block size-6 shrink-0 rounded border border-border align-middle"
      style={{
        backgroundImage: `linear-gradient(${value}, ${value}), conic-gradient(#0002 25%, #0000 0 50%, #0002 0 75%, #0000 0)`,
        backgroundSize: 'auto, 8px 8px',
      }}
      aria-hidden
    />
  );
}

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      {/* `scroll-mt-24` clears the sticky header, and matches the fold line the
          table of contents uses to decide which entry is current. */}
      <h2 id={id} className="mb-1 scroll-mt-24 text-xl font-semibold">
        {title}
      </h2>
      {intro && <div className="mb-4 max-w-3xl text-sm text-muted-foreground">{intro}</div>}
      {children}
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-border px-3 py-2 text-start font-medium">{children}</th>;
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td className="border-b border-border px-3 py-2 align-middle">{children}</td>;
}

function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h, i) => (
              <Th key={i}>{h}</Th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Ratio({ value, target }: { value: number; target: number }) {
  return <Badge variant={value >= target ? 'success' : 'danger'}>{value}:1</Badge>;
}

/** Max per-channel distance in 8-bit sRGB , the unit the perceptibility gate uses. */
function channelDistance(a: string, b: string) {
  // `Rgb` is a fixed 3-tuple, so destructuring keeps this honest under
  // `noUncheckedIndexedAccess` , indexing it would need a non-null assertion.
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return Math.max(Math.abs(ar - br), Math.abs(ag - bg), Math.abs(ab - bb));
}

/* ── which semantic tokens are gated, derived rather than asserted ────────── */

const GATED = new Set<string>();
for (const p of CONTRAST_PAIRS) {
  GATED.add(p.fg);
  GATED.add(p.bg);
}
for (const p of SOFT_CHIP_PAIRS) {
  GATED.add(p.fg);
  GATED.add(p.wash);
}

const SEMANTIC_KEYS = Object.keys(light) as (keyof SemanticTokens)[];

export default function ColorsPage() {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-10">
      <main id="main" className="min-w-0 space-y-14 py-8 pb-24">
        <section>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Colors</h1>
          <p className="max-w-3xl text-muted-foreground">
            Every value below is read from <code>@velobitsio/tokens</code> at build time and mapped
            from the exported registries, so a token added to the package appears here without
            anyone editing this page.
          </p>
        </section>

        <Section
          id="seeds"
          title="Seeds"
          intro="The five source colours. Everything else is derived from these or measured against them."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(seed).map(([name, hex]) => (
              <Swatch key={name} name={name} hex={hex} />
            ))}
          </div>
        </Section>

        <Section
          id="neutrals"
          title="Warm neutral ramp"
          intro={
            <>
              Generated by holding cream&apos;s hue and decaying chroma toward the dark end, so a
              grey beside the brand cream never reads cold. <code>750</code> exists solely so the
              dark-mode border sits above <code>--panel</code>; <code>925</code> is the dark page,
              dropped one step during the glass re-tune to widen the Tier-S perceptibility budget.
            </>
          }
        >
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(neutral).map(([step, hex]) => (
              <Swatch key={step} name={`neutral-${step}`} hex={hex} />
            ))}
          </div>
        </Section>

        <Section
          id="semantic"
          title={`Semantic tokens (${SEMANTIC_KEYS.length})`}
          intro={
            <>
              The names components actually consume, resolved per theme. These and{' '}
              <code>css/tokens.css</code> describe the same values , the suite parses the CSS and
              asserts they agree, so the two cannot drift. <strong>Gated</strong> means the token
              appears in at least one contrast pair; <strong>exempt</strong> means it is
              deliberately excluded, with the reason recorded in the package and repeated below.
            </>
          }
        >
          <Table head={['Token', 'Light', 'Dark', 'Contrast']}>
            {SEMANTIC_KEYS.map((key) => {
              const exemptReason = CONTRAST_EXEMPT[key];
              return (
                <tr key={key}>
                  <Td>
                    <code className="text-xs">{key}</code>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Chip value={light[key]} />
                      <span className="font-mono text-xs text-muted-foreground">{light[key]}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Chip value={dark[key]} />
                      <span className="font-mono text-xs text-muted-foreground">{dark[key]}</span>
                    </div>
                  </Td>
                  <Td>
                    {GATED.has(key) ? (
                      <Badge variant="success">gated</Badge>
                    ) : exemptReason ? (
                      <Badge variant="neutral" title={exemptReason}>
                        exempt
                      </Badge>
                    ) : (
                      <Badge variant="danger">ungated</Badge>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Section>

        <Section
          id="exemptions"
          title="Contrast exemptions"
          intro="Each of these is excluded from the flat-pair gate on purpose. The reason ships with the package, so an exemption can never become a silent omission."
        >
          <Table head={['Token', 'Why it is exempt']}>
            {Object.entries(CONTRAST_EXEMPT).map(([token, reason]) => (
              <tr key={token}>
                <Td>
                  <code className="text-xs">{token}</code>
                </Td>
                <Td>
                  <span className="text-muted-foreground">{reason}</span>
                </Td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section
          id="glass"
          title="Glass"
          intro={
            <>
              Two tiers, and they are not the same material. <strong>Tier O</strong> (
              <code>light</code>, <code>dark</code>, <code>darkElevated</code>) floats over
              arbitrary content and is measured against all seven worst-case backdrops.{' '}
              <strong>Tier S</strong> (<code>surfaceLight</code>, <code>surfaceDark</code>) sits on
              the page, so it is measured against exactly one thing and carries no{' '}
              <code>backdrop-filter</code> by default. Alpha floor <code>{GLASS_ALPHA_FLOOR}</code>,
              specular alpha <code>{GLASS_SPECULAR_ALPHA}</code>.
            </>
          }
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(glass).map(([tier, values]) => (
              <div key={tier} className="rounded-xl border border-dashed border-border p-4">
                <div className="mb-3 font-medium">
                  <code className="text-sm">{tier}</code>
                </div>
                <dl className="space-y-1.5">
                  {Object.entries(values).map(([prop, value]) => (
                    <div key={prop} className="flex items-center gap-2 text-sm">
                      <dt className="w-24 shrink-0 text-muted-foreground">{prop}</dt>
                      <dd className="flex min-w-0 items-center gap-2">
                        {typeof value === 'string' && !value.endsWith('px') && (
                          <Chip value={value} />
                        )}
                        <span className="truncate font-mono text-xs">{String(value)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Section>

        <Section
          id="scales"
          title="Scales"
          intro="Non-colour tokens. Motion durations and easings are the ones most often re-invented at a call site, which is why they are named rather than inlined."
        >
          <div className="grid gap-8 lg:grid-cols-2">
            {Object.entries(SCALES).map(([name, scale]) => (
              <ScaleTable key={name} title={scaleLabel(name)} entries={Object.entries(scale)} />
            ))}
          </div>
        </Section>

        <Section
          id="measured-pairs"
          title={`Measured pairs (${CONTRAST_PAIRS.length})`}
          intro={
            <>
              The full flat-pair registry, not a selection , every ratio is computed here by the
              same functions the gate uses. A pair scoped to one theme prints <code>,</code> in the
              other.
            </>
          }
        >
          <Table head={['Pair', 'Target', 'Light', 'Dark']}>
            {CONTRAST_PAIRS.map((pair) => {
              const l = resolvePair(pair, 'light');
              const d = resolvePair(pair, 'dark');
              const target = (l ?? d)!.target;
              return (
                <tr key={pair.label}>
                  <Td>
                    {pair.label}
                    {pair.note && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{pair.note}</div>
                    )}
                  </Td>
                  <Td>
                    <span className="text-muted-foreground">≥{target}:1</span>
                  </Td>
                  <Td>
                    {l ? (
                      <Ratio value={round2(contrastRatio(l.fg, l.bg))} target={l.target} />
                    ) : (
                      <span className="text-muted-foreground">,</span>
                    )}
                  </Td>
                  <Td>
                    {d ? (
                      <Ratio value={round2(contrastRatio(d.fg, d.bg))} target={d.target} />
                    ) : (
                      <span className="text-muted-foreground">,</span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Section>

        <Section
          id="soft-chips"
          title={`Soft-chip composites (${SOFT_CHIP_PAIRS.length} × 3 backdrops × 2 themes)`}
          intro={
            <>
              A chip is never seen against the colour it is declared with. Each wash is flattened
              over the page, the panel and the Tier-S glass composite, and the text measured on the
              result , which is the gate a flat pair cannot express.
            </>
          }
        >
          <Table head={['Chip', 'Theme', 'Backdrop', 'Composite', 'Ratio']}>
            {SOFT_CHIP_PAIRS.flatMap((pair) =>
              (['light', 'dark'] as const).flatMap((theme) => {
                const resolved = resolveSoftChip(pair, theme);
                return resolved.backdrops.map((backdrop) => (
                  <tr key={`${pair.label}-${theme}-${backdrop.name}`}>
                    <Td>{pair.label}</Td>
                    <Td>
                      <span className="text-muted-foreground">{theme}</span>
                    </Td>
                    <Td>
                      <span className="text-muted-foreground">{backdrop.name}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Chip value={backdrop.composite} />
                        <span className="font-mono text-xs text-muted-foreground">
                          {backdrop.composite}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <Ratio
                        value={round2(contrastRatio(resolved.fg, backdrop.composite))}
                        target={TARGET.text}
                      />
                    </Td>
                  </tr>
                ));
              }),
            )}
          </Table>
        </Section>

        <Section
          id="perceptibility"
          title="Glass perceptibility"
          intro={
            <>
              Translucency is worthless if the result is the colour underneath it. Every tier must
              clear <strong>{PERCEPTIBILITY_FLOOR}/255</strong> max-channel distance from what it
              sits on , Tier S from both the page and the opaque panel, since it has to read as
              raised without becoming the panel. This gate is what caught a dark overlay that
              composited to byte-identical with the page.
            </>
          }
        >
          <Table head={['Surface', 'Composite', 'vs page', 'vs panel', 'Body text']}>
            {/*
             * One row PER SHEEN STOP, not per tier. Tier S paints a two-stop
             * gradient, and the far stop is the one that approaches a wall , light's
             * bottom sits on the floor exactly. A table showing one composite per
             * tier would be showing the safe half.
             */}
            {GLASS_SURFACE_PAIRS.flatMap((pair) => {
              const r = resolveGlassSurface(pair);
              return r.stops.map(({ name, composite }) => {
                const vsBg = channelDistance(composite, r.bg);
                const vsPanel = channelDistance(composite, r.panel);
                return (
                  <tr key={`${pair.label} ${name}`}>
                    <Td>
                      {pair.label} <span className="text-muted-foreground">· {name} stop</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Chip value={composite} />
                        <span className="font-mono text-xs text-muted-foreground">{composite}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={vsBg >= PERCEPTIBILITY_FLOOR ? 'success' : 'danger'}>
                        {vsBg}/255
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={vsPanel >= PERCEPTIBILITY_FLOOR ? 'success' : 'danger'}>
                        {vsPanel}/255
                      </Badge>
                    </Td>
                    <Td>
                      <Ratio value={round2(contrastRatio(r.fg, composite))} target={TARGET.text} />
                    </Td>
                  </tr>
                );
              });
            })}
            {GLASS_OVERLAY_PAIRS.map((pair) => {
              const r = resolveGlassOverlay(pair);
              const vsBg = channelDistance(r.composite, r.bg);
              return (
                <tr key={pair.label}>
                  <Td>{pair.label}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Chip value={r.composite} />
                      <span className="font-mono text-xs text-muted-foreground">{r.composite}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge variant={vsBg >= PERCEPTIBILITY_FLOOR ? 'success' : 'danger'}>
                      {vsBg}/255
                    </Badge>
                  </Td>
                  <Td>
                    <span className="text-muted-foreground">,</span>
                  </Td>
                  <Td>
                    <span className="text-muted-foreground">,</span>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Section>
      </main>

      <aside className="hidden xl:sticky xl:top-14 xl:block xl:h-[calc(100dvh-3.5rem)] xl:overflow-y-auto xl:py-8">
        <DocsToc entries={TOC} />
      </aside>
    </div>
  );
}

/**
 * Display names only, and every scale renders whether or not it appears here ,
 * an unlisted one just gets its key capitalised. That asymmetry is the point:
 * this map can get a label wrong, but it can never hide a scale the way the
 * nine hand-written `<ScaleTable>` calls it replaced could.
 */
const SCALE_LABELS: Record<string, string> = { zIndex: 'Z-index' };

const scaleLabel = (name: string) =>
  SCALE_LABELS[name] ?? name.charAt(0).toUpperCase() + name.slice(1);

function ScaleTable({ title, entries }: { title: string; entries: [string, string | number][] }) {
  /**
   * Derived rather than passed: the mono column is for values too long to read
   * as prose , easings, shadows, font stacks , and length is the actual reason,
   * so measuring it keeps a new long-valued scale from arriving unformatted.
   */
  const mono = entries.some(([, value]) => String(value).length > 24);

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <dl className="space-y-1">
        {entries.map(([name, value]) => (
          <div key={name} className="flex items-baseline gap-3 text-sm">
            <dt className="w-28 shrink-0">
              <code className="text-xs">{name}</code>
            </dt>
            <dd
              className={
                mono
                  ? 'min-w-0 truncate font-mono text-xs text-muted-foreground'
                  : 'font-mono text-xs text-muted-foreground'
              }
            >
              {String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
