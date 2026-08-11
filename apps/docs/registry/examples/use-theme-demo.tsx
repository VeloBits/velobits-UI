'use client';

import { Badge, Button, useTheme } from '@velobits-dev/ui';
import { MoonIcon, SunIcon } from '@velobits-dev/icons';

export default function UseThemeDemo() {
  const { mode, theme, mounted, setMode, toggle } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/*
         * Both icons render and CSS picks one, rather than branching on `theme`
         * in JS. The server has no localStorage, so a JS branch
         * renders the light arm while the client's first render already knows the
         * stored preference — React throws #418 and discards the server HTML.
         * Letting the `dark` class decide keeps the markup identical on both
         * sides. `mounted` is for the cases CSS cannot express, like the readout
         * below.
         */}
        <Button variant="secondary" onClick={toggle}>
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="dark:hidden" />
          Toggle
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMode('light')}>
          Light
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMode('dark')}>
          Dark
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMode('system')}>
          System
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">mode</span>
        <Badge variant="primary">{mounted ? mode : '…'}</Badge>
        <span className="text-muted-foreground">theme</span>
        <Badge variant="info">{mounted ? theme : '…'}</Badge>
      </div>
    </div>
  );
}
