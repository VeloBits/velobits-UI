import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../registry/velobits/ui/accordion';
import { audit } from './axe';

function Fixture({
  headingLevel,
  defaultValue,
}: { headingLevel?: 2 | 3 | 4; defaultValue?: string } = {}) {
  return (
    <Accordion type="single" defaultValue={defaultValue}>
      <AccordionItem value="flags">
        <AccordionTrigger headingLevel={headingLevel}>What is a feature flag?</AccordionTrigger>
        <AccordionContent>A switch you can flip without a deploy.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="envs">
        <AccordionTrigger headingLevel={headingLevel}>How do environments work?</AccordionTrigger>
        <AccordionContent>Each project starts with Production.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="sdk">
        <AccordionTrigger headingLevel={headingLevel}>Which SDKs are there?</AccordionTrigger>
        <AccordionContent>An edge worker and a JS client.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion, expand and collapse', () => {
  it('starts all-collapsed and reports it', () => {
    render(<Fixture />);
    const triggers = screen.getAllByRole('button');
    expect(triggers).toHaveLength(3);
    expect(triggers.map((t) => t.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
      'false',
    ]);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('opens a row on click and associates the panel with its trigger', async () => {
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: 'What is a feature flag?' });
    await userEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const panel = screen.getByRole('region');
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id);
    expect(panel.textContent).toContain('A switch you can flip without a deploy.');
  });

  it('closes the previous row when another opens , single-expand', async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: 'What is a feature flag?' }));
    await userEvent.click(screen.getByRole('button', { name: 'How do environments work?' }));

    expect(
      screen.getByRole('button', { name: 'What is a feature flag?' }).getAttribute('aria-expanded'),
    ).toBe('false');
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('region').textContent).toContain('Each project starts with Production');
  });

  it('collapses the open row, so "nothing open" stays reachable', async () => {
    /**
     * Radix defaults `collapsible` to FALSE for type="single", which would make
     * the first row you open permanent. The original hand-rolled component
     * deliberately allowed closing it, so the wrapper defaults it to true.
     */
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: 'What is a feature flag?' });
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('honours an explicit collapsible={false}', async () => {
    render(
      <Accordion type="single" collapsible={false} defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>Body A</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole('button', { name: 'A' });
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('supports multiple-expand when asked', async () => {
    render(
      <Accordion type="multiple">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>Body A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>B</AccordionTrigger>
          <AccordionContent>Body B</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });
});

describe('Accordion, keyboard', () => {
  it('activates with Enter and with Space', async () => {
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: 'What is a feature flag?' });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await userEvent.keyboard(' ');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('moves between triggers with the arrow keys and wraps at both ends', async () => {
    /**
     * The wrapping is the behaviour the hand-rolled version chose on purpose: on a
     * 4–8 row FAQ a dead-ended ArrowDown reads as a broken key more often than a
     * wrap surprises anyone. Radix wraps too, so the choice survived the move.
     */
    render(<Fixture />);
    const triggers = screen.getAllByRole('button');
    triggers[0]!.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(triggers[1]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(triggers[0]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(triggers[2]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(triggers[0]);
  });

  it('jumps to the ends with Home and End', async () => {
    render(<Fixture />);
    const triggers = screen.getAllByRole('button');
    triggers[1]!.focus();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(triggers[2]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(triggers[0]);
  });

  it('leaves every trigger in the tab order, as the APG accordion pattern requires', async () => {
    /** Unlike a tablist: an accordion is a stack of buttons, not a roving group. */
    render(<Fixture />);
    const triggers = screen.getAllByRole('button');
    for (const trigger of triggers) {
      expect(trigger.getAttribute('tabindex')).toBeNull();
    }
    await userEvent.tab();
    expect(document.activeElement).toBe(triggers[0]);
    await userEvent.tab();
    expect(document.activeElement).toBe(triggers[1]);
  });

  it('skips a disabled row when navigating', async () => {
    render(
      <Accordion type="single">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>Body A</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b" disabled>
          <AccordionTrigger>B</AccordionTrigger>
          <AccordionContent>Body B</AccordionContent>
        </AccordionItem>
        <AccordionItem value="c">
          <AccordionTrigger>C</AccordionTrigger>
          <AccordionContent>Body C</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    screen.getByRole('button', { name: 'A' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'C' }));
  });
});

describe('Accordion, headings', () => {
  it('wraps each trigger in an h3 by default', () => {
    render(<Fixture />);
    const headings = screen.getAllByRole('heading');
    expect(headings).toHaveLength(3);
    expect(headings[0]!.tagName).toBe('H3');
    // The button lives INSIDE the heading , a heading whose only child is the
    // control is what lets a screen reader list the rows from the heading menu.
    expect(headings[0]!.querySelector('button')).toBeTruthy();
  });

  it('takes the level from headingLevel, so the host page owns its outline', () => {
    /**
     * Radix's `Accordion.Header` is a hard-coded h3. The original component's
     * `headingLevel` prop existed because a heading that lies about its depth is
     * worse than no heading, and it is preserved via `Header asChild`.
     */
    render(<Fixture headingLevel={2} />);
    expect(screen.getAllByRole('heading')[0]!.tagName).toBe('H2');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  });

  it('zeroes the heading margin that would push rows off their dividers', () => {
    render(<Fixture />);
    expect(screen.getAllByRole('heading')[0]!.className).toContain('m-0');
  });
});

describe('Accordion, styling contract', () => {
  it('keeps the four utilities that fight the consumer bare-button rule', () => {
    /**
     * the dashboard app's styles.css styles bare `button` (border, background, radius,
     * padding) in Tailwind's components layer. Utilities win that cascade only for
     * properties one is actually written for , drop `rounded-none` and the row
     * grows a 6px-rounded panel-coloured box inside the container.
     */
    render(<Fixture />);
    const cls = screen.getAllByRole('button')[0]!.className;
    expect(cls).toContain('rounded-none');
    expect(cls).toContain('border-0');
    expect(cls).toContain('bg-transparent');
    expect(cls).toMatch(/\bpx-5\b/);
  });

  it('keeps the 44px touch minimum', () => {
    render(<Fixture />);
    expect(screen.getAllByRole('button')[0]!.className).toContain('min-h-11');
  });

  it('clips the hover band to the container instead of computing per-row radii', () => {
    /**
     * Replaces the original `triggerRadius()` helper: `overflow-hidden` clips at
     * the padding box, whose corner radius is already the outer radius minus the
     * border width , so the first and last rows follow the same 9px inner curve
     * with no arithmetic and no open/closed special case.
     */
    const { container } = render(<Fixture />);
    const root = container.firstElementChild!;
    expect(root.className).toContain('overflow-hidden');
    expect(root.className).toContain('rounded-xl');
  });

  it('aligns the trigger text logically', () => {
    render(<Fixture />);
    const cls = screen.getAllByRole('button')[0]!.className;
    expect(cls).toContain('text-start');
    expect(cls).not.toContain('text-left');
  });

  it('rotates only the chevron, and only via the trigger state group', () => {
    /** A `[&>svg]` rule would also spin an icon a caller put inside the title. */
    render(<Fixture />);
    const trigger = screen.getAllByRole('button')[0]!;
    expect(trigger.className).toContain('group/accordion-trigger');
    const chevron = trigger.querySelector('[data-slot="accordion-chevron"]')!;
    expect(chevron.className).toContain('group-data-[state=open]/accordion-trigger:rotate-180');
    // Transform and colour only , never a blur radius.
    expect(chevron.className).toContain('transition-[transform,color]');
    // --primary is 3.86:1 on the paper page; --primary-text has headroom.
    expect(chevron.className).toContain('group-data-[state=open]/accordion-trigger:text-link');
    expect(chevron.className).not.toMatch(/:text-primary\b/);
    // Decorative by default, so it is not announced beside the title text.
    expect(chevron.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Accordion, the one sanctioned height animation', () => {
  it('drives height from the Radix-measured CSS var, via tw-animate-css', async () => {
    /**
     * Animating height is otherwise banned here because it invalidates layout each
     * frame. This case is the exception: Radix measures the content in a layout
     * effect and publishes `--radix-accordion-content-height`, so the keyframes run
     * between two known pixel values. The pathological versions are an unbounded
     * `height: auto` transition (re-resolves intrinsic size every frame, or simply
     * does not animate) and `max-height: 9999px` (animates the wrong distance, so
     * the speed is wrong for every content length).
     */
    render(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: 'What is a feature flag?' }));
    const panel = screen.getByRole('region');
    expect(panel.className).toContain('data-[state=open]:animate-accordion-down');
    expect(panel.className).toContain('data-[state=closed]:animate-accordion-up');
    // The clip that makes the keyframes read as a reveal.
    expect(panel.className).toContain('overflow-hidden');
    expect(panel.className).not.toMatch(/max-h-|transition-\[height/);
  });

  it('puts caller classes on the body, never on the animated element', async () => {
    /**
     * Padding on the animated element is height the `0` keyframe cannot remove,
     * leaving a collapsed panel roughly 32px tall. Routing `className` to the body
     * makes the common case (`className="px-6"`) correct instead of a bug.
     */
    render(
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent className="max-w-none px-10">Body A</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const panel = screen.getByRole('region');
    expect(panel.className).not.toContain('px-10');
    const body = panel.querySelector('[data-slot="accordion-content-body"]')!;
    expect(body.className).toContain('px-10');
    // cn() is twMerge-based, so `max-w-none` replaces the 70ch measure cap.
    expect(body.className).toContain('max-w-none');
    expect(body.className).not.toContain('max-w-[70ch]');
  });

  it('caps the reading measure by default', () => {
    render(
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>Body A</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const body = screen.getByRole('region').querySelector('[data-slot="accordion-content-body"]')!;
    expect(body.className).toContain('max-w-[70ch]');
  });

  it('unmounts a closed panel , the one original behaviour NOT carried over', () => {
    /**
     * The hand-rolled version kept collapsed panels in the DOM (with `aria-hidden`
     * + `inert`) because the dashboard app's landing page is the product's only crawlable
     * surface. Radix unmounts them, and `forceMount` is not a substitute: with it
     * Radix never applies `hidden` and always renders children, so the panel does
     * not collapse and the height var is never set. A crawlable FAQ is a
     * page-level requirement, not this component's job , asserted here so the
     * trade-off is visible rather than discovered in a search console.
     */
    render(<Fixture />);
    expect(screen.queryByText('A switch you can flip without a deploy.')).toBeNull();
  });
});

describe('Accordion, axe', () => {
  it('finds no structural violations, collapsed', async () => {
    const violations = await audit(<Fixture />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no structural violations, one row open', async () => {
    const violations = await audit(<Fixture defaultValue="flags" />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

describe('Accordion, the container surface', () => {
  const root = () => document.querySelector('[data-slot="accordion"]')!.className;

  const Fixture = (props: { surface?: 'glass' | 'panel' | 'none' }) => (
    <Accordion type="single" {...props}>
      <AccordionItem value="a">
        <AccordionTrigger>Q</AccordionTrigger>
        <AccordionContent>A</AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  it('carries the Tier-S material by default', () => {
    render(<Fixture />);
    expect(root()).toContain('glass-surface');
  });

  it('does NOT add a border-* utility alongside the glass', () => {
    /**
     * `.glass-surface` lives in the components layer, so a `border-border`
     * utility would beat it and silently replace the material's own edge ,
     * the exact failure the Card docblock warns about.
     */
    render(<Fixture />);
    expect(root()).not.toMatch(/\bborder-border\b/);
  });

  it('falls back to the opaque panel, and to nothing when nested', () => {
    const { unmount } = render(<Fixture surface="panel" />);
    expect(root()).toContain('bg-panel');
    unmount();
    render(<Fixture surface="none" />);
    expect(root()).not.toContain('glass-surface');
    expect(root()).not.toContain('bg-panel');
  });

  it('never leaks `surface` to the DOM', () => {
    render(<Fixture surface="glass" />);
    expect(document.querySelector('[data-slot="accordion"]')!.hasAttribute('surface')).toBe(false);
  });
});
