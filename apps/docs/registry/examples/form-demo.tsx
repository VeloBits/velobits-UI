'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { Button, Input, NativeSelect, Textarea } from '@velobits-dev/ui';
// Deliberately NOT from the barrel. `react-hook-form` is an OPTIONAL peer and the
// barrel is one bundled module, so re-exporting Form there would put a top-level
// `import 'react-hook-form'` in dist/index.js and break every consumer that has
// no forms. `registry-parity.test.ts` asserts this exception by name, in both
// directions. This import is itself part of the check.
import { Form, FormError, FormField } from '@velobits-dev/ui/form';

interface FlagFormValues {
  key: string;
  description: string;
  environment: string;
}

/**
 * A hand-written resolver so the demo needs no schema library. Real consumers
 * pair this with zodResolver; nothing in the rendering layer cares which.
 */
const resolver: Resolver<FlagFormValues> = async (values) => {
  const errors: Record<string, { type: string; message: string }> = {};

  if (!values.key) {
    errors.key = { type: 'required', message: 'A flag key is required.' };
  } else if (!/^[a-z0-9-]+$/.test(values.key)) {
    errors.key = { type: 'pattern', message: 'Lowercase letters, digits and dashes only.' };
  }
  if (!values.description) {
    errors.description = { type: 'required', message: 'Say what this flag controls.' };
  }

  if (Object.keys(errors).length > 0) return { values: {}, errors };
  return { values, errors: {} };
};

export default function FormDemo() {
  const [created, setCreated] = useState<string | null>(null);
  const form = useForm<FlagFormValues>({
    resolver,
    defaultValues: { key: '', description: '', environment: 'dev' },
  });

  const create = (values: FlagFormValues) => {
    // A root error — the failure that belongs to the submission, not to a field.
    if (values.key === 'new-checkout') {
      form.setError('root', { message: 'A flag with that key already exists in this project.' });
      return;
    }
    setCreated(`${values.key} → ${values.environment}`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(create)} className="flex max-w-md flex-col gap-4">
        <FormField
          control={form.control}
          name="key"
          label="Flag key"
          description="Lowercase letters, digits and dashes only."
          render={({ field }) => <Input placeholder="new-checkout" {...field} />}
        />
        <FormField
          control={form.control}
          name="description"
          label="Description"
          description="What behaviour does this flag switch?"
          render={({ field }) => (
            <Textarea placeholder="Routes checkout through the new flow." {...field} />
          )}
        />
        <FormField
          control={form.control}
          name="environment"
          label="Create in"
          description="A new flag starts off wherever you create it."
          render={({ field }) => (
            <NativeSelect {...field}>
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </NativeSelect>
          )}
        />
        {/*
         * FormError reads via useFormState, never useFormContext().formState. The
         * latter is a Proxy recording which fields the CALLER of useForm
         * subscribed to, so through context the reader is never re-rendered — it
         * paints correctly once and then never updates, which passes a casual
         * test.
         */}
        <FormError />
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary">
            Create flag
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              form.reset();
              setCreated(null);
            }}
          >
            Reset
          </Button>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {created ? `Created ${created} (demo only).` : ''}
        </p>
      </form>
    </Form>
  );
}
