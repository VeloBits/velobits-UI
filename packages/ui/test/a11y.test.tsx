import { render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { Alert, AlertDescription, AlertTitle } from '../../../registry/velobits/ui/alert';
import { Avatar, AvatarFallback } from '../../../registry/velobits/ui/avatar';
import { Badge } from '../../../registry/velobits/ui/badge';
import { Button } from '../../../registry/velobits/ui/button';
import {
  Card,
  CardContent,
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
import { Kbd } from '../../../registry/velobits/ui/kbd';
import { Label } from '../../../registry/velobits/ui/label';
import { NativeSelect } from '../../../registry/velobits/ui/native-select';
import { Separator } from '../../../registry/velobits/ui/separator';
import { Switch } from '../../../registry/velobits/ui/switch';
import { Textarea } from '../../../registry/velobits/ui/textarea';

/**
 * The axe gate.
 *
 * The plan called for "axe-core on every Storybook story"; the docs site is
 * Next.js + MDX rather than Storybook, so the same guarantee lives here instead
 * — every primitive is rendered in a representative composition and audited.
 *
 * ## What this can and cannot catch
 *
 * happy-dom has no layout engine and no CSS cascade, so **colour-contrast rules
 * cannot run here** and are disabled below rather than silently passing. Contrast
 * is covered properly and exhaustively by `@velobits/tokens`' own suite, which
 * measures the actual token values instead of sampling rendered pixels. What
 * this file catches is the structural half: roles, names, label association,
 * ARIA validity, and nesting.
 */

const RULES_UNRUNNABLE_WITHOUT_LAYOUT = [
  // Needs computed colours and a real cascade. See @velobits/tokens/test/contrast.test.ts.
  'color-contrast',
  // Needs a full page, which a component fixture is not.
  'region',
  'landmark-one-main',
  'page-has-heading-one',
  'html-has-lang',
];

async function audit(ui: React.ReactElement) {
  const { container } = render(
    // A landmark, so region-scoped rules have somewhere sensible to anchor.
    <main>{ui}</main>,
  );
  const results = await axe.run(container, {
    rules: Object.fromEntries(
      RULES_UNRUNNABLE_WITHOUT_LAYOUT.map((id) => [id, { enabled: false }]),
    ),
  });
  return results.violations;
}

function describeViolations(violations: axe.Result[]): string {
  return violations
    .map(
      (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`,
    )
    .join('\n  ');
}

afterEach(() => {
  document.body.innerHTML = '';
});

const CASES: [name: string, ui: () => React.ReactElement][] = [
  ['Button', () => <Button>Save changes</Button>],
  ['Button, icon-only with a label', () => <Button size="icon" aria-label="Close" />],
  [
    'Button variants together',
    () => (
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="brand">Brand</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="link">Docs</Button>
      </div>
    ),
  ],
  ['Badge', () => <Badge variant="success">Live</Badge>],
  [
    'Card',
    () => (
      <Card>
        <CardHeader>
          <CardTitle>Production</CardTitle>
          <CardDescription>12 flags enabled</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>
    ),
  ],
  [
    'Alert',
    () => (
      <Alert variant="danger" role="alert">
        <AlertTitle>Rollout failed</AlertTitle>
        <AlertDescription>Check the target environment.</AlertDescription>
      </Alert>
    ),
  ],
  [
    'Input with a Label',
    () => (
      <div>
        <Label htmlFor="a11y-key">Flag key</Label>
        <Input id="a11y-key" />
      </div>
    ),
  ],
  [
    'Textarea with a Label',
    () => (
      <div>
        <Label htmlFor="a11y-desc">Description</Label>
        <Textarea id="a11y-desc" />
      </div>
    ),
  ],
  [
    'NativeSelect with a Label',
    () => (
      <div>
        <Label htmlFor="a11y-env">Environment</Label>
        <NativeSelect id="a11y-env">
          <option value="dev">Development</option>
          <option value="prod">Production</option>
        </NativeSelect>
      </div>
    ),
  ],
  [
    'Checkbox with a Label',
    () => (
      <div>
        <Checkbox id="a11y-check" />
        <Label htmlFor="a11y-check">Enable in production</Label>
      </div>
    ),
  ],
  [
    'Checkbox, indeterminate',
    () => <Checkbox aria-label="Select all rows" checked="indeterminate" />,
  ],
  [
    'Switch with a Label',
    () => (
      <div>
        <Switch id="a11y-switch" />
        <Label htmlFor="a11y-switch">Auto run</Label>
      </div>
    ),
  ],
  [
    'Field, valid',
    () => (
      <Field>
        <FieldLabel>Flag key</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldDescription>Lowercase and dashes only.</FieldDescription>
      </Field>
    ),
  ],
  [
    'Field, invalid',
    () => (
      <Field error="That key is taken">
        <FieldLabel>Flag key</FieldLabel>
        <FieldControl>
          <Input />
        </FieldControl>
        <FieldDescription>Lowercase and dashes only.</FieldDescription>
        <FieldError>That key is taken</FieldError>
      </Field>
    ),
  ],
  [
    'Avatar fallback',
    () => (
      <Avatar>
        <AvatarFallback>NS</AvatarFallback>
      </Avatar>
    ),
  ],
  ['Separator', () => <Separator />],
  ['Kbd', () => <Kbd>⌘K</Kbd>],
];

describe('axe finds no structural violations', () => {
  for (const [name, ui] of CASES) {
    it(name, async () => {
      const violations = await audit(ui());
      expect(
        violations.length,
        violations.length ? `\n  ${describeViolations(violations)}` : '',
      ).toBe(0);
    });
  }
});

describe('the audit itself is wired correctly', () => {
  it('detects a genuine violation, so a green run means something', async () => {
    /**
     * Without this, a misconfigured axe (wrong container, all rules disabled, a
     * silently-swallowed promise) would report zero violations for every case
     * above and look like a passing suite.
     */
    const violations = await audit(
      // An input with no accessible name at all.
      <input type="text" />,
    );
    expect(violations.map((v) => v.id)).toContain('label');
  });

  it('leaves contrast rules explicitly disabled rather than passing them', () => {
    /**
     * A reader should not conclude from a green run that contrast was checked
     * here. It was not — @velobits/tokens measures the token values directly,
     * which is stronger than sampling rendered pixels in a DOM without a cascade.
     */
    expect(RULES_UNRUNNABLE_WITHOUT_LAYOUT).toContain('color-contrast');
  });
});
