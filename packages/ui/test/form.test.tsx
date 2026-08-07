import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Form, FormError, FormField } from '../../../registry/velobits/ui/form';
import { Input } from '../../../registry/velobits/ui/input';
import { audit } from './axe';

interface Values {
  key: string;
  note: string;
}

/** A resolver rather than a schema library: this file must not depend on zod. */
function resolver(values: Values) {
  const errors: Record<string, { type: string; message: string }> = {};
  if (!/^[a-z-]+$/.test(values.key)) {
    errors.key = { type: 'pattern', message: 'Lowercase and dashes only.' };
  }
  return { values: Object.keys(errors).length ? {} : values, errors };
}

function Fixture({
  onSubmit = vi.fn(),
  description = 'Lowercase and dashes only.' as React.ReactNode,
}: {
  onSubmit?: (values: Values) => void;
  description?: React.ReactNode;
}) {
  const form = useForm<Values>({
    defaultValues: { key: '', note: '' },
    resolver: (values) => resolver(values as Values),
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="key"
          label="Flag key"
          description={description}
          render={({ field }) => <Input {...field} />}
        />
        <FormError />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
}

describe('Form, the ARIA wiring it inherits from Field', () => {
  it('binds the label to the control', () => {
    render(<Fixture />);
    const input = screen.getByLabelText('Flag key');
    expect(input.tagName).toBe('INPUT');
  });

  it('describes the control from the description', () => {
    render(<Fixture />);
    const input = screen.getByLabelText('Flag key');
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(1);
    expect(document.getElementById(ids[0]!)!.textContent).toBe('Lowercase and dashes only.');
  });

  it('lists NO describedby id when there is no description', () => {
    /**
     * The reason `description` is a prop and not a child. `aria-describedby` is
     * assembled before children render, so a component that assumes a description
     * will exist points at an element that never appears — a dangling reference,
     * which several screen readers resolve by announcing nothing at all,
     * including the error.
     */
    // `null`, not `undefined` — Fixture's default parameter would swallow that.
    render(<Fixture description={null} />);
    expect(screen.getByLabelText('Flag key').getAttribute('aria-describedby')).toBeNull();
    expect(screen.queryByText('Lowercase and dashes only.')).toBeNull();
  });

  it('keeps BOTH the error and the description described, error first', async () => {
    /**
     * Dropping the hint when validation fails is the classic version of this: the
     * user loses the format rule at exactly the moment they need it.
     */
    render(<Fixture />);
    await userEvent.type(screen.getByLabelText('Flag key'), 'NOT VALID');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    const input = await screen.findByLabelText('Flag key');
    await waitFor(() => expect(input.getAttribute('aria-describedby')!.split(' ')).toHaveLength(2));
    const [errorId, descriptionId] = input.getAttribute('aria-describedby')!.split(' ');
    expect(document.getElementById(errorId!)!.textContent).toBe('Lowercase and dashes only.');
    expect(document.getElementById(errorId!)!.getAttribute('role')).toBe('alert');
    expect(document.getElementById(descriptionId!)!.getAttribute('role')).toBeNull();
  });

  it('marks the control invalid only once it is invalid', async () => {
    render(<Fixture />);
    const input = screen.getByLabelText('Flag key');
    expect(input.getAttribute('aria-invalid')).toBeNull();

    await userEvent.type(input, 'NOT VALID');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
  });
});

describe('Form, submission', () => {
  it('blocks submission and shows the message when invalid', async () => {
    const onSubmit = vi.fn();
    render(<Fixture onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Flag key'), 'NOT VALID');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByRole('alert');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the values when valid', async () => {
    const onSubmit = vi.fn();
    render(<Fixture onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Flag key'), 'new-checkout');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'new-checkout' }),
        expect.anything(),
      ),
    );
  });

  it('forwards the field ref, which is what focuses the first invalid control', async () => {
    /**
     * `{...field}` carries `ref`, and `ref` is how react-hook-form implements
     * `shouldFocusError`. A custom control that takes `value`/`onChange` and
     * swallows `ref` still validates and still shows its message — and submitting
     * a long invalid form silently stops scrolling to the problem. Nothing warns.
     */
    render(<Fixture />);
    const input = screen.getByLabelText('Flag key');
    await userEvent.type(input, 'NOT VALID');
    (document.activeElement as HTMLElement).blur();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(document.activeElement).toBe(input));
  });
});

describe('FormError, the submit-level failure', () => {
  function RootFixture() {
    const form = useForm<Values>({ defaultValues: { key: '', note: '' } });
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() =>
            form.setError('root', { message: 'That key already exists.' }),
          )}
        >
          <FormError />
          <button type="submit">Save</button>
        </form>
      </Form>
    );
  }

  it('renders nothing until there is a root error', () => {
    render(<RootFixture />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('surfaces a request-level failure that belongs to no field', async () => {
    /**
     * A form that only renders per-field messages has nowhere to put a 409, and
     * the usual outcome is a console.error and a submit button that appears to do
     * nothing.
     */
    render(<RootFixture />);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('That key already exists.');
  });

  it('UPDATES when the error appears, which useFormContext().formState would not', async () => {
    /**
     * The subscription trap. `formState` is a Proxy recording which fields a
     * component read; reaching it through `useFormContext()` reads the
     * subscription belonging to the component that called `useForm()`, so this
     * one is never told. That version renders correctly on first paint and then
     * never updates — it passes a casual test and fails in use. `useFormState`
     * registers its own subscription, which is the whole reason the hook exists.
     */
    render(<RootFixture />);
    expect(screen.queryByRole('alert')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  });

  it('lets a caller override the message', () => {
    function Direct() {
      const form = useForm<Values>();
      return (
        <Form {...form}>
          <FormError>Your session expired.</FormError>
        </Form>
      );
    }
    render(<Direct />);
    expect(screen.getByRole('alert').textContent).toBe('Your session expired.');
  });
});

describe('Form, axe', () => {
  it('finds no violations on a pristine form', async () => {
    const violations = await audit(<Fixture />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
