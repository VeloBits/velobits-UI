/**
 * @velobits/tokens — the VeloBits design system's token layer.
 *
 * ZERO dependencies and ZERO React, deliberately: the Keycloak login theme
 * consumes this package and **cannot** consume `@velobits/ui`. Its component
 * sources are git-ignored and re-vended by a `keycloakify sync-extensions`
 * postinstall hook, so shared *components* there means fighting the upstream
 * extension forever, while shared *tokens* is a clean seam the theme's own
 * README already points at. An eslint rule enforces the constraint.
 *
 * ## Consuming the CSS
 *
 * One import per app — `theme.css` pulls in Tailwind, the raw tokens and the
 * glass layer:
 *
 * ```css
 * @import '@velobits/tokens/theme.css';
 * @source "../node_modules/@velobits/ui/dist";
 * ```
 *
 * That `@source` line is not optional. Tailwind v4 does not scan node_modules,
 * so utilities used *inside* `@velobits/ui` are never generated without it, and
 * the components arrive unstyled with no error anywhere.
 */

export * from './color';
export * from './palette';
export * from './semantic';
export * from './scales';
export * from './glass';
export * from './contrast-pairs';
