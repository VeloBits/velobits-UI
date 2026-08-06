'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { Button, Input, Textarea } from '@velobits-dev/ui';
// Deliberately NOT in the barrel — react-hook-form is an optional peer, so Form
// is reachable only as a subpath. This import is itself part of the check.
import { Form, FormError, FormField } from '@velobits-dev/ui/form';

import { Section } from './section';

interface FlagFormValues {
  key: string;
  description: string;
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
    errors.description = { type: 'required', message: 'A description is required.' };
  }

  if (Object.keys(errors).length > 0) return { values: {}, errors };
  return { values, errors: {} };
};

export function FormSection() {
  const [saved, setSaved] = useState<string | null>(null);
  const form = useForm<FlagFormValues>({
    resolver,
    defaultValues: { key: '', description: '' },
  });

  const save = (values: FlagFormValues) => {
    if (values.key === 'existing-flag') {
      form.setError('root', { message: 'That key already exists.' });
      return;
    }
    setSaved(values.key);
  };

  return (
    <Section
      title="Form"
      note="Validation demo: submit empty, then an UPPERCASE key, then the key `existing-flag` for a root error."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(save)} className="flex max-w-md flex-col gap-4">
          <FormField
            control={form.control}
            name="key"
            label="Flag key"
            description="Lowercase and dashes only."
            render={({ field }) => <Input placeholder="new-checkout" {...field} />}
          />
          <FormField
            control={form.control}
            name="description"
            label="Description"
            render={({ field }) => (
              <Textarea placeholder="What does this flag control?" {...field} />
            )}
          />
          <FormError />
          <div>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {saved ? `Saved “${saved}” (demo only).` : ''}
          </p>
        </form>
      </Form>
    </Section>
  );
}
