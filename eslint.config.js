import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      // Next writes route validators full of `any` and `@ts-ignore` into
      // .next/types. Linting generated output produces thousands of errors
      // nobody can act on.
      '**/.next/**',
      'packages/tokens/src/generated/**',
      // Compiled registry output, written by `npm run registry:build`.
      'apps/docs/public/r/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    files: ['packages/*/src/**/*.tsx', 'apps/docs/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
    languageOptions: { globals: globals.browser },
  },

  /*
   * @velobits/tokens is declared with ZERO dependencies and ZERO React, and
   * that is load-bearing rather than tidy: the Keycloak login theme consumes
   * this package and CANNOT consume @velobits/ui (its component sources are
   * git-ignored and re-vended by a keycloakify postinstall hook). The moment a
   * token file imports React the theme's only clean seam closes.
   *
   * Node built-ins are barred for the same reason — the generator script under
   * scripts/ is where filesystem work belongs, and it is not shipped.
   */
  {
    files: ['packages/tokens/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'node:*'],
              message:
                '@velobits/tokens must stay dependency-free and React-free — the Keycloak login theme consumes it precisely because it is. Put anything needing React in @velobits/ui.',
            },
          ],
        },
      ],
    },
  },

  /*
   * This package IS the icon source. lucide-react is not a dependency anywhere
   * in this repo, and the rule exists so that adding it back is a deliberate
   * argument rather than an autocomplete. The consumer apps bar it too
   * (ToggleFlow's eslint config, outside components/ui/**) because Lucide's
   * glyphs lose their read at the 13-18px these dashboards render at.
   */
  {
    files: ['packages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message:
                'velobits-ui IS the icon source — add the glyph to @velobits/icons instead. The 24×24/strokeWidth-2 set is tuned for the 13-18px these products render at.',
            },
          ],
        },
      ],
    },
  },

  /*
   * Presentational primitives only. Mirrors the rule ToggleFlow applies to its
   * own components/ui/**: it is what makes excluding these files from coverage
   * thresholds honest rather than a hiding place, since nothing that fetches,
   * routes or knows an app type can live here.
   */
  {
    files: ['packages/ui/src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@tanstack/react-query', 'react-router-dom', '**/api/*'],
              message:
                'Shared primitives must not fetch, route, or know an app type — those belong in the consuming app.',
            },
          ],
        },
      ],
    },
  },

  {
    // `.mjs` matters: apps/docs/next.config.mjs uses `URL`, which is a Node
    // global rather than a browser one in that context.
    files: ['**/*.config.{ts,js,mjs}', 'scripts/**/*.ts', 'packages/*/scripts/**/*.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.es2023 } },
    rules: { 'no-restricted-imports': 'off' },
  },
);
