import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../registry/velobits/ui/breadcrumb';
import { audit } from './axe';

function Fixture() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Acme</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/flags">Flags</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>new-checkout</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe('Breadcrumb structure', () => {
  it('is a NAMED navigation landmark', () => {
    /**
     * A page here has a sidebar nav and a pagination nav too. An unnamed
     * `navigation` is announced as "navigation", and cycling landmarks becomes
     * guesswork.
     */
    render(<Fixture />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.tagName).toBe('NAV');
  });

  it('is an ordered list, so depth is announced without reading every crumb', () => {
    render(<Fixture />);
    expect(screen.getByRole('list').tagName).toBe('OL');
  });

  it('counts only the crumbs, not the separators', () => {
    /**
     * Four crumbs and three separators are seven `<li>`s in the DOM. Without
     * `role="presentation"` on the separators the list announces "7 items" and
     * every other one is the word "slash".
     */
    render(<Fixture />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
});

describe('Breadcrumb, the leaf', () => {
  it('marks the current page with aria-current and nothing else', () => {
    render(<Fixture />);
    const page = screen.getByText('new-checkout');
    expect(page.getAttribute('aria-current')).toBe('page');
  });

  it('does NOT claim the leaf is a disabled link', () => {
    /**
     * shadcn adds `role="link" aria-disabled="true"`. That announces static,
     * unfocusable text as "link, dimmed" , asserting an affordance that was never
     * there in order to then take it away. `aria-current` already says the one
     * true thing.
     */
    render(<Fixture />);
    const page = screen.getByText('new-checkout');
    expect(page.getAttribute('role')).toBeNull();
    expect(page.getAttribute('aria-disabled')).toBeNull();
    expect(page.tagName).toBe('SPAN');
  });

  it('leaves the leaf out of the link list', () => {
    render(<Fixture />);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Acme', 'Flags']);
  });
});

describe('Breadcrumb, separator and ellipsis are opposites', () => {
  it('removes the separator from the tree entirely', () => {
    const { container } = render(<Fixture />);
    const sep = container.querySelector('[data-slot="breadcrumb-separator"]')!;
    expect(sep.getAttribute('role')).toBe('presentation');
    expect(sep.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the ellipsis IN the tree, with a word', () => {
    /**
     * The inverse of the separator: the glyph is aria-hidden by default, so
     * without the sr-only text this crumb announces as an empty list item.
     */
    const { container } = render(<Fixture />);
    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')!;
    expect(ellipsis.getAttribute('aria-hidden')).toBeNull();
    expect(ellipsis.textContent).toContain('More');
    expect(ellipsis.querySelector('.sr-only')).not.toBeNull();
  });

  it('lets a caller swap the glyph without losing the two attributes', () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const sep = container.querySelector('[data-slot="breadcrumb-separator"]')!;
    expect(sep.textContent).toBe('/');
    expect(sep.getAttribute('aria-hidden')).toBe('true');
    expect(sep.getAttribute('role')).toBe('presentation');
  });

  it('flips the chevron under RTL , the one sanctioned rtl: variant', () => {
    /**
     * The rule everywhere else is logical properties, but there is no logical
     * property for the direction a drawing points, and an unflipped chevron in
     * RTL reads as a trail pointing back the way it came.
     */
    const { container } = render(<Fixture />);
    expect(container.querySelector('[data-slot="breadcrumb-separator"]')!.className).toContain(
      'rtl:[&>svg]:rotate-180',
    );
  });
});

describe('Breadcrumb, links', () => {
  it('uses --primary-text, never --primary, on hover', () => {
    /** --primary is 3.86:1 on the paper page: a fill colour, not a text colour. */
    render(<Fixture />);
    const cls = screen.getByRole('link', { name: 'Acme' }).className;
    expect(cls).toContain('hover:text-link');
    expect(cls).not.toMatch(/\btext-primary\b/);
  });

  it('renders the child element under asChild, so a router Link works', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button type="button">Flags</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const el = screen.getByRole('button', { name: 'Flags' });
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('data-slot')).toBe('breadcrumb-link');
  });
});

describe('Breadcrumb, axe', () => {
  it('finds no violations on a trail with an ellipsis and a leaf', async () => {
    const violations = await audit(<Fixture />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
