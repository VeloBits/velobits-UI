'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { CheckIcon, CopyIcon } from '@velobitsio/icons';

import { cn } from '../lib/cn';
import { resolveCodeLanguage, toCodeVariants, type CodeVariant } from '../lib/code-languages';
import { buttonVariants } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

/**
 * Preformatted code, a config payload, a curl snippet, a revealed secret.
 *
 * ```tsx
 * <CodeBlock language="json" copyable>{prettyJson(config)}</CodeBlock>
 * <CodeBlock variant="terminal" wrap copyable label="API key">{key}</CodeBlock>
 * ```
 *
 * ## The `terminal` variant is theme-invariant, and that is the feature
 *
 * It paints `--code` / `--on-code`, the one pair in the palette that does not
 * flip between light and dark. This is where the dashboard app's `.reveal-token`
 * rule lands , the surface a one-time API key is shown on.
 *
 * A revealed secret is the only string in the product that has to be transcribed
 * *exactly*, and pinning the surface means the characters that are easy to
 * confuse are the same characters in both themes. It also makes the block read as
 * "not part of the page", which is the right signal for content you are being
 * shown once. The pair measures 12.95:1.
 *
 * ## There is deliberately no highlighter here
 *
 * `language` emits `data-language` and the conventional `language-*` class, and
 * stops. Shiki and Prism are 100 kB-plus and a design system must not force that
 * on a consumer whose only code block is a four-line curl command. Anything that
 * attaches to `.language-json` works unchanged; nothing has to be re-wired if a
 * consumer later adds one.
 *
 * `variants` is the same bargain one level up: a block may be handed several
 * pre-rendered languages, and each variant's `html` is whatever highlighted it,
 * pasted in as-is. This component chooses between them and never produces them.
 *
 * ## The language selector, and the three things it is careful about
 *
 * ```tsx
 * <CodeBlock copyable variants={{ ts: tsSource, js: jsSource }} label="Usage" />
 * ```
 *
 *  1. **`variants[0]` is the default.** Listing the block's own language first is
 *     the whole mechanism , there is no "primary" flag to keep in sync, and a
 *     derived variant appended by a build step cannot displace the authored one.
 *  2. **One variant is not a choice.** At `length <= 1` nothing is rendered and
 *     the tree is exactly what it was before this prop existed, so the several
 *     hundred blocks that never pass `variants` are untouched , including their
 *     class strings.
 *  3. **The selection is reportable without being surrendered.** `blockId` names
 *     the block and rides along on every `onLanguageChange` call, in controlled
 *     AND uncontrolled mode. A page has many blocks, so a bare `(language)`
 *     callback is unusable for a store; `(language, { blockId })` is a reducer
 *     action. Lifting the value into Redux later means adding
 *     `selectedLanguage`, not rewriting the call site.
 *
 * ## What it does NOT do: mask a secret behind a Reveal button
 *
 * Considered and left out. A mask is only meaningful for a value the server can
 * send again , and the case this replaces is a key shown exactly once, where
 * hiding it behind a click adds a step and protects nothing (it is already in the
 * DOM). A component that offers `secret` would invite it onto values where the
 * mask is theatre.
 */
const codeBlockVariants = cva(
  [
    'relative overflow-auto rounded-md font-mono text-xs leading-relaxed',
    // A scrollable region must be reachable by keyboard (WCAG 2.1.1) , hence the
    // `tabIndex={0}` below. Without it a mouse user can read a long snippet and a
    // keyboard user cannot scroll it at all. This is axe's
    // `scrollable-region-focusable`, and it needs real layout to detect, so no
    // unit test will ever catch its absence.
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
  ],
  {
    variants: {
      variant: {
        /** The default: an inset well on the surrounding surface. */
        panel: 'border border-border bg-bg2 control-recessed p-3 text-fg',
        /**
         * The pinned dark surface. See the docblock.
         *
         * `scrollbar-on-dark` is not decoration: this block scrolls (the root is
         * `overflow-auto`), and `--code` is #101828 in BOTH themes, so the
         * default thumb escalation , which mixes toward `--fg` , runs backwards
         * here in light mode. Measured: rest 4.58:1, hover 2.69:1, drag 1.79:1,
         * i.e. the bar fades into the block exactly as you reach for it. The
         * utility re-anchors hover and drag to the neutral ramp; rest is already
         * `--neutral-500` and does not move. See scrollbar.css.
         */
        terminal: 'bg-code p-3 text-on-code scrollbar-on-dark',
      },
      wrap: {
        /**
         * `break-all`, not `break-words`: a 64-character opaque key has no word
         * boundaries to break on, so `break-words` leaves it overflowing. The
         * cost is that prose inside a wrapped block breaks mid-word, which is
         * why this is opt-in rather than the default.
         */
        true: 'break-all whitespace-pre-wrap',
        false: 'whitespace-pre',
      },
    },
    defaultVariants: { variant: 'panel', wrap: false },
  },
);

interface CodeBlockOwnProps
  extends Omit<React.ComponentProps<'pre'>, 'children'>, VariantProps<typeof codeBlockVariants> {
  /** Emitted as `data-language` and `language-*`, for an optional highlighter. */
  language?: string;
  /** Show the copy button. */
  copyable?: boolean;
  /**
   * Names the block for assistive tech, and captions it when a header is shown.
   * Worth setting whenever a page has more than one: "code" is not a useful
   * announcement, and the copy button's name becomes "Copy API key".
   */
  label?: string;
  /**
   * Stable identity for this block, defaulting to a `useId()`.
   *
   * Load-bearing rather than decorative: the selection is reported as
   * `(language, { blockId })`, and a page of a dozen blocks cannot route a bare
   * language string to the right slice of a store. Pass the same key the store
   * uses , a doc slug, a snippet id , and `onLanguageChange` becomes an action
   * with no correlation work left to do.
   */
  blockId?: string;
  /**
   * The languages this block is available in, in order. **The first is the
   * default**, which is what keeps a block's own language its default: list it
   * first and a derived variant cannot displace it.
   *
   * The record form (`{ ts: '…', js: '…' }`) is the ergonomic one for a
   * hand-written block; the array form carries `html` and is what a build step
   * emits. `length <= 1` renders no selector at all.
   */
  variants?: CodeVariant[] | Record<string, string>;
  /** Controlled selection. Present means this component stores nothing. */
  selectedLanguage?: string;
  /** Uncontrolled initial selection. Falls back to `variants[0].language`. */
  defaultLanguage?: string;
  /**
   * Fires in BOTH modes , that is the point. An uncontrolled block still
   * reports every switch, so the value can be mirrored into a store today and
   * promoted to `selectedLanguage` later without touching the call site.
   * Re-activating the current language is a no-op and reports nothing.
   */
  onLanguageChange?: (language: string, meta: { blockId: string }) => void;
}

/**
 * `children` XOR `variants`, expressed so that supplying NEITHER is a type
 * error rather than an empty block at runtime.
 *
 * Two members rather than `children?: string` plus a thrown error: a block with
 * no code is a mistake a compiler can see, and the throw would only be reached
 * in the one environment (production, on a consumer's page) where it helps
 * least. Both may be supplied together , the second member permits it , which is
 * how a caller keeps a plain-text fallback next to its variants.
 */
type CodeBlockSource =
  | { children: string; variants?: never }
  | { children?: string; variants: CodeVariant[] | Record<string, string> };

export type CodeBlockProps = CodeBlockOwnProps & CodeBlockSource;

function CodeBlock({
  className,
  children,
  variant,
  wrap,
  language,
  copyable = false,
  label,
  variants,
  blockId,
  selectedLanguage,
  defaultLanguage,
  onLanguageChange,
  ...props
}: CodeBlockProps) {
  const generatedId = useId();
  const id = blockId ?? generatedId;

  const list = toCodeVariants(variants);
  // One language is not a choice. Below the threshold nothing extra is rendered
  // and the class strings below collapse to exactly what they were.
  const hasSelector = list.length > 1;

  const [stored, setStored] = useState(
    () =>
      list.find((entry) => entry.language === defaultLanguage)?.language ?? list[0]?.language ?? '',
  );
  // The `?? list[0]` is what guarantees something is always checked, including
  // when a controlled caller names a language this block was never given , the
  // alternative is a radiogroup with no checked radio, which is unreachable by
  // keyboard because every roving `tabIndex` would be -1.
  const active = list.find((entry) => entry.language === (selectedLanguage ?? stored)) ?? list[0];
  const selected = active?.language ?? '';
  const code = active?.code ?? children ?? '';
  const shown = active?.language ?? language;

  function select(next: string) {
    if (next === selected) return;
    // A present `selectedLanguage` means the caller owns the value, so nothing
    // is stored here , but the callback fires either way.
    if (selectedLanguage === undefined) setStored(next);
    onLanguageChange?.(next, { blockId: id });
  }

  const [announced, setAnnounced] = useState('');
  const mounted = useRef(false);
  useEffect(() => {
    // Skip the mount pass. A live region that receives its first text a tick
    // after mounting is a CHANGE to observe, so seeding it here would make every
    // block on the page announce its own language at load.
    if (mounted.current) setAnnounced(resolveCodeLanguage(selected).label);
    else mounted.current = true;
  }, [selected]);

  return (
    <div
      data-slot="code-block"
      data-block-id={hasSelector ? id : undefined}
      className={cn('group/code relative', className)}
    >
      {hasSelector && (
        <>
          <LanguageSelector
            variants={list}
            value={selected}
            onSelect={select}
            // The group needs a name that says what it switches , "TS / JS"
            // floating unnamed in a corner is an unlabelled control, and with
            // two blocks on a page it is an ambiguous one.
            name={label ? `Code language for ${label}` : 'Code language'}
            // Start side of the copy button, never under it: the button is
            // `end-2` and 28px wide, so it owns the first 36px of the corner.
            className={copyable ? 'end-10' : 'end-2'}
          />
          {/*
           * The content of the region below changed under whoever was reading
           * it, and nothing else would say so , the `<pre>`'s own name and role
           * are unchanged by a switch. Mounted empty for the same reason the
           * copy button's is; see point 2 of that docblock.
           */}
          <span aria-live="polite" data-slot="code-block-language-status" className="sr-only">
            {announced}
          </span>
        </>
      )}
      {copyable && (
        <CopyButton
          // Always the SELECTED variant's literal text, never the highlighted
          // markup , `html` is a rendering of `code`, not a substitute for it.
          value={code}
          label={label}
          className={cn(
            'absolute end-2 top-2 z-raised',
            // Tinted from the token rather than from a literal `white/10`, so the
            // hover wash stays on the same surface's own axis.
            variant === 'terminal' && 'text-on-code hover:bg-on-code/10 hover:text-on-code',
          )}
        />
      )}
      <pre
        // See the note in the cva base: a scrollable region needs to be
        // focusable, and this one scrolls by construction.
        tabIndex={0}
        role={label ? 'region' : undefined}
        /*
         * The NAME carries the language whenever there is a choice to be in.
         *
         * This is the half that survives without live regions: the announcement
         * below fires at the moment of the switch, which is no help to a reader
         * who tabs into the block later and meets a different listing under the
         * name it had before. `CodePanel` in the docs app names its region the
         * same way, and the two must agree , they are two renderers of one
         * feature, and a screen-reader user should not be able to tell which one
         * drew the page.
         *
         * Only when a selector exists: a single-language block has nothing to
         * disambiguate, and "Usage in TypeScript" on a block that is only ever
         * TypeScript is noise in every announcement of it.
         */
        aria-label={
          label && hasSelector && shown ? `${label} in ${resolveCodeLanguage(shown).label}` : label
        }
        data-slot="code-block-pre"
        data-language={shown}
        className={cn(
          codeBlockVariants({ variant, wrap }),
          /*
           * Two different mechanisms, because the two controls are two different
           * shapes.
           *
           * The copy button alone is 28px and a known quantity, so it is cleared
           * by indenting the FIRST LINE only , `pe-12` on the whole block would
           * indent every line of a long snippet. That string is byte-for-byte the
           * one this file has always emitted.
           *
           * A dropdown is not a known quantity. Its width is set by its widest
           * `<option>`, and the option list is open-ended by design , a consumer
           * registering `objective-c` widens it. So the selector case reserves a
           * ROW instead of a width: correct for any label, at the cost of one
           * line of height on blocks that have a selector at all.
           */
          copyable && !hasSelector && '[&>code]:inline-block [&>code]:pe-10',
          hasSelector && 'pt-12',
        )}
        {...props}
      >
        {/*
         * `children` and `dangerouslySetInnerHTML` are mutually exclusive props
         * in React, so they are spread as one or the other rather than branched
         * into two near-identical elements , which is also what keeps the
         * `language-*` hook and the class string written exactly once.
         */}
        <code
          className={shown ? `language-${shown}` : undefined}
          {...(active?.html
            ? { dangerouslySetInnerHTML: { __html: active.html } }
            : { children: code })}
        />
      </pre>
    </div>
  );
}

/**
 * ## A DROPDOWN, and since 2026-08-26 the system's `Select` rather than `NativeSelect`
 *
 * This was a segmented row of `role="radio"` buttons with roving `tabIndex` and
 * arrow-key handling. It became a dropdown, which deleted all of that.
 *
 * Two reasons for the dropdown, and the second is the durable one:
 *
 *  , A segmented row spends horizontal space per option. It is comfortable at two
 *    languages, tight at three, and at four it is eating the first line of the
 *    code it sits over. A dropdown is one control width no matter how many
 *    languages are registered , and since {@link registerCodeLanguages} exists
 *    precisely so consumers can add their own, "how many options" is not a number
 *    this component gets to know.
 *  , An option's text IS its accessible name. The row needed "TS" visible with
 *    "TypeScript" appended in an `sr-only` span, because an `aria-label` of
 *    "TypeScript" over visible "TS" breaks WCAG 2.5.3 Label in Name. A dropdown
 *    has room for the real word, so the workaround goes away rather than moving.
 *
 * ## Why it is `Select` now and not `NativeSelect`
 *
 * This control sits ON TOP OF a code block, and a native `<select>`'s option
 * popup is drawn by the OS: square corners, no shadow, no padding, and , on
 * Chromium , a fill taken from the select's own `background`. Over a syntax-
 * highlighted panel that is the least finished-looking surface on the page, and
 * it is the one thing a reader of the docs clicks on every visit.
 *
 * The objection that used to rule Radix out here was bundle weight (a popper for
 * two buttons) plus ADR-0031's testability argument. Neither holds now: the
 * popper is already paid for , `Dialog`, `Popover`, `DropdownMenu` and `Tooltip`
 * all ship it, so any consumer with an overlay has it , and the testability
 * ground expired with the polyfills in `packages/ui/test/setup.ts`. See the
 * docblock in `select.tsx`.
 *
 * `size="sm"` rather than hand-patched heights. That variant exists BECAUSE of
 * this call site and the icon playground's two pickers, all of which previously
 * wrote `h-7 w-auto text-xs` plus a background-position nudge by hand.
 *
 * `accent` and `className` from the language definition are applied on top, so a
 * consumer who registers Python with Python's blue gets it here without this file
 * knowing Python exists. `accent` lands on the TRIGGER; unlike the native
 * control, the panel is ours to paint too, but tinting per-option would make the
 * highlight and the accent fight for the same row.
 *
 * ## Why the terminal variant is not re-tinted
 *
 * The row used to darken itself on a `terminal` block. The dropdown deliberately
 * does not, and it is now a plainer decision than it was: the panel is glass on
 * the overlay tier and reads correctly over either variant, so a hand-tinted
 * track would buy blending at the cost of a control that no longer looks like a
 * control. (Under `NativeSelect` this was also a hard constraint rather than a
 * preference , its chevron was a background SVG with its colour spelled out per
 * theme, so a hand-tinted track put a light-theme glyph on a dark fill with no
 * variant to correct it.)
 */
function LanguageSelector({
  variants,
  value,
  onSelect,
  name,
  className,
}: {
  variants: CodeVariant[];
  value: string;
  onSelect: (language: string) => void;
  name: string;
  className?: string;
}) {
  const language = resolveCodeLanguage(value);

  return (
    <Select value={value} onValueChange={onSelect}>
      <SelectTrigger
        aria-label={name}
        data-slot="code-block-languages"
        size="sm"
        style={language.accent ? { color: language.accent } : undefined}
        className={cn(
          /*
           * `w-auto` because `SelectTrigger` is `w-full` for the form case, and
           * this one is absolutely positioned in a corner , a full-width trigger
           * would span the block. The panel still floors at the trigger's width,
           * so a narrow trigger does not produce a narrow panel.
           */
          'absolute top-2 z-raised w-auto',
          className,
          language.className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {variants.map((entry) => (
          <SelectItem key={entry.language} value={entry.language}>
            {resolveCodeLanguage(entry.language).label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * ## Three things go wrong with a copy button, and two of them are silent
 *
 *  1. **`navigator.clipboard` is undefined on an insecure origin.** It is a
 *     secure-context API, so the whole object , not just the method , is absent
 *     over plain http, which is exactly how a staging box on a LAN IP gets
 *     reached. Unguarded, the button throws a TypeError on click and appears to
 *     do nothing at all. Here it falls through to a stated instruction to copy
 *     by hand, which is the honest outcome: the browser will not let the page do
 *     it, and pretending otherwise is how someone walks away without their key.
 *  2. **The label changes under a focused button.** Swapping "Copy" for "Copied"
 *     renames the element the user is standing on; several screen readers
 *     re-announce the whole control, and some announce nothing because the
 *     accessible name changed without a focus event. The name here is constant
 *     and the confirmation goes to a separate live region , which is also the
 *     only way a non-visual user learns the copy succeeded at all.
 *  3. **The reset timer outlives the component.** Copy, navigate away, and
 *     `setState` fires on an unmounted tree. Cleared on unmount below.
 */
function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    clearTimeout(timer.current);
    try {
      // Presence-checked, not optional-chained: on an insecure origin the whole
      // `clipboard` object is absent, so `?.writeText()` would resolve to
      // `undefined` and the success branch would run on a copy that never
      // happened , the one failure worse than throwing.
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('manual');
    }
    timer.current = setTimeout(() => setState('idle'), 2000);
  }, [value]);

  return (
    <>
      <button
        type="button"
        data-slot="code-block-copy"
        // Constant, deliberately , see point 2 in the docblock.
        aria-label={label ? `Copy ${label}` : 'Copy code'}
        onClick={copy}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-7', className)}
      >
        {state === 'copied' ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      </button>
      {/*
       * `aria-live` on a permanently-mounted, initially-empty region. A region
       * that is added to the DOM already containing its message is frequently
       * not announced , the observer has nothing to observe a change to.
       */}
      <span aria-live="polite" className="sr-only">
        {state === 'copied' && 'Copied to clipboard'}
        {state === 'manual' && 'Copying is unavailable here , select the text and press Ctrl+C'}
      </span>
    </>
  );
}

export { CodeBlock, codeBlockVariants };
