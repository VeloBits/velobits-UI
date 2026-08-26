'use client';

import { useId, useState } from 'react';

import {
  resolveCodeLanguage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@velobitsio/ui';

import type { DocCodeVariant } from './code-panel';
import { CopyButton } from './copy-button';

export interface CodePanelSwitcherProps {
  /**
   * Ordered, two or more. **`variants[0]` is the default language**, which is
   * what makes "keep the language the block was written in" fall out of the
   * generator listing it first rather than out of a rule stated here.
   */
  variants: DocCodeVariant[];
  label?: string;
  /**
   * Identity for this block's selection. Defaults to `useId()`, which is stable
   * across renders and across hydration but means nothing outside this component
   * , pass a key you chose (`install:src/ui/button.tsx`) if you intend to lift
   * the state later, because that key is what arrives in `onLanguageChange`.
   *
   * It is a state key, never a DOM id: React 19's `useId` values are wrapped in
   * `«…»`, which is a legal HTML id and not a legal CSS selector.
   */
  blockId?: string;
  /**
   * Controlled selection. Leave undefined and the block owns its own.
   *
   * A language this block has no variant for is not an error , it falls back to
   * the default and renders. That case is the whole point of allowing a value in
   * from outside: a page-wide "JavaScript" preference must be able to wash over a
   * CSS-only snippet without either blanking it or forcing the caller to know
   * which blocks have which languages.
   */
  selectedLanguage?: string;
  /**
   * Fired on every user selection, in BOTH the controlled and the uncontrolled
   * case, with the id of the block it came from.
   *
   * Both, deliberately. A consumer who later wants one preference for the page,
   * or a store entry per block, should be able to start listening without first
   * converting every call site to controlled , the callback is the observation
   * point, `selectedLanguage` is the override, and needing the second to get the
   * first is what makes "just add persistence" a refactor.
   *
   * Only a client component can pass this: functions do not cross the RSC
   * boundary, and most of these blocks are rendered from a server component.
   */
  onLanguageChange?: (language: string, meta: { blockId: string }) => void;
  /** Composed by `CodePanel` on the server; see the note at the top of that file. */
  wrapperClassName?: string;
  /** Likewise. Carries every measured `[&_pre]:…` rule. */
  codeClassName?: string;
  maxHeight?: string;
}

/**
 * The client half of `CodePanel`: the language selection, and the one variant it
 * resolves to.
 *
 * ## Why the state lives here and nowhere else
 *
 * Per block, in `useState`. Not a context, not `localStorage`.
 *
 * A context would make every block on a page share one language, which is the
 * wrong default for a page whose blocks are not all in the same language to begin
 * with , the Usage snippet on `/docs/velobits-theme` is CSS and the examples
 * under it are TSX, and there is no single answer for both. `onLanguageChange`
 * plus `selectedLanguage` is the same feature without the assumption: a consumer
 * who does want one preference for the page lifts it, and one who wants a store
 * entry per block has `blockId` to key it by.
 *
 * `localStorage` is a separate and harder no. This site is a static export, so
 * the markup is prerendered with the default language; reading a stored
 * preference during the first client render makes the client tree disagree with
 * the server HTML, and React 19 responds by throwing away the server HTML for
 * that subtree (#418) , which is precisely the failure `hooks/use-theme.tsx`
 * documents at length and pays a blocking inline script to avoid. Code blocks are
 * not worth a second one.
 *
 * ## What the browser is asked to carry
 *
 * Every variant's `html` is in the RSC payload, so switching is a re-render and
 * never a fetch. That is the same trade the CLI/npm tabs in `component-preview`
 * already make , both panels are in the payload whether or not the reader opens
 * the second tab , and it is the right one here for the same reason: the
 * alternative to a few kilobytes of prerendered markup is a highlighter in the
 * browser, or a network round trip to read the next paragraph of a document.
 */
export function CodePanelSwitcher({
  variants,
  label,
  blockId,
  selectedLanguage,
  onLanguageChange,
  wrapperClassName,
  codeClassName,
  maxHeight,
}: CodePanelSwitcherProps) {
  const fallbackId = useId();
  const id = blockId ?? fallbackId;

  /*
   * The uncontrolled store. Seeded from `variants[0]` rather than from a
   * constant, so a block whose first entry is CSS opens on CSS.
   *
   * Held even while controlled: a caller may hand control back (a page-level
   * preference cleared to `undefined`), and dropping the state on the way in
   * would mean losing the reader's own choice at that moment.
   */
  const [ownLanguage, setOwnLanguage] = useState(() => variants[0]?.language ?? '');

  const isControlled = selectedLanguage !== undefined;
  const requested = isControlled ? selectedLanguage : ownLanguage;

  /*
   * Resolve against what this block actually HAS. `variants[0]` is the fallback
   * for a request it cannot satisfy , see `selectedLanguage`. The fallback is
   * silent on purpose: nobody performed an action, so firing `onLanguageChange`
   * here would report a selection the reader never made, and in a controlled
   * setup would fight the owner's value on every render.
   */
  const active = variants.find((entry) => entry.language === requested) ?? variants[0];
  if (!active) return null;

  const language = resolveCodeLanguage(active.language);

  const select = (next: string) => {
    // Uncontrolled: we are the store. Controlled: the owner is, and re-renders us
    // with the new value , writing here as well would be a second copy to drift.
    if (!isControlled) setOwnLanguage(next);
    onLanguageChange?.(next, { blockId: id });
  };

  return (
    <div className={wrapperClassName}>
      {/*
       * One absolutely positioned ROW rather than two absolutely positioned
       * controls. Flow inside it is what guarantees the selector and the copy
       * button cannot overlap at any width; two elements each pinned to `end-2`
       * with their own offsets would be a pair of magic numbers that hold until
       * the day a third language widens the control.
       *
       * The group is shrink-to-fit and pinned with the logical `end-2`, so it
       * flips with the document direction the way the copy button always has. The
       * code below it never reaches this lane: `[&_pre]:pt-12` (composed in
       * `code-panel.tsx`) reserves the height inside the scrolling box.
       */}
      <div className="absolute end-2 top-2 z-raised flex items-center gap-1.5">
        {/*
         * A DROPDOWN, and since 2026-08-26 the system's `Select` rather than
         * `NativeSelect`.
         *
         * The dropdown itself replaced a `SegmentedControl` for a reason that has
         * not changed: a segmented row spends horizontal space per option, so it
         * works at two languages and starts eating the code's first line at four.
         * A dropdown is one width forever, which is the only property that
         * survives someone registering a fifth language. And an option's text IS
         * its accessible name, so there is no 2.5.3 Label-in-Name problem to work
         * around , the segmented implementation printed "TS" and hid "TypeScript"
         * beside it for exactly that reason.
         *
         * What DID change is which dropdown. This control floats over a syntax-
         * highlighted panel, and a native `<select>`'s option popup is drawn by
         * the OS , square, unshadowed, unpadded, and on Chromium filled from the
         * select's own `background`. It was the least finished-looking surface on
         * the docs site and also one of the most clicked. `Select` keeps every
         * property listed above (one tab stop, name from the option text,
         * selection in the accessibility tree rather than inferred from styling)
         * and adds a panel that belongs to the design system. ADR-0031's
         * testability objection expired with the polyfills in
         * `packages/ui/test/setup.ts`; see the docblock in `select.tsx`.
         *
         * `aria-label` rather than the `aria-labelledby` + visible caption that
         * `skill-install.tsx` uses: that pattern exists to avoid duplicating a
         * caption already on screen, and this control has no room for one. It
         * names what it switches, including which block, because a page of these
         * otherwise offers a screen-reader user a dozen identically named
         * dropdowns.
         *
         * `size="sm"` instead of the four size overrides this used to carry. That
         * variant exists because of this call site , and `w-auto` is still needed
         * because a trigger is `w-full` for the form case and this one sits in a
         * shrink-to-fit row.
         */}
        <Select value={active.language} onValueChange={select}>
          <SelectTrigger
            aria-label={label ? `Code language for ${label}` : 'Code language'}
            size="sm"
            className="w-auto backdrop-blur-sm"
            /*
             * The registered language's own colour, when it has one. `accent` is
             * how a consumer's language arrives looking like itself rather than
             * like our `--primary`. It stays on the TRIGGER: the panel is ours to
             * paint now, but tinting each row would put the accent and the
             * highlight on one surface, fighting.
             */
            style={language.accent ? { color: language.accent } : undefined}
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
        <CopyButton
          /*
           * The selected variant's literal text, and a name that says which one.
           * A reader who switched to JavaScript and copied TypeScript would have
           * no way to tell from the button, and the two payloads differ by
           * exactly the annotations that stop the paste from running.
           */
          value={active.code}
          label={label ? `Copy ${label} as ${language.label}` : `Copy code as ${language.label}`}
          className="bg-panel/80 backdrop-blur-sm"
        />
      </div>

      <div
        /*
         * The region's NAME carries the language. This is the part that survives
         * without live regions: a screen-reader user who lands in the code after
         * switching is told which language they are in, rather than meeting an
         * unannounced different listing under the same name as before.
         */
        role={label ? 'region' : undefined}
        aria-label={label ? `${label} in ${language.label}` : undefined}
        className={codeClassName}
        style={maxHeight ? ({ '--code-panel-max-h': maxHeight } as React.CSSProperties) : undefined}
        dangerouslySetInnerHTML={{ __html: active.html }}
      />

      {/*
       * And the part that covers the moment of the change, since the content of a
       * region the reader is not inside can otherwise swap in silence.
       *
       * Derived from the active variant rather than set in the click handler, so
       * it is also correct when a controlled owner changes the language from
       * somewhere else on the page. That is safe to render non-empty because a
       * live region announces MUTATIONS, not its initial content: this page is
       * prerendered, the served HTML already carries this text, and hydration
       * changes nothing about it, so mount is silent and only a real switch
       * speaks. `polite` because the reader is mid-document, not mid-error.
       */}
      <span aria-live="polite" className="sr-only">
        Showing {language.label}
      </span>
    </div>
  );
}
