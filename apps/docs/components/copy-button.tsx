'use client';

import { useEffect, useState } from 'react';

import { Button, cn } from '@velobitsio/ui';
import { CheckIcon, CopyIcon } from '@velobitsio/icons';

/**
 * Copy-to-clipboard with a confirmation that decays.
 *
 * Presence-checks `navigator.clipboard` as a whole object rather than calling it
 * and catching , the entire API is absent on an insecure origin, so
 * `navigator.clipboard.writeText` throws a TypeError on the property access, not
 * a rejected promise. `CodeBlock` in the registry makes the same check for the
 * same reason; this is the docs-chrome copy of it, for buttons that are not
 * attached to a CodeBlock.
 */
export function CopyButton({
  value,
  label = 'Copy to clipboard',
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      className={cn('size-7', className)}
      /*
       * The label changes, so a screen reader hears the result. The ICON alone
       * changing is a visual-only confirmation, which is the whole of 1.4.1's
       * complaint about colour.
       */
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
    </Button>
  );
}
