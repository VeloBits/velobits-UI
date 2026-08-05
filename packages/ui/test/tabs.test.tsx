import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListVariants,
} from '../../../registry/velobits/ui/tabs';
import { audit } from './axe';

/**
 * Three tabs, because two cannot distinguish "moved one" from "toggled".
 * Radix unmounts the inactive panels, so exactly one `tabpanel` exists at a time.
 */
function Fixture({
  orientation,
  disabledSecond = false,
}: {
  orientation?: 'horizontal' | 'vertical';
  disabledSecond?: boolean;
} = {}) {
  return (
    <Tabs defaultValue="overview" orientation={orientation}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="rollout" disabled={disabledSecond}>
          Rollout
        </TabsTrigger>
        <TabsTrigger value="json">Raw JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="rollout">Rollout panel</TabsContent>
      <TabsContent value="json">JSON panel</TabsContent>
    </Tabs>
  );
}

describe('Tabs, structure and panel association', () => {
  it('emits the tablist/tab/tabpanel roles and marks exactly one tab selected', () => {
    render(<Fixture />);
    expect(screen.getByRole('tablist')).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  });

  it('wires the selected tab to its panel in both directions', () => {
    /**
     * The half that hand-rolled tab strips forget is `aria-labelledby` back on
     * the panel. Without it a screen-reader user who arrives in the panel is told
     * "tab panel" and nothing about which tab produced it.
     */
    render(<Fixture />);
    const selected = screen.getAllByRole('tab')[0]!;
    const panel = screen.getByRole('tabpanel');
    expect(selected.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(selected.id);
    expect(panel.textContent).toBe('Overview panel');
  });

  it('keeps the whole strip at one tab stop, then hands off to the panel', async () => {
    /**
     * Roving focus is the reason to reach for the primitive at all: every trigger
     * left in the tab order costs a keyboard user one press per tab just to get
     * past the strip. Only the selected trigger is tabbable; the rest are -1.
     */
    render(<Fixture />);
    const tabs = screen.getAllByRole('tab');
    await userEvent.tab();
    expect(document.activeElement).toBe(tabs[0]);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('tabpanel'));
  });
});

describe('Tabs, keyboard navigation', () => {
  it('moves and activates with ArrowRight, swapping the panel', async () => {
    render(<Fixture />);
    const tabs = screen.getAllByRole('tab');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tabpanel').textContent).toBe('Rollout panel');
  });

  it('wraps at both ends rather than dead-ending', async () => {
    render(<Fixture />);
    const tabs = screen.getAllByRole('tab');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tabs[2]);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('supports Home and End', async () => {
    render(<Fixture />);
    const tabs = screen.getAllByRole('tab');
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tabs[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('uses the block axis when vertical, and ignores the inline one', async () => {
    /** A vertical strip that also answered ArrowRight would fight the page. */
    render(<Fixture orientation="vertical" />);
    const tabs = screen.getAllByRole('tab');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[0]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('skips a disabled trigger instead of landing on it', async () => {
    render(<Fixture disabledSecond />);
    const tabs = screen.getAllByRole('tab');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[2]);
    expect(screen.getByRole('tabpanel').textContent).toBe('JSON panel');
  });

  it('does not activate a disabled trigger on click', async () => {
    render(<Fixture disabledSecond />);
    await userEvent.click(screen.getByRole('tab', { name: 'Rollout' }));
    expect(screen.getByRole('tabpanel').textContent).toBe('Overview panel');
  });
});

describe('Tabs, styling contract', () => {
  it('exposes the orientation the group selectors read', () => {
    /**
     * Every orientation-dependent class in the component is a
     * `group-data-[orientation=…]/tabs:` selector. If this attribute goes missing
     * the vertical layout flattens silently, so it is asserted rather than
     * assumed.
     */
    const { container } = render(<Fixture orientation="vertical" />);
    expect(container.firstElementChild!.getAttribute('data-orientation')).toBe('vertical');
    expect(container.firstElementChild!.className).toContain('group/tabs');
  });

  it('mirrors the list variant onto data-variant, which the triggers style from', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList variant="line">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole('tablist').getAttribute('data-variant')).toBe('line');
  });

  it('keeps ToggleFlow variant names, and they are visually distinct', () => {
    // `default` is a filled track with a raised pill; `line` is bare with an
    // underline. Renaming either breaks FlagDetailPage and AuditDetailPanel.
    expect(tabsListVariants({ variant: 'default' })).toContain('bg-bg2');
    expect(tabsListVariants({ variant: 'line' })).toContain('bg-transparent');
    expect(tabsListVariants({ variant: 'line' })).not.toContain('bg-bg2');
    // No argument at all must still produce the default track.
    expect(tabsListVariants()).toContain('bg-bg2');
  });

  it('uses the AA-gated muted step for an inactive tab, not an alpha guess', () => {
    /**
     * ToggleFlow used `text-foreground/60`, which computes to roughly 3:1 over
     * `--bg2` — under AA for 14px text — and then needed a `dark:` override that
     * made the themes disagree. `--muted-fg` is measured against both themes'
     * surfaces by @velobits/tokens.
     */
    render(<Fixture />);
    const cls = screen.getByRole('tab', { name: 'Overview' }).className;
    expect(cls).toContain('text-muted-foreground');
    expect(cls).not.toContain('text-foreground/60');
  });

  it('positions the vertical underline with logical inset so RTL needs no variant', () => {
    render(<Fixture />);
    const cls = screen.getByRole('tab', { name: 'Overview' }).className;
    expect(cls).toContain('after:end-[-4px]');
    expect(cls).not.toContain('-right-1');
  });

  it('crossfades the underline instead of animating its position', () => {
    /** Opacity and transform only — an animated inset would invalidate layout. */
    render(<Fixture />);
    const cls = screen.getByRole('tab', { name: 'Overview' }).className;
    expect(cls).toContain('after:transition-opacity');
    expect(cls).not.toContain('transition-all');
    expect(cls).not.toMatch(/backdrop-blur|transition-\[.*filter/);
  });

  it('lets a caller class win over a variant class', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList className="rounded-pill">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A</TabsContent>
      </Tabs>,
    );
    const cls = screen.getByRole('tablist').className;
    expect(cls).toContain('rounded-pill');
    expect(cls).not.toMatch(/\brounded-lg\b/);
  });
});

describe('Tabs, axe', () => {
  it('finds no structural violations, horizontal default variant', async () => {
    const violations = await audit(<Fixture />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no structural violations, vertical with a disabled trigger', async () => {
    const violations = await audit(<Fixture orientation="vertical" disabledSecond />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
