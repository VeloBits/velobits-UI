import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import * as iconsModule from '@velobitsio/icons';
import { light } from '@velobitsio/tokens';

import { registry } from '../../../registry/registry';

/**
 * `skills/velobits-ui/SKILL.md` is the one file in this repo written to be read
 * by a model rather than a person, and that changes what a wrong number costs.
 *
 * A human reading "39 components" beside a list of 38 notices, or checks
 * `/r/registry.json`, or asks. A model loads the file, believes it, and rebuilds
 * a component the list failed to mention , which is exactly what happened:
 * `ScrollArea` and `Slider` both shipped without being added to it, while the
 * prose claimed 36 semantic tokens against a real 48 and 39 components against a
 * real 40. Every one of those numbers was hand-maintained, so every one of them
 * drifted the moment someone landed a component and did not think about a
 * markdown file two directories away.
 *
 * So the numbers stop being prose. This suite derives each one from the thing it
 * describes and fails the build when the document disagrees , the same trick
 * `registry-parity.test.ts` plays on the four lists, and the icon suite plays on
 * its own count.
 *
 * Adding a component therefore means touching SKILL.md too. That is the point:
 * the cost of the extra edit is paid once, by the person who has the context,
 * instead of by every agent that reads a stale list afterwards.
 */

/*
 * `process.cwd()` rather than `import.meta.url`, for the reason spelled out in
 * `registry-parity.test.ts`: vitest rewrites `import.meta` in transformed
 * modules and the URL-relative form resolves against the package's `main`.
 */
const skillPath = join(process.cwd(), '../../skills/velobits-ui/SKILL.md');
const skill = readFileSync(skillPath, 'utf8');

/**
 * `velobits-provider` is typed `registry:ui` because the CLI has to drop it into
 * the consumer's components tree like any other file, but it is foundation in
 * the documentation's grouping , nobody reaches for it looking for a component.
 * It is the single name that cannot be derived from `type` alone, so it is the
 * single name written out here.
 */
const FOUNDATION = new Set(
  registry.items
    .filter((item) => item.type !== 'registry:ui')
    .map((item) => item.name)
    .concat('velobits-provider'),
);

const componentNames = registry.items
  .map((item) => item.name)
  .filter((name) => !FOUNDATION.has(name));

const iconCount = Object.entries(iconsModule).filter(
  ([name, value]) => name.endsWith('Icon') && typeof value === 'function' && name !== 'createIcon',
).length;

/** The `## 6.` section, which is the only part of the file that inventories items. */
function inventorySection(): string {
  const start = skill.indexOf('## 6.');
  expect(start, 'SKILL.md no longer has a `## 6.` section to check').toBeGreaterThan(-1);
  const rest = skill.slice(start + 1);
  const end = rest.indexOf('\n## ');
  return end === -1 ? rest : rest.slice(0, end);
}

/** The backticked names under one `- **Heading**` bullet of the inventory. */
function bulletNames(heading: string): string[] {
  const section = inventorySection();
  const bullet = new RegExp(`^- \\*\\*${heading}\\*\\*([\\s\\S]*?)(?=^- \\*\\*|\\n\\n)`, 'm');
  const match = bullet.exec(section);
  expect(match, `SKILL.md's inventory has no **${heading}** bullet`).not.toBeNull();
  return [...match![1]!.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1]!);
}

/** One number out of the prose, by the sentence around it. */
function statedNumber(pattern: RegExp, what: string): number {
  const match = pattern.exec(skill);
  expect(match, `SKILL.md no longer states ${what} in a form this test can read`).not.toBeNull();
  return Number(match![1]);
}

describe('SKILL.md ↔ the system it documents', () => {
  it('states the real number of semantic tokens', () => {
    /*
     * Against the light theme's keys rather than a count of `--` lines in the
     * CSS: `SemanticTokens` is the interface both themes satisfy, so this is the
     * vocabulary a consumer actually has. It read 36 while the real figure was
     * 48, the gap being the five chart roles, `on-danger`, and the seven-token
     * `chrome` tier , a whole paintable surface an agent had no way to discover.
     */
    const stated = statedNumber(/(\d+) semantic tokens/, 'a semantic token count');
    expect(stated).toBe(Object.keys(light).length);
  });

  it('states the real number of components, in both places it says so', () => {
    const intro = statedNumber(/(\d+)\s+components built on Radix/, 'a component count');
    const inventory = statedNumber(
      /(\d+) components in three tiers/,
      'a component count in the inventory',
    );

    expect(intro).toBe(componentNames.length);
    expect(inventory).toBe(componentNames.length);
  });

  it('states the real number of registry items', () => {
    const stated = statedNumber(/(\d+) registry items/, 'a registry item count');
    expect(stated).toBe(registry.items.length);
  });

  it('states the real number of icons', () => {
    const stated = statedNumber(/(\d+) stroke icons/, 'an icon count');
    expect(stated).toBe(iconCount);
  });

  it('names every registry item exactly once, and invents none', () => {
    /*
     * The assertion that would have caught ScrollArea and Slider. A count alone
     * would not have: the inventory claimed 39 while listing 38, so the prose
     * and the list were independently wrong and neither disproved the other.
     */
    const listed = [
      ...bulletNames('Foundation'),
      ...bulletNames('Primitives'),
      ...bulletNames('Overlays'),
      ...bulletNames('Composites'),
    ];

    expect(new Set(listed).size, 'a name appears under more than one tier').toBe(listed.length);
    expect([...listed].sort()).toEqual([...registry.items.map((i) => i.name)].sort());
  });

  it('puts the foundation items under Foundation and nothing else there', () => {
    expect([...bulletNames('Foundation')].sort()).toEqual([...FOUNDATION].sort());
  });
});
