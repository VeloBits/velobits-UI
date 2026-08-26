import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Label } from '../../../registry/velobits/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../../../registry/velobits/ui/select';
import { auditElement, describeViolations } from './axe';

/**
 * ## This file is the evidence that ADR-0031's refusal has expired
 *
 * That ADR declined `@radix-ui/react-select` on the grounds that it is
 * undriveable under happy-dom. Everything below drives it: open, roles,
 * `aria-selected`, selection by pointer AND by keyboard, arrow traversal,
 * disabled items, placeholder, controlled value, and an axe audit of the open
 * panel. If this suite ever has to be weakened, that is the signal to revisit
 * the decision , not to delete the assertion.
 *
 * Three environment facts the suite depends on, all of them already provided by
 * `test/setup.ts`: `ResizeObserver`, `Element.prototype.scrollIntoView` and
 * `Element.prototype.getAnimations`.
 *
 * ## Two rules for driving this primitive in tests
 *
 * 1. **Open with `fireEvent.keyDown(trigger, { key: 'Enter' })`.** Select's
 *    content is a modal Radix layer, so it sets `pointer-events: none` on
 *    `document.body`, and `userEvent` THROWS on any element inheriting that
 *    rather than failing an assertion , the error does not look like a Select
 *    problem at all. (`userEvent.click` on the trigger works, because the
 *    trigger is outside the layer when the click starts; anything after the
 *    panel opens is not.)
 * 2. **Arrow keys need `userEvent.keyboard`, NOT `fireEvent.keyDown`.** Radix
 *    resolves the next candidate from `event.target` and looks it up in its item
 *    collection. A bare `fireEvent` aimed at the listbox targets the listbox,
 *    which is not a collection member, so the handler finds the
 *    already-focused item first and returns having moved nothing. This is a
 *    property of the synthetic event, not of happy-dom , and it is exactly the
 *    kind of false negative that gets a working primitive written off.
 */

const ENVIRONMENTS = [
  { value: 'dev', label: 'Development' },
  { value: 'stage', label: 'Staging' },
  { value: 'prod', label: 'Production' },
];

function Fixture({
  onValueChange,
  ...rootProps
}: React.ComponentProps<typeof Select> & { onValueChange?: (value: string) => void }) {
  return (
    <Select onValueChange={onValueChange} {...rootProps}>
      <SelectTrigger aria-label="Environment">
        <SelectValue placeholder="Select an environment" />
      </SelectTrigger>
      <SelectContent>
        {ENVIRONMENTS.map((environment) => (
          <SelectItem key={environment.value} value={environment.value}>
            {environment.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function getTrigger() {
  return screen.getByRole('combobox', { name: 'Environment' });
}

/** See rule 1 in the file docblock , keyboard, not pointer. */
async function openPanel() {
  fireEvent.keyDown(getTrigger(), { key: 'Enter' });
  return waitFor(() => screen.getByRole('listbox'));
}

describe('Select', () => {
  it('renders a combobox that shows the selected item, not the raw value', () => {
    render(<Fixture defaultValue="prod" />);
    expect(getTrigger().textContent).toContain('Production');
    expect(getTrigger().textContent).not.toContain('prod');
  });

  it('shows the placeholder, and marks the trigger, when there is no value', () => {
    render(<Fixture />);
    const trigger = getTrigger();
    expect(trigger.textContent).toContain('Select an environment');
    /*
     * The muted colour is applied via `data-[placeholder]:text-muted-foreground`
     * on the TRIGGER, because Radix puts the attribute there rather than on the
     * placeholder text, which is not separately targetable. Asserting the
     * attribute is asserting that the styling hook exists at all.
     */
    expect(trigger.hasAttribute('data-placeholder')).toBe(true);
  });

  it('opens a listbox of options', async () => {
    render(<Fixture defaultValue="prod" />);
    await openPanel();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Development',
      'Staging',
      'Production',
    ]);
  });

  it('marks the current option aria-selected and only that one', async () => {
    render(<Fixture defaultValue="stage" />);
    await openPanel();
    const selected = screen
      .getAllByRole('option')
      .filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]!.textContent).toBe('Staging');
  });

  it('selects on click', async () => {
    const onValueChange = vi.fn();
    render(<Fixture defaultValue="prod" onValueChange={onValueChange} />);
    await openPanel();
    fireEvent.click(screen.getByRole('option', { name: 'Development' }));
    expect(onValueChange).toHaveBeenCalledWith('dev');
  });

  it('selects on Enter', async () => {
    const onValueChange = vi.fn();
    render(<Fixture defaultValue="prod" onValueChange={onValueChange} />);
    await openPanel();
    fireEvent.keyDown(screen.getByRole('option', { name: 'Staging' }), { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('stage');
  });

  it('updates the trigger after an uncontrolled selection', async () => {
    render(<Fixture defaultValue="prod" />);
    await openPanel();
    fireEvent.click(screen.getByRole('option', { name: 'Development' }));
    await waitFor(() => expect(getTrigger().textContent).toContain('Development'));
  });

  it('honours a controlled value and does not move on its own', async () => {
    const onValueChange = vi.fn();
    render(<Fixture value="stage" onValueChange={onValueChange} />);
    await openPanel();
    fireEvent.click(screen.getByRole('option', { name: 'Development' }));
    expect(onValueChange).toHaveBeenCalledWith('dev');
    // The parent never re-rendered with the new value, so the trigger must not
    // have taken it on faith.
    expect(getTrigger().textContent).toContain('Staging');
  });

  it('moves the highlight with the arrow keys', async () => {
    render(<Fixture defaultValue="prod" />);
    await openPanel();
    // Opening focuses the selected item. See rule 2 , this MUST be userEvent.
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement?.textContent).toBe('Staging');
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement?.textContent).toBe('Development');
  });

  it('skips a disabled option when traversing, and cannot select it', async () => {
    const onValueChange = vi.fn();
    render(
      <Select defaultValue="prod" onValueChange={onValueChange}>
        <SelectTrigger aria-label="Environment">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dev">Development</SelectItem>
          <SelectItem value="stage" disabled>
            Staging
          </SelectItem>
          <SelectItem value="prod">Production</SelectItem>
        </SelectContent>
      </Select>,
    );
    await openPanel();

    const disabled = screen.getByRole('option', { name: 'Staging' });
    expect(disabled.hasAttribute('data-disabled')).toBe(true);

    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement?.textContent).toBe('Development');

    fireEvent.click(disabled);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('closes on Escape without changing the value', async () => {
    const onValueChange = vi.fn();
    render(<Fixture defaultValue="prod" onValueChange={onValueChange} />);
    await openPanel();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(getTrigger().textContent).toContain('Production');
  });

  it('is disabled as a whole when the root is', () => {
    render(<Fixture defaultValue="prod" disabled />);
    expect(getTrigger()).toHaveProperty('disabled', true);
  });

  it('renders a native <select> for a form post when inside a form', () => {
    /*
     * Radix mirrors the value into a visually-hidden native control so a plain
     * `<form>` submit carries it. Worth pinning: it is the reason `Select` is a
     * valid form field and not only a menu that looks like one , and the reason
     * choosing `Select` over `NativeSelect` is a presentation decision, not a
     * functional downgrade.
     *
     * The mirror is CONDITIONAL: Radix computes
     * `!!form || !!trigger.closest('form')` and renders nothing when both are
     * false. So `name` alone is not enough , the trigger has to actually be in a
     * form (or be given the `form` prop). A fixture without one silently gets no
     * hidden control, which is the shape of this test's first failure.
     */
    const { container } = render(
      <form>
        <Fixture defaultValue="prod" name="environment" />
      </form>,
    );
    const native = container.querySelector('select[name="environment"]');
    expect(native).not.toBeNull();
    expect((native as HTMLSelectElement).value).toBe('prod');
  });

  it('supports groups, group labels and separators', async () => {
    render(
      <Select defaultValue="prod">
        <SelectTrigger aria-label="Environment">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Pre-production</SelectLabel>
            <SelectItem value="dev">Development</SelectItem>
            <SelectItem value="stage">Staging</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Live</SelectLabel>
            <SelectItem value="prod">Production</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
    await openPanel();
    expect(screen.getByText('Pre-production')).toBeDefined();
    // A label is a heading, not an option , it must never be selectable.
    expect(screen.queryByRole('option', { name: 'Pre-production' })).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  describe('sizes', () => {
    it('defaults to the form-field height', () => {
      render(<Fixture defaultValue="prod" />);
      expect(getTrigger().className).toContain('h-9');
      expect(getTrigger().getAttribute('data-size')).toBe('default');
    });

    it('has an `sm` variant for toolbars', () => {
      render(
        <Select defaultValue="prod">
          <SelectTrigger aria-label="Environment" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prod">Production</SelectItem>
          </SelectContent>
        </Select>,
      );
      expect(getTrigger().className).toContain('h-7');
      expect(getTrigger().getAttribute('data-size')).toBe('sm');
    });
  });

  describe('the chevron', () => {
    /*
     * The regression this guards is silent by construction: a
     * `data-[state=open]:rotate-180` written on the icon compiles to a valid
     * rule that can never match, because `SelectPrimitive.Icon` forwards no
     * state. Nothing throws, nothing warns, the chevron simply never turns.
     */
    it('reads open state off the trigger via a named group, not off itself', () => {
      const source = readFileSync(
        join(process.cwd(), '../../registry/velobits/ui/select.tsx'),
        'utf8',
      );
      expect(source).toMatch(/group-data-\[state=open\]\/select-trigger:rotate-180/);
      expect(source).toMatch(/'group\/select-trigger'/);
      // The form that cannot work must not reappear on the icon.
      expect(source).not.toMatch(/'data-\[state=open\]:rotate-180'/);
    });

    it('is a real svg child rather than a background-image data URI', () => {
      const source = readFileSync(
        join(process.cwd(), '../../registry/velobits/ui/select.tsx'),
        'utf8',
      );
      expect(source).not.toMatch(/data:image\/svg\+xml/);
      render(<Fixture defaultValue="prod" />);
      expect(getTrigger().querySelector('svg[data-slot="select-chevron"]')).not.toBeNull();
    });
  });

  describe('the open panel', () => {
    it('sits on the glass overlay tier at z-popover, above a Dialog and a Popover', async () => {
      /*
       * Not `z-dropdown`. Both this panel and a `PopoverContent` portal to the
       * body, so they are siblings in the root stacking context and z-index alone
       * decides the paint order , at 1000 a Select opened from inside a Popover
       * (1300) vanishes behind it while still holding focus. The rung is decided
       * by the lowest surface the panel must clear, and Select is modal, so
       * nothing can be opened over it to contest the rung.
       */
      render(<Fixture defaultValue="prod" />);
      const listbox = await openPanel();
      const content = listbox.closest('[data-slot="select-content"]');
      expect(content).not.toBeNull();
      expect(content!.className).toContain('glass');
      expect(content!.className).toContain('z-popover');
      expect(content!.className.split(/\s+/)).not.toContain('z-dropdown');
    });

    it('is a flex column, which is what makes a long list scroll', async () => {
      /*
       * Not cosmetics. Radix gives the viewport `flex: 1` and
       * `overflow: hidden auto` as inline styles; in a block container the
       * `flex: 1` is inert, the viewport grows to full content height, and the
       * content's `max-h` + `overflow-hidden` CLIPS the tail instead of
       * scrolling it. Dropping `flex flex-col` breaks long lists only, which is
       * why it needs a test rather than a comment.
       */
      render(<Fixture defaultValue="prod" />);
      const listbox = await openPanel();
      const content = listbox.closest('[data-slot="select-content"]')!;
      expect(content.className).toContain('flex');
      expect(content.className).toContain('flex-col');
    });

    it('portals out of the trigger subtree', async () => {
      const { container } = render(<Fixture defaultValue="prod" />);
      const listbox = await openPanel();
      /*
       * `backdrop-filter` forms a stacking context AND a containing block for
       * fixed descendants, so a panel left inside a glass ancestor is clipped by
       * it whatever its z-index says. This assertion is the guard on that.
       */
      expect(container.contains(listbox)).toBe(false);
    });

    it('floors its width at the trigger width without pinning it', async () => {
      render(<Fixture defaultValue="prod" />);
      const listbox = await openPanel();
      const content = listbox.closest('[data-slot="select-content"]')!;
      expect(content.className).toContain('min-w-(--radix-select-trigger-width)');
      // `w-full` would resolve against the viewport, not the trigger: the
      // content is `position: fixed`.
      expect(content.className.split(/\s+/)).not.toContain('w-full');
    });

    it('highlights on data-[highlighted], never on hover', () => {
      /*
       * Same rule as DropdownMenu, same reason: Radix funnels the pointer path
       * and the keyboard path into that one attribute. A `hover:` here looks
       * perfect with a mouse and is completely invisible to the keyboard.
       */
      const source = readFileSync(
        join(process.cwd(), '../../registry/velobits/ui/select.tsx'),
        'utf8',
      );
      expect(source).toMatch(/data-\[highlighted\]:bg-highlight/);
      expect(source).not.toMatch(/hover:bg-/);
    });
  });

  describe('accessibility', () => {
    it('associates with a Label through htmlFor, because the trigger is a button', async () => {
      /*
       * A Radix trigger IS a real `<button>`, so `htmlFor` resolves to it and no
       * `aria-labelledby` dance is needed , unlike `SegmentedControl`, whose div
       * root leaves `htmlFor` dangling.
       */
      render(
        <div>
          <Label htmlFor="env">Environment</Label>
          <Select defaultValue="prod">
            <SelectTrigger id="env">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prod">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>,
      );
      expect(screen.getByRole('combobox', { name: 'Environment' })).toBeDefined();
    });

    it('passes axe closed', async () => {
      const { container } = render(
        <main>
          <Label htmlFor="env-a11y">Environment</Label>
          <Select defaultValue="prod">
            <SelectTrigger id="env-a11y">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </main>,
      );
      const violations = await auditElement(container);
      expect(violations, describeViolations(violations)).toEqual([]);
    });

    it('passes axe open', async () => {
      render(<Fixture defaultValue="prod" />);
      const listbox = await openPanel();
      const content = listbox.closest('[data-slot="select-content"]')!;
      /*
       * The open panel is audited on its own subtree rather than on the render
       * container: it is portalled to the body, so the container no longer holds
       * it, and the rest of the page is `aria-hidden` by Radix's modal layer
       * while it is open , which `region`-style rules would flag as a page
       * problem rather than a component one.
       */
      const violations = await auditElement(content);
      expect(violations, describeViolations(violations)).toEqual([]);
    });
  });

  describe('the decision this component reverses', () => {
    it('documents why ADR-0031 no longer applies, and pins position=popper', () => {
      const source = readFileSync(
        join(process.cwd(), '../../registry/velobits/ui/select.tsx'),
        'utf8',
      );
      expect(source).toMatch(/ADR-0031/);
      expect(source).toMatch(/position = 'popper'/);
    });

    it('leaves NativeSelect in place as the native-picker escape hatch', () => {
      const source = readFileSync(
        join(process.cwd(), '../../registry/velobits/ui/native-select.tsx'),
        'utf8',
      );
      // The old docblock forbade exactly what `select.tsx` now does; it has to
      // say the current thing instead, or the two files contradict each other.
      expect(source).not.toMatch(/Do not "upgrade" this to Radix Select/);
      expect(source).toMatch(/Select/);
    });
  });
});
