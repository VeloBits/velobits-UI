/**
 * @velobitsio/icons , the unified VeloBits icon set.
 *
 * 201 hand-drawn stroke icons, merged from the sets that had independently
 * diverged in the dashboard app and the editor app. Every existing name is
 * preserved.
 *
 * ```tsx
 * import { FlagIcon } from '@velobitsio/icons';
 * <FlagIcon size={16} />
 * ```
 *
 * Tree-shakes on ESM without per-icon entry points: the package is
 * `sideEffects: false` and every export is a plain function, so a bundler drops
 * what you do not reference. `size-limit` asserts that in CI rather than
 * assuming it.
 */
export { createIcon, type Icon, type IconProps } from './create-icon';
export * from './icons';
