import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  alertVariants,
} from '../../../registry/velobits/ui/alert';
import { Badge } from '../../../registry/velobits/ui/badge';
import { Button } from '../../../registry/velobits/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../registry/velobits/ui/card';
import { Checkbox } from '../../../registry/velobits/ui/checkbox';
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../../../registry/velobits/ui/field';
import { Input } from '../../../registry/velobits/ui/input';
import { Label } from '../../../registry/velobits/ui/label';
import { NativeSelect } from '../../../registry/velobits/ui/native-select';
import { Separator } from '../../../registry/velobits/ui/separator';
import { Skeleton } from '../../../registry/velobits/ui/skeleton';
import { Spinner } from '../../../registry/velobits/ui/spinner';
import { Switch } from '../../../registry/velobits/ui/switch';

describe('Button', () => {
  it('renders a real button and fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the child element with asChild, without nesting interactive elements', () => {
    render(
      <Button asChild>
        <a href="/flags">Flags</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Flags' });
    expect(link.tagName).toBe('A');
    // The point of asChild: no <button><a> nesting, which is invalid HTML and
    // gives screen readers two competing roles.
    expect(link.querySelector('button')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('never paints --primary as text', () => {
    /**
     * #007ACC is 3.90:1 on the cream page — a fill colour, not a text colour.
     * The `link` variant must use `text-link` (--primary-text). A regression here
     * is an accessibility bug that looks like a styling preference.
     */
    const { container } = render(<Button variant="link">Docs</Button>);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain('text-link');
    expect(cls).not.toMatch(/\btext-primary\b/);
  });

  it('keeps caller classes able to win over variant classes', () => {
    // cn() is twMerge-based, so a later conflicting utility replaces the earlier.
    const { container } = render(<Button className="rounded-pill">x</Button>);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain('rounded-pill');
    expect(cls).not.toMatch(/\brounded-md\b/);
  });
});

describe('Badge', () => {
  it('pairs a soft wash with the matching text token, not the solid fill', () => {
    const { container } = render(<Badge variant="success">Live</Badge>);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain('bg-success-soft');
    expect(cls).toContain('text-success');
  });

  it('uses charcoal on the lime brand fill', () => {
    /** White on lime is 1.31:1; charcoal is 10.89:1 and the only valid pairing. */
    const { container } = render(<Badge variant="brand">New</Badge>);
    expect(container.firstElementChild!.className).toContain('text-on-brand');
  });
});

describe('Card', () => {
  it('states its border colour explicitly on the opaque variant', () => {
    /**
     * Tailwind v4's bare `border` emits width and style only, so the colour
     * falls back to currentColor — which painted a near-white outline on every
     * dark-mode card. The base layer fixes it globally; this makes the component
     * correct even in an app that skipped the base layer.
     *
     * Only the `panel` variant needs the guard. The default glass variant takes
     * its border from `.glass-surface`, which sets the `border` SHORTHAND —
     * colour included — from the components layer.
     */
    const { container } = render(<Card surface="panel">x</Card>);
    expect(container.firstElementChild!.className).toContain('border-border');
  });

  it('defaults to the Tier-S material and adds nothing that would override it', () => {
    /**
     * `.glass-surface` sits in Tailwind's `components` layer, so a utility on the
     * same element wins and silently removes part of the material: `bg-*` drops
     * the tint that IS the material, `shadow-*` replaces the whole box-shadow
     * list — which carries the inset specular highlight that is the entire
     * dark-mode treatment — and a `border-*` colour swaps the sanctioned
     * translucent edge for an opaque one (1.60:1 → 1.53:1 light, 1.50:1 → 1.30:1
     * dark). `surface="panel"` is the escape hatch; an override is not.
     */
    const { container } = render(<Card>x</Card>);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain('glass-surface');
    expect(cls).not.toMatch(/\bbg-/);
    expect(cls).not.toMatch(/\bshadow-/);
    expect(cls).not.toMatch(/\bborder-/);
  });

  it('places CardAction beside the title, not below the description', () => {
    /**
     * A column flexbox cannot do this: `ms-auto` right-aligns the action but it
     * still occupies its own row, so the badge landed *below* the description.
     * The header switches to a two-column grid, and the action spans both rows.
     */
    render(
      <Card>
        <CardHeader data-testid="header">
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction data-testid="action">·</CardAction>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByTestId('header').className).toContain(
      'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
    );
    const cls = screen.getByTestId('action').className;
    expect(cls).toContain('col-start-2');
    expect(cls).toContain('row-span-2');
  });

  it('aligns CardAction with grid placement, which is already direction-aware', () => {
    /**
     * `justify-self-end` resolves to the right edge in LTR and the left edge
     * under `dir="rtl"` with no `rtl:` variant. A physical `ml-auto` would not,
     * and neither would `translate`.
     */
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardAction data-testid="action">·</CardAction>
        </CardHeader>
      </Card>,
    );
    const cls = screen.getByTestId('action').className;
    expect(cls).toContain('justify-self-end');
    expect(cls).not.toContain('ml-auto');
  });
});

describe('Alert', () => {
  it('is a polite status region by default', () => {
    render(
      <Alert>
        <AlertTitle>Saved</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('can be escalated to assertive deliberately', () => {
    render(
      <Alert role="alert" variant="danger">
        <AlertTitle>Failed</AlertTitle>
      </Alert>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('names the state in text, not only in colour', () => {
    render(
      <Alert variant="danger">
        <AlertTitle>Rollout failed</AlertTitle>
        <AlertDescription>Check the environment.</AlertDescription>
      </Alert>,
    );
    // WCAG 1.4.1: the red wash is not the message.
    expect(screen.getByText('Rollout failed')).toBeTruthy();
  });

  it('takes the Tier-S material on neutral only, never under a *-soft wash', () => {
    /**
     * `bg-danger-soft` is a utility and `.glass-surface` is in the `components`
     * layer, so a wash on the glass tier REPLACES the tint at alpha 0.10 and what
     * survives is the glass border and shadow around a near-transparent panel.
     * `toast.test.tsx` guards the same trap on Tier O. Here the surface axis is
     * confined to `neutral` through a compound variant, and `surface="panel"` is
     * the way back to an opaque neutral alert.
     */
    expect(alertVariants()).toContain('glass-surface');
    expect(alertVariants({ surface: 'panel' })).not.toContain('glass-surface');
    expect(alertVariants({ surface: 'panel' })).toContain('bg-panel');
    for (const variant of ['info', 'success', 'warning', 'danger'] as const) {
      expect(alertVariants({ variant, surface: 'glass' }), variant).not.toContain('glass-surface');
    }
  });
});

describe('Label', () => {
  it('renders a real <label> so htmlFor resolves', async () => {
    render(
      <>
        <Label htmlFor="key">Flag key</Label>
        <Input id="key" />
      </>,
    );
    const label = screen.getByText('Flag key');
    expect(label.tagName).toBe('LABEL');
    // The association a dangling htmlFor would silently break.
    expect(screen.getByLabelText('Flag key')).toBe(screen.getByRole('textbox'));
    await userEvent.click(label);
    expect(document.activeElement).toBe(screen.getByRole('textbox'));
  });
});

describe('Input', () => {
  it('draws its edge from --field-border, the token 1.4.11 gates', () => {
    const { container } = render(<Input />);
    expect(container.querySelector('input')!.className).toContain('border-input');
  });

  it('reflects aria-invalid rather than needing an `error` prop', () => {
    /** So whatever form library the app uses gets error styling for free. */
    const { container } = render(<Input aria-invalid />);
    const cls = container.querySelector('input')!.className;
    expect(cls).toContain('aria-invalid:border-danger');
    expect(container.querySelector('input')!.getAttribute('aria-invalid')).toBe('true');
  });

  it('accepts typing', async () => {
    render(<Input aria-label="Key" />);
    await userEvent.type(screen.getByRole('textbox'), 'my-flag');
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('my-flag');
  });
});

describe('NativeSelect', () => {
  it('is a native select, which is why it is testable at all', async () => {
    /**
     * Radix Select measures its trigger to position the popper, and happy-dom
     * has no layout, so every option lands at 0×0 and cannot be clicked. This is
     * the component that decision produced — and this test is what it buys.
     */
    render(
      <NativeSelect aria-label="Environment" defaultValue="prod">
        <option value="dev">Development</option>
        <option value="prod">Production</option>
      </NativeSelect>,
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    await userEvent.selectOptions(select, 'dev');
    expect(select.value).toBe('dev');
  });

  it('uses logical padding so the chevron gutter flips under RTL', () => {
    const { container } = render(
      <NativeSelect aria-label="x">
        <option>a</option>
      </NativeSelect>,
    );
    const cls = container.querySelector('select')!.className;
    expect(cls).toContain('ps-3');
    expect(cls).toContain('pe-8');
  });
});

describe('Checkbox', () => {
  it('toggles and reports state', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Select all" onCheckedChange={onCheckedChange} />);
    const box = screen.getByRole('checkbox');
    expect(box.getAttribute('aria-checked')).toBe('false');
    await userEvent.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('reports mixed for the indeterminate bulk-selection state', () => {
    /**
     * A header checkbox meaning "some rows selected" must announce `mixed`, not
     * checked — otherwise a screen-reader user is told everything is selected.
     */
    render(<Checkbox aria-label="Select all" checked="indeterminate" />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('mixed');
  });
});

describe('Switch', () => {
  it('exposes role=switch and toggles', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Auto run" onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole('switch');
    await userEvent.click(sw);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('mirrors the thumb translation for RTL', () => {
    /** transform is not a logical property; without this the thumb leaves its track. */
    const { container } = render(<Switch aria-label="x" />);
    const thumb = container.querySelector('[data-slot="switch-thumb"]')!;
    expect(thumb.className).toContain('rtl:data-[state=checked]:-translate-x-4');
  });
});

describe('Field', () => {
  it('wires label, description and control together', () => {
    render(
      <Field>
        <FieldLabel>Flag key</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldDescription>Lowercase and dashes.</FieldDescription>
      </Field>,
    );
    const input = screen.getByLabelText('Flag key');
    const describedBy = input.getAttribute('aria-describedby')!;
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy.split(' ')[0]!)!.textContent).toBe(
      'Lowercase and dashes.',
    );
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('keeps the description referenced when an error appears, error first', () => {
    /**
     * The bug this exists to prevent: swapping describedby to the error and
     * dropping the hint, so the user loses the format rule at the exact moment
     * they need it. Both ids must be present, error first so it is read first.
     */
    render(
      <Field error="Key is taken">
        <FieldLabel>Flag key</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldDescription>Lowercase and dashes.</FieldDescription>
        <FieldError>Key is taken</FieldError>
      </Field>,
    );
    const input = screen.getByLabelText('Flag key');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0]!)!.textContent).toBe('Key is taken');
    expect(document.getElementById(ids[1]!)!.textContent).toBe('Lowercase and dashes.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('renders nothing for FieldError with no message', () => {
    render(
      <Field>
        <FieldLabel>Key</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldError>{undefined}</FieldError>
      </Field>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('throws a useful error when a part is used outside Field', () => {
    /** Better than rendering an unassociated label that looks fine and is not. */
    expect(() => render(<FieldLabel>Orphan</FieldLabel>)).toThrow(/must be used inside a <Field>/);
  });
});

describe('Separator, Skeleton, Spinner', () => {
  it('Separator is decorative by default and uses --border', () => {
    const { container } = render(<Separator />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('bg-border');
    // Decorative → role="none", so it is not announced as a structural divider.
    expect(el.getAttribute('role')).not.toBe('separator');
  });

  it('Separator can be made semantic when it really divides groups', () => {
    const { container } = render(<Separator decorative={false} />);
    expect(container.firstElementChild!.getAttribute('role')).toBe('separator');
  });

  it('Skeleton is hidden from assistive tech', () => {
    /** Fourteen grey rectangles should not be enumerated; one live region announces. */
    const { container } = render(<Skeleton className="h-4 w-20" />);
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  });

  it('Skeleton fills with a translucent scrim, never with a glass tier', () => {
    /**
     * A placeholder has to differ from whatever hosts it, and the Tier-S retrofit
     * changed what hosts it. A glass Skeleton inside a glass Card would composite
     * 2/255 off the card and vanish; the previous opaque `bg-bg2` measured 0/255
     * inside a dark `--panel`, because `--bg2` IS `--panel` in dark mode.
     * `--highlight` is a scrim, so it tracks its host: ≥10/255 on the page, on
     * `--panel` and on `.glass-surface`, in both themes.
     */
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const cls = container.firstElementChild!.className;
    expect(cls).toContain('bg-highlight');
    expect(cls).not.toMatch(/glass/);
  });

  it('Spinner announces by default and can be silenced', () => {
    const { unmount } = render(<Spinner />);
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Loading');
    unmount();
    const { container } = render(<Spinner label={null} />);
    expect(container.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
