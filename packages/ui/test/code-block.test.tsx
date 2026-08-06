import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
     * this `scrollable-region-focusable` and needs real layout to detect it — so
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
     * frequently not announced — there is nothing for the observer to observe.
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
