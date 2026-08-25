import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * The consumer suite: a SECOND vitest project that runs against `dist/`, not
 * against `registry/velobits/`.
 *
 * `vitest.config.ts` deliberately aliases the workspace packages to their
 * TypeScript sources , "so a failure points at a line you can edit". That is the
 * right default and it is also a blind spot: everything between the source and
 * what npm actually serves , the tsup entry map, the `exports` map, the
 * `'use client'` banner, which dependencies are externalised , is untested by
 * it. `publint` and `attw` read that map statically; nothing imported it.
 *
 * So this config is the inverse of the other one, on purpose:
 *
 *   - NO aliases. `@velobitsio/ui/form` resolves the way a consumer's bundler
 *     resolves it, through the workspace symlink into the published `exports`.
 *   - It requires a build. `turbo.json` gives this task `dependsOn: ["build"]`
 *     so `npm run package:check` and CI always have one; run standalone without
 *     one and the first test says so by name rather than failing obscurely.
 *
 * Kept out of `test/` rather than excluded from it, because the two suites
 * answer different questions and a file in the wrong one passes for the wrong
 * reason.
 */
/**
 * The guard lives HERE, not in a `beforeAll`.
 *
 * Vite resolves a test file's imports while transforming it, so with no `dist/`
 * the suite dies at `Failed to resolve import "@velobitsio/ui/form"` before a
 * single hook runs , a `beforeAll` check reads like a safety net and is dead
 * code. A config module is plain Node and evaluates first, so this is the only
 * place the message can actually reach anyone.
 */
if (!existsSync(join(dirname(fileURLToPath(import.meta.url)), 'dist/index.js'))) {
  throw new Error(
    'packages/ui/dist is missing, and this suite tests the BUILT package.\n' +
      'Run `npm run build -w @velobitsio/ui` first, or `npm run package:check`,\n' +
      'which is the task turbo wires this to.',
  );
}

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['test-consumer/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
});
