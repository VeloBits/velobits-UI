'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@velobits-dev/ui';

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Avatar>
        <AvatarImage src="/icon.svg" alt="" />
        <AvatarFallback>VB</AvatarFallback>
      </Avatar>
      {/* No image at all, so the fallback shows without a console 404. */}
      <Avatar>
        <AvatarFallback>NS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>
    </div>
  );
}
