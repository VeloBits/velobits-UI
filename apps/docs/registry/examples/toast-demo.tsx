'use client';

import { useState } from 'react';

import {
  Button,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@velobits/ui';
import { AlertTriangleIcon, CircleCheckIcon } from '@velobits/icons';

interface ToastEntry {
  id: number;
  variant: 'success' | 'danger';
}

export default function ToastDemo() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [nextId, setNextId] = useState(0);

  const fire = (variant: ToastEntry['variant']) => {
    setToasts((current) => [...current, { id: nextId, variant }]);
    setNextId((n) => n + 1);
  };

  return (
    <ToastProvider>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => fire('success')}>
          Show success toast
        </Button>
        <Button variant="secondary" onClick={() => fire('danger')}>
          Show danger toast
        </Button>
      </div>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          onOpenChange={(open) => {
            if (!open) setToasts((current) => current.filter((t) => t.id !== toast.id));
          }}
        >
          {toast.variant === 'success' ? <CircleCheckIcon /> : <AlertTriangleIcon />}
          <ToastTitle>{toast.variant === 'success' ? 'Flag saved' : 'Save failed'}</ToastTitle>
          <ToastDescription>
            {toast.variant === 'success'
              ? 'new-checkout is live in Production.'
              : 'The server rejected the change.'}
          </ToastDescription>
          <ToastAction altText="Open the flag's history to undo this change">Undo</ToastAction>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
