import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Test against source, not dist, so a failure points at a line you can edit.
    // The PUBLISHED types are verified separately by publint + attw in CI.
    alias: {
      '@velobitsdevs/tokens': new URL('../tokens/src/index.ts', import.meta.url).pathname,
      '@velobitsdevs/icons': new URL('../icons/src/index.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
