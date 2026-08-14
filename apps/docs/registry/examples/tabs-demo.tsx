'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@velobitsio/ui';

export default function TabsDemo() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Tabs defaultValue="targeting">
        <TabsList>
          <TabsTrigger value="targeting">Targeting</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="targeting" className="pt-3 text-sm text-muted-foreground">
          Rules are evaluated top to bottom; the first match wins.
        </TabsContent>
        <TabsContent value="history" className="pt-3 text-sm text-muted-foreground">
          Every state change is written to the audit log with its actor.
        </TabsContent>
        <TabsContent value="settings" className="pt-3 text-sm text-muted-foreground">
          Key, description and owning team.
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="one">
        <TabsList variant="line">
          <TabsTrigger value="one">Overview</TabsTrigger>
          <TabsTrigger value="two">Usage</TabsTrigger>
        </TabsList>
        <TabsContent value="one" className="pt-3 text-sm text-muted-foreground">
          The `line` variant, for a page-level tab bar.
        </TabsContent>
        <TabsContent value="two" className="pt-3 text-sm text-muted-foreground">
          Evaluations over the last 24 hours.
        </TabsContent>
      </Tabs>
    </div>
  );
}
