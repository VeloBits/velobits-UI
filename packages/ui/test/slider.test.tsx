import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Label } from '../../../registry/velobits/ui/label';
import { Slider } from '../../../registry/velobits/ui/slider';
import { audit } from './axe';

/**
 * The accessible name of the element that actually has `role="slider"`.
 *
 * Deliberately computed from the DOM rather than read off an attribute. The bug
 * this component exists to avoid , a name attached to the wrong element , leaves
 * every attribute present and correct-looking while the computed name is empty,
 * so asserting `toHaveAttribute('aria-label')` would pass on the broken version.
 */
function thumbName(thumb: HTMLElement): string {
  const labelledBy = thumb.getAttribute('aria-labelledby');
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
  }
  return thumb.getAttribute('aria-label')?.trim() ?? '';
}

describe('Slider, THE TRAP , the name belongs on the thumb', () => {
  /**
   * Radix renders `Slider.Root` as a plain `<span>` and puts `role="slider"`,
   * `tabindex` and the `aria-value*` triplet on each **Thumb**.
   *
   * So the two things a developer reaches for first both fail silently:
   * `<label htmlFor>` pointing at the root associates with nothing (a `<span>`
   * is not labelable), and `aria-label` on the root names a roleless element
   * while the focusable thumb stays anonymous. Same family as the `htmlFor`
   * trap in `segmented-control.tsx`, one element further in.
   */
  it('resolves a name on the element that has role="slider"', () => {
    render(
      <>
        <span id="size-label">Size</span>
        <Slider aria-labelledby="size-label" defaultValue={[24]} min={8} max={128} />
      </>,
    );
    const thumb = screen.getByRole('slider');
    expect(thumbName(thumb), 'the thumb, not the root, is what AT focuses').toBe('Size');
  });

  it('accepts aria-label for the no-visible-label case', () => {
    render(<Slider aria-label="Opacity" defaultValue={[50]} />);
    expect(thumbName(screen.getByRole('slider'))).toBe('Opacity');
  });

  it('has a non-labelable root, which is the whole reason those two props exist', () => {
    /**
     * Pins the fact the API is designed around. If Radix ever renders the root
     * as a real form control, `htmlFor` starts working and the required-name
     * union could be relaxed , this is the test that would notice.
     */
    const { container } = render(<Slider aria-label="Opacity" defaultValue={[50]} />);
    const root = container.querySelector('[data-slot="slider"]')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.getAttribute('role'), 'the root carries no slider role').toBeNull();
  });

  it('names each thumb separately when there are two', () => {
    /**
     * One shared name announces both handles identically, and a screen-reader
     * user cannot tell which end of the range they are holding , which is the
     * entire difficulty of a two-thumb slider.
     */
    render(
      <Slider
        aria-label="Rollout window"
        thumbLabels={['Rollout window, start', 'Rollout window, end']}
        defaultValue={[20, 80]}
      />,
    );
    expect(screen.getAllByRole('slider').map(thumbName)).toEqual([
      'Rollout window, start',
      'Rollout window, end',
    ]);
  });

  it('a per-thumb name wins outright, rather than stacking with the group name', () => {
    /**
     * An element carrying both `aria-label` and `aria-labelledby` announces only
     * the referenced text , `aria-labelledby` silently wins. Leaving both on
     * would therefore DROP the specific per-thumb name, which is the opposite of
     * what passing `thumbLabels` asks for.
     */
    render(
      <>
        <span id="group-label">Rollout window</span>
        <Slider
          aria-labelledby="group-label"
          thumbLabels={['Start', 'End']}
          defaultValue={[20, 80]}
        />
      </>,
    );
    const [start] = screen.getAllByRole('slider');
    expect(start!.getAttribute('aria-labelledby')).toBeNull();
    expect(thumbName(start!)).toBe('Start');
  });
});

describe('Slider, value reporting', () => {
  it('renders one thumb per value', () => {
    const { unmount } = render(<Slider aria-label="One" defaultValue={[10]} />);
    expect(screen.getAllByRole('slider')).toHaveLength(1);
    unmount();
    render(<Slider aria-label="Two" defaultValue={[10, 90]} />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('follows a CONTROLLED value when the thumb count changes', () => {
    /**
     * Two separate renders above, a rerender here, and the difference is the
     * point rather than test style.
     *
     * Changing `defaultValue` on a mounted control is a no-op , standard
     * uncontrolled semantics, Radix holds the initial value in its own state.
     * The thumb count is derived HERE from the props, so this file would render
     * a second thumb while Radix's own `SliderThumb` returns `null` for an index
     * its context has no value at. The two layers can disagree, and when they do
     * the extra thumb vanishes silently rather than throwing , which is why the
     * controlled path gets its own assertion.
     */
    const { rerender } = render(<Slider aria-label="Range" value={[10]} onValueChange={vi.fn()} />);
    expect(screen.getAllByRole('slider')).toHaveLength(1);
    rerender(<Slider aria-label="Range" value={[10, 90]} onValueChange={vi.fn()} />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('renders a single thumb when neither value nor defaultValue is given', () => {
    // Radix's own uncontrolled fallback. Worth pinning: the thumb count is
    // derived here, not by the primitive, so a wrong fallback renders NO thumb
    // and the control silently becomes unusable rather than throwing.
    render(<Slider aria-label="Bare" min={0} max={10} />);
    expect(screen.getAllByRole('slider')).toHaveLength(1);
  });

  it('carries the value triplet AT so can report position', () => {
    render(<Slider aria-label="Size" defaultValue={[24]} min={8} max={128} />);
    const thumb = screen.getByRole('slider');
    expect(thumb.getAttribute('aria-valuenow')).toBe('24');
    expect(thumb.getAttribute('aria-valuemin')).toBe('8');
    expect(thumb.getAttribute('aria-valuemax')).toBe('128');
  });

  it('formatValue writes aria-valuetext, which is what carries the UNIT', () => {
    /**
     * `aria-valuenow` is a bare number. Whether 24 means pixels, percent or
     * items lives in the visible label, which is heard once on focus and not
     * again for the rest of the drag. `aria-valuetext` REPLACES the number in
     * the announcement, so the unit comes along on every step.
     */
    render(
      <Slider
        aria-label="Size"
        defaultValue={[24]}
        min={8}
        max={128}
        formatValue={(value) => `${value} pixels`}
      />,
    );
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('24 pixels');
  });

  it('omits aria-valuetext entirely when no formatter is given', () => {
    // An empty or stringified-number valuetext would be worse than none: it
    // overrides aria-valuenow with the same information, minus the unit.
    render(<Slider aria-label="Size" defaultValue={[24]} />);
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBeNull();
  });

  it('reports a new value from the keyboard', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Slider aria-label="Size" value={[24]} onValueChange={onValueChange} min={8} max={128} />,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('slider'));
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenCalledWith([25]);
  });

  it('steps by the configured step, not by one', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Slider aria-label="Size" value={[20]} onValueChange={onValueChange} step={5} />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenCalledWith([25]);
  });
});

describe('Slider, disabled is a real disable', () => {
  /**
   * Same standard `SegmentedControl` holds itself to: `pointer-events-none`
   * removes the mouse and nothing else , the control keeps its tabindex, stays
   * operable with arrow keys, and never tells AT it is unavailable.
   */
  it('takes the thumb out of the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Slider aria-label="Size" defaultValue={[24]} disabled />
        <button type="button">after</button>
      </>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'before' }));
    await user.tab();
    expect(document.activeElement, 'focus must skip the slider entirely').toBe(
      screen.getByRole('button', { name: 'after' }),
    );
  });

  it('does not change value from the keyboard when disabled', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Slider aria-label="Size" value={[24]} onValueChange={onValueChange} disabled />);
    await user.keyboard('{Tab}{ArrowRight}{ArrowRight}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a not-allowed cursor rather than removing pointer events', () => {
    const { container } = render(<Slider aria-label="Size" defaultValue={[24]} disabled />);
    const root = container.querySelector('[data-slot="slider"]')!;
    expect(root.className).toContain('data-[disabled]:cursor-not-allowed');
    expect(root.className, 'pointer-events-none is a fake disable').not.toContain(
      'pointer-events-none',
    );
  });
});

describe('Slider, the material and the target size', () => {
  it('gives the thumb a border, because the fill collides with the track in dark mode', () => {
    /**
     * `--bg2` (the track) and `--panel` (the thumb) are the SAME hex in dark
     * mode, so the edge is the only thing separating the knob from its groove.
     * `--field-border` is the one ramp step clearing 3:1 against both themes'
     * surfaces , same token, same reasoning, as the selected segment in
     * `segmented-control.tsx`.
     */
    const { container } = render(<Slider aria-label="Size" defaultValue={[24]} />);
    const thumb = container.querySelector('[data-slot="slider-thumb"]')!;
    expect(thumb.className).toContain('border-field-border');
    expect(thumb.className).toContain('bg-panel');
  });

  it('extends the pointer target to 24px without growing the visible thumb', () => {
    /**
     * WCAG 2.2 §2.5.8 wants 24×24 CSS px. `size-4` is 16, `-inset-1` adds 4 on
     * every side: 16 + 8 = 24 exactly. Shrinking the inset silently drops the
     * control under the threshold, which nothing else here would catch.
     */
    const { container } = render(<Slider aria-label="Size" defaultValue={[24]} />);
    const thumb = container.querySelector('[data-slot="slider-thumb"]')!;
    expect(thumb.className).toContain('size-4');
    expect(thumb.className).toContain('before:-inset-1');
  });

  it('makes the track recessed and the fill primary', () => {
    const { container } = render(<Slider aria-label="Size" defaultValue={[24]} />);
    expect(container.querySelector('[data-slot="slider-track"]')!.className).toContain(
      'control-recessed',
    );
    expect(container.querySelector('[data-slot="slider-range"]')!.className).toContain(
      'bg-primary',
    );
  });

  it('sets touch-none, without which a drag scrolls the page instead', () => {
    const { container } = render(<Slider aria-label="Size" defaultValue={[24]} />);
    expect(container.querySelector('[data-slot="slider"]')!.className).toContain('touch-none');
  });
});

describe('Slider, axe', () => {
  it('finds no structural violations, named by aria-labelledby', async () => {
    const violations = await audit(
      <>
        <Label id="axe-slider-label">Size</Label>
        <Slider aria-labelledby="axe-slider-label" defaultValue={[24]} min={8} max={128} />
      </>,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no structural violations on a two-thumb range', async () => {
    const violations = await audit(
      <Slider aria-label="Rollout window" thumbLabels={['Start', 'End']} defaultValue={[20, 80]} />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no structural violations when disabled', async () => {
    const violations = await audit(<Slider aria-label="Size" defaultValue={[24]} disabled />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
