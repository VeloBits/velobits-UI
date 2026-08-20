import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../../../registry/velobits/ui/button';
import { EmptyState } from '../../../registry/velobits/ui/empty-state';
import { audit } from './axe';

describe('EmptyState', () => {
  it('renders the title as a paragraph by default', () => {
    /**
     * An empty state is nearly always the body of a container that already has a
     * heading naming the same collection, so promoting the title would put two
     * headings in a row and heading-navigation would land on the useless one.
     */
    render(<EmptyState title="No flags yet" />);
    const title = screen.getByText('No flags yet');
    expect(title.tagName).toBe('P');
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('promotes the title when headingLevel is set, for a whole-page state', () => {
    render(<EmptyState title="No flags yet" headingLevel={2} />);
    const heading = screen.getByRole('heading', { level: 2, name: 'No flags yet' });
    expect(heading.tagName).toBe('H2');
  });

  it('hides the glyph from assistive tech', () => {
    /** Redundant with the title beside it; announcing it can only add noise. */
    const { container } = render(
      <EmptyState icon={<svg data-testid="glyph" />} title="No flags yet" />,
    );
    const slot = container.querySelector('[data-slot="empty-state-icon"]')!;
    expect(slot.getAttribute('aria-hidden')).toBe('true');
  });

  it('sizes an unsized icon and leaves a sized one alone', () => {
    const { container } = render(<EmptyState icon={<svg />} title="x" />);
    // The system's standard escape hatch: `size-*` on the icon opts out.
    expect(container.querySelector('[data-slot="empty-state-icon"]')!.className).toContain(
      "[&_svg:not([class*='size-'])]:size-6",
    );
  });

  it('renders the action, and children AFTER it', () => {
    /**
     * Supplemental "what happens next" content goes below the button, so someone
     * who already knows what they are creating never reads past the thing they
     * came to click.
     */
    const { container } = render(
      <EmptyState title="No flags yet" action={<Button>Create a flag</Button>}>
        <p>Flags let you ship dark.</p>
      </EmptyState>,
    );
    const action = container.querySelector('[data-slot="empty-state-action"]')!;
    const extra = screen.getByText('Flags let you ship dark.');
    expect(action.compareDocumentPosition(extra) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('omits the description element entirely when there is none', () => {
    const { container } = render(<EmptyState title="No flags yet" />);
    expect(container.querySelector('[data-slot="empty-state-description"]')).toBeNull();
  });

  it('lets a caller class win over the size variant', () => {
    const { container } = render(<EmptyState title="x" className="py-2" />);
    const cls = container.querySelector('[data-slot="empty-state"]')!.className;
    expect(cls).toContain('py-2');
    expect(cls).not.toContain('py-12');
  });

  /**
   * One audit per test. `audit()` renders its own `<main>` and RTL only cleans up
   * between tests, so a second audit in the same test trips
   * `landmark-no-duplicate-main` , a violation of the harness, not the component.
   */
  it('finds no axe violations as a filtered-to-nothing state', async () => {
    const violations = await audit(
      <EmptyState
        icon={<svg />}
        title="No flags match this filter"
        description="Try clearing the environment filter."
        action={<Button>Clear filters</Button>}
      />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no axe violations as a whole-page first-run state', async () => {
    const violations = await audit(
      <EmptyState headingLevel={2} title="No flags yet" description="Create one." />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

describe('EmptyState, the surface default', () => {
  const root = () => document.querySelector('[data-slot="empty-state"]')!.className;

  it('has NO surface by default , it is normally already inside one', () => {
    /**
     * The deliberate odd one out. Table, Accordion and Card default to glass
     * because they are usually outermost; an EmptyState is usually inside a
     * table body, a card body or a popover, all of which are already glass.
     * Nesting the tier composites the two ~2/255 apart and both vanish.
     */
    render(<EmptyState title="Nothing here" />);
    expect(root()).not.toContain('glass-surface');
    expect(root()).not.toContain('bg-panel');
  });

  it('opts in for the page-level first-run case', () => {
    render(<EmptyState title="Nothing here" surface="glass" />);
    expect(root()).toContain('glass-surface');
    expect(root()).not.toContain('glass-surface-blur');
  });
});
