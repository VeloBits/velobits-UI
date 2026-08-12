/**
 * The handful of strings that appear in dozens of places and must never disagree
 * with each other — most of all the registry namespace, which is copied out of
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
 * Namespaced registries need shadcn CLI 3 or newer. The full-URL form documented
 * alongside it works on any version and needs no configuration, which is why it
 * is never removed from these pages — only demoted.
 */
export const REGISTRY_NAMESPACE = '@velobits';

/** What a consumer pastes into `components.json`. */
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

/** The no-configuration fallback, for a CLI older than 3 or a one-off install. */
export function itemUrl(name: string): string {
  return `${SITE.url}/r/${name}.json`;
}

/** The three published packages, for the npm half of the distribution. */
export const NPM_PACKAGES = {
  tokens: '@velobits/tokens',
  icons: '@velobits/icons',
  ui: '@velobits/ui',
} as const;
