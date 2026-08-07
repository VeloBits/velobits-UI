import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  THEME_STORAGE_KEYS,
  readStoredMode,
  resolveTheme,
  themeInitScript,
} from '../../../registry/velobits/lib/theme';
import { ThemeProvider, useTheme } from '../../../registry/velobits/hooks/use-theme';

/**
 * happy-dom has no matchMedia; drive the OS preference explicitly.
 *
 * `matches` is read through a getter over MUTABLE state, because a real
 * MediaQueryList updates it when the preference changes. An earlier version
 * captured the initial boolean, and the resulting failure was thoroughly
 * misleading: `resolveTheme('system')` re-reads `matches` on every toggle, so
 * the provider looked like it was toggling in the wrong direction when in fact
 * the mock was reporting a stale preference.
 */
function mockSystemDark(dark: boolean) {
  let current = dark;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes('prefers-color-scheme: dark') ? current : false;
    },
    media: query,
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return {
    /**
     * Wrapped in `act` because the provider's listener calls `setState` from
     * outside React's event system. Without it the update is never flushed and
     * the assertion reads the pre-change value — which looks exactly like the
     * listener not being registered at all.
     */
    change(next: boolean) {
      current = next;
      act(() => {
        for (const cb of listeners) cb({ matches: next } as MediaQueryListEvent);
      });
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

function Probe() {
  const { mode, theme, setMode, toggle } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setMode('system')}>system</button>
    </div>
  );
}

const KEY = THEME_STORAGE_KEYS.dashboard;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  document.body.className = '';
  document.documentElement.style.colorScheme = '';
  mockSystemDark(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('storage keys', () => {
  it('keeps the two live keys distinct and unchanged', () => {
    /**
     * Both stores hold real user choices. Renaming either silently discards
     * every existing preference in that app, which is why the provider requires
     * the key rather than defaulting it.
     */
    expect(THEME_STORAGE_KEYS.editor).toBe('fmx_theme_mode');
    expect(THEME_STORAGE_KEYS.dashboard).toBe('tf.theme');
  });

  it('accepts the legacy bare values both apps already persisted', () => {
    localStorage.setItem(KEY, 'dark');
    expect(readStoredMode(KEY)).toBe('dark');
    localStorage.setItem(KEY, 'light');
    expect(readStoredMode(KEY)).toBe('light');
  });

  it('falls back to system on a corrupt value instead of throwing', () => {
    localStorage.setItem(KEY, '{"mode":"dark"}');
    expect(readStoredMode(KEY)).toBe('system');
  });

  it('survives storage being unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(readStoredMode(KEY)).toBe('system');
    spy.mockRestore();
  });
});

describe('ThemeProvider', () => {
  it('reads the stored mode on first render, with no intermediate default', () => {
    /** An effect-based read would paint light first — the flash this prevents. */
    localStorage.setItem(KEY, 'dark');
    render(
      <ThemeProvider storageKey={KEY}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('resolves system against the OS preference', () => {
    mockSystemDark(true);
    render(
      <ThemeProvider storageKey={KEY}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mode').textContent).toBe('system');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('applies the class to BOTH html and body', async () => {
    /**
     * The apps toggle body.dark, the Keycloak theme toggles html.dark, and the
     * token layer's selector list matches either. Setting both makes a component
     * correct regardless of its host's convention.
     */
    render(
      <ThemeProvider storageKey={KEY}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('toggle'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('persists the choice', async () => {
    render(
      <ThemeProvider storageKey={KEY}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('toggle'));
    expect(localStorage.getItem(KEY)).toBe('dark');
  });

  it('notifies onModeChange, for consumers where the server is authoritative', async () => {
    /** the editor app syncs to its backend via RTK Query; local storage is a cache. */
    const onModeChange = vi.fn();
    render(
      <ThemeProvider storageKey={KEY} onModeChange={onModeChange}>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('toggle'));
    expect(onModeChange).toHaveBeenCalledWith('dark');
  });

  it('toggle flips what is on screen when the mode is system', async () => {
    mockSystemDark(true);
    render(
      <ThemeProvider storageKey={KEY}>
        <Probe />
      </ThemeProvider>,
    );
    // system → currently dark, so the first click must produce light.
    await userEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('follows OS changes only while the mode is system', async () => {
    const mql = mockSystemDark(false);
    render(
      <ThemeProvider storageKey={KEY}>
        <Probe />
      </ThemeProvider>,
    );
    mql.change(true);
    expect(screen.getByTestId('theme').textContent).toBe('dark');

    // An explicit choice must not be overridden by a later OS change.
    await userEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    mql.change(true);
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('can leave the DOM alone for hosts that own the class', async () => {
    /** The Keycloak theme applies `dark` itself from kcContext. */
    render(
      <ThemeProvider storageKey={KEY} disableDomSync>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

describe('the hydration hazard', () => {
  it('reports mounted=false on the first render and true after', () => {
    /**
     * The bug this exists to prevent, observed in the docs site: the server has
     * no localStorage, so it renders the `defaultMode` branch, while the client's
     * very first render already knows the stored preference. Any markup that
     * BRANCHES on `theme` therefore differs between the two, and React discards
     * the server HTML with error #418.
     *
     * `theme` is still safe to use for styling, because styling flows through the
     * `dark` class. `mounted` is for the cases where markup must differ — and the
     * better answer is usually to let CSS decide instead, as the docs header does.
     */
    const seen: boolean[] = [];
    function MountProbe() {
      const { mounted } = useTheme();
      seen.push(mounted);
      return <span data-testid="mounted">{String(mounted)}</span>;
    }
    localStorage.setItem(KEY, 'dark');
    render(
      <ThemeProvider storageKey={KEY}>
        <MountProbe />
      </ThemeProvider>,
    );
    // First render must report false — that is the render which has to match the
    // server's output.
    expect(seen[0]).toBe(false);
    expect(screen.getByTestId('mounted').textContent).toBe('true');
  });

  it('still resolves the stored theme immediately, so there is no flash', () => {
    /**
     * `mounted` must NOT be implemented by deferring the storage read. The DOM
     * class has to be correct on the first paint; only React-rendered *markup*
     * needs to wait.
     */
    localStorage.setItem(KEY, 'dark');
    render(
      <ThemeProvider storageKey={KEY}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });
});

describe('useTheme', () => {
  it('throws outside a provider rather than defaulting to light', () => {
    /** A silent fallback only shows up on the one route someone forgot to wrap. */
    expect(() => render(<Probe />)).toThrow(/must be used within a <ThemeProvider>/);
  });
});

describe('themeInitScript', () => {
  it('is synchronous and self-contained', () => {
    const script = themeInitScript(KEY);
    expect(script).toContain('"tf.theme"');
    expect(script).toContain('classList.toggle("dark"');
    // No await/import: it has to run before first paint, inline in <head>.
    expect(script).not.toMatch(/\bawait\b|\bimport\b/);
  });

  it('swallows its own errors, so a storage failure cannot block rendering', () => {
    expect(themeInitScript(KEY)).toContain('catch(e){}');
  });
});

describe('resolveTheme', () => {
  it('passes explicit modes through untouched', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('collapses system against the OS', () => {
    mockSystemDark(true);
    expect(resolveTheme('system')).toBe('dark');
    mockSystemDark(false);
    expect(resolveTheme('system')).toBe('light');
  });
});
