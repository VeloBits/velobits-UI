import { createIcon } from './create-icon';

/**
 * The unified VeloBits icon set: 201 stroke icons on a 24×24 grid.
 *
 * Merged from the two hand-drawn sets that had diverged across the workspace:
 * the dashboard app's own `src/ui/icons.tsx` (52) and the editor app's
 * `@velobits/design-system` (55), which shared 19 names. EVERY existing
 * name is preserved, so no consumer has to rename anything at migration time.
 *
 * Both sets already shared an identical `createIcon` factory and `IconProps`,
 * which is what made the merge mechanical rather than a redraw.
 *
 * ## Why these are hand-drawn and not Lucide
 *
 * Lucide's glyphs lose their read at the 13-18px these dashboards render at.
 * Several icons below carry a docblock recording the measured departure from
 * the stock trace , those are deliberate and should not be "corrected" back.
 * An eslint rule bars `lucide-react` from this repo entirely.
 *
 * ## Where the two sets disagreed
 *
 * 19 names existed in both; ten were byte-identical. For the nine that
 * differed, the dashboard app's geometry won , it is the set with recorded
 * small-size tuning. The exception is `AlertTriangleIcon`, where the editor
 * app closes the triangle with `Z` and the dashboard app leaves it open; the
 * closed path is simply more correct.
 *
 * The editor app will therefore see a small visual change on those eight glyphs
 * at migration. They are the same shapes drawn slightly tighter.
 *
 * ## Why every call carries `/*#__PURE__*\/`
 *
 * `export const FlagIcon = createIcon(...)` is a top-level function CALL, and a
 * bundler must assume a call has side effects unless told otherwise , so it
 * cannot drop the unused ones. Without the annotation, importing a single icon
 * pulled in 3.4 kB of the set's 3.92 kB: `sideEffects: false` alone was not
 * enough, because that describes the module, not each initialiser. The
 * annotation is what makes the per-icon `size-limit` budget achievable, and that
 * budget is what stops this regressing silently.
 */

/** Tool glyph: `adler32`. */
export const Adler32Icon = /*#__PURE__*/ createIcon(
  'Adler32Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 16l2-8 2 8" />
    <path d="M9 14h2" />
    <path d="M16 8v4h-2" />
  </>,
);

export const AlertTriangleIcon = /*#__PURE__*/ createIcon(
  'AlertTriangleIcon',
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
);

/** Archive, not delete - a lid over a body, which is the reversible metaphor. */
export const ArchiveIcon = /*#__PURE__*/ createIcon(
  'ArchiveIcon',
  <>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </>,
);

/** The active sort direction; rotated 180° by the caller for ascending. */
export const ArrowDownIcon = /*#__PURE__*/ createIcon(
  'ArrowDownIcon',
  <>
    <path d="M12 4v16" />
    <path d="m6 14 6 6 6-6" />
  </>,
);

/** "before → after". Mirrors ArrowUpIcon exactly: head first, then the shaft. */
export const ArrowRightIcon = /*#__PURE__*/ createIcon(
  'ArrowRightIcon',
  <>
    <path d="m12 5 7 7-7 7" />
    <path d="M5 12h14" />
  </>,
);

/**
 * "This column is sortable, currently unsorted." Two opposed arrows on separate
 * tracks rather than Lucide's shared shaft, which at 14px reads as one arrow
 * with a bar through it.
 */
export const ArrowUpDownIcon = /*#__PURE__*/ createIcon(
  'ArrowUpDownIcon',
  <>
    <path d="M7 20V7m0 0L4 10m3-3 3 3" />
    <path d="M17 4v13m0 0 3-3m-3 3-3-3" />
  </>,
);

export const ArrowUpIcon = /*#__PURE__*/ createIcon(
  'ArrowUpIcon',
  <>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </>,
);

/** Tool glyph: `atbash`. */
export const AtbashIcon = /*#__PURE__*/ createIcon(
  'AtbashIcon',
  <>
    <path d="M4 6l4 14M4 14h8M12 6l4 14" />
    <path d="M18 6v14" />
    <path d="M20 8l-2-2-2 2" />
    <path d="M20 18l-2 2-2-2" />
  </>,
);

export const BarChart3Icon = /*#__PURE__*/ createIcon(
  'BarChart3Icon',
  <>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </>,
);

export const BarrelIcon = /*#__PURE__*/ createIcon(
  'BarrelIcon',
  <>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </>,
);

/** Tool glyph: `base64_dec`. */
export const Base64DecIcon = /*#__PURE__*/ createIcon(
  'Base64DecIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9v6M11 9v6M15 15l-2-3 2-3" />
  </>,
);

/** Tool glyph: `base64_enc`. */
export const Base64EncIcon = /*#__PURE__*/ createIcon(
  'Base64EncIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9v6M11 9v6M15 9l-2 3 2 3" />
  </>,
);

/** Tool glyph: `binary_dec`. */
export const BinaryDecIcon = /*#__PURE__*/ createIcon(
  'BinaryDecIcon',
  <>
    <path d="M4 6v12M8 6v12" />
    <path d="M14 12h6" />
    <path d="M17 9l3 3-3 3" />
  </>,
);

/** Tool glyph: `binary_enc`. */
export const BinaryEncIcon = /*#__PURE__*/ createIcon(
  'BinaryEncIcon',
  <>
    <path d="M6 6v12M10 6v12" />
    <path d="M16 6v12M20 6v12" />
    <path d="M6 12h4M16 12h4" />
  </>,
);

/** Tool glyph: `blake2b`. */
export const Blake2bIcon = /*#__PURE__*/ createIcon(
  'Blake2bIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 8v8M7 8h3a2 2 0 010 4H7M7 12h3a2 2 0 010 4H7" />
  </>,
);

/** Tool glyph: `blake2s`. */
export const Blake2sIcon = /*#__PURE__*/ createIcon(
  'Blake2sIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9c0-1 1-2 2-2s2 1 2 1-2 1-2 2 1 2 2 2 2-1 2-2" />
    <path d="M15 8v4c0 2 3 2 3 0" />
  </>,
);

/** Tool glyph: `blog_outline`. */
export const BlogOutlineIcon = /*#__PURE__*/ createIcon(
  'BlogOutlineIcon',
  <>
    <path d="M4 6h16M4 10h16M8 14h12M8 18h12" />
    <circle cx="4" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
  </>,
);

export const BotIcon = /*#__PURE__*/ createIcon(
  'BotIcon',
  <>
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </>,
);

/** Tool glyph: `brainfuck_dec`. */
export const BrainfuckDecIcon = /*#__PURE__*/ createIcon(
  'BrainfuckDecIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 8l3 4-3 4" />
    <path d="M16 8l-3 4 3 4" />
  </>,
);

/** Tool glyph: `brainfuck_enc`. */
export const BrainfuckEncIcon = /*#__PURE__*/ createIcon(
  'BrainfuckEncIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 12h4M13 12h4" />
    <path d="M9 8v8" />
    <path d="M15 8v8" />
  </>,
);

export const BucketIcon = /*#__PURE__*/ createIcon(
  'BucketIcon',
  <>
    <path d="M5 7h14l-1.5 13a2 2 0 0 1-2 1.75h-7A2 2 0 0 1 6.5 20L5 7z" />
    <path d="M4 7c0-2 3.6-4 8-4s8 2 8 4" />
  </>,
);

/** The org entity mark, in the org picker trigger and its menu rows. */
export const BuildingIcon = /*#__PURE__*/ createIcon(
  'BuildingIcon',
  <>
    <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
    <path d="M15 9h3a2 2 0 0 1 2 2v10" />
    <path d="M2 21h20" />
    <path d="M8 7h3" />
    <path d="M8 11h3" />
    <path d="M8 15h3" />
  </>,
);

export const CalendarIcon = /*#__PURE__*/ createIcon(
  'CalendarIcon',
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>,
);

/** Tool glyph: `camel_case`. */
export const CamelCaseIcon = /*#__PURE__*/ createIcon(
  'CamelCaseIcon',
  <>
    <path d="M2 17a5 5 0 019 0" />
    <path d="M13 17a5 5 0 019 0" />
  </>,
);

/** Tool glyph: `change_format`. */
export const ChangeFormatIcon = /*#__PURE__*/ createIcon(
  'ChangeFormatIcon',
  <>
    <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />
    <path d="M19 14l2 2-2 2" />
  </>,
);

/** Tool glyph: `change_tone`. */
export const ChangeToneIcon = /*#__PURE__*/ createIcon(
  'ChangeToneIcon',
  <>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </>,
);

export const CheckIcon = /*#__PURE__*/ createIcon('CheckIcon', <path d="M20 6 9 17l-5-5" />);

export const ChevronDownIcon = /*#__PURE__*/ createIcon(
  'ChevronDownIcon',
  <path d="m6 9 6 6 6-6" />,
);

export const ChevronRightIcon = /*#__PURE__*/ createIcon(
  'ChevronRightIcon',
  <path d="m9 18 6-6-6-6" />,
);

/**
 * The affordance on a picker trigger. A lone chevron-down reads as "expand";
 * the opposed pair says "this value is one of a set you can swap between",
 * which is what the org/project/env triggers actually do.
 */
export const ChevronsUpDownIcon = /*#__PURE__*/ createIcon(
  'ChevronsUpDownIcon',
  <>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </>,
);

export const ChevronUpIcon = /*#__PURE__*/ createIcon('ChevronUpIcon', <path d="m18 15-6-6-6 6" />);

export const CircleCheckIcon = /*#__PURE__*/ createIcon(
  'CircleCheckIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>,
);

/**
 * The one icon here that isn't pure stroke: a half-filled disc is the whole
 * point of the glyph (it replaces `◐`), and no stroke arrangement reads as
 * "partly on" at 15px. The half-disc therefore takes an explicit
 * `fill="currentColor" stroke="none"`, overriding the factory's defaults, while
 * the outer circle stays stroked so it matches its sibling states exactly. The
 * fill runs out to r=10 and is capped by the inner half of that stroke, leaving
 * no seam.
 */
export const CircleHalfIcon = /*#__PURE__*/ createIcon(
  'CircleHalfIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 0 1 0 20Z" fill="currentColor" stroke="none" />
  </>,
);

/** Slashed across the full diameter: Lucide's short inner chord reads as a dash at 15px. */
export const CircleSlashIcon = /*#__PURE__*/ createIcon(
  'CircleSlashIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m4.93 4.93 14.14 14.14" />
  </>,
);

export const ClipboardIcon = /*#__PURE__*/ createIcon(
  'ClipboardIcon',
  <>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </>,
);

/**
 * Timestamps. r=9 rather than Lucide's 10: a 2px stroke at r=10 leaves the hands
 * roughly 2px of clear air at 13px and the glyph fills in at the rim. The hands
 * are `HistoryIcon`'s, unchanged, so a timestamp and the history mark read as
 * the same family rather than two people's clocks.
 */
export const ClockIcon = /*#__PURE__*/ createIcon(
  'ClockIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l4 2" />
  </>,
);

/**
 * The "Raw JSON" tab. Pulled in from Lucide's edge-to-edge span (x=2 to x=22),
 * whose vertices sit on the viewBox edge and clip under a round cap; at 6 units
 * between the two brackets' open ends the pair also still reads as a pair rather
 * than one zigzag.
 */
export const CodeIcon = /*#__PURE__*/ createIcon(
  'CodeIcon',
  <>
    <path d="m9 8-4 4 4 4" />
    <path d="m15 8 4 4-4 4" />
  </>,
);

export const CommandIcon = /*#__PURE__*/ createIcon(
  'CommandIcon',
  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />,
);

/** Tool glyph: `compare`. */
export const CompareIcon = /*#__PURE__*/ createIcon(
  'CompareIcon',
  <>
    <path d="M8 3v18M16 3v18" />
    <path d="M3 8l5-5 5 5" />
    <path d="M11 16l5 5 5-5" />
  </>,
);

/**
 * Copy the flag key. The offset-rectangles glyph, with the back sheet drawn as
 * an L rather than a full rect so the two outlines never sit 1px apart.
 */
export const CopyIcon = /*#__PURE__*/ createIcon(
  'CopyIcon',
  <>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M15 5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2" />
  </>,
);

export const CornerUpLeftIcon = /*#__PURE__*/ createIcon(
  'CornerUpLeftIcon',
  <>
    <polyline points="9 14 4 9 9 4" />
    <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
  </>,
);

export const CornerUpRightIcon = /*#__PURE__*/ createIcon(
  'CornerUpRightIcon',
  <>
    <polyline points="15 14 20 9 15 4" />
    <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
  </>,
);

/** Tool glyph: `crc32`. */
export const Crc32Icon = /*#__PURE__*/ createIcon(
  'Crc32Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M9 8a4 4 0 100 8" />
    <path d="M16 8v4h-2" />
  </>,
);

export const CreditCardIcon = /*#__PURE__*/ createIcon(
  'CreditCardIcon',
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>,
);

export const CrownIcon = /*#__PURE__*/ createIcon(
  'CrownIcon',
  <>
    <path d="M2 20h20l-2-12-5 5-3-7-3 7-5-5-2 12z" />
    <rect x="2" y="20" width="20" height="2" rx="1" />
  </>,
);

/** Tool glyph: `css_fmt`. */
export const CssFmtIcon = /*#__PURE__*/ createIcon(
  'CssFmtIcon',
  <>
    <path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h2" />
    <path d="M16 3h2a2 2 0 012 2v14a2 2 0 01-2 2h-2" />
    <path d="M12 8v2M10 14h4M12 14v2" />
  </>,
);

/** Tool glyph: `csv_json`. */
export const CsvJsonIcon = /*#__PURE__*/ createIcon(
  'CsvJsonIcon',
  <>
    <path d="M4 6h16M4 12h10M4 18h6" />
    <path d="M18 14l3 3-3 3" />
  </>,
);

/** Tool glyph: `decimal_dec`. */
export const DecimalDecIcon = /*#__PURE__*/ createIcon(
  'DecimalDecIcon',
  <>
    <path d="M4 8h4v8H4z" />
    <path d="M12 12h8" />
    <path d="M17 9l3 3-3 3" />
  </>,
);

/** Tool glyph: `decimal_enc`. */
export const DecimalEncIcon = /*#__PURE__*/ createIcon(
  'DecimalEncIcon',
  <>
    <path d="M4 8h4v8H4z" />
    <path d="M12 8v8" />
    <path d="M18 8h2v8h-2" />
    <path d="M14 16h8" />
  </>,
);

/** Tool glyph: `deduplicate`. */
export const DeduplicateIcon = /*#__PURE__*/ createIcon(
  'DeduplicateIcon',
  <>
    <rect x="3" y="3" width="14" height="14" rx="2" />
    <path d="M7 21h12a2 2 0 002-2V7" />
    <line x1="9" y1="10" x2="13" y2="10" />
  </>,
);

export const DotIcon = /*#__PURE__*/ createIcon(
  'DotIcon',
  <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
);

export const DownloadIcon = /*#__PURE__*/ createIcon(
  'DownloadIcon',
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </>,
);

export const DropletIcon = /*#__PURE__*/ createIcon(
  'DropletIcon',
  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />,
);

/** Tool glyph: `eli5`. */
export const Eli5Icon = /*#__PURE__*/ createIcon(
  'Eli5Icon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9a3 3 0 015 1c0 2-3 2-3 4" />
    <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none" />
  </>,
);

export const EllipsisIcon = /*#__PURE__*/ createIcon(
  'EllipsisIcon',
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </>,
);

/** Tool glyph: `email_rewrite`. */
export const EmailRewriteIcon = /*#__PURE__*/ createIcon(
  'EmailRewriteIcon',
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="22 7 12 13 2 7" />
  </>,
);

/** Tool glyph: `emojify`. */
export const EmojifyIcon = /*#__PURE__*/ createIcon(
  'EmojifyIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" />
  </>,
);

export const FileTextIcon = /*#__PURE__*/ createIcon(
  'FileTextIcon',
  <>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </>,
);

/**
 * Segments - a filtered subset. Lucide's `filter` funnel at 15px loses the
 * distinction between its neck and its stem; three tracks with a handle on
 * each (a filter-list glyph) keeps three separate horizontals, which is also
 * the truer metaphor: a segment is rules narrowing an audience.
 */
export const FilterIcon = /*#__PURE__*/ createIcon(
  'FilterIcon',
  <>
    <path d="M3 6h18" />
    <path d="M7 12h10" />
    <path d="M10 18h4" />
  </>,
);

/** Tool glyph: `find_replace`. */
export const FindReplaceIcon = /*#__PURE__*/ createIcon(
  'FindReplaceIcon',
  <>
    <circle cx="10" cy="10" r="6" />
    <path d="M14.5 14.5L20 20" />
    <path d="M18 13v6h6" />
  </>,
);

/** Tool glyph: `fix_grammar`. */
export const FixGrammarIcon = /*#__PURE__*/ createIcon(
  'FixGrammarIcon',
  <>
    <path d="M11 4H4v16h16v-7" />
    <polyline points="20 7 11 16 8 13" />
  </>,
);

/**
 * The Flags nav item and the product's primary noun. Lucide's `flag` is a bare
 * outline whose pole and cloth meet at a thin acute angle that fills in at
 * 15px; this one squares the hoist and gives the cloth a single wave, so the
 * silhouette survives. Deliberately not the `ToggleMarkIcon` - that is the
 * brand mark, and reusing it for a nav row makes the row look like a logo.
 */
export const FlagIcon = /*#__PURE__*/ createIcon(
  'FlagIcon',
  <>
    <path d="M5 21V4" />
    <path d="M5 15V4h6l1 1.5h7l-2.5 4L19 14h-7l-1-1.5H5" />
  </>,
);

export const FlameIcon = /*#__PURE__*/ createIcon(
  'FlameIcon',
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
);

/** Tool glyph: `fnv1a`. */
export const Fnv1aIcon = /*#__PURE__*/ createIcon(
  'Fnv1aIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 8v8M8 8h4M8 12h3" />
    <path d="M15 16V8l3 8V8" />
  </>,
);

/** The project entity mark. */
export const FolderIcon = /*#__PURE__*/ createIcon(
  'FolderIcon',
  <path d="M3 7a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.6.8L11.5 7H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
);

export const Gamepad2Icon = /*#__PURE__*/ createIcon(
  'Gamepad2Icon',
  <>
    <line x1="6" x2="10" y1="11" y2="11" />
    <line x1="8" x2="8" y1="9" y2="13" />
    <line x1="15" x2="15.01" y1="12" y2="12" />
    <line x1="18" x2="18.01" y1="10" y2="10" />
    <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
  </>,
);

export const GemIcon = /*#__PURE__*/ createIcon(
  'GemIcon',
  <>
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </>,
);

/** Tool glyph: `gen_title`. */
export const GenTitleIcon = /*#__PURE__*/ createIcon(
  'GenTitleIcon',
  <>
    <path d="M4 6h16M4 12h12" />
    <path d="M17 16l3 3-3 3" />
  </>,
);

export const GiftIcon = /*#__PURE__*/ createIcon(
  'GiftIcon',
  <>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
    <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
  </>,
);

export const GlobeIcon = /*#__PURE__*/ createIcon(
  'GlobeIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </>,
);

export const GraduationCapIcon = /*#__PURE__*/ createIcon(
  'GraduationCapIcon',
  <>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </>,
);

export const GripVerticalIcon = /*#__PURE__*/ createIcon(
  'GripVerticalIcon',
  <>
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </>,
);

/** Tool glyph: `hashtags`. */
export const HashtagsIcon = /*#__PURE__*/ createIcon(
  'HashtagsIcon',
  <>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </>,
);

export const HeartIcon = /*#__PURE__*/ createIcon(
  'HeartIcon',
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
);

/** Tool glyph: `hex_dec`. */
export const HexDecIcon = /*#__PURE__*/ createIcon(
  'HexDecIcon',
  <>
    <path d="M4 4v16M2 12h4" />
    <path d="M10 4v16h4" />
    <path d="M22 4l-4 8 4 8" />
  </>,
);

/** Tool glyph: `hex_enc`. */
export const HexEncIcon = /*#__PURE__*/ createIcon(
  'HexEncIcon',
  <>
    <path d="M5 4v16M2 10h6" />
    <path d="M11 4v16h5" />
    <path d="M20 4v16h-2" />
  </>,
);

export const HistoryIcon = /*#__PURE__*/ createIcon(
  'HistoryIcon',
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </>,
);

export const HomeIcon = /*#__PURE__*/ createIcon(
  'HomeIcon',
  <>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
  </>,
);

/** Tool glyph: `html_esc`. */
export const HtmlEscIcon = /*#__PURE__*/ createIcon(
  'HtmlEscIcon',
  <>
    <polyline points="8 18 4 12 8 6" />
    <polyline points="16 6 20 12 16 18" />
    <path d="M12 9l1 6" />
  </>,
);

/** Tool glyph: `html_fmt`. */
export const HtmlFmtIcon = /*#__PURE__*/ createIcon(
  'HtmlFmtIcon',
  <>
    <polyline points="8 18 4 12 8 6" />
    <polyline points="16 6 20 12 16 18" />
    <path d="M10 14h4" />
  </>,
);

/** Tool glyph: `html_unesc`. */
export const HtmlUnescIcon = /*#__PURE__*/ createIcon(
  'HtmlUnescIcon',
  <>
    <polyline points="8 18 4 12 8 6" />
    <polyline points="16 6 20 12 16 18" />
    <path d="M13 15l-1-6" />
  </>,
);

export const JarIcon = /*#__PURE__*/ createIcon(
  'JarIcon',
  <>
    <path d="M8 3h8v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V3z" />
    <rect x="6" y="7" width="12" height="13" rx="2" />
    <line x1="6" y1="11" x2="18" y2="11" />
  </>,
);

/** Tool glyph: `js_fmt`. */
export const JsFmtIcon = /*#__PURE__*/ createIcon(
  'JsFmtIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M10 8v6c0 2-3 2-3 0" />
    <path d="M15 8c2 0 2 3 0 3s-2 3 0 3" />
  </>,
);

/** Tool glyph: `json_csv`. */
export const JsonCsvIcon = /*#__PURE__*/ createIcon(
  'JsonCsvIcon',
  <>
    <path d="M4 6h6M4 12h10M4 18h16" />
    <path d="M18 2l3 3-3 3" />
  </>,
);

/** Tool glyph: `json_esc`. */
export const JsonEscIcon = /*#__PURE__*/ createIcon(
  'JsonEscIcon',
  <>
    <path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h2" />
    <path d="M16 3h2a2 2 0 012 2v14a2 2 0 01-2 2h-2" />
    <path d="M9 12h6M12 9l3 3-3 3" />
  </>,
);

/** Tool glyph: `json_fmt`. */
export const JsonFmtIcon = /*#__PURE__*/ createIcon(
  'JsonFmtIcon',
  <>
    <path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h2" />
    <path d="M16 3h2a2 2 0 012 2v14a2 2 0 01-2 2h-2" />
    <path d="M9 10h6M9 14h4" />
  </>,
);

/** Tool glyph: `json_unesc`. */
export const JsonUnescIcon = /*#__PURE__*/ createIcon(
  'JsonUnescIcon',
  <>
    <path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h2" />
    <path d="M16 3h2a2 2 0 012 2v14a2 2 0 01-2 2h-2" />
    <path d="M15 12H9M12 9l-3 3 3 3" />
  </>,
);

/** Tool glyph: `json_yaml`. */
export const JsonYamlIcon = /*#__PURE__*/ createIcon(
  'JsonYamlIcon',
  <>
    <path d="M4 8l4 4v8" />
    <path d="M12 8l-4 4" />
    <path d="M16 6v12M14 10h4M14 14h4" />
  </>,
);

/** Tool glyph: `jwt_decode`. */
export const JwtDecodeIcon = /*#__PURE__*/ createIcon(
  'JwtDecodeIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="12" cy="10" r="3" />
    <path d="M12 13v3" />
  </>,
);

/** Tool glyph: `kebab_case`. */
export const KebabCaseIcon = /*#__PURE__*/ createIcon(
  'KebabCaseIcon',
  <>
    <path d="M2 12h20" />
    <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    <circle cx="18" cy="12" r="2" fill="currentColor" stroke="none" />
  </>,
);

/** Tool glyph: `keccak256`. */
export const Keccak256Icon = /*#__PURE__*/ createIcon(
  'Keccak256Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 8l4 4-4 4" />
    <path d="M14 8l-2 4 2 4" />
  </>,
);

export const KeyboardIcon = /*#__PURE__*/ createIcon(
  'KeyboardIcon',
  <>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="M6 8h.01" />
    <path d="M10 8h.01" />
    <path d="M14 8h.01" />
    <path d="M18 8h.01" />
    <path d="M8 12h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
    <path d="M7 16h10" />
  </>,
);

export const KeyIcon = /*#__PURE__*/ createIcon(
  'KeyIcon',
  <>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.8 12.2 8.2-8.2" />
    <path d="m16 7 2.5 2.5" />
  </>,
);

/** Tool glyph: `keywords`. */
export const KeywordsIcon = /*#__PURE__*/ createIcon(
  'KeywordsIcon',
  <>
    <circle cx="12" cy="10" r="3" />
    <path d="M12 13v8" />
    <path d="M9 18h6" />
  </>,
);

export const LayersIcon = /*#__PURE__*/ createIcon(
  'LayersIcon',
  <>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 12 10 5 10-5" />
    <path d="m2 17 10 5 10-5" />
  </>,
);

export const LayoutGridIcon = /*#__PURE__*/ createIcon(
  'LayoutGridIcon',
  <>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </>,
);

export const LayoutTemplateIcon = /*#__PURE__*/ createIcon(
  'LayoutTemplateIcon',
  <>
    <rect width="18" height="7" x="3" y="3" rx="1" />
    <rect width="9" height="7" x="3" y="14" rx="1" />
    <rect width="5" height="7" x="16" y="14" rx="1" />
  </>,
);

export const LeafIcon = /*#__PURE__*/ createIcon(
  'LeafIcon',
  <>
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-3.8 10-10 10z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </>,
);

/** Tool glyph: `lengthen`. */
export const LengthenIcon = /*#__PURE__*/ createIcon(
  'LengthenIcon',
  <>
    <path d="M12 5v14M5 12h14" />
    <circle cx="12" cy="12" r="9" />
  </>,
);

export const LightbulbIcon = /*#__PURE__*/ createIcon(
  'LightbulbIcon',
  <>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </>,
);

export const LinkIcon = /*#__PURE__*/ createIcon(
  'LinkIcon',
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>,
);

export const LockIcon = /*#__PURE__*/ createIcon(
  'LockIcon',
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>,
);

export const LockOpenIcon = /*#__PURE__*/ createIcon(
  'LockOpenIcon',
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </>,
);

export const LogInIcon = /*#__PURE__*/ createIcon(
  'LogInIcon',
  <>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" x2="3" y1="12" y2="12" />
  </>,
);

export const LogOutIcon = /*#__PURE__*/ createIcon(
  'LogOutIcon',
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

/** Tool glyph: `lowercase`. */
export const LowercaseIcon = /*#__PURE__*/ createIcon(
  'LowercaseIcon',
  <>
    <circle cx="8" cy="16" r="4" />
    <path d="M12 12v8" />
    <circle cx="19" cy="16" r="4" />
    <path d="M19 12v8" />
  </>,
);

/** Tool glyph: `markdown`. */
export const MarkdownIcon = /*#__PURE__*/ createIcon(
  'MarkdownIcon',
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M7 8v8l2.5-3 2.5 3V8" />
    <path d="M17 12l-2-2v8" />
  </>,
);

/** Tool glyph: `md5`. */
export const Md5Icon = /*#__PURE__*/ createIcon(
  'Md5Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 16V8l3 4 3-4v8" />
    <path d="M17 16V8" />
  </>,
);

export const MenuIcon = /*#__PURE__*/ createIcon(
  'MenuIcon',
  <>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </>,
);

/** Tool glyph: `meta_desc`. */
export const MetaDescIcon = /*#__PURE__*/ createIcon(
  'MetaDescIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 7h10M7 11h10M7 15h6" />
  </>,
);

export const MinusIcon = /*#__PURE__*/ createIcon('MinusIcon', <path d="M5 12h14" />);

export const MoonIcon = /*#__PURE__*/ createIcon(
  'MoonIcon',
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
);

/** Row-actions trigger. Discs, not rings - a 2px ring is a smudge at 14px. */
export const MoreHorizontalIcon = /*#__PURE__*/ createIcon(
  'MoreHorizontalIcon',
  <>
    <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </>,
);

/** Tool glyph: `morse_dec`. */
export const MorseDecIcon = /*#__PURE__*/ createIcon(
  'MorseDecIcon',
  <>
    <path d="M2 12h6" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    <path d="M16 12h6" />
  </>,
);

/** Tool glyph: `morse_enc`. */
export const MorseEncIcon = /*#__PURE__*/ createIcon(
  'MorseEncIcon',
  <>
    <circle cx="4" cy="12" r="2" fill="currentColor" stroke="none" />
    <path d="M10 12h6" />
    <circle cx="20" cy="12" r="2" fill="currentColor" stroke="none" />
  </>,
);

/** Tool glyph: `murmurhash3`. */
export const Murmurhash3Icon = /*#__PURE__*/ createIcon(
  'Murmurhash3Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M6 16V8l2 4 2-4v8" />
    <path d="M13 16V8l2 4 2-4v8" />
  </>,
);

/** Tool glyph: `no_accents`. */
export const NoAccentsIcon = /*#__PURE__*/ createIcon(
  'NoAccentsIcon',
  <>
    <path d="M5 20l4-16h2l4 16" />
    <path d="M7 14h6" />
    <line x1="15" y1="4" x2="19" y2="4" />
  </>,
);

/** Tool glyph: `no_breaks`. */
export const NoBreaksIcon = /*#__PURE__*/ createIcon(
  'NoBreaksIcon',
  <>
    <path d="M17 3l-12 18" />
    <path d="M4 12h16" />
  </>,
);

/** Tool glyph: `number_lines`. */
export const NumberLinesIcon = /*#__PURE__*/ createIcon(
  'NumberLinesIcon',
  <>
    <path d="M10 6h11M10 12h11M10 18h11" />
    <path d="M4 6h1M3 12h2M2 18h3" />
  </>,
);

/** Tool glyph: `octal_dec`. */
export const OctalDecIcon = /*#__PURE__*/ createIcon(
  'OctalDecIcon',
  <>
    <circle cx="16" cy="12" r="5" />
    <path d="M3 12h8" />
    <path d="M6 9l-3 3 3 3" />
  </>,
);

/** Tool glyph: `octal_enc`. */
export const OctalEncIcon = /*#__PURE__*/ createIcon(
  'OctalEncIcon',
  <>
    <circle cx="8" cy="12" r="5" />
    <path d="M13 12h8" />
    <path d="M18 9l3 3-3 3" />
  </>,
);

/** Collapse/expand the sidebar rail: a frame with its left column filled. */
export const PanelLeftIcon = /*#__PURE__*/ createIcon(
  'PanelLeftIcon',
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </>,
);

/** Tool glyph: `paraphrase`. */
export const ParaphraseIcon = /*#__PURE__*/ createIcon(
  'ParaphraseIcon',
  <>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 014-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
  </>,
);

/** Tool glyph: `pascal_case`. */
export const PascalCaseIcon = /*#__PURE__*/ createIcon(
  'PascalCaseIcon',
  <>
    <path d="M4 20V6h5a4 4 0 010 8H4" />
    <path d="M15 20V6h5a4 4 0 010 8H15" />
  </>,
);

/** Tool glyph: `password`. */
export const PasswordIcon = /*#__PURE__*/ createIcon(
  'PasswordIcon',
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </>,
);

export const PencilIcon = /*#__PURE__*/ createIcon(
  'PencilIcon',
  <>
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    <path d="m15 5 4 4" />
  </>,
);

export const PenLineIcon = /*#__PURE__*/ createIcon(
  'PenLineIcon',
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>,
);

export const PlayIcon = /*#__PURE__*/ createIcon(
  'PlayIcon',
  <polygon points="6 3 20 12 6 21 6 3" />,
);

/** Integrations - a plug going into a socket. */
export const PlugIcon = /*#__PURE__*/ createIcon(
  'PlugIcon',
  <>
    <path d="M9 3v5" />
    <path d="M15 3v5" />
    <path d="M6 8h12v3a6 6 0 0 1-12 0Z" />
    <path d="M12 17v4" />
  </>,
);

export const PlusIcon = /*#__PURE__*/ createIcon(
  'PlusIcon',
  <>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </>,
);

export const PowerIcon = /*#__PURE__*/ createIcon(
  'PowerIcon',
  <>
    <path d="M12 2v10" />
    <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
  </>,
);

/** Tool glyph: `proofread`. */
export const ProofreadIcon = /*#__PURE__*/ createIcon(
  'ProofreadIcon',
  <>
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="10" />
  </>,
);

/** Tool glyph: `random_text`. */
export const RandomTextIcon = /*#__PURE__*/ createIcon(
  'RandomTextIcon',
  <path d="M4 6h16M4 10h12M4 14h14M4 18h8" />,
);

/** Tool glyph: `refactor_prompt`. */
export const RefactorPromptIcon = /*#__PURE__*/ createIcon(
  'RefactorPromptIcon',
  <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </>,
);

/** Tool glyph: `regex_test`. */
export const RegexTestIcon = /*#__PURE__*/ createIcon(
  'RegexTestIcon',
  <>
    <path d="M12 4v16M7 7l10 10M17 7L7 17" />
    <circle cx="12" cy="12" r="2" />
  </>,
);

/** Tool glyph: `reverse`. */
export const ReverseIcon = /*#__PURE__*/ createIcon(
  'ReverseIcon',
  <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </>,
);

/** Tool glyph: `reverse_lines`. */
export const ReverseLinesIcon = /*#__PURE__*/ createIcon(
  'ReverseLinesIcon',
  <>
    <path d="M7 4v16M17 4v16" />
    <path d="M4 8l3-4 3 4M14 16l3 4 3-4" />
  </>,
);

/** Tool glyph: `ripemd160`. */
export const Ripemd160Icon = /*#__PURE__*/ createIcon(
  'Ripemd160Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 8v8M7 8h3a3 3 0 010 4H7" />
    <path d="M14 8v8h3" />
  </>,
);

/** Tool glyph: `rot13`. */
export const Rot13Icon = /*#__PURE__*/ createIcon(
  'Rot13Icon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v4M12 17v4" />
    <path d="M8 7l4 5-4 5" />
  </>,
);

/**
 * `config.rollback`. This is `HistoryIcon` minus the clock hands, deliberately:
 * a rollback is a jump backwards along exactly the history that icon stands for,
 * and the two never appear in the same view (HistoryIcon is a landing-page
 * feature card, this is an audit row).
 */
export const RotateCcwIcon = /*#__PURE__*/ createIcon(
  'RotateCcwIcon',
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>,
);

export const RulerIcon = /*#__PURE__*/ createIcon(
  'RulerIcon',
  <>
    <path d="M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
    <line x1="12" y1="9" x2="12" y2="13" />
  </>,
);

export const RunnerIcon = /*#__PURE__*/ createIcon(
  'RunnerIcon',
  <>
    <circle cx="17" cy="4" r="2" />
    <path d="M14 7l-2 2-3 1-1 4 3 2v4" />
    <path d="M9 9L6 12" />
    <path d="M12 9l4 4-2 4" />
  </>,
);

export const SearchIcon = /*#__PURE__*/ createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);

/** Tool glyph: `sentence_case`. */
export const SentenceCaseIcon = /*#__PURE__*/ createIcon(
  'SentenceCaseIcon',
  <>
    <path d="M4 6h8M8 6v14" />
    <circle cx="18" cy="18" r="2" fill="currentColor" stroke="none" />
  </>,
);

/** Tool glyph: `sentiment`. */
export const SentimentIcon = /*#__PURE__*/ createIcon(
  'SentimentIcon',
  <>
    <path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83" />
    <circle cx="12" cy="12" r="8" />
    <path d="M12 12l4-4" />
  </>,
);

/** Tool glyph: `seo_titles`. */
export const SeoTitlesIcon = /*#__PURE__*/ createIcon(
  'SeoTitlesIcon',
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <path d="M8 11h6M11 8v6" />
  </>,
);

/** Tool glyph: `sha1`. */
export const Sha1Icon = /*#__PURE__*/ createIcon(
  'Sha1Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9c0-1 1-2 2-2s2 1 2 1-2 1-2 2 1 2 2 2 2-1 2-2" />
    <path d="M16 8v8" />
  </>,
);

/** Tool glyph: `sha224`. */
export const Sha224Icon = /*#__PURE__*/ createIcon(
  'Sha224Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9c0-1 1-2 2-2s2 1 2 1-2 1-2 2 1 2 2 2 2-1 2-2" />
    <path d="M16 8v4h-2" />
  </>,
);

/** Tool glyph: `sha256`. */
export const Sha256Icon = /*#__PURE__*/ createIcon(
  'Sha256Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9c0-1 1-2 2-2s2 1 2 1-2 1-2 2 1 2 2 2 2-1 2-2" />
  </>,
);

/** Tool glyph: `sha3_224`. */
export const Sha3224Icon = /*#__PURE__*/ createIcon(
  'Sha3224Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 9a2 2 0 110 3 2 2 0 110 3" />
    <path d="M15 9h2M17 9v6h-2" />
  </>,
);

/** Tool glyph: `sha3_256`. */
export const Sha3256Icon = /*#__PURE__*/ createIcon(
  'Sha3256Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 9a2 2 0 110 3 2 2 0 110 3" />
    <path d="M15 9h2l-2 3 2 3h-2" />
  </>,
);

/** Tool glyph: `sha3_384`. */
export const Sha3384Icon = /*#__PURE__*/ createIcon(
  'Sha3384Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 9a2 2 0 110 3 2 2 0 110 3" />
    <path d="M15 9a2 2 0 110 3 2 2 0 110 3" />
  </>,
);

/** Tool glyph: `sha3_512`. */
export const Sha3512Icon = /*#__PURE__*/ createIcon(
  'Sha3512Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 9a2 2 0 110 3 2 2 0 110 3" />
    <path d="M15 8v2h2v2h-2v2h2" />
  </>,
);

/** Tool glyph: `sha384`. */
export const Sha384Icon = /*#__PURE__*/ createIcon(
  'Sha384Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9c0-1 1-2 2-2s2 1 2 1-2 1-2 2 1 2 2 2 2-1 2-2" />
    <path d="M16 9a2 2 0 110 3 2 2 0 110 3" />
  </>,
);

/** Tool glyph: `sha512_224`. */
export const Sha512224Icon = /*#__PURE__*/ createIcon(
  'Sha512224Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 9l3-1v8" />
    <path d="M14 9h3M17 9v6h-3" />
  </>,
);

/** Tool glyph: `sha512_256`. */
export const Sha512256Icon = /*#__PURE__*/ createIcon(
  'Sha512256Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 9l3-1v8" />
    <path d="M14 9h3l-3 3 3 3h-3" />
  </>,
);

/** Tool glyph: `sha512`. */
export const Sha512Icon = /*#__PURE__*/ createIcon(
  'Sha512Icon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 9c0-1 1-2 2-2s2 1 2 1-2 1-2 2 1 2 2 2 2-1 2-2" />
    <path d="M16 8v2h2v2h-2v2h2" />
  </>,
);

export const ShieldIcon = /*#__PURE__*/ createIcon(
  'ShieldIcon',
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
);

/**
 * Two faders, not Lucide's three: at 18px a third track puts strokes ~2px apart
 * and the whole glyph collapses into a hatch. Round knobs also survive the size
 * better than Lucide's tick-mark handles. Track gaps are cut exactly at each
 * knob's radius so the line never appears to pass through it.
 */
export const SlidersIcon = /*#__PURE__*/ createIcon(
  'SlidersIcon',
  <>
    <path d="M3 7h3" />
    <path d="M12 7h9" />
    <circle cx="9" cy="7" r="3" />
    <path d="M3 17h9" />
    <path d="M18 17h3" />
    <circle cx="15" cy="17" r="3" />
  </>,
);

export const SmartphoneIcon = /*#__PURE__*/ createIcon(
  'SmartphoneIcon',
  <>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </>,
);

export const SmileIcon = /*#__PURE__*/ createIcon(
  'SmileIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" x2="9.01" y1="9" y2="9" />
    <line x1="15" x2="15.01" y1="9" y2="9" />
  </>,
);

/** Tool glyph: `snake_case`. */
export const SnakeCaseIcon = /*#__PURE__*/ createIcon(
  'SnakeCaseIcon',
  <>
    <path d="M2 12h20" />
    <path d="M6 8v8M12 8v8M18 8v8" />
  </>,
);

/** Tool glyph: `sort_asc`. */
export const SortAscIcon = /*#__PURE__*/ createIcon(
  'SortAscIcon',
  <>
    <path d="M3 6h8M3 12h5M3 18h3" />
    <path d="M17 6v14M14 17l3 3 3-3" />
  </>,
);

/** Tool glyph: `sort_desc`. */
export const SortDescIcon = /*#__PURE__*/ createIcon(
  'SortDescIcon',
  <>
    <path d="M3 18h8M3 12h5M3 6h3" />
    <path d="M17 18V4M14 7l3-3 3 3" />
  </>,
);

export const SparklesIcon = /*#__PURE__*/ createIcon(
  'SparklesIcon',
  <>
    <path d="M10 4c.6 3.84 2.16 5.4 6 6-3.84.6-5.4 2.16-6 6-.6-3.84-2.16-5.4-6-6 3.84-.6 5.4-2.16 6-6Z" />
    <path d="M18.5 16c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5Z" />
  </>,
);

/**
 * A symmetric fork, unlike Lucide's `split`, which forks left only and reads as
 * a mistake. Each branch turns vertical before its tip so it can end in an
 * ordinary up-chevron: on a 45° branch an arrowhead's wings lie along the axes,
 * which at 18px is indistinguishable from a corner bracket, and the glyph loses
 * its arrows and flattens into a plain Y.
 */
export const SplitIcon = /*#__PURE__*/ createIcon(
  'SplitIcon',
  <>
    <path d="M12 22v-6" />
    <path d="M12 16 6 10V4" />
    <path d="m3 7 3-3 3 3" />
    <path d="m12 16 6-6V4" />
    <path d="m15 7 3-3 3 3" />
  </>,
);

export const StarIcon = /*#__PURE__*/ createIcon(
  'StarIcon',
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
);

/** Tool glyph: `strip_all`. */
export const StripAllIcon = /*#__PURE__*/ createIcon(
  'StripAllIcon',
  <>
    <line x1="4" y1="4" x2="20" y2="20" />
    <path d="M4 12h16" />
    <line x1="4" y1="20" x2="20" y2="4" />
  </>,
);

/** Tool glyph: `strip_html`. */
export const StripHtmlIcon = /*#__PURE__*/ createIcon(
  'StripHtmlIcon',
  <>
    <polyline points="8 18 4 12 8 6" />
    <polyline points="16 6 20 12 16 18" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </>,
);

/** Tool glyph: `summarize`. */
export const SummarizeIcon = /*#__PURE__*/ createIcon(
  'SummarizeIcon',
  <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />,
);

export const SunIcon = /*#__PURE__*/ createIcon(
  'SunIcon',
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>,
);

export const TargetIcon = /*#__PURE__*/ createIcon(
  'TargetIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>,
);

/** Tool glyph: `title_case`. */
export const TitleCaseIcon = /*#__PURE__*/ createIcon(
  'TitleCaseIcon',
  <>
    <path d="M4 6h8M8 6v14" />
    <path d="M16 12v8m-3-8h6" />
  </>,
);

/** Tool glyph: `toggle_case`. */
export const ToggleCaseIcon = /*#__PURE__*/ createIcon(
  'ToggleCaseIcon',
  <>
    <path d="M4 12v8m-2-8h4" />
    <path d="M10 4V18l4 -14v14" />
  </>,
);

/**
 * `flag.update` in the audit log - a switch, lighter than `ToggleMarkIcon`,
 * which is the brand.
 *
 * This was one of three per-type glyphs (`boolean` / `string` / `string_enum`)
 * that `FlagTypeBadge` rendered before its label. They went when the Flags table
 * was rebuilt: a type is a fixed property of the definition rather than state,
 * and fifty outlined pills down a column read as fifty buttons and competed with
 * the Status badge, which is the one thing people scan a row for. Its two
 * siblings had no other caller and were deleted with it; this one survives
 * because `features/audit/audit-events.ts` uses it for the flag-changed event,
 * where a glyph per action IS the point.
 */
export const ToggleIcon = /*#__PURE__*/ createIcon(
  'ToggleIcon',
  <>
    <rect x="2" y="7" width="20" height="10" rx="5" />
    <circle cx="16" cy="12" r="2.5" fill="currentColor" stroke="none" />
  </>,
);

/**
 * The brand mark - a switch in the "on" position, standing in for the wordmark's
 * former `◆`. It sits beside bold 19px text, so the knob is a solid disc rather
 * than a ring: a stroked knob greys out next to bold type at 18–20px. Its radius
 * (3.5) is heavier than a UI toggle's would be for the same reason, and it is
 * centred on the pill's right cap at x=15, keeping a uniform 2.5 gap all round.
 */
export const ToggleMarkIcon = /*#__PURE__*/ createIcon(
  'ToggleMarkIcon',
  <>
    <rect x="2" y="5" width="20" height="14" rx="7" />
    <circle cx="15" cy="12" r="3.5" fill="currentColor" stroke="none" />
  </>,
);

/** Tool glyph: `toggle_quotes`. */
export const ToggleQuotesIcon = /*#__PURE__*/ createIcon(
  'ToggleQuotesIcon',
  <>
    <path d="M5 8c0-2 1-4 4-4v3c-1 0-2 1-2 2v2h3v5H5V8z" />
    <path d="M14 8c0-2 1-4 4-4v3c-1 0-2 1-2 2v2h3v5h-5V8z" />
  </>,
);

/** Tool glyph: `translate`. */
export const TranslateIcon = /*#__PURE__*/ createIcon(
  'TranslateIcon',
  <>
    <path d="M5 8h8M9 4v4" />
    <path d="M6 12c0 3 3 6 6 6" />
    <path d="M14 10l3 8 3-8" />
    <path d="M15 16h4" />
  </>,
);

/** Tool glyph: `transliterate`. */
export const TransliterateIcon = /*#__PURE__*/ createIcon(
  'TransliterateIcon',
  <>
    <path d="M4 6h7M7.5 6v10" />
    <path d="M14 8l3 8 3-8" />
    <path d="M15 14h4" />
  </>,
);

export const Trash2Icon = /*#__PURE__*/ createIcon(
  'Trash2Icon',
  <>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </>,
);

export const TrashIcon = /*#__PURE__*/ createIcon(
  'TrashIcon',
  <>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7" />
  </>,
);

export const TrendingUpIcon = /*#__PURE__*/ createIcon(
  'TrendingUpIcon',
  <>
    <path d="M16 7h6v6" />
    <path d="m22 7-8.5 8.5-5-5L2 17" />
  </>,
);

/** Tool glyph: `trim_extra`. */
export const TrimExtraIcon = /*#__PURE__*/ createIcon(
  'TrimExtraIcon',
  <path d="M4 12h16M9 6l-5 6 5 6M15 6l5 6-5 6" />,
);

export const TrophyIcon = /*#__PURE__*/ createIcon(
  'TrophyIcon',
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </>,
);

/** Tool glyph: `ts_fmt`. */
export const TsFmtIcon = /*#__PURE__*/ createIcon(
  'TsFmtIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 8h5M10.5 8v8" />
    <path d="M17 8c-2 0-3 2-1 3 2 1 1 3-1 3" />
  </>,
);

/** Tool glyph: `tweet_shorten`. */
export const TweetShortenIcon = /*#__PURE__*/ createIcon(
  'TweetShortenIcon',
  <path d="M4 4l16 16M12 4h8M4 20h8" />,
);

/** Tool glyph: `unicode_esc`. */
export const UnicodeEscIcon = /*#__PURE__*/ createIcon(
  'UnicodeEscIcon',
  <>
    <path d="M6 4v7c0 3 3 5 6 5s6-2 6-5V4" />
    <path d="M4 4h4M16 4h4" />
    <path d="M17 18l3 3-3 3" />
  </>,
);

/** Tool glyph: `unicode_unesc`. */
export const UnicodeUnescIcon = /*#__PURE__*/ createIcon(
  'UnicodeUnescIcon',
  <>
    <path d="M6 4v7c0 3 3 5 6 5s6-2 6-5V4" />
    <path d="M4 4h4M16 4h4" />
    <path d="M7 18l-3 3 3 3" />
  </>,
);

/**
 * `ruleset.republish` - a publish. The tray is open at the top so the arrow
 * reads as leaving it; its 5-unit gap to the arrow's tail is the closest two
 * strokes come anywhere in the glyph.
 */
export const UploadIcon = /*#__PURE__*/ createIcon(
  'UploadIcon',
  <>
    <path d="m7 9 5-5 5 5" />
    <path d="M12 16V4" />
    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </>,
);

/** Tool glyph: `uppercase`. */
export const UppercaseIcon = /*#__PURE__*/ createIcon(
  'UppercaseIcon',
  <path d="M4 20V6l4 14M4 12h8M12 6v14M16 20V6l4 14M16 12h8" />,
);

/** Tool glyph: `url_dec`. */
export const UrlDecIcon = /*#__PURE__*/ createIcon(
  'UrlDecIcon',
  <>
    <path d="M10 14a4 4 0 01-4-4V8a4 4 0 018 0v2a4 4 0 01-4 4z" />
    <path d="M18 8v8M15 12h6" />
  </>,
);

/** Tool glyph: `url_enc`. */
export const UrlEncIcon = /*#__PURE__*/ createIcon(
  'UrlEncIcon',
  <>
    <path d="M10 14a4 4 0 01-4-4V8a4 4 0 018 0v2a4 4 0 01-4 4z" />
    <path d="M17 10h3M17 14h3M20 12h-3" />
  </>,
);

export const UserIcon = /*#__PURE__*/ createIcon(
  'UserIcon',
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </>,
);

/**
 * The "Canary releases" card. This is an audience, not a rocket, because no
 * rocket survives 18px: a hull with flared fins is topologically the letter A,
 * and the porthole lands exactly where A's crossbar goes. Rasterising the
 * candidates at 18px and magnifying the bitmap, every variant read as a glyph -
 * "A" for flared fins, a bell for a solid base, a fish for a capsule and flame.
 * An audience is also the truer metaphor: a canary release is defined by *who*
 * receives it - your team, then a beta segment, then everyone.
 */
export const UsersIcon = /*#__PURE__*/ createIcon(
  'UsersIcon',
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
);

/**
 * Webhooks. Lucide's mark is three arcs meeting at a hub, which at 15px merges
 * into a blob. Drawn instead as what a webhook literally is - an event (the
 * filled origin dot) pushed out to your endpoint (the bar on the right). Four
 * strokes, no two of them close enough to fuse.
 */
export const WebhookIcon = /*#__PURE__*/ createIcon(
  'WebhookIcon',
  <>
    <circle cx="4.5" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <path d="M9 12h7" />
    <path d="m13 8 4 4-4 4" />
    <path d="M20.5 4v16" />
  </>,
);

/** Tool glyph: `whirlpool`. */
export const WhirlpoolIcon = /*#__PURE__*/ createIcon(
  'WhirlpoolIcon',
  <>
    <path d="M12 2a10 10 0 0110 10" />
    <path d="M12 6a6 6 0 016 6" />
    <path d="M12 10a2 2 0 012 2" />
    <path d="M12 22a10 10 0 01-10-10" />
    <path d="M12 18a6 6 0 01-6-6" />
    <path d="M12 14a2 2 0 01-2-2" />
  </>,
);

/** Tool glyph: `word_freq`. */
export const WordFreqIcon = /*#__PURE__*/ createIcon(
  'WordFreqIcon',
  <>
    <path d="M3 3v18h18" />
    <rect x="7" y="13" width="3" height="5" rx="1" />
    <rect x="12" y="8" width="3" height="10" rx="1" />
    <rect x="17" y="3" width="3" height="15" rx="1" />
  </>,
);

export const WrenchIcon = /*#__PURE__*/ createIcon(
  'WrenchIcon',
  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
);

export const XIcon = /*#__PURE__*/ createIcon(
  'XIcon',
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);

/** Tool glyph: `xxhash`. */
export const XxhashIcon = /*#__PURE__*/ createIcon(
  'XxhashIcon',
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M7 8l4 4-4 4" />
    <path d="M13 8l4 4-4 4" />
  </>,
);

export const ZapIcon = /*#__PURE__*/ createIcon(
  'ZapIcon',
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
);
