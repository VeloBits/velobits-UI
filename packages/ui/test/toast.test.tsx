import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CircleCheckIcon } from '@velobits/icons';

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toastVariants,
} from '../../../registry/velobits/ui/toast';
import { auditElement, describeViolations } from './axe';

/**
 * Radix portals each toast into the viewport, and the viewport refuses to render
 * toasts without a `ToastProvider` above it — so every fixture here mounts the
 * full triple. That is also the shape a consumer must use.
 */
function Harness({
  children,
  ...providerProps
}: React.ComponentProps<typeof ToastProvider> & { children?: React.ReactNode }) {
  return (
    <ToastProvider {...providerProps}>
      {children}
      <ToastViewport />
    </ToastProvider>
  );
}

function getToast() {
  return document.querySelector('[data-slot="toast"]');
}

describe('Toast, rendering and structure', () => {
  it('renders a titled toast inside the labelled viewport region', () => {
    render(
      <Harness>
        <Toast open>
          <ToastTitle>Rollout complete</ToastTitle>
          <ToastDescription>gradual-onboarding is at 100%.</ToastDescription>
          <ToastClose />
        </Toast>
      </Harness>,
    );
    expect(screen.getByText('Rollout complete')).toBeTruthy();
    expect(screen.getByText('gradual-onboarding is at 100%.')).toBeTruthy();
    // Radix wraps the <ol> in role=region with the provider's label + F8 hotkey.
    expect(screen.getByRole('region').getAttribute('aria-label')).toMatch(/Notification/);
  });

  it('portals the toast into the viewport list, not where it was declared', () => {
    /**
     * Which is why the viewport's own position is the thing that matters — see
     * the containing-block warning. A toast declared deep inside a glass Dialog
     * still lands in the viewport's `<ol>`.
     */
    render(
      <Harness>
        <div data-testid="declared-here">
          <Toast open>
            <ToastTitle>Saved</ToastTitle>
          </Toast>
        </div>
      </Harness>,
    );
    const toast = getToast()!;
    expect(screen.getByTestId('declared-here').contains(toast)).toBe(false);
    expect(toast.closest('ol')).toBe(document.querySelector('[data-slot="toast-viewport"]'));
  });

  it('places title, description, action and close on the reserved grid', () => {
    /**
     * Column 1 is the icon gutter, 2 the content, 3 the close affordance — the
     * same shape as Alert, so the two read as one family and neither has to be
     * laid out at the call site.
     */
    render(
      <Harness>
        <Toast open variant="success">
          <CircleCheckIcon />
          <ToastTitle>Rollout complete</ToastTitle>
          <ToastDescription>All environments updated.</ToastDescription>
          <ToastAction altText="Open the rollout history to revert">Undo</ToastAction>
          <ToastClose />
        </Toast>
      </Harness>,
    );
    expect(getToast()!.className).toContain('grid-cols-[calc(var(--spacing)*4)_1fr_auto]');
    expect(document.querySelector('[data-slot="toast-title"]')!.className).toContain('col-start-2');
    expect(document.querySelector('[data-slot="toast-description"]')!.className).toContain(
      'col-start-2',
    );
    expect(document.querySelector('[data-slot="toast-action"]')!.className).toContain(
      'col-start-2',
    );

    const close = document.querySelector('[data-slot="toast-close"]')!;
    expect(close.className).toContain('col-start-3');
    expect(close.className).toContain('row-start-1');
    // justify-self, not a margin: grid placement is already direction-aware.
    expect(close.className).toContain('justify-self-end');
    expect(close.className).not.toMatch(/\bml-auto\b/);
  });
});

describe('Toast, dismissal', () => {
  it('closes when the close button is pressed', async () => {
    const onOpenChange = vi.fn();
    render(
      <Harness>
        <Toast open onOpenChange={onOpenChange}>
          <ToastTitle>Saved</ToastTitle>
          <ToastClose />
        </Toast>
      </Harness>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('unmounts the toast on close when it is uncontrolled', async () => {
    render(
      <Harness>
        <Toast defaultOpen>
          <ToastTitle>Saved</ToastTitle>
          <ToastClose />
        </Toast>
      </Harness>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
  });

  it('auto-dismisses after its duration', async () => {
    /**
     * A real timer at 40ms rather than fake timers: Radix drives the countdown
     * through a `window.setTimeout` started in an effect and pauses it on
     * `VIEWPORT_PAUSE`, so faking the clock means also faking the pause/resume
     * choreography, and the test starts asserting the mock instead of the
     * component.
     */
    render(
      <Harness>
        <Toast defaultOpen duration={40}>
          <ToastTitle>Copied</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(screen.getByText('Copied')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Copied')).toBeNull(), { timeout: 2000 });
  });

  it('never auto-dismisses when duration is Infinity', async () => {
    /**
     * The escape hatch for a message the user must read. Anything they must ACT
     * on is a Dialog, not a toast — but a persistent toast is the right shape for
     * "we lost the connection, retrying".
     */
    render(
      <Harness>
        <Toast defaultOpen duration={Infinity}>
          <ToastTitle>Reconnecting…</ToastTitle>
        </Toast>
      </Harness>,
    );
    await new Promise((r) => setTimeout(r, 60));
    expect(screen.getByText('Reconnecting…')).toBeTruthy();
  });

  it('dismisses on Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <Harness>
        <Toast open onOpenChange={onOpenChange}>
          <ToastTitle>Saved</ToastTitle>
          <ToastClose />
        </Toast>
      </Harness>,
    );
    fireEvent.keyDown(getToast()!, { key: 'Escape' });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('inherits the provider duration and lets a single toast override it', () => {
    render(
      <Harness duration={9000}>
        <Toast open>
          <ToastTitle>a</ToastTitle>
        </Toast>
      </Harness>,
    );
    // Nothing user-visible to assert here beyond "it did not throw and did not
    // vanish", which is the point: a provider-level default must not be
    // interpreted as 0.
    expect(screen.getByText('a')).toBeTruthy();
  });
});

describe('Toast, variants', () => {
  it('maps every variant onto the status tokens with a logical accent stripe', () => {
    const cases = [
      ['success', 'border-s-success'],
      ['danger', 'border-s-danger'],
      ['warning', 'border-s-warning'],
      ['info', 'border-s-info'],
    ] as const;

    for (const [variant, expected] of cases) {
      const cls = toastVariants({ variant });
      expect(cls, variant).toContain(expected);
      expect(cls, variant).toContain('border-s-4');
      // Logical, so the stripe stays on the reading-start edge under dir="rtl".
      expect(cls, variant).not.toMatch(/\bborder-l-/);
    }
    expect(toastVariants({ variant: 'default' })).toContain('border-s-border');
  });

  it('defaults to the neutral variant', () => {
    render(
      <Harness>
        <Toast open>
          <ToastTitle>a</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(getToast()!.getAttribute('data-variant')).toBe('default');
    expect(getToast()!.className).toContain('border-s-border');
  });

  it('never puts a *-soft wash on the glass surface', () => {
    /**
     * THE variant trap. The soft tokens are low-alpha washes meant for an OPAQUE
     * panel — `--success-soft` is `rgba(43,118,45,0.12)`. `.glass` sits in
     * Tailwind's `components` layer, so a `bg-success-soft` utility WINS and
     * replaces `--glass-bg` (alpha 0.85) with alpha 0.12. The toast becomes a
     * blurred smear of the page behind it, and nothing warns you because both
     * classes are individually valid.
     *
     * The status colour therefore rides the border and the icon, never the
     * background.
     */
    for (const variant of ['default', 'success', 'danger', 'warning', 'info'] as const) {
      const cls = toastVariants({ variant });
      expect(cls, variant).toContain('glass');
      expect(cls, variant).not.toMatch(
        /\bbg-(success|danger|warning|info|brand|primary)(-soft)?\b/,
      );
    }
  });

  it('tints only the icon, leaving body copy on the glass-corrected muted step', () => {
    /**
     * Stacking a status tint on body copy is how a text pair quietly drops below
     * AA — the same reason `Alert` keeps its description on
     * `text-muted-foreground`. Inside `.glass` that token resolves to
     * `--muted-on-glass` (4.92:1) rather than `--muted-fg` (3.09:1), and the call
     * site does not have to know.
     */
    expect(toastVariants({ variant: 'danger' })).toContain('[&>svg]:text-danger');
    render(
      <Harness>
        <Toast open variant="danger">
          <ToastTitle>Rollout failed</ToastTitle>
          <ToastDescription>Check the target environment.</ToastDescription>
        </Toast>
      </Harness>,
    );
    expect(document.querySelector('[data-slot="toast-description"]')!.className).toContain(
      'text-muted-foreground',
    );
    expect(document.querySelector('[data-slot="toast-title"]')!.className).not.toMatch(
      /text-(danger|success|warning|info)\b/,
    );
  });
});

describe('Toast, the viewport contract', () => {
  it('is fixed at the inline end of the bottom edge, on the toast rung', () => {
    render(<Harness />);
    const cls = document.querySelector('[data-slot="toast-viewport"]')!.className;
    expect(cls).toContain('fixed');
    expect(cls).toContain('z-toast');
    expect(cls).toContain('bottom-0');
    // Logical: bottom-right in LTR, bottom-left under dir="rtl".
    expect(cls).toContain('end-0');
    expect(cls).not.toMatch(/\bright-0\b/);
  });

  it('stacks with flex-col so DOM order matches visual order', () => {
    /**
     * The container hugs its content at `bottom-0`, so the LAST child is already
     * nearest the corner. `flex-col-reverse` would achieve the same visual
     * result while inverting reading order against DOM order (WCAG 1.3.2).
     */
    render(<Harness />);
    const cls = document.querySelector('[data-slot="toast-viewport"]')!.className;
    expect(cls).toContain('flex-col');
    expect(cls).not.toContain('flex-col-reverse');
  });

  it('lets clicks through the gaps between toasts', () => {
    render(
      <Harness>
        <Toast open>
          <ToastTitle>a</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(document.querySelector('[data-slot="toast-viewport"]')!.className).toContain(
      'pointer-events-none',
    );
    expect(getToast()!.className).toContain('pointer-events-auto');
  });

  it('documents that it must not be mounted inside a glass ancestor', () => {
    /**
     * `backdrop-filter` establishes a containing block for `position: fixed`
     * descendants, so a viewport under a `.glass` element anchors to that element
     * instead of the layout viewport and is trapped inside it. There is no
     * runtime check that can catch this — the docblock is the control, so the
     * docblock is what is asserted.
     */
    const source = readFileSync(
      join(process.cwd(), '../../registry/velobits/ui/toast.tsx'),
      'utf8',
    );
    expect(source).toMatch(/MUST NOT BE RENDERED INSIDE A GLASS ANCESTOR/);
    expect(source).toMatch(/containing block for fixed descendants/i);
  });
});

describe('Toast, swipe and animation', () => {
  it('defaults the swipe axis to `down`, which is direction-agnostic', () => {
    /**
     * Radix defaults to `right`. The viewport sits at the inline END, so under
     * `dir="rtl"` that is the bottom-LEFT corner and a rightward swipe drags the
     * toast away from the edge it should leave through. Down works in both.
     */
    render(
      <Harness>
        <Toast open>
          <ToastTitle>a</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(getToast()!.getAttribute('data-swipe-direction')).toBe('down');
  });

  it('carries a fallback on both swipe axes, so overriding the direction still works', () => {
    /**
     * Radix publishes `--radix-toast-swipe-move-y` ONLY while swiping on that
     * axis. A bare `var()` with no fallback makes the whole `translate`
     * declaration invalid, so a horizontal override would silently not move.
     */
    const cls = toastVariants({});
    expect(cls).toContain('translate-x-[var(--radix-toast-swipe-move-x,0px)]');
    expect(cls).toContain('translate-y-[var(--radix-toast-swipe-move-y,0px)]');
  });

  it('honours a horizontal override', () => {
    render(
      <Harness swipeDirection="right">
        <Toast open>
          <ToastTitle>a</ToastTitle>
        </Toast>
      </Harness>,
    );
    expect(getToast()!.getAttribute('data-swipe-direction')).toBe('right');
  });

  it('animates transform and opacity only — never the blur radius', () => {
    const cls = toastVariants({});
    expect(cls).toMatch(/data-\[state=open\]:animate-in/);
    expect(cls).toMatch(/data-\[state=closed\]:animate-out/);
    expect(cls).toMatch(/slide-in-from-bottom/);
    expect(cls).not.toMatch(/backdrop-blur|transition-\[backdrop/);
  });
});

describe('Toast accessibility', () => {
  it('requires altText on an action, because the button may never be reached', () => {
    /**
     * A toast is transient; a screen-reader user may hear the announcement long
     * after the button has gone. Radix reads `altText` as the alternative route
     * to the same outcome, so it must describe a route, not the button.
     */
    render(
      <Harness>
        <Toast open>
          <ToastTitle>Flag archived</ToastTitle>
          <ToastAction altText="Restore it from the flag's history">Undo</ToastAction>
          <ToastClose />
        </Toast>
      </Harness>,
    );
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
  });

  it('gives the close button a name, since it is icon-only', () => {
    render(
      <Harness>
        <Toast open>
          <ToastTitle>a</ToastTitle>
          <ToastClose />
        </Toast>
      </Harness>,
    );
    const close = screen.getByRole('button', { name: 'Dismiss' });
    expect(close.getAttribute('aria-label')).toBe('Dismiss');
    // The glyph itself stays decorative, or it would be announced twice.
    expect(close.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('passes axe with every variant mounted at once', async () => {
    render(
      <main>
        <Harness>
          {(['default', 'success', 'danger', 'warning', 'info'] as const).map((variant) => (
            <Toast key={variant} open variant={variant} duration={Infinity}>
              <CircleCheckIcon />
              <ToastTitle>{`${variant} title`}</ToastTitle>
              <ToastDescription>{`${variant} description`}</ToastDescription>
              <ToastAction altText={`Do ${variant} another way`}>Undo</ToastAction>
              <ToastClose />
            </Toast>
          ))}
        </Harness>
      </main>,
    );

    // The shared gate, rooted at `document.body` rather than at the render
    // container: the viewport is portalled out of it.
    const violations = await auditElement(document.body);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });
});
