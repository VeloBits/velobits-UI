import { blueSteps, neutral, plumSteps, roseSteps, seed, tealSteps } from './palette';

/**
 * The semantic layer: the names components actually consume, resolved per
 * theme. This object and `css/tokens.css` describe the same values , the test
 * suite parses the CSS and asserts they agree, so the two cannot drift.
 */
export interface SemanticTokens {
  /** Page background. */
  bg: string;
  /** Recessed background , table headers, inset wells, secondary surfaces. */
  bg2: string;
  /** Card / panel / popover surface. */
  panel: string;
  /** Raised above `panel`. Dark mode tints with plum, which is *lighter* than charcoal in OKLCH and so reads as elevation. */
  elevated: string;
  /** Body text. */
  fg: string;
  /** Secondary text. Meets AA against `bg` and `panel`, not against glass , use `mutedOnGlass` there. */
  mutedFg: string;
  /** Secondary text when it sits on a glass surface. */
  mutedOnGlass: string;
  /** Structural separators: table rules, card outlines, sidebar edges. Decorative, so exempt from WCAG 1.4.11. */
  border: string;
  /** The edge of an interactive control. Identifies the component, so it MUST meet 1.4.11's 3:1. */
  fieldBorder: string;
  /** Brand blue as a fill. Never as text. */
  primary: string;
  primaryHover: string;
  /** Text/icons on a `primary` fill. */
  onPrimary: string;
  /** Brand blue as text: links, inline icons, active nav labels. */
  primaryText: string;
  /** Tinted blue wash for selected rows and soft badges. */
  primarySoft: string;
  /** Brand lime as a fill. */
  brand: string;
  /** Text/icons on a `brand` fill , charcoal, at 10.89:1. White on lime is 1.31:1 and is never correct. */
  onBrand: string;
  /**
   * Hover fill for `brand`. Exists so `Button` variant `brand` stops reaching for
   * `hover:brightness-95`, which is a filter rather than a colour and so escapes
   * the palette entirely , nothing measures it, and it composites differently
   * over a glass surface than over an opaque one.
   */
  brandHover: string;
  /** Tinted lime wash. */
  brandSoft: string;
  /** Plum text accent (light) / plum elevated tint (dark). */
  accentText: string;
  /**
   * The terminal surface: a `CodeBlock` in its `terminal` variant, which is what
   * a one-time secret is shown on.
   *
   * **Identical in both themes, deliberately.** Everything else in this object
   * flips; this pair does not, and that is the point. A revealed API key is the
   * one string in the product that must be transcribed *exactly*, and a surface
   * that changes colour with the theme changes which characters are easiest to
   * misread. Pinning it also makes the block unmistakably "not part of the page"
   * in light mode, which is the visual cue that this content is different in
   * kind.
   */
  code: string;
  /** Text on a `code` fill , 12.95:1. */
  onCode: string;
  /** Focus ring. */
  ring: string;
  /** Hover wash on an otherwise transparent control. */
  highlight: string;
  /** Modal scrim. */
  overlay: string;
  /** Semantic status colours. `*Soft` is the tinted background of the matching chip. */
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  /**
   * Text/icons on a `danger` FILL , `Button` variant `destructive`, and nothing
   * else in the system.
   *
   * ## Why this is not just `onPrimary`
   *
   * It was, and in dark mode that measured **2.45:1** and shipped.
   *
   * `--danger` serves two roles that want opposite things in dark mode. As TEXT
   * on a dark surface it has to be light, and the 2026-08-06 re-tune pushed it to
   * `#FF7F79` for exactly that reason. As a FILL under white text it then has to
   * be dark , and it is not, so white on it fails AA by a wide margin. Nothing
   * caught it because the flat pairs gate `danger` as text and the soft-chip suite
   * gates the wash; the fill-with-white-on-it combination had no pair at all.
   *
   * The resolution is the one the palette already uses for lime: flip the text
   * rather than the fill. Charcoal on `#FF7F79` is 5.80:1, so dark mode gets
   * charcoal here for the same reason {@link SemanticTokens.onBrand} is charcoal ,
   * the fill is too light in that theme for white to sit on it. Light mode keeps
   * white at 6.19:1.
   *
   * Same shape of bug as `--info`, and now gated the same way: as its own pair.
   */
  onDanger: string;
  /** Hover fill for `danger`. Replaces `hover:brightness-95` , see {@link SemanticTokens.brandHover}. */
  dangerHover: string;
  warning: string;
  warningSoft: string;
  /**
   * Informational. **Teal, not blue** , see {@link tealSteps}. It was
   * `blueSteps.text`, i.e. the same bytes as {@link SemanticTokens.primaryText},
   * which made "informational" and "this is a link" the same colour.
   */
  info: string;
  infoSoft: string;
  /**
   * A category colour with NO status reading , see {@link roseSteps}.
   *
   * For axes where the values are kinds rather than severities: a flag's value
   * type, an environment that is neither production nor staging, a resource
   * class. Everything else chromatic in this palette either means a status or
   * means the brand, so before this existed those axes had to borrow `primary`
   * and every one of them came out blue.
   */
  rose: string;
  roseSoft: string;
  /**
   * Chart series. Isoluminant by construction , every entry clears the non-text
   * floor against its theme's page, but they differ in hue rather than
   * lightness, so they are indistinguishable in greyscale. A chart using these
   * must ALSO encode series by shape, pattern or direct label; colour alone
   * fails WCAG 1.4.1 (Use of Color).
   */
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  /**
   * App chrome , the top bar surface. **The plum seed, in BOTH themes.**
   *
   * ## Why chrome is its own tier
   *
   * Before this, the header was Tier-O glass, so in light mode it was a
   * near-white bar on a near-white page: the app had no visual frame, and the
   * strip carrying the product's identity and its primary navigation looked like
   * a piece of the document. A dark bar over a light page is what separates
   * "chrome" from "content", and it is the single change that does most to make a
   * light theme read as an application rather than a web page.
   *
   * ## Why plum, and not a neutral
   *
   * The first version of this tier was `neutral-800`, and it read as near-black:
   * correct, and characterless. Plum is the palette's own answer , it is already
   * sanctioned as a dark surface (`elevated` in dark mode), its OKLCH lightness
   * (0.355) sits ABOVE charcoal's (0.288) so it is genuinely lighter than the
   * neutral it replaces, and it carries brand rather than just contrast.
   *
   * It also unlocks the pairing the neutral bar could not have:
   * {@link SemanticTokens.chromeAccent} is **lime**, and lime on plum is 8.85:1.
   * That is the VeloBits brand pair, both seeds, at high contrast, on the one
   * surface in the product whose job is to say whose product this is. The blue
   * step a grey bar needs (`blueSteps.textDark`, 4.75:1 on plum) is dimmer *and*
   * off-brand.
   *
   * ## Why theme-INVARIANT, when nothing else here is
   *
   * Every other surface flips because it has to stay legible against a page that
   * flips. Chrome does not sit against the page , it sits *above* it, and it is
   * dark in both themes, so the same value works in both:
   *
   *   light  over a `#EFEDEA` page , 196/255. Unmistakably a frame.
   *   dark   over a `#161615` page ,  67/255, reading as raised chrome. (Nearly
   *          three times the separation the neutral bar had, which is the second
   *          thing plum buys: a chromatic bar cannot be confused with the page.)
   *
   * That it equals dark mode's `elevated` is not a collision , both are "plum as
   * a dark surface", which is what the seed is for. They never abut.
   *
   * The consequence worth knowing: **none of the theme's text tokens work on it in
   * light mode.** Charcoal `fg` on plum is 1.23:1, `mutedFg` 1.84:1, `primaryText`
   * 1.87:1. Every foreground that lands on chrome needs the `chrome*` token beside
   * it, which is why this tier ships six tokens rather than one.
   */
  chrome: string;
  /** Text and icons on `chrome` , 9.80:1. Never `fg`, which is 1.23:1 there. */
  chromeFg: string;
  /**
   * Secondary text on `chrome` (inactive nav labels) , 6.50:1.
   *
   * `neutral-300`, two steps lighter than the `neutral-400` a near-black bar could
   * afford. On plum that step measures 4.58:1 flat and drops to 3.64:1 over
   * {@link SemanticTokens.chromeHighlight}, so it is not usable here at all.
   */
  chromeMutedFg: string;
  /** The bar's bottom edge , 1.84:1. Decorative, like `border`. */
  chromeBorder: string;
  /**
   * Hover wash on an otherwise transparent chrome control. `highlight` cannot be
   * reused here: it is charcoal at α 0.05, i.e. it DARKENS, and chrome is already
   * dark.
   *
   * Composites to `#663A50`, where every chrome foreground still clears AA ,
   * `chromeFg` 7.79:1, `chromeMutedFg` 5.17:1, `chromeAccent` 7.04:1. That is a
   * property of the `neutral-300` muted step and worth stating, because it is what
   * makes hover a free change here: a hovered item MAY promote its label to
   * `chromeFg`, and nothing breaks if it does not. The near-black version of this
   * tier had no such slack (muted over the wash was 4.25:1, under AA), so the
   * promotion was mandatory and the fill and text had to move together.
   */
  chromeHighlight: string;
  /**
   * The active nav item on `chrome`: this as the text, `chromeAccentSoft` as the
   * fill. **Lime** , 8.85:1 flat, 6.07:1 over its own wash, which is the pairing
   * an active item actually renders.
   *
   * Note what this is NOT. `primaryText` is the light-theme blue step and measures
   * 1.87:1 here; `blueSteps.textDark` manages 4.75:1 and is the value a grey bar
   * would have to use. Lime beats both by a wide margin on plum, and in dark mode
   * `accentText` is already lime , so this is the palette's existing
   * lime-on-a-dark-plum-surface pairing, reused rather than invented.
   */
  chromeAccent: string;
  /** The active nav item's fill , see {@link SemanticTokens.chromeAccent}. */
  chromeAccentSoft: string;
}

export const light: SemanticTokens = {
  bg: seed.paper,
  // neutral-200, NOT neutral-100 , and this is the light theme's second
  // structural fix after the ramp itself.
  //
  // At neutral-100 this token measured **2/255** from the page. `--bg2` is the
  // recessed surface: a table header, an inset well, `Button variant="secondary"`,
  // and everything shadcn's `--color-muted`/`--color-secondary` paints. All of
  // them were invisible against the page, so a table header read as body rows and
  // a secondary button read as a ghost one. Nothing caught it for the same reason
  // the invisible glass tier went unnoticed for a release , a surface that is the
  // same colour as its backdrop has *better* text contrast, not worse.
  //
  // One step down is 14/255 from the page and 30/255 from `--panel`: a real
  // recess in both directions. It costs one thing, and `neutral[600]` pays it ,
  // muted text on this surface is 4.44:1 at the old L, so the ramp step moved.
  bg2: neutral[200],
  panel: '#FFFFFF',
  elevated: '#FFFFFF',
  fg: seed.charcoal,
  mutedFg: neutral[600],
  mutedOnGlass: neutral[700],
  // neutral-300, whose L dropped 0.845 → 0.815 for this token: 1.81:1 on
  // `--panel`, up from 1.60:1. A card outline and a table rule were faint enough
  // that a Card was carried by its shadow alone, which is most of what made the
  // light theme read as unfinished. Decorative, so WCAG 1.4.11 does not gate it
  // and this is purely a judgement about crispness , see `fieldBorder` below for
  // the half that IS gated.
  border: neutral[300],
  // neutral-500 is the ONLY ramp step that clears 3:1 against both this theme's
  // surfaces AND the dark theme's, which is why one value serves both. The
  // lighter neutral-400 measures 2.52:1 on white and fails.
  fieldBorder: neutral[500],
  primary: seed.blue,
  primaryHover: blueSteps.hover,
  onPrimary: '#FFFFFF',
  primaryText: blueSteps.text,
  primarySoft: 'rgba(0, 122, 204, 0.10)',
  brand: seed.lime,
  onBrand: seed.charcoal,
  // Charcoal on it measures 9.73:1, so the only sanctioned pairing on lime
  // survives the hover. One value serves both themes, like `brand` itself.
  brandHover: '#BCE52B',
  brandSoft: 'rgba(200, 241, 53, 0.18)',
  accentText: plumSteps.text,
  code: '#101828',
  onCode: '#7DF3B1',
  ring: seed.blue,
  highlight: 'rgba(42, 43, 42, 0.05)',
  overlay: 'rgba(27, 27, 26, 0.45)',
  // The status text steps are tuned against the WORST composite they sit on,
  // not against the page: a soft chip (`bg-*-soft text-*`) flattens its wash
  // over the page, and 12px chip text holds the 4.5:1 target there ,
  // the soft-chip suite in `test/contrast.test.ts`. That is why `success` is
  // #226E25 and not the flat-pair-sufficient #2B762D (4.16:1 inside the chip),
  // and the same one-step darkening applies to `danger` and `warning`. Each
  // `*Soft` wash restates its text token's rgb at a fixed alpha.
  success: '#226E25',
  successSoft: 'rgba(34, 110, 37, 0.12)',
  danger: '#B82A24',
  dangerSoft: 'rgba(184, 42, 36, 0.10)',
  // White, 6.19:1. Light mode's danger fill is dark enough for it , dark mode's
  // is not, which is the whole reason this token exists.
  onDanger: '#FFFFFF',
  dangerHover: '#9E231E',
  // An amber, at last. `#855600` is hue 72.7° at chroma 0.105, which is not a
  // warning colour , it is **olive-brown**, and a brown chip beside a red one
  // reads as "old" rather than as "caution". This is hue 62° at chroma 0.132: the
  // same lightness band as every other status token, more chroma, rotated toward
  // orange. It measures BETTER than the value it replaces inside its own chip
  // (4.72:1 against 4.58:1) because the extra chroma buys more separation from
  // the wash than the hue rotation costs.
  //
  // Still ΔE 0.088 from `danger` in OKLab, so "caution" and "destructive" remain
  // distinguishable , the constraint that keeps this from going further orange.
  warning: '#954800',
  warningSoft: 'rgba(149, 72, 0, 0.12)',
  // Teal, not blue , this used to be `blueSteps.text`, the same bytes as
  // `primaryText`. 5.04:1 inside its own chip on the page.
  info: tealSteps.text,
  infoSoft: 'rgba(37, 98, 98, 0.12)',
  rose: roseSteps.text,
  roseSoft: 'rgba(155, 62, 107, 0.12)',
  chart1: '#1D82D2',
  chart2: '#6F8714',
  chart3: '#BC5F8D',
  chart4: '#AF7011',
  chart5: '#368A8A',
  // The chrome tier. EVERY value is an existing palette entry doing a second job:
  // the plum seed, the lime seed, three ramp steps. A branded dark bar needs no
  // new colours , it needs the two seeds the palette already reserves for dark
  // surfaces and dark-surface accents. Restated identically in the dark block
  // below rather than inherited; see `code`/`onCode` for the same discipline.
  chrome: seed.plum,
  chromeFg: neutral[100],
  chromeMutedFg: neutral[300],
  chromeBorder: neutral[600],
  chromeHighlight: 'rgba(255, 255, 255, 0.08)',
  chromeAccent: seed.lime,
  chromeAccentSoft: 'rgba(200, 241, 53, 0.16)',
};

export const dark: SemanticTokens = {
  // neutral-925 exists for this token, the same way 750 exists for the dark
  // border. A tier-S surface must clear 8/255 from the page AND from `panel`,
  // so the page↔panel distance is its whole budget; with the page at 900 that
  // was 18/255 and the glass was pinned at 9/255 either side. `panel` cannot
  // move up to widen it (at #2E2F2E the gated `primary fill vs panel` pair
  // falls to 2.98:1), so the page moved down , the free direction, since every
  // dark pair measured against the page is light-on-dark and only improves.
  bg: neutral[925],
  bg2: neutral[800],
  panel: neutral[800],
  // Plum, not a lighter grey: its OKLCH lightness (0.355) is above charcoal's
  // (0.288), so it reads as elevation while staying unmistakably branded.
  elevated: seed.plum,
  fg: neutral[100],
  mutedFg: neutral[400],
  mutedOnGlass: neutral[200],
  // neutral-750 exists for this token. The value inherited from the dashboard
  // app (#2E2E2E) was tuned against its darker #252526 panel; against this
  // palette's #2C2D2C it lands at 1.02:1 , an invisible border.
  border: neutral[750],
  fieldBorder: neutral[500],
  primary: seed.blue,
  primaryHover: blueSteps.hoverDark,
  onPrimary: '#FFFFFF',
  primaryText: blueSteps.textDark,
  primarySoft: 'rgba(0, 122, 204, 0.22)',
  brand: seed.lime,
  onBrand: seed.charcoal,
  brandHover: '#BCE52B',
  brandSoft: 'rgba(200, 241, 53, 0.16)',
  // Lime IS a valid text accent in dark mode (13.24:1 on the page). In light
  // mode the same token as text measures 1.13:1 , hence the asymmetry.
  accentText: seed.lime,
  // Same values as light , see the docblock on `code`. Restated rather than
  // omitted: a token declared only for light inherits the light value into dark,
  // which works by accident here and would stop working the day someone edits
  // one half. The CSS parity test requires both blocks to declare it anyway.
  code: '#101828',
  onCode: '#7DF3B1',
  ring: blueSteps.ringDark,
  highlight: 'rgba(238, 236, 233, 0.06)',
  overlay: 'rgba(15, 15, 14, 0.60)',
  // The four status washes run THINNER than light mode's story would suggest
  // (0.12, down from 0.16): in dark mode a wash LIGHTENS its backdrop, and the
  // soft-chip composite over the panel is where these pairs bottom out , the
  // soft-chip suite in `test/contrast.test.ts`. `danger` moved lighter than the
  // inherited #F1706B for the same reason (3.77:1 inside the chip on the
  // panel); `success` and `warning` cleared the gate on the thinner wash alone.
  success: '#7FB86B',
  successSoft: 'rgba(127, 184, 107, 0.12)',
  danger: '#FF7F79',
  dangerSoft: 'rgba(255, 127, 121, 0.12)',
  // CHARCOAL, not white. White on this fill is 2.45:1 and is what shipped;
  // charcoal is 5.80:1. Dark mode's danger is a light red because it also has to
  // work as text on a dark surface , see the docblock on `onDanger`.
  onDanger: seed.charcoal,
  // Lighter, not darker: dark-mode hovers move up (like `primaryHover`), and
  // lifting this raises charcoal's contrast on it from 5.80:1 to 6.98:1.
  dangerHover: '#FF9A95',
  warning: '#E0C060',
  warningSoft: 'rgba(224, 192, 96, 0.12)',
  // Teal, not blue , see the light block. 4.94:1 inside its own chip on the dark
  // panel, which is where every dark soft chip bottoms out.
  info: tealSteps.textDark,
  infoSoft: 'rgba(111, 186, 185, 0.12)',
  rose: roseSteps.textDark,
  roseSoft: 'rgba(218, 143, 178, 0.12)',
  // Lifted relative to light so each series clears 4.5:1 against the darker
  // page instead of resting on the 3:1 floor.
  chart1: '#2387D7',
  chart2: '#738C1B',
  chart3: '#C06492',
  chart4: '#B37519',
  chart5: '#3B8F8E',
  // Identical to light, deliberately , see the docblock on `chrome`. Chrome is
  // dark in both themes, so the tier does not flip; it is restated rather than
  // omitted so that editing one half cannot silently change the other.
  chrome: seed.plum,
  chromeFg: neutral[100],
  chromeMutedFg: neutral[300],
  chromeBorder: neutral[600],
  chromeHighlight: 'rgba(255, 255, 255, 0.08)',
  chromeAccent: seed.lime,
  chromeAccentSoft: 'rgba(200, 241, 53, 0.16)',
};

export const themes = { light, dark } as const;
export type ThemeName = keyof typeof themes;
