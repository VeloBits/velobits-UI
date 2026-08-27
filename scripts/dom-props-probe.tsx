import type { ComponentProps } from 'react';

/**
 * NOT A COMPONENT. A fixture `build-docs-data.ts` parses to learn the NAMES of
 * every prop a plain DOM element accepts , see the prop-table filter there.
 *
 * It exists as a real file rather than a hardcoded list so the set tracks
 * `@types/react` on its own: a React release that adds an attribute adds it
 * here for free, and one that removes an attribute stops us denying a name that
 * has become available for a component's own use.
 *
 * `'div'` is the right element to probe because the set wanted is the *shared*
 * HTML surface , global attributes, ARIA and DOM events. An input or an anchor
 * would add `value`, `href` and friends, which are names a component of ours
 * could legitimately declare.
 */
export function DomPropsProbe(_props: ComponentProps<'div'>) {
  return null;
}
