import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  treeshake: true,
  // Function-form config with `clean: !options.watch` is mandatory for any
  // package whose dist/ types a sibling consumes: @velobits-dev/ui resolves its
  // token types from dist/index.d.ts, and a startup wipe races its DTS build.
  clean: !options.watch,
}));
