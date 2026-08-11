'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@velobits-dev/ui';

export default function AccordionDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Accordion type="single" collapsible defaultValue="what">
        <AccordionItem value="what">
          <AccordionTrigger>What is a flag?</AccordionTrigger>
          <AccordionContent>
            A named switch, evaluated at request time rather than at build time.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="envs">
          <AccordionTrigger>How do environments inherit?</AccordionTrigger>
          <AccordionContent>
            A child environment falls back to its parent&apos;s state until it sets its own.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="rollouts">
          <AccordionTrigger>What is a partial rollout?</AccordionTrigger>
          <AccordionContent>
            A stable percentage of traffic sees the flag on, bucketed by a seed so the same user
            keeps the same answer.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Accordion type="multiple" surface="panel">
        <AccordionItem value="a">
          <AccordionTrigger>surface=&quot;panel&quot;, type=&quot;multiple&quot;</AccordionTrigger>
          <AccordionContent>
            The opaque variant, and more than one panel can be open at once.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>When to reach for it</AccordionTrigger>
          <AccordionContent>
            Inside a Card, inside a Dialog — anywhere the parent is already glass.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
