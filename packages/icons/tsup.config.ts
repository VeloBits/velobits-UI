import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  treeshake: true,
  external: ['react'],
  // See the note in packages/tokens/tsup.config.ts — @velobitsdevs/ui resolves icon
  // types from this dist/, so a watch-mode wipe races its DTS build.
  clean: !options.watch,
}));
