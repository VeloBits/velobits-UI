'use client';

import {
  Button,
  SidePanel,
  SidePanelClose,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
  StatusChip,
} from '@velobitsdevs/ui';

export default function SidePanelDemo() {
  return (
    <SidePanel>
      <SidePanelTrigger asChild>
        <Button variant="secondary">Open flag detail</Button>
      </SidePanelTrigger>
      <SidePanelContent>
        <SidePanelHeader>
          <SidePanelTitle>new-checkout</SidePanelTitle>
          <SidePanelDescription>Slides in from the inline end.</SidePanelDescription>
        </SidePanelHeader>
        <div className="space-y-4 px-4 text-sm">
          <div className="flex items-center gap-2">
            <StatusChip status="partial">40%</StatusChip>
            <span className="text-muted-foreground">in Production</span>
          </div>
          <p className="text-muted-foreground">
            Escape closes the panel and focus returns to the trigger. Below the md breakpoint this
            same component is what AppShell uses for its nav drawer.
          </p>
        </div>
        <SidePanelFooter>
          <SidePanelClose asChild>
            <Button variant="ghost">Close</Button>
          </SidePanelClose>
          <Button variant="primary">Save</Button>
        </SidePanelFooter>
      </SidePanelContent>
    </SidePanel>
  );
}
