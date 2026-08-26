import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  registerCodeLanguages,
  resetCodeLanguages,
  resolveCodeLanguage,
} from '../../../registry/velobits/lib/code-languages';
import { CodeBlock } from '../../../registry/velobits/ui/code-block';
import { audit } from './axe';

const SNIPPET = '{\n  "enabled": true\n}';

/**
 * happy-dom ships no clipboard, so every test decides explicitly which of the two
 * worlds it is in. That is the point: the insecure-origin branch is the one that
 * only shows up on a staging box, so it has to be exercised here or nowhere.
 */
function withClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

function withoutClipboard() {
  Object.defineProperty(navigator, 'clipboard', {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => withClipboard(() => Promise.resolve()));
afterEach(() => {
  vi.restoreAllMocks();
  withoutClipboard();
});

describe('CodeBlock structure', () => {
  it('renders real pre/code elements', () => {
    const { container } = render(<CodeBlock>{SNIPPET}</CodeBlock>);
    const pre = container.querySelector('pre')!;
    expect(pre.querySelector('code')!.textContent).toBe(SNIPPET);
  });

  it('makes the scroll region keyboard-reachable', () => {
    /**
     * WCAG 2.1.1: a region that scrolls must be focusable, or a mouse user can
     * read a long snippet and a keyboard user cannot scroll it at all. axe calls
     * this `scrollable-region-focusable` and needs real layout to detect it , so
     * no unit test would ever catch its absence, only this one asserting it is
     * there.
     */
    const { container } = render(<CodeBlock>{SNIPPET}</CodeBlock>);
    expect(container.querySelector('pre')!.getAttribute('tabindex')).toBe('0');
  });

  it('names the region when given a label, and adds no unnamed region without one', () => {
    const { container, unmount } = render(<CodeBlock label="Flag payload">{SNIPPET}</CodeBlock>);
    expect(screen.getByRole('region', { name: 'Flag payload' })).toBeTruthy();
    unmount();
    // An unnamed `role="region"` is an axe violation and a landmark that says
    // nothing, so it is simply not applied.
    const second = render(<CodeBlock>{SNIPPET}</CodeBlock>);
    expect(second.container.querySelector('pre')!.getAttribute('role')).toBeNull();
    expect(container).toBeTruthy();
  });

  it('emits the conventional highlighter hooks and ships no highlighter', () => {
    const { container } = render(<CodeBlock language="json">{SNIPPET}</CodeBlock>);
    expect(container.querySelector('pre')!.getAttribute('data-language')).toBe('json');
    expect(container.querySelector('code')!.className).toBe('language-json');
  });
});

describe('CodeBlock, the terminal variant', () => {
  it('paints the theme-invariant --code / --on-code pair', () => {
    /**
     * The one pair in the palette that does not flip. A revealed secret has to be
     * transcribed exactly, and a surface that changes colour with the theme
     * changes which characters are easiest to misread.
     */
    const { container } = render(<CodeBlock variant="terminal">tf_live_9f2a…</CodeBlock>);
    const cls = container.querySelector('pre')!.className;
    expect(cls).toContain('bg-code');
    expect(cls).toContain('text-on-code');
    expect(cls).not.toContain('dark:');
  });

  it('breaks all characters when wrapping, not just words', () => {
    /** A 64-character opaque key has no word boundaries; `break-words` overflows. */
    const { container } = render(
      <CodeBlock variant="terminal" wrap>
        tf_live_9f2a
      </CodeBlock>,
    );
    const cls = container.querySelector('pre')!.className;
    expect(cls).toContain('break-all');
    expect(cls).toContain('whitespace-pre-wrap');
  });

  it('tints the copy button from the token, not from a literal white', () => {
    const { container } = render(
      <CodeBlock variant="terminal" copyable>
        tf_live_9f2a
      </CodeBlock>,
    );
    const cls = container.querySelector('[data-slot="code-block-copy"]')!.className;
    expect(cls).toContain('hover:bg-on-code/10');
    expect(cls).not.toContain('bg-white');
  });
});

describe('CodeBlock, the copy button', () => {
  it('is absent unless asked for', () => {
    const { container } = render(<CodeBlock>{SNIPPET}</CodeBlock>);
    expect(container.querySelector('[data-slot="code-block-copy"]')).toBeNull();
  });

  it('copies the exact string', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    withClipboard(writeText);
    render(<CodeBlock copyable>{SNIPPET}</CodeBlock>);
    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith(SNIPPET);
  });

  it('names itself from the label, so two buttons on a page are distinguishable', async () => {
    render(
      <CodeBlock copyable label="API key">
        tf_live_9f2a
      </CodeBlock>,
    );
    expect(screen.getByRole('button', { name: 'Copy API key' })).toBeTruthy();
  });

  it('keeps the button NAME constant and confirms in a live region', async () => {
    /**
     * Swapping "Copy" for "Copied" renames the element the user is standing on.
     * Several screen readers re-announce the whole control; some announce nothing
     * at all, because the accessible name changed without a focus event. It is
     * also the only way a non-visual user learns the copy succeeded.
     */
    render(<CodeBlock copyable>{SNIPPET}</CodeBlock>);
    const button = screen.getByRole('button', { name: 'Copy code' });
    await userEvent.click(button);
    await waitFor(() => expect(screen.getByText('Copied to clipboard')).toBeTruthy());
    // Still "Copy code", not "Copied".
    expect(screen.getByRole('button', { name: 'Copy code' })).toBe(button);
  });

  it('mounts the live region empty, so the message is a CHANGE to observe', () => {
    /**
     * A live region inserted into the DOM already containing its text is
     * frequently not announced , there is nothing for the observer to observe.
     */
    const { container } = render(<CodeBlock copyable>{SNIPPET}</CodeBlock>);
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(live).not.toBeNull();
    expect(live.textContent).toBe('');
  });

  it('degrades honestly on an insecure origin instead of throwing', async () => {
    /**
     * `navigator.clipboard` is a secure-context API: over plain http the whole
     * object is absent, which is exactly how a staging box on a LAN IP is
     * reached. Unguarded, the button throws a TypeError and appears to do
     * nothing.
     */
    withoutClipboard();
    render(<CodeBlock copyable>{SNIPPET}</CodeBlock>);
    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await waitFor(() => expect(screen.getByText(/Copying is unavailable here/)).toBeTruthy());
    expect(screen.queryByText('Copied to clipboard')).toBeNull();
  });

  it('reports failure rather than success when writeText rejects', async () => {
    withClipboard(() => Promise.reject(new Error('denied')));
    render(<CodeBlock copyable>{SNIPPET}</CodeBlock>);
    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    await waitFor(() => expect(screen.getByText(/select the text/)).toBeTruthy());
  });
});

describe('CodeBlock, axe', () => {
  it('finds no violations on a labelled, copyable block', async () => {
    const violations = await audit(
      <CodeBlock label="Flag payload" language="json" copyable>
        {SNIPPET}
      </CodeBlock>,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no violations on the terminal variant', async () => {
    const violations = await audit(
      <CodeBlock variant="terminal" wrap copyable label="API key">
        tf_live_9f2a
      </CodeBlock>,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

/* ── The language selector ─────────────────────────────────────────────────── */

const TS = 'export const flag = true;';
const JS = 'export var flag = true;';
const PAIR = { ts: TS, js: JS };

describe('CodeBlock, when there is nothing to choose between', () => {
  /**
   * The hard requirement of the whole feature: a block that was written before
   * `variants` existed renders what it always rendered, down to the class string.
   * Several hundred call sites depend on it, and a padding regression would show
   * up as a first line indented by a control that is not there.
   */
  it('renders no selector without variants, and none for a single variant', () => {
    const bare = render(<CodeBlock>{SNIPPET}</CodeBlock>);
    expect(bare.container.querySelector('select')).toBeNull();
    bare.unmount();

    const one = render(<CodeBlock variants={{ ts: TS }} />);
    expect(one.container.querySelector('select')).toBeNull();
    expect(one.container.querySelector('code')!.textContent).toBe(TS);
  });

  it('keeps the copy button’s first-line padding exactly as it was', () => {
    const { container } = render(<CodeBlock copyable>{SNIPPET}</CodeBlock>);
    const cls = container.querySelector('pre')!.className;
    expect(cls).toContain('[&>code]:inline-block [&>code]:pe-10');
    // The selector's row reservation must not leak onto a copy-only block.
    expect(cls).not.toContain('pt-12');
  });

  it('adds no identity attribute to a block that has no selector', () => {
    // `data-block-id` exists to correlate a switch with a store key. A block
    // that can never emit one has nothing to correlate, so it stays off the DOM.
    const { container } = render(<CodeBlock copyable>{SNIPPET}</CodeBlock>);
    expect(container.querySelector('[data-slot="code-block"]')!.hasAttribute('data-block-id')).toBe(
      false,
    );
    expect(container.querySelectorAll('[aria-live="polite"]')).toHaveLength(1);
  });
});

/**
 * ── DRIVING THE LANGUAGE SELECTOR ───────────────────────────────────────────
 *
 * The selector was a native `<select>` until 2026-08-26 and is a Radix `Select`
 * now, so `userEvent.selectOptions` (which requires a real `<select>` element)
 * cannot drive it and `control.value` cannot read it. These two helpers are the
 * entire adaptation, and both encode a rule worth knowing:
 *
 *  , **Open with `fireEvent.keyDown`, never with a pointer.** The open panel is a
 *    modal Radix layer: it sets `pointer-events: none` on `document.body`, and
 *    `userEvent` THROWS on any element inheriting that rather than failing an
 *    assertion, so the error does not look like a selector problem at all.
 *  , **Options are found by their LABEL, not by their value.** An option's text
 *    is its accessible name, which is the same reason this control retired the
 *    2.5.3 `sr-only` workaround the segmented row needed. `resolveCodeLanguage`
 *    is the one source of that mapping, so a consumer-registered language works
 *    here without this file knowing it exists.
 */
async function pickLanguage(trigger: HTMLElement, language: string) {
  fireEvent.keyDown(trigger, { key: 'Enter' });
  const option = await screen.findByRole('option', {
    name: resolveCodeLanguage(language).label,
  });
  fireEvent.click(option);
  // The panel unmounts on select; anything asserted while it is still up races
  // the exit animation and, worse, is still under the pointer-events lock.
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
}

/**
 * What the closed control is showing , the Radix equivalent of reading `.value`,
 * except it reads the LABEL, because that is what a user sees and what the
 * accessibility tree carries. The raw value is asserted separately off the
 * `<pre>`'s `data-language`, which is where it is actually observable.
 */
function shownLanguage(trigger: HTMLElement): string {
  return trigger.textContent ?? '';
}

/** The options in the panel. Opens it, reads it, and leaves it open. */
async function openOptions(trigger: HTMLElement) {
  fireEvent.keyDown(trigger, { key: 'Enter' });
  await screen.findByRole('listbox');
  return screen.getAllByRole('option');
}

describe('CodeBlock, the language selector', () => {
  afterEach(resetCodeLanguages);

  it('appears once two languages exist, and reserves a row for the controls', async () => {
    const { container } = render(<CodeBlock copyable variants={PAIR} />);
    /*
     * ONE trigger, and the options live in a PORTAL that only exists while the
     * panel is open , so unlike the native `<select>` this replaced, they are not
     * in the tree at rest. `container.querySelectorAll('select')` would now find
     * nothing at all (Radix mirrors into a hidden native control only inside a
     * `<form>`), which is why this counts triggers instead.
     */
    expect(container.querySelectorAll('[data-slot="code-block-languages"]')).toHaveLength(1);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(await openOptions(screen.getByRole('combobox'))).toHaveLength(2);
    const cls = container.querySelector('pre')!.className;
    /**
     * A ROW, not a first-line indent. The old segmented row was two fixed-width
     * buttons, so `pe-*` could clear it; a dropdown's width is set by its widest
     * option and the option list is open-ended by design, so no `pe-*` value is
     * correct for every consumer's language set.
     */
    expect(cls).toContain('pt-12');
    expect(cls).not.toContain('[&>code]:pe-10');
  });

  it('sits on the START side of the copy button so the two cannot overlap', () => {
    /**
     * The copy button is `end-2` and `size-7`, so it owns the first 36px of the
     * corner. The control is pushed to `end-10` (40px) when it is there and takes
     * the corner itself when it is not , the only two states, since both are
     * absolutely positioned and neither can push the other.
     */
    const withCopy = render(<CodeBlock copyable variants={PAIR} />);
    expect(
      withCopy.container.querySelector('[data-slot="code-block-languages"]')!.className,
    ).toContain('end-10');
    withCopy.unmount();

    const alone = render(<CodeBlock variants={PAIR} />);
    const control = alone.container.querySelector('[data-slot="code-block-languages"]')!;
    expect(control.className).toContain('end-2');
    expect(control.className).not.toContain('end-10');
  });

  it('names the control after what it switches, and disambiguates it with the label', () => {
    const { unmount } = render(<CodeBlock variants={PAIR} />);
    expect(screen.getByRole('combobox', { name: 'Code language' })).toBeTruthy();
    unmount();
    render(<CodeBlock label="Usage" variants={PAIR} />);
    expect(screen.getByRole('combobox', { name: 'Code language for Usage' })).toBeTruthy();
  });

  it('gives each option the language’s full name, with no 2.5.3 workaround', async () => {
    /**
     * An option's text IS its accessible name, so the dropdown can simply say
     * "TypeScript". The segmented row could not: it had room for "TS" only, and an
     * `aria-label` of "TypeScript" over visible "TS" breaks Label in Name, so it
     * had to append the expansion in an `sr-only` span. The control shape retired
     * the workaround rather than relocating it.
     */
    render(<CodeBlock variants={PAIR} />);
    await openOptions(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'TypeScript' }).textContent).toBe('TypeScript');
    expect(screen.getByRole('option', { name: 'JavaScript' }).textContent).toBe('JavaScript');
    // And nothing is hidden from the accessibility tree to make that work.
    expect(document.querySelector('[data-slot="code-block-languages"] .sr-only')).toBeNull();
  });

  it('carries the selection in the accessibility tree, not as styling', async () => {
    /**
     * The whole "not colour alone" problem the segmented row had to solve , in
     * dark mode `--bg2` IS `--panel`, so a fill was a 1.00:1 indicator , does not
     * arise for a dropdown: which option is current is the control's own state,
     * exposed as `aria-selected` on exactly one option and as the trigger's text.
     * The tick beside the row is the visible half of that, not the source of it.
     */
    render(<CodeBlock variants={PAIR} />);
    const control = screen.getByRole('combobox', { name: 'Code language' });
    expect(shownLanguage(control)).toContain('TypeScript');

    const options = await openOptions(control);
    const selected = options.filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]!.textContent).toBe('TypeScript');
  });

  it('keeps the pre’s own semantics untouched when a selector is present', () => {
    const { container } = render(
      <CodeBlock label="Usage" copyable variants={PAIR}>
        {TS}
      </CodeBlock>,
    );
    const pre = container.querySelector('pre')!;
    expect(pre.getAttribute('tabindex')).toBe('0');
    expect(pre.getAttribute('role')).toBe('region');
    /**
     * The name gains the language, and that is the ONE thing about the `<pre>`
     * that a selector is allowed to change. A reader who tabs in after a switch
     * would otherwise meet different code under the name it had before , the live
     * region only speaks at the moment of the change. `CodePanel` names its region
     * identically; the two renderers of this feature must not be tellable apart.
     */
    expect(pre.getAttribute('aria-label')).toBe('Usage in TypeScript');
  });

  it('leaves the region name alone when there is no language to disambiguate', () => {
    const { container } = render(
      <CodeBlock label="Usage" copyable>
        {TS}
      </CodeBlock>,
    );
    expect(container.querySelector('pre')!.getAttribute('aria-label')).toBe('Usage');
  });

  it('paints a registered accent and merges its className onto the control', async () => {
    /**
     * `accent` lands on the TRIGGER rather than on the options. The panel is ours
     * to paint now , that is the point of the Radix control , but tinting each
     * row would put the accent and the highlight on the same surface, fighting.
     * So it follows the SELECTION: pick the other language and the accent goes
     * with it.
     */
    registerCodeLanguages([
      {
        id: 'py',
        label: 'Python',
        shortLabel: 'PY',
        accent: '#3776ab',
        className: 'tracking-wide',
      },
    ]);
    render(<CodeBlock variants={{ py: 'print(1)', ts: TS }} />);
    const control = screen.getByRole('combobox', { name: 'Code language' });
    expect(control.getAttribute('style')).toContain('#3776ab');
    expect(control.className).toContain('tracking-wide');

    await pickLanguage(control, 'ts');
    expect(control.getAttribute('style') ?? '').not.toContain('#3776ab');
    expect(control.className).not.toContain('tracking-wide');
  });
});

describe('CodeBlock, which language is showing', () => {
  it('defaults to the FIRST variant, which is how a block keeps its own language', () => {
    const { container } = render(<CodeBlock variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(TS);
    expect(container.querySelector('pre')!.getAttribute('data-language')).toBe('ts');
    expect(shownLanguage(screen.getByRole('combobox'))).toContain('TypeScript');
  });

  it('lets defaultLanguage override the first entry', () => {
    const { container } = render(<CodeBlock defaultLanguage="js" variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(JS);
    expect(container.querySelector('code')!.className).toBe('language-js');
  });

  it('ignores a defaultLanguage this block was never given', () => {
    /*
     * Falling back to the first variant keeps the control in step with the code
     * on screen. Under the native `<select>` a value naming no option showed
     * blank; under Radix it shows the PLACEHOLDER, and there is none here , so
     * the trigger would render empty. Same class of bug, louder failure.
     */
    const { container } = render(<CodeBlock defaultLanguage="rust" variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(TS);
    expect(shownLanguage(screen.getByRole('combobox'))).toContain('TypeScript');
  });

  it('renders pre-highlighted html when a variant has it, and text when it does not', async () => {
    const { container } = render(
      <CodeBlock
        variants={[
          { language: 'ts', code: TS, html: '<span data-hl="keyword">export</span> const' },
          { language: 'js', code: JS },
        ]}
      />,
    );
    expect(container.querySelector('code [data-hl="keyword"]')).not.toBeNull();

    await pickLanguage(screen.getByRole('combobox'), 'js');
    expect(container.querySelector('code [data-hl]')).toBeNull();
    expect(container.querySelector('code')!.textContent).toBe(JS);
  });

  it('copies the SELECTED variant’s literal code, never the markup', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    withClipboard(writeText);
    render(
      <CodeBlock
        copyable
        variants={[
          { language: 'ts', code: TS, html: '<span>markup</span>' },
          { language: 'js', code: JS },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenLastCalledWith(TS);

    await pickLanguage(screen.getByRole('combobox'), 'js');
    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenLastCalledWith(JS);
    expect(writeText).not.toHaveBeenCalledWith('<span>markup</span>');
  });

  it('still renders children when no variants are given', () => {
    const { container } = render(<CodeBlock language="json">{SNIPPET}</CodeBlock>);
    expect(container.querySelector('code')!.textContent).toBe(SNIPPET);
    expect(container.querySelector('code')!.className).toBe('language-json');
  });
});

describe('CodeBlock, controlled and uncontrolled selection', () => {
  it('owns the value when uncontrolled, AND still reports the switch', async () => {
    /**
     * Both halves matter. The report is what makes the value liftable into a
     * store later , a consumer mirrors it today and adds `selectedLanguage`
     * when they are ready, without converting the call site first.
     */
    const onLanguageChange = vi.fn();
    const { container } = render(
      <CodeBlock blockId="usage" variants={PAIR} onLanguageChange={onLanguageChange} />,
    );

    await pickLanguage(screen.getByRole('combobox'), 'js');
    expect(container.querySelector('code')!.textContent).toBe(JS);
    expect(onLanguageChange).toHaveBeenCalledWith('js', { blockId: 'usage' });
  });

  it('stores nothing when controlled, and reports every switch', async () => {
    const onLanguageChange = vi.fn();
    const { container } = render(
      <CodeBlock selectedLanguage="ts" variants={PAIR} onLanguageChange={onLanguageChange} />,
    );

    await pickLanguage(screen.getByRole('combobox'), 'js');
    // Unmoved: the caller owns the value and has not changed it.
    expect(container.querySelector('code')!.textContent).toBe(TS);
    expect(shownLanguage(screen.getByRole('combobox'))).toContain('TypeScript');
    expect(onLanguageChange).toHaveBeenCalledWith('js', { blockId: expect.any(String) });
  });

  it('follows the controlled value when the caller does change it', () => {
    const { container, rerender } = render(<CodeBlock selectedLanguage="ts" variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(TS);
    rerender(<CodeBlock selectedLanguage="js" variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(JS);
  });

  it('shows the first variant when the controlled value names an absent language', () => {
    const { container } = render(<CodeBlock selectedLanguage="rust" variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(TS);
  });

  it('reports nothing when the active language is re-selected', async () => {
    // `onLanguageChange` is a change, not an activation. A store does not want a
    // dispatch per interaction with the option that is already showing.
    const onLanguageChange = vi.fn();
    render(<CodeBlock variants={PAIR} onLanguageChange={onLanguageChange} />);
    await pickLanguage(screen.getByRole('combobox'), 'ts');
    expect(onLanguageChange).not.toHaveBeenCalled();
  });
});

describe('CodeBlock, one page with several blocks', () => {
  it('gives every block its own blockId and its own selection', async () => {
    /**
     * The reason the callback carries `blockId` at all. A docs page has a dozen
     * blocks; a bare `(language)` callback cannot say which one moved, so it
     * cannot be reduced into anything.
     */
    const onLanguageChange = vi.fn();
    render(
      <>
        <CodeBlock label="First" variants={PAIR} onLanguageChange={onLanguageChange} />
        <CodeBlock label="Second" variants={PAIR} onLanguageChange={onLanguageChange} />
      </>,
    );

    const first = screen.getByRole('combobox', { name: 'Code language for First' });
    const second = screen.getByRole('combobox', { name: 'Code language for Second' });

    await pickLanguage(first, 'js');
    expect(shownLanguage(first)).toContain('JavaScript');
    // Independent: the second block never heard about it.
    expect(shownLanguage(second)).toContain('TypeScript');

    await pickLanguage(second, 'js');

    const ids = onLanguageChange.mock.calls.map((call) => (call[1] as { blockId: string }).blockId);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(ids.every(Boolean)).toBe(true);
  });
});

describe('CodeBlock, the selector’s keyboard and announcements', () => {
  it('is ONE tab stop, and the platform drives the options', async () => {
    /**
     * The segmented row had to implement this: a radiogroup is one tab stop, so
     * it needed a roving `tabIndex` and Arrow handlers that select as they move.
     * A dropdown is one tab stop with the options on a layer, and neither the
     * native control nor Radix asks this component for a single line of keyboard
     * code , which is most of why this is a dropdown.
     */
    const { container } = render(<CodeBlock copyable variants={PAIR} />);
    const control = screen.getByRole('combobox');
    expect(control.getAttribute('tabindex')).toBeNull();

    await userEvent.tab();
    expect(document.activeElement).toBe(control);

    await pickLanguage(control, 'js');
    expect(container.querySelector('code')!.textContent).toBe(JS);
  });

  it('mounts the language live region empty and announces the switch', async () => {
    /**
     * The code region's content changed under whoever was reading it and nothing
     * else would say so , the `<pre>`'s name and role are unchanged by a switch.
     * Empty at mount for the same reason the copy confirmation is: a region that
     * arrives already containing its text is frequently not announced.
     */
    const { container } = render(<CodeBlock variants={PAIR} />);
    const live = container.querySelector('[data-slot="code-block-language-status"]')!;
    expect(live.textContent).toBe('');

    await pickLanguage(screen.getByRole('combobox'), 'js');
    await waitFor(() => expect(live.textContent).toBe('JavaScript'));
  });
});

describe('CodeBlock, axe with a selector', () => {
  it('finds no violations on a labelled, copyable, multi-language block', async () => {
    const violations = await audit(
      <CodeBlock label="Usage" copyable variants={PAIR}>
        {TS}
      </CodeBlock>,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no violations on the terminal variant with a selector', async () => {
    const violations = await audit(
      <CodeBlock
        variant="terminal"
        wrap
        copyable
        label="Request"
        variants={{ bash: 'curl -s /v1', ts: TS }}
      />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
