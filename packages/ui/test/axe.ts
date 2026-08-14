import { render } from '@testing-library/react';
import axe from 'axe-core';
import { createElement } from 'react';

/**
 * The shared axe gate. Every suite that audits accessibility imports from here,
 * so the disabled-rule set is defined exactly once.
 *
 * The plan called for "axe-core on every Storybook story"; the docs site is
 * Next.js + MDX rather than Storybook, so the same guarantee lives in the test
 * suites instead — every component is rendered in a representative composition
 * and audited.
 *
 * ## What this can and cannot catch
 *
 * happy-dom has no layout engine and no CSS cascade, so **colour-contrast rules
 * cannot run here** and are disabled below rather than silently passing. Contrast
 * is covered properly and exhaustively by `@velobitsio/tokens`' own suite, which
 * measures the actual token values instead of sampling rendered pixels. What
 * these audits catch is the structural half: roles, names, label association,
 * ARIA validity, and nesting.
 *
 * ## What is deliberately NOT here
 *
 * Per-suite violation SUBTRACTIONS. `dropdown-menu.test.tsx` and
 * `command-palette.test.tsx` filter `aria-hidden-focus` node by node on
 * Radix-specific attributes, because a modal Radix layer marks the rest of the
 * page `aria-hidden` while leaving it focusable — it relies on a focus SCOPE
 * that no static rule can see. Those filters stay in their own files: folding
 * them in here would silently exempt every other suite from a real rule.
 */
export const RULES_UNRUNNABLE_WITHOUT_LAYOUT = [
  // Needs computed colours and a real cascade. See @velobitsio/tokens/test/contrast.test.ts.
  'color-contrast',
  // Needs a full page, which a component fixture is not.
  'region',
  'landmark-one-main',
  'page-has-heading-one',
  'html-has-lang',
];

const RULE_OVERRIDES = {
  rules: Object.fromEntries(RULES_UNRUNNABLE_WITHOUT_LAYOUT.map((id) => [id, { enabled: false }])),
};

/**
 * Audit an element that is already in the document.
 *
 * Use this for portalled content: root it at the panel rather than at
 * `document.body` where the suite owns only the panel, or at `document.body`
 * where the markup under test is portalled out of the render container.
 */
export async function auditElement(root: Element): Promise<axe.Result[]> {
  const results = await axe.run(root, RULE_OVERRIDES);
  return results.violations;
}

/**
 * Render `ui` inside a `<main>` landmark — so region-scoped rules have somewhere
 * sensible to anchor — and audit the render container.
 *
 * `createElement` rather than JSX so this stays a `.ts` module and no suite has
 * to care whether the shared helper is `.ts` or `.tsx`.
 */
export async function audit(ui: React.ReactElement): Promise<axe.Result[]> {
  const { container } = render(createElement('main', null, ui));
  return auditElement(container);
}

/** The violation formatter the suites pass as an assertion message. */
export function describeViolations(violations: axe.Result[]): string {
  return violations
    .map(
      (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`,
    )
    .join('\n  ');
}
