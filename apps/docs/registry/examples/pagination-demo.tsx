'use client';

import { useState } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from '@velobits-dev/ui';

export default function PaginationDemo() {
  const [page, setPage] = useState(6);
  const pageCount = 20;

  return (
    <div className="space-y-3">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {/*
             * `disabled` here sets aria-disabled, not the attribute: at the ends
             * of the range the focused element must not vanish, so the click
             * guard is what actually stops the activation.
             */}
            <PaginationPrevious
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
          </PaginationItem>
          {paginationRange({ page, pageCount }).map((slot, index) => (
            <PaginationItem key={slot === 'ellipsis' ? `gap-${index}` : slot}>
              {slot === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href={`#page-${slot}`}
                  isActive={slot === page}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(slot);
                  }}
                >
                  {slot}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={page === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-center text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {pageCount}
      </p>
    </div>
  );
}
