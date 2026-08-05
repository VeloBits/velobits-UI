import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // No DOM: this package is pure data and maths, and keeping it that way is
    // the point (see the eslint rule barring React imports).
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
