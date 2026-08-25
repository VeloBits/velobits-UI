import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Label } from '../../../registry/velobits/ui/label';
import {
  SegmentedControl,
  type SegmentOption,
} from '../../../registry/velobits/ui/segmented-control';
import { audit } from './axe';

const OPTIONS: SegmentOption[] = [
  { value: 'dev', label: 'Development' },
  { value: 'prod', label: 'Production', tone: 'danger' },
];

describe('SegmentedControl, behaviour carried over from the dashboard app', () => {
  it('reports a new selection', async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        value="dev"
        onValueChange={onValueChange}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Production' }));
    expect(onValueChange).toHaveBeenCalledWith('prod');
  });

  it('ignores a deselect , the selection can never be empty', async () => {
    /** Clicking the active item is what Radix reports as an empty value. */
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        value="dev"
        onValueChange={onValueChange}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Development' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('maps to a radiogroup, which is what a segmented control actually is', () => {
    render(
      <SegmentedControl
        value="prod"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    const [dev, prod] = screen.getAllByRole('radio');
    expect(prod!.getAttribute('aria-checked')).toBe('true');
    expect(dev!.getAttribute('aria-checked')).toBe('false');
    // The data-state hook the dashboard app's own tests assert on still exists.
    expect(prod!.getAttribute('data-state')).toBe('on');
    expect(dev!.getAttribute('data-state')).toBe('off');
  });

  it('paints the danger tone from --danger, not from the neutral text token', () => {
    render(
      <SegmentedControl
        value="prod"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    expect(screen.getByRole('radio', { name: 'Production' }).className).toContain(
      'data-[state=on]:text-danger',
    );
    expect(screen.getByRole('radio', { name: 'Development' }).className).toContain(
      'data-[state=on]:text-fg',
    );
  });

  it('roves focus with the arrow keys, then activates on Enter', async () => {
    /**
     * Radix's ToggleGroup roving focus MOVES focus on an arrow key; it does not
     * select. That is a real gap against APG's radio-group pattern, where
     * selection follows focus , pinned here so the behaviour is a recorded
     * decision rather than a surprise. Enter and Space both activate.
     */
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        value="dev"
        onValueChange={onValueChange}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Development' }));

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Production' }));
    expect(onValueChange).not.toHaveBeenCalled();

    await userEvent.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('prod');
  });

  it('keeps the whole group at one tab stop', async () => {
    /**
     * The point of roving focus: Tab enters the control once and Tab again leaves
     * it, however many segments there are. Arrow keys move within.
     */
    render(
      <>
        <SegmentedControl
          value="prod"
          onValueChange={vi.fn()}
          options={OPTIONS}
          aria-label="Environment"
        />
        <button type="button">after</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('radiogroup').contains(document.activeElement)).toBe(true);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'after' }));
  });
});

describe('SegmentedControl, FIX 1 , an accessible name that actually resolves', () => {
  /**
   * These fail against the dashboard app's `src/ui/segmented-control.tsx`: it accepts
   * only `aria-label`, and its `<div>` root makes any external `<label htmlFor>`
   * dangle with nothing to warn you.
   */

  it('takes its name from a real <label> element via aria-labelledby', () => {
    /**
     * This is the migration shape: keep the `<Label>`, drop `htmlFor`, reference
     * it by id instead. `htmlFor` cannot work here , see the next test.
     */
    render(
      <>
        <Label id="env-label">Environment</Label>
        <SegmentedControl
          value="dev"
          onValueChange={vi.fn()}
          options={OPTIONS}
          aria-labelledby="env-label"
        />
      </>,
    );
    // Not "the attribute is present" , the name has to RESOLVE. `getByRole` runs
    // the real accessible-name computation, so a dangling id fails here.
    expect(screen.getByRole('radiogroup', { name: 'Environment' })).toBeTruthy();
  });

  it('accepts aria-label for the no-visible-label case', () => {
    render(
      <SegmentedControl
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Environment' })).toBeTruthy();
  });

  it('has a non-labelable div root, which is the whole reason those two props exist', () => {
    /**
     * The root cause of the original bug, pinned. `<label htmlFor>` only
     * associates with *labelable* elements , button, input, select, textarea,
     * meter, output, progress. A `<div>` is not one, so the association is a no-op
     * with no console warning and no visual difference.
     */
    render(
      <SegmentedControl
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    expect(screen.getByRole('radiogroup').tagName).toBe('DIV');
  });

  it('a dangling aria-labelledby leaves the group unnamed, which is why the tests assert the name', () => {
    render(
      <SegmentedControl
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-labelledby="no-such-element"
      />,
    );
    expect(screen.getByRole('radiogroup').getAttribute('aria-labelledby')).toBe('no-such-element');
    // No name at all , the failure mode a presence-only assertion would miss.
    expect(screen.queryByRole('radiogroup', { name: /./ })).toBeNull();
  });
});

describe('SegmentedControl, id + aria-describedby , the wiring the dashboard app added', () => {
  /**
   * The dashboard app's repaired control grew `id` and description wiring; this
   * is the same pair under the native ARIA spelling (`aria-describedby`, not a
   * camelCase `describedBy`).
   */

  it('forwards id onto the radiogroup root', () => {
    render(
      <SegmentedControl
        id="env-switch"
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    expect(screen.getByRole('radiogroup').id).toBe('env-switch');
  });

  it('takes its description from real hint text via aria-describedby', () => {
    render(
      <>
        <SegmentedControl
          value="dev"
          onValueChange={vi.fn()}
          options={OPTIONS}
          aria-label="Environment"
          aria-describedby="env-hint"
        />
        <p id="env-hint">Production changes apply immediately.</p>
      </>,
    );
    // Same rule as the name: not "the attribute is present" , the description
    // has to RESOLVE. `getByRole` runs the real accessible-description
    // computation, so a dangling id fails here.
    expect(
      screen.getByRole('radiogroup', { description: 'Production changes apply immediately.' }),
    ).toBeTruthy();
  });

  it('a dangling aria-describedby leaves the group undescribed, exactly like a dangling aria-labelledby', () => {
    render(
      <SegmentedControl
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
        aria-describedby="no-such-hint"
      />,
    );
    expect(screen.getByRole('radiogroup').getAttribute('aria-describedby')).toBe('no-such-hint');
    // No description at all , the failure mode a presence-only assertion would miss.
    expect(screen.queryByRole('radiogroup', { description: /./ })).toBeNull();
  });
});

describe('SegmentedControl, FIX 2 , a real disable, not pointer-events-none', () => {
  /**
   * All of these fail against the dashboard app's version, which has no `disabled` prop
   * at all: a `pointer-events-none` "disable" leaves the control focusable,
   * keyboard-operable and unannounced.
   */

  it('puts the disabled attribute on every segment', () => {
    render(
      <SegmentedControl
        disabled
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect((radio as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it('is unreachable by keyboard when disabled', async () => {
    /** The half `pointer-events-none` never fixes. */
    render(
      <>
        <button type="button">before</button>
        <SegmentedControl
          disabled
          value="dev"
          onValueChange={vi.fn()}
          options={OPTIONS}
          aria-label="Environment"
        />
        <button type="button">after</button>
      </>,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'before' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'after' }));
  });

  it('does not change value from a click or an arrow key when disabled', async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        disabled
        value="dev"
        onValueChange={onValueChange}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Production' }));
    screen.getByRole('radio', { name: 'Development' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps a not-allowed cursor rather than removing pointer events', () => {
    /**
     * The disabled attribute already blocks activation, so there is no reason to
     * also drop pointer events , and dropping them would take the `not-allowed`
     * cursor with it, removing the only mouse-visible explanation for why the
     * click did nothing.
     */
    render(
      <SegmentedControl
        disabled
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    const cls = screen.getAllByRole('radio')[0]!.className;
    expect(cls).toContain('disabled:cursor-not-allowed');
    expect(cls).not.toContain('pointer-events-none');
  });

  it('disables one segment without taking the rest of the control down', async () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        value="dev"
        onValueChange={onValueChange}
        options={[OPTIONS[0]!, { ...OPTIONS[1]!, disabled: true }]}
        aria-label="Environment"
      />,
    );
    const prod = screen.getByRole('radio', { name: 'Production' }) as HTMLButtonElement;
    const dev = screen.getByRole('radio', { name: 'Development' }) as HTMLButtonElement;
    expect(prod.disabled).toBe(true);
    expect(dev.disabled).toBe(false);
    await userEvent.click(prod);
    expect(onValueChange).not.toHaveBeenCalled();

    // The disabled segment is dropped from the roving-focus collection, so the
    // enabled one keeps the group's single tab stop and Arrow keys cannot reach
    // the disabled one.
    expect(dev.getAttribute('tabindex')).toBe('0');
    expect(prod.getAttribute('tabindex')).toBe('-1');
    dev.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(dev);
  });

  it('exposes data-disabled on the root for styling, without a duplicate aria-disabled', () => {
    render(
      <SegmentedControl
        disabled
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    const group = screen.getByRole('radiogroup');
    expect(group.hasAttribute('data-disabled')).toBe(true);
    // Each radio already reports its own state; a group-level repeat makes some
    // screen readers announce it twice.
    expect(group.getAttribute('aria-disabled')).toBeNull();
  });
});

describe('SegmentedControl, FIX 3 , a selection you can actually see', () => {
  /**
   * ## The bug this pins, and why nothing caught it for a release
   *
   * The active segment was `bg-panel` + `control-raised` on a `bg-bg2` track.
   * Two independent failures stacked into no indicator at all in dark mode:
   *
   *   1. `--bg2` and `--panel` are the SAME value in dark (`#2C2D2C`), so the
   *      fill measured 1.00:1 against its own track.
   *   2. `data-[state=on]:control-raised` generated no CSS whatsoever. A
   *      Tailwind variant can only compose over a utility Tailwind owns, and
   *      `control-raised` was a hand-written class in a `components` layer. The
   *      class sat in the DOM looking right while the computed box-shadow was
   *      `none`. `packages/tokens/css/controls.css` now declares it as
   *      `@utility`, and `controls-css.test.ts` guards that end.
   *
   * These assertions cover the half that lives in this file: the class contract.
   * They cannot see computed CSS , happy-dom does not run Tailwind , which is
   * precisely why the failure was invisible to a test suite before. What they DO
   * catch is the indicator being dropped or renamed, which is how it would go.
   */
  const OPTS: SegmentOption[] = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ];

  function segments() {
    return screen.getAllByRole('radio');
  }

  it('marks the selected segment with a border, not the fill alone', () => {
    render(<SegmentedControl value="a" onValueChange={vi.fn()} options={OPTS} aria-label="G" />);
    const [selected] = segments();
    expect(
      selected!.className,
      'The fill is 1.00:1 against the track in dark mode, so `bg-panel` cannot be ' +
        'the only selected-state signal. --field-border is the one ramp step ' +
        'clearing 3:1 against both themes.',
    ).toContain('data-[state=on]:border-field-border');
  });

  it('keeps the raised material on the selected segment', () => {
    render(<SegmentedControl value="a" onValueChange={vi.fn()} options={OPTS} aria-label="G" />);
    expect(segments()[0]!.className).toContain('data-[state=on]:control-raised');
  });

  it('reserves the border on EVERY segment, so selecting one shifts nothing', () => {
    /**
     * A border applied only to the active segment makes it 2px wider than the
     * others and shunts the rest of the row sideways on every change. A ring
     * would avoid that too, but Tailwind composes `ring-*` into `box-shadow`,
     * which `control-raised` sets outright , the two cannot share the element.
     */
    render(<SegmentedControl value="a" onValueChange={vi.fn()} options={OPTS} aria-label="G" />);
    for (const segment of segments()) {
      expect(segment.className, 'every segment reserves the 1px').toContain(
        'border border-transparent',
      );
    }
  });

  it('the track and the selected fill are the two halves that were identical', () => {
    /**
     * Recorded so the collision is discoverable from the test rather than only
     * from the docblock: the track is `--bg2`, the pill is `--panel`, and in dark
     * those are the same hex. Neither class is wrong , they just cannot carry the
     * signal alone, which is what the border above is for.
     */
    render(<SegmentedControl value="a" onValueChange={vi.fn()} options={OPTS} aria-label="G" />);
    expect(screen.getByRole('radiogroup').className).toContain('bg-bg2');
    expect(segments()[0]!.className).toContain('data-[state=on]:bg-panel');
  });
});

describe('SegmentedControl, axe', () => {
  it('finds no structural violations, named by aria-label', async () => {
    const violations = await audit(
      <SegmentedControl
        value="dev"
        onValueChange={vi.fn()}
        options={OPTIONS}
        aria-label="Environment"
      />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no structural violations, named by aria-labelledby, disabled', async () => {
    const violations = await audit(
      <>
        <Label id="axe-env-label">Environment</Label>
        <SegmentedControl
          disabled
          value="dev"
          onValueChange={vi.fn()}
          options={OPTIONS}
          aria-labelledby="axe-env-label"
        />
      </>,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
