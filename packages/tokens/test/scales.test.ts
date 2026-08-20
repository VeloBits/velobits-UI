import { describe, expect, it } from 'vitest';

import * as scalesModule from '../src/scales';
import { SCALES } from '../src/scales';

/**
 * `SCALES` exists so `/tokens` can map over the scales instead of hand-listing
 * them. That only buys anything if the registry is guaranteed complete , a
 * registry that someone forgets to extend is exactly as lossy as the nine
 * literal `<ScaleTable>` calls it replaced, just harder to notice.
 *
 * So this asserts the two agree in both directions.
 */
describe('SCALES is the whole set, not a hand-picked subset', () => {
  /** Every object-valued export of the module except the registry itself. */
  const declared = Object.entries(scalesModule)
    .filter(([name, value]) => name !== 'SCALES' && typeof value === 'object' && value !== null)
    .map(([name]) => name)
    .sort();

  it('found the scales at all, so the filter above still works', () => {
    expect(declared.length).toBeGreaterThanOrEqual(9);
  });

  it('registers every scale the module exports', () => {
    expect(Object.keys(SCALES).sort()).toEqual(declared);
  });

  it('registers each one by identity, not a copy that can drift', () => {
    for (const name of declared) {
      expect(SCALES[name]).toBe(scalesModule[name as keyof typeof scalesModule]);
    }
  });

  it('holds only non-empty scales of primitives', () => {
    for (const [name, scale] of Object.entries(SCALES)) {
      expect(Object.keys(scale).length, `${name} is empty`).toBeGreaterThan(0);
      for (const [key, value] of Object.entries(scale)) {
        expect(['string', 'number'], `${name}.${key}`).toContain(typeof value);
      }
    }
  });
});
