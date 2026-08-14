'use client';

import { NativeSelect } from '@velobitsdevs/ui';

export default function NativeSelectDemo() {
  return (
    <div className="max-w-xs">
      <NativeSelect aria-label="Environment" defaultValue="prod">
        <option value="dev">Development</option>
        <option value="staging">Staging</option>
        <option value="prod">Production</option>
      </NativeSelect>
    </div>
  );
}
