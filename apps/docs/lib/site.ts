/**
 * The handful of strings that appear in dozens of places and must never disagree
 * with each other, most of all the registry namespace, which is copied out of
 * this site into consumers' `components.json` files.
 */

export const SITE = {
  name: 'VeloBits UI',
  url: 'https://ui.velobits.dev',
  description:
    'The VeloBits design system: tokens, icons and components shared across every VeloBits surface.',
  repo: 'https://github.com/VeloBits/velobits-UI',
} as const;

/**
 * The shadcn CLI namespace. Consumers map it to this site in their
 * `components.json`, after which `@velobits/button` resolves to
 * `https://ui.velobits.dev/r/button.json`.
 *
 * ## It resolves with NO configuration
 *
 * `@velobits` is registered in shadcn's public registry index, so a current CLI
 * resolves `@velobits/button` in any project that has run `shadcn init`;
 * nothing to add to `components.json`. Verified against a project with no
 * `registries` key at all: `view`, `add` and `search` all work.
 *
 * The two explicit forms below are therefore FALLBACKS, not the happy path. They
 * still matter (an older CLI, an air-gapped mirror, or pinning to a staging
 * origin), which is why they stay documented rather than being deleted.
 */
export const REGISTRY_NAMESPACE = '@velobits';

/**
 * The explicit mapping, for a consumer who wants to pin the origin rather than
 * rely on the public index.
 */
export const REGISTRY_URL_TEMPLATE = `${SITE.url}/r/{name}.json`;

export const REGISTRY_CONFIG_SNIPPET = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "registries": {
    "${REGISTRY_NAMESPACE}": "${REGISTRY_URL_TEMPLATE}"
  }
}`;

/** `button` → `@velobits/button`. */
export function namespacedItem(name: string): string {
  return `${REGISTRY_NAMESPACE}/${name}`;
}

/** Addressable on any CLI version, with no config and no index lookup. */
export function itemUrl(name: string): string {
  return `${SITE.url}/r/${name}.json`;
}

/** The three published packages, for the npm half of the distribution. */
export const NPM_PACKAGES = {
  tokens: '@velobitsio/tokens',
  icons: '@velobitsio/icons',
  ui: '@velobitsio/ui',
} as const;
