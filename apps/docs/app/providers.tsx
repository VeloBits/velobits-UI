'use client';

import { THEME_STORAGE_KEYS, VelobitsProvider } from '@velobits-dev/ui';

/**
 * The docs site reuses the dashboard app's storage key rather than inventing a third,
 * so opening the docs beside the dashboard on the same host shows the same theme.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>{children}</VelobitsProvider>;
}
