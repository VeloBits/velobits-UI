import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  registerCodeLanguages,
  resetCodeLanguages,
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

describe('CodeBlock, the language selector', () => {
  afterEach(resetCodeLanguages);

  it('appears once two languages exist, and reserves a row for the controls', () => {
    const { container } = render(<CodeBlock copyable variants={PAIR} />);
    // A native <select> maps to `combobox`, and its options are in the tree.
    expect(container.querySelectorAll('select')).toHaveLength(1);
    expect(screen.getAllByRole('option')).toHaveLength(2);
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

  it('gives each option the language’s full name, with no 2.5.3 workaround', () => {
    /**
     * An `<option>`'s text IS its accessible name, so the dropdown can simply say
     * "TypeScript". The segmented row could not: it had room for "TS" only, and an
     * `aria-label` of "TypeScript" over visible "TS" breaks Label in Name, so it
     * had to append the expansion in an `sr-only` span. The control shape retired
     * the workaround rather than relocating it.
     */
    render(<CodeBlock variants={PAIR} />);
    expect(screen.getByRole('option', { name: 'TypeScript' }).textContent).toBe('TypeScript');
    expect(screen.getByRole('option', { name: 'JavaScript' }).textContent).toBe('JavaScript');
    // And nothing is hidden from the accessibility tree to make that work.
    expect(document.querySelector('[data-slot="code-block-languages"] .sr-only')).toBeNull();
  });

  it('carries the selection as the select’s own value, not as styling', () => {
    /**
     * The whole "not colour alone" problem the segmented row had to solve , in
     * dark mode `--bg2` IS `--panel`, so a fill was a 1.00:1 indicator , does not
     * arise for a `<select>`: which option is current is the control's value, in
     * the accessibility tree, and the platform draws it.
     */
    render(<CodeBlock variants={PAIR} />);
    const control = screen.getByRole('combobox', { name: 'Code language' }) as HTMLSelectElement;
    expect(control.value).toBe('ts');
    expect((screen.getByRole('option', { name: 'TypeScript' }) as HTMLOptionElement).selected).toBe(
      true,
    );
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
    expect(pre.getAttribute('aria-label')).toBe('Usage');
  });

  it('paints a registered accent and merges its className onto the control', async () => {
    /**
     * `accent` lands on the CONTROL rather than on the options, because browsers
     * largely ignore per-`<option>` styling , the closed dropdown is the only
     * surface that can carry a consumer's colour reliably. So it follows the
     * SELECTION: pick the other language and the accent goes with it.
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

    await userEvent.selectOptions(control, 'ts');
    expect(control.getAttribute('style') ?? '').not.toContain('#3776ab');
    expect(control.className).not.toContain('tracking-wide');
  });
});

describe('CodeBlock, which language is showing', () => {
  it('defaults to the FIRST variant, which is how a block keeps its own language', () => {
    const { container } = render(<CodeBlock variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(TS);
    expect(container.querySelector('pre')!.getAttribute('data-language')).toBe('ts');
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('ts');
  });

  it('lets defaultLanguage override the first entry', () => {
    const { container } = render(<CodeBlock defaultLanguage="js" variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(JS);
    expect(container.querySelector('code')!.className).toBe('language-js');
  });

  it('ignores a defaultLanguage this block was never given', () => {
    // Falling back to the first variant keeps the control's value in step with
    // the code on screen; a <select> whose value names no option shows blank.
    const { container } = render(<CodeBlock defaultLanguage="rust" variants={PAIR} />);
    expect(container.querySelector('code')!.textContent).toBe(TS);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('ts');
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

    await userEvent.selectOptions(screen.getByRole('combobox'), 'js');
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

    await userEvent.selectOptions(screen.getByRole('combobox'), 'js');
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

    await userEvent.selectOptions(screen.getByRole('combobox'), 'js');
    expect(container.querySelector('code')!.textContent).toBe(JS);
    expect(onLanguageChange).toHaveBeenCalledWith('js', { blockId: 'usage' });
  });

  it('stores nothing when controlled, and reports every switch', async () => {
    const onLanguageChange = vi.fn();
    const { container } = render(
      <CodeBlock selectedLanguage="ts" variants={PAIR} onLanguageChange={onLanguageChange} />,
    );

    await userEvent.selectOptions(screen.getByRole('combobox'), 'js');
    // Unmoved: the caller owns the value and has not changed it.
    expect(container.querySelector('code')!.textContent).toBe(TS);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('ts');
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
    await userEvent.selectOptions(screen.getByRole('combobox'), 'ts');
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

    const first = screen.getByRole('combobox', {
      name: 'Code language for First',
    }) as HTMLSelectElement;
    const second = screen.getByRole('combobox', {
      name: 'Code language for Second',
    }) as HTMLSelectElement;

    await userEvent.selectOptions(first, 'js');
    expect(first.value).toBe('js');
    // Independent: the second block never heard about it.
    expect(second.value).toBe('ts');

    await userEvent.selectOptions(second, 'js');

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
     * A `<select>` is one tab stop by construction and the platform owns the
     * option keyboard, which is most of why this is a `<select>`.
     */
    const { container } = render(<CodeBlock copyable variants={PAIR} />);
    const control = screen.getByRole('combobox') as HTMLSelectElement;
    expect(control.getAttribute('tabindex')).toBeNull();

    await userEvent.tab();
    expect(document.activeElement).toBe(control);

    await userEvent.selectOptions(control, 'js');
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

    await userEvent.selectOptions(screen.getByRole('combobox'), 'js');
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
