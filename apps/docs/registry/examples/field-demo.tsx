'use client';

import { Field, FieldControl, FieldDescription, FieldError, FieldLabel, Input } from '@velobits/ui';

export default function FieldDemo() {
  return (
    <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
      <Field>
        <FieldLabel>Flag key</FieldLabel>
        <FieldControl>
          <Input placeholder="new-checkout" />
        </FieldControl>
        <FieldDescription>Lowercase letters, digits and dashes only.</FieldDescription>
      </Field>
      <Field error="That key is already taken">
        <FieldLabel>Flag key</FieldLabel>
        <FieldControl>
          <Input defaultValue="new-checkout" />
        </FieldControl>
        <FieldDescription>Lowercase letters, digits and dashes only.</FieldDescription>
        <FieldError>That key is already taken</FieldError>
      </Field>
    </div>
  );
}
