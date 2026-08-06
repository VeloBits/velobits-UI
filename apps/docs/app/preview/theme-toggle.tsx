'use client';

import { MoonIcon, SunIcon } from '@velobits-dev/icons';
import { Button, useTheme } from '@velobits-dev/ui';

/**
 * Same pattern as the site header: both icons rendered, CSS picks one, so the
 * server and client markup agree and there is no hydration mismatch.
 */
export function PreviewThemeToggle() {
  const { toggle } = useTheme();

  return (
    <Button variant="secondary" onClick={toggle} aria-label="Toggle theme">
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
      Toggle theme
    </Button>
  );
}
