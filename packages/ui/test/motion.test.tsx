import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { duration, easing } from '../../tokens/src/scales';
import {
  FadeIn,
  PageTransition,
  STAGGER_LIMIT,
  Stagger,
  StaggerItem,
  TRANSITION,
} from '../../../registry/velobits/ui/motion';

/**
 * The motion layer's tests are mostly about the things that are easy to get wrong
 * and impossible to see: that the durations agree with the token layer, that the
 * stagger's cap actually caps, and that nothing here re-implements reduced-motion
 * handling that `VelobitsProvider` and the token layer already own.
 *
 * What is deliberately NOT tested: whether an element visually animates. Framer
 * drives that with rAF and `happy-dom` has no compositor, so asserting on
 * intermediate opacity would be asserting on the test environment.
 */

describe('TRANSITION agrees with the token layer', () => {
  /**
   * The numbers in `motion.tsx` are a genuine duplication of `--duration-*` and
   * `--ease-out`: Framer needs seconds and a cubic-bezier array, and cannot
   * interpolate a `var()` string. Duplication that nothing checks is duplication
   * that drifts, so this is the check.
   */
  const ms = (token: string) => Number(token.replace('ms', '')) / 1000;

  it('enter matches --duration-enter', () => {
    expect(TRANSITION.enter.duration).toBe(ms(duration.enter));
  });

  it('page matches --duration-page', () => {
    expect(TRANSITION.page.duration).toBe(ms(duration.page));
  });

  it('both use the system --ease-out curve', () => {
    const expected = easing.out
      .replace('cubic-bezier(', '')
      .replace(')', '')
      .split(',')
      .map(Number);
    expect([...TRANSITION.enter.ease]).toEqual(expected);
    expect([...TRANSITION.page.ease]).toEqual(expected);
  });
});

describe('PageTransition', () => {
  it('renders its children', () => {
    render(
      <PageTransition transitionKey="/flags">
        <h1>Flags</h1>
      </PageTransition>,
    );
    expect(screen.getByRole('heading', { name: 'Flags' })).toBeTruthy();
  });

  it('keeps exactly one page mounted across a key change', async () => {
    /**
     * This is the `mode="wait"` contract, and it is a correctness property rather
     * than an aesthetic one. With the default overlapping mode both routes are
     * mounted and stacked for the duration, which leaves the outgoing page's
     * focusable elements reachable by keyboard while invisible.
     */
    const { rerender } = render(
      <PageTransition transitionKey="/flags">
        <button type="button">Old page</button>
      </PageTransition>,
    );
    rerender(
      <PageTransition transitionKey="/audit">
        <button type="button">New page</button>
      </PageTransition>,
    );

    // Whichever one is present, there must never be two.
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('forwards arbitrary props to the rendered element', () => {
    render(
      <PageTransition transitionKey="/x" data-testid="page" aria-label="Main">
        <span>x</span>
      </PageTransition>,
    );
    expect(screen.getByTestId('page').getAttribute('aria-label')).toBe('Main');
  });
});

describe('Stagger', () => {
  it('renders every child, cap or no cap', () => {
    /**
     * The cap changes TIMING, never membership. A stagger that dropped rows past
     * item twelve would be a data-loss bug wearing an animation costume, and it is
     * the failure mode a naive "slice(0, LIMIT)" implementation would have.
     */
    const count = STAGGER_LIMIT + 30;
    render(
      <Stagger>
        {Array.from({ length: count }, (_, i) => (
          <StaggerItem key={i}>
            <span>row {i}</span>
          </StaggerItem>
        ))}
      </Stagger>,
    );
    expect(screen.getAllByText(/^row \d+$/)).toHaveLength(count);
  });

  it('keeps items as DIRECT children, so a grid or flex parent still works', () => {
    /**
     * The reason the cap is implemented as a clamped per-item delay rather than by
     * splitting the children into two groups: an extra wrapper element would make
     * the items grandchildren, and every `grid`/`flex` layout on the Stagger would
     * silently collapse to one column.
     */
    const { container } = render(
      <Stagger className="grid grid-cols-3">
        <StaggerItem>
          <span>a</span>
        </StaggerItem>
        <StaggerItem>
          <span>b</span>
        </StaggerItem>
      </Stagger>,
    );
    const root = container.firstElementChild!;
    expect(root.className).toContain('grid-cols-3');
    expect(root.children).toHaveLength(2);
    for (const child of Array.from(root.children)) {
      expect(child.querySelector('span')).toBeTruthy();
    }
  });

  it('passes non-StaggerItem children through untouched', () => {
    render(
      <Stagger>
        <hr data-testid="rule" />
        <StaggerItem>
          <span>item</span>
        </StaggerItem>
      </Stagger>,
    );
    expect(screen.getByTestId('rule')).toBeTruthy();
    expect(screen.getByText('item')).toBeTruthy();
  });

  it('a StaggerItem outside a Stagger still renders', () => {
    // It reads the context default rather than throwing: a lone item is a
    // reasonable thing to write, and an entrance animation is never worth a crash.
    render(
      <StaggerItem>
        <span>lonely</span>
      </StaggerItem>,
    );
    expect(screen.getByText('lonely')).toBeTruthy();
  });
});

describe('FadeIn', () => {
  it('renders children and forwards props', () => {
    render(
      <FadeIn delay={0.1} data-testid="fade">
        <span>content</span>
      </FadeIn>,
    );
    expect(screen.getByTestId('fade')).toBeTruthy();
    expect(screen.getByText('content')).toBeTruthy();
  });
});

describe('reduced motion is not re-implemented here', () => {
  it('the module never reads a reduced-motion preference itself', async () => {
    /**
     * Reduced motion is owned in exactly two places , `MotionConfig
     * reducedMotion="user"` inside `VelobitsProvider`, and the token layer's
     * `prefers-reduced-motion` block. A third path in this file would be one more
     * thing to keep in step, and the failure would be silent: motion that honours
     * the preference in some components and not others.
     *
     * Asserted against the source because the alternative is asserting on Framer's
     * internals, and this is the property that actually matters.
     */
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(
      join(here, '../../../registry/velobits/ui/motion.tsx'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

    expect(source).not.toContain('usePrefersReducedMotion');
    expect(source).not.toContain('prefers-reduced-motion');
    expect(source).not.toContain('MotionConfig');
  });
});
