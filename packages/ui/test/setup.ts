import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Testing Library registers its own `afterEach(cleanup)` only when a global
 * `afterEach` exists , which it does not, because `globals: false` in
 * vitest.config.ts. Without this, every render accumulates in the same document
 * and the failure is `Found multiple elements with the role "button"`, which
 * reads like a component rendering twice.
 */
afterEach(() => {
  cleanup();
});

/**
 * happy-dom implements none of the following, and Radix uses all three.
 * Absent them, any component that measures or animates throws during render,
 * which reads as a component bug rather than an environment gap.
 */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Radix's Presence checks for running animations before it unmounts.
if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = function getAnimations() {
    return [];
  };
}
