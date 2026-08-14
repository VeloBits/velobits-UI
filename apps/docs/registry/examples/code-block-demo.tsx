'use client';

import { CodeBlock } from '@velobitsio/ui';

export default function CodeBlockDemo() {
  return (
    <div className="max-w-2xl space-y-4">
      <CodeBlock language="json" copyable label="Flag payload">
        {
          '{\n  "key": "new-checkout",\n  "type": "boolean",\n  "state": "partial",\n  "rollout": 40\n}'
        }
      </CodeBlock>
      <CodeBlock variant="terminal" wrap copyable label="API key">
        vb_live_4f8a2c91d7e35b06a1c9f2e8d4b7a350
      </CodeBlock>
    </div>
  );
}
