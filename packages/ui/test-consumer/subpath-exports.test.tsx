import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, type Resolver } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

/*
 * `process.cwd()` rather than `import.meta.url`, for the reason spelled out in
 * `test/registry-parity.test.ts`: vitest rewrites import.meta in transformed
 * modules and the URL-relative form resolves to the package's `main`.
 */
const uiDir = process.cwd();
const pkg = JSON.parse(readFileSync(join(uiDir, 'package.json'), 'utf8')) as {
  name: string;
  exports: Record<
    string,
    | { import: { types: string; default: string }; require: { types: string; default: string } }
    | string
  >;
};

/** A consumer's `require`, pointed at this package so self-reference resolves. */
const require = createRequire(join(uiDir, 'package.json'));

const subpaths = Object.entries(pkg.exports).filter(
  (entry): entry is [string, Exclude<(typeof pkg.exports)[string], string>] =>
    entry[0] !== './package.json' && typeof entry[1] !== 'string',
);

/**
 * `registry-parity.test.ts` proves the four LISTS agree , the registry, the tsup
 * entry map, the `exports` map and the barrel all name the same components. It
 * does that by comparing strings, and every one of those strings can be right
 * while the artifact is absent: nothing in it stats a file, resolves a specifier
 * or imports anything.
 *
 * This is the other half. Same components, asked a different question: does the
 * thing a consumer types actually resolve, and does what comes back work.
 */
describe('every exports subpath resolves to something that was built', () => {
  it.each(subpaths)('%s', (subpath, condition) => {
    for (const file of [
      condition.import.default,
      condition.import.types,
      condition.require.default,
      condition.require.types,
    ]) {
      expect(
        existsSync(join(uiDir, file)),
        `${subpath} declares ${file}, which does not exist`,
      ).toBe(true);
    }
  });

  it('resolves each one through the exports map under the `require` condition', () => {
    /**
     * `existsSync` above proves the files are there; this proves the MAP points
     * at them. The two fail separately , a typo'd target passes the first check
     * on a sibling entry's file and fails here.
     */
    const unresolvable: string[] = [];
    for (const [subpath] of subpaths) {
      const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.replace('./', '')}`;
      try {
        require.resolve(specifier);
      } catch {
        unresolvable.push(specifier);
      }
    }
    expect(
      unresolvable,
      `declared in "exports" but unresolvable: ${unresolvable.join(', ')}`,
    ).toEqual([]);
  });
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * `Form` IS THE ONE COMPONENT WITH NO ROUTE INTO THE BARREL, SO IT IS THE ONE
 * WITH NO SECOND CHANCE.
 *
 * Every other component is reachable two ways: if a subpath entry broke, the
 * barrel import in some example would still catch it. `form` has only the
 * subpath, deliberately , `react-hook-form` is an OPTIONAL peer and a barrel
 * re-export would put a top-level `import 'react-hook-form'` in `dist/index.js`,
 * breaking every app that never installed it.
 *
 * That decision is asserted in `registry-parity.test.ts` against the tsup config
 * TEXT and the `package.json` fields. What follows asserts it against the
 * artifact those produce, and then uses it the way a consumer does.
 * ─────────────────────────────────────────────────────────────────────────────
 */
describe('@velobitsio/ui/form, as a consumer imports it', () => {
  it('exports Form, FormField and FormError from the subpath', async () => {
    const mod = await import('@velobitsio/ui/form');
    expect(typeof mod.Form).toBe('function');
    expect(typeof mod.FormField).toBe('function');
    expect(typeof mod.FormError).toBe('function');
  });

  it('is absent from the barrel, which is the whole point of the subpath', async () => {
    const barrel = await import('@velobitsio/ui');
    // The exclusion...
    expect('Form' in barrel).toBe(false);
    expect('FormField' in barrel).toBe(false);
    // ...and the control, so an empty/broken barrel cannot pass the line above.
    expect(typeof (barrel as Record<string, unknown>).Button).toBe('function');
  });

  it('leaves react-hook-form out of the barrel and external in the entry', () => {
    /**
     * The failure this prevents: bundling `react-hook-form` instead of
     * externalising it. The bundled copy has its own module state, so
     * `useFormContext()` inside `FormField` reads a different context from the
     * consumer's `useForm()` and every field registers against nothing , which
     * renders, and silently never validates.
     *
     * Asserted on the emitted JavaScript rather than on `tsup.config.ts`, because
     * a config can say `external` while the output disagrees.
     */
    const form = readFileSync(join(uiDir, 'dist/form.js'), 'utf8');
    expect(form.startsWith("'use client';")).toBe(true);
    expect(form).toMatch(/from\s*["']react-hook-form["']/);

    const barrel = readFileSync(join(uiDir, 'dist/index.js'), 'utf8');
    expect(barrel).not.toMatch(/react-hook-form/);
  });

  it('wires a real form: label, description, error, and the consumer’s own useForm', async () => {
    /**
     * The end-to-end case, and the reason this file renders instead of only
     * resolving. It exercises the two things the source suite structurally
     * cannot: the BUILT module, and the fact that its `FormProvider` and the
     * `useForm()` called here are the same instance of `react-hook-form`.
     *
     * If the peer were bundled, this test is what fails , `fieldState.error`
     * would stay empty and no message would appear, while every string-level
     * assertion above still passed.
     */
    const { Form, FormError, FormField } = await import('@velobitsio/ui/form');
    const { Input } = await import('@velobitsio/ui');

    /**
     * Hand-written so the suite needs no schema library, and annotated rather
     * than inlined: `resolver` is generic over the form's values, and an inline
     * arrow leaves TValues unresolved. Same shape the docs' form example uses.
     */
    const resolver: Resolver<{ key: string }> = async (values) => {
      // Assembled into a Record first, exactly as the docs' form example does.
      // `ResolverResult` is a discriminated union whose success arm demands
      // `errors: {}` and whose error arm demands `values: {}`; returning object
      // literals inline infers a join of the two that matches neither.
      const errors: Record<string, { type: string; message: string }> = {};
      if (!values.key) errors.key = { type: 'required', message: 'A flag key is required.' };
      if (Object.keys(errors).length > 0) return { values: {}, errors };
      return { values, errors: {} };
    };

    function FlagForm() {
      const form = useForm<{ key: string }>({ defaultValues: { key: '' }, resolver });
      return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(() => form.setError('root', { message: 'Key taken.' }))}
          >
            <FormField
              control={form.control}
              name="key"
              label="Flag key"
              description="Lowercase and dashes only."
              render={({ field }) => <Input {...field} />}
            />
            <FormError />
            <button type="submit">Save</button>
          </form>
        </Form>
      );
    }

    render(<FlagForm />);

    // The ARIA wiring `Field` exists to guarantee: the hint is in
    // aria-describedby BEFORE anything fails, and stays there afterwards.
    const input = screen.getByLabelText('Flag key');
    const described = () =>
      (input.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
    expect(described().length).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    // A field error , proof the provider and this file share one instance.
    expect(await screen.findByText('A flag key is required.')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(described().length).toBe(2);
    for (const id of described()) expect(document.getElementById(id)).not.toBeNull();

    // And the root error, which is the one a form with only per-field messages
    // has nowhere to put.
    await userEvent.type(input, 'new-checkout');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Key taken.');
  });
});
