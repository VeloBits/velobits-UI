import { createIcon } from './create-icon';

/**
 * The unified VeloBits icon set — 88 stroke icons on a 24×24 grid.
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
 * the stock trace — those are deliberate and should not be "corrected" back.
 * An eslint rule bars `lucide-react` from this repo entirely.
 *
 * ## Where the two sets disagreed
 *
 * 19 names existed in both; ten were byte-identical. For the nine that
 * differed, the dashboard app's geometry won — it is the set with recorded
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
 * bundler must assume a call has side effects unless told otherwise — so it
 * cannot drop the unused ones. Without the annotation, importing a single icon
 * pulled in 3.4 kB of the set's 3.92 kB: `sideEffects: false` alone was not
 * enough, because that describes the module, not each initialiser. The
 * annotation is what makes the per-icon `size-limit` budget achievable, and that
 * budget is what stops this regressing silently.
 */

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

export const BarChart3Icon = /*#__PURE__*/ createIcon(
  'BarChart3Icon',
  <>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
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

export const CreditCardIcon = /*#__PURE__*/ createIcon(
  'CreditCardIcon',
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
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

export const EllipsisIcon = /*#__PURE__*/ createIcon(
  'EllipsisIcon',
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
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

export const HeartIcon = /*#__PURE__*/ createIcon(
  'HeartIcon',
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
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

export const MenuIcon = /*#__PURE__*/ createIcon(
  'MenuIcon',
  <>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
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

/** Collapse/expand the sidebar rail: a frame with its left column filled. */
export const PanelLeftIcon = /*#__PURE__*/ createIcon(
  'PanelLeftIcon',
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
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

export const SearchIcon = /*#__PURE__*/ createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
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

export const ZapIcon = /*#__PURE__*/ createIcon(
  'ZapIcon',
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
);
