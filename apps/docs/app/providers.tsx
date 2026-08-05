'use client';

import { THEME_STORAGE_KEYS, VelobitsProvider } from '@velobits/ui';

/**
 * The docs site uses ToggleFlow's storage key rather than inventing a third one,
 * so opening the docs beside the dashboard on the same host shows the same theme.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <VelobitsProvider storageKey={THEME_STORAGE_KEYS.toggleflow}>{children}</VelobitsProvider>;
}
