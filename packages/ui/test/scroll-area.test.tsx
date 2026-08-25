import { act, render } from '@testing-library/react';
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ScrollArea, ScrollBar } from '../../../registry/velobits/ui/scroll-area';

/**
 * A fake layout, because happy-dom has none.
 *
 * Every box metric is 0 in a DOM without a layout engine, so `Radix` measures a
 * zero-height viewport, decides the region does not overflow and never renders a
 * thumb at all. These three numbers are the whole geometry the suite needs, and
 * every expectation below is written against them rather than against a
 * magic string.
 */
const VIEWPORT = 100; // what you can see
const CONTENT = 400; // what is in there
const BAR = 100; // the track the thumb slides down

/**
 * The content height the fake layout reports, so one suite can also describe a
 * region whose content FITS , the case that decides whether overscroll
 * containment is safe to apply as a static class. Reset per test.
 */
let content = CONTENT;

/** Radix's own `getThumbSize`: `max(track × viewport / content, 18)`. */
const THUMB = (BAR * VIEWPORT) / CONTENT; // 25
const MAX_THUMB_POS = BAR - THUMB; // 75 , the far end of the track
const MAX_SCROLL = CONTENT - VIEWPORT; // 300 , the far end of the content

const METRICS = [
  'clientHeight',
  'clientWidth',
  'offsetHeight',
  'offsetWidth',
  'scrollHeight',
  'scrollWidth',
] as const;

const saved = new Map<string, PropertyDescriptor | undefined>();

beforeEach(() => {
  content = CONTENT;

  /*
   * Patched on the PROTOTYPE, not on nodes.
   *
   * Radix measures inside a layout effect, during the very first commit, which
   * is before any test has a node to define a property on. A prototype getter
   * that answers from the element's own attributes is the only version of this
   * that is in place early enough, and it doubles as the documentation of which
   * element is standing in for what.
   */
  for (const prop of METRICS) {
    saved.set(prop, Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop));
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get(this: HTMLElement) {
        if (this.hasAttribute('data-radix-scroll-area-viewport')) {
          return prop === 'scrollHeight' || prop === 'scrollWidth' ? content : VIEWPORT;
        }
        if (this.dataset.slot === 'scroll-area-scrollbar') return BAR;
        return 0;
      },
    });
  }

  /*
   * The suite-wide stub in `setup.ts` is inert by design , it exists so that
   * components which merely construct a ResizeObserver do not throw. Radix
   * derives the thumb's existence and its size from one, so here it has to
   * actually fire.
   */
  globalThis.ResizeObserver = class {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe() {
      this.callback([], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  for (const [prop, descriptor] of saved) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, prop, descriptor);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
  }
  saved.clear();
});

/**
 * Wait for a thumb, which takes THREE commits and cannot be done in one `act`.
 *
 * Radix walks there in steps, and each step is a `requestAnimationFrame` inside
 * a ResizeObserver callback followed by a 10ms debounce before the state update:
 *
 *   1. `visible` , the region overflows, so an `auto` scrollbar should exist
 *   2. `sizes`   , the bar is now mounted and can be measured
 *   3. `hasThumb`, the measured ratio is between 0 and 1, so a thumb renders
 *
 * Each step's state update is queued into the act queue and flushed when `act`
 * RESOLVES, so a single long sleep inside one `act` advances the chain by
 * exactly one commit and then stalls. Sleeping longer does not help , which is
 * the trap. Only another `act` does.
 */
async function settle() {
  for (let step = 0; step < 4; step++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
  }
}

/** Scroll the way a wheel does: move the offset, then let the event fly. */
function scroll(viewport: HTMLElement, offset: { top?: number; left?: number }) {
  if (offset.top !== undefined) viewport.scrollTop = offset.top;
  if (offset.left !== undefined) viewport.scrollLeft = offset.left;
  viewport.dispatchEvent(new Event('scroll'));
}

function parts(container: HTMLElement) {
  const viewport = container.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]')!;
  const thumb = container.querySelector<HTMLElement>('[data-slot="scroll-area-thumb"]')!;
  return { viewport, thumb };
}

/**
 * THE TRAP , and it is a trap laid by the BUNDLER, not by this component.
 *
 * Radix moves the thumb from a `requestAnimationFrame` poll it starts on the
 * first `scroll` event. The loop is wrapped in an IIFE carrying esbuild's
 * `@__PURE__` annotation, SWC binds that annotation to the outer call, and
 * because the outer call's result is unused it deletes the invocation. Every
 * minified build therefore ships a thumb that moves ONCE and then stops , and
 * every unminified build, this suite included, looks perfectly healthy.
 *
 * So the assertion cannot be "the thumb moved". It has to be "the thumb moved
 * on an event that Radix alone would have ignored". Radix repositions on a
 * scroll event only while its listener ref is empty, and it is a 100ms debounce
 * that empties it, so the SECOND event of a gesture is exactly the one the
 * broken build drops. That is what these tests dispatch.
 */
describe('ScrollArea, the thumb tracks the viewport', () => {
  it('follows a vertical scroll, on every event and not just the first', async () => {
    const { container } = render(
      <ScrollArea className="h-24">
        <div>tall content</div>
      </ScrollArea>,
    );
    await settle();
    const { viewport, thumb } = parts(container);

    expect(thumb, 'no thumb means the fake layout stopped convincing Radix').toBeTruthy();
    expect(thumb.style.transform).toBe('translate3d(0, 0px, 0)');

    scroll(viewport, { top: MAX_SCROLL / 2 });
    expect(thumb.style.transform).toBe(`translate3d(0, ${MAX_THUMB_POS / 2}px, 0)`);

    /*
     * No frame is allowed to pass between the two dispatches. Radix's poll runs
     * on a rAF and cannot have contributed, so what this asserts is our own
     * listener and nothing else.
     */
    scroll(viewport, { top: MAX_SCROLL });
    expect(
      thumb.style.transform,
      'the second scroll of a gesture is the one a minified build drops',
    ).toBe(`translate3d(0, ${MAX_THUMB_POS}px, 0)`);
  });

  it('clamps past either end of the range', async () => {
    const { container } = render(
      <ScrollArea className="h-24">
        <div>tall content</div>
      </ScrollArea>,
    );
    await settle();
    const { viewport, thumb } = parts(container);

    scroll(viewport, { top: MAX_SCROLL + 500 });
    expect(thumb.style.transform, 'overscroll must not push the thumb off the track').toBe(
      `translate3d(0, ${MAX_THUMB_POS}px, 0)`,
    );

    scroll(viewport, { top: -500 });
    expect(thumb.style.transform, 'rubber-banding must not push it above the track').toBe(
      'translate3d(0, 0px, 0)',
    );
  });

  it('follows a horizontal scroll on the x axis', async () => {
    const { container } = render(
      <ScrollArea axis="x">
        <div>wide content</div>
      </ScrollArea>,
    );
    await settle();
    const { viewport, thumb } = parts(container);

    scroll(viewport, { left: MAX_SCROLL / 2 });
    expect(thumb.style.transform).toBe(`translate3d(${MAX_THUMB_POS / 2}px, 0, 0)`);

    scroll(viewport, { left: MAX_SCROLL });
    expect(thumb.style.transform).toBe(`translate3d(${MAX_THUMB_POS}px, 0, 0)`);
  });

  /**
   * `scrollLeft` is NEGATIVE in a right-to-left scroller, running 0 → -max as
   * you scroll towards the end, while `translate3d` stays physical , positive x
   * is still rightwards. So the start of the content is the thumb's RIGHTMOST
   * position and the mapping inverts. Get this wrong and the thumb runs
   * backwards, which no LTR test can see.
   *
   * `direction` is set on the bar itself because happy-dom does not inherit it;
   * hand-composing the primitive is also the documented way to place a bar, so
   * this covers that path at the same time.
   */
  it('inverts the mapping when the scroller is right-to-left', async () => {
    const { container } = render(
      <ScrollAreaPrimitive.Root type="always">
        <ScrollAreaPrimitive.Viewport>
          <div>wide content</div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar orientation="horizontal" style={{ direction: 'rtl' }} />
      </ScrollAreaPrimitive.Root>,
    );
    await settle();
    const { viewport, thumb } = parts(container);

    scroll(viewport, { left: 0 });
    expect(thumb.style.transform, 'RTL starts at the far end of the track').toBe(
      `translate3d(${MAX_THUMB_POS}px, 0, 0)`,
    );

    scroll(viewport, { left: -MAX_SCROLL / 2 });
    expect(thumb.style.transform).toBe(`translate3d(${MAX_THUMB_POS / 2}px, 0, 0)`);

    scroll(viewport, { left: -MAX_SCROLL });
    expect(thumb.style.transform).toBe('translate3d(0px, 0, 0)');
  });

  it('positions the thumb on mount for a region that arrives already scrolled', async () => {
    const { container } = render(
      <ScrollArea className="h-24">
        <div>tall content</div>
      </ScrollArea>,
    );
    /*
     * Set before the thumb exists, and with no event , which is what a restored
     * scroll position or an anchor jump looks like.
     */
    const viewport = container.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]')!;
    viewport.scrollTop = MAX_SCROLL;
    await settle();

    const { thumb } = parts(container);
    expect(thumb.style.transform, 'a silent initial offset still has to be drawn').toBe(
      `translate3d(0, ${MAX_THUMB_POS}px, 0)`,
    );
  });
});

/**
 * THE TRAP , `overscroll-behavior: contain` is only correct while there is
 * something to contain.
 *
 * Radix makes the viewport `overflow: scroll` unconditionally, so a region whose
 * content fits is still a scroll container with nothing to scroll. Measured in
 * Chrome on exactly that shape: with `auto` the wheel eventually reaches the page,
 * with `contain` it never does and the page cannot be scrolled from that spot at
 * all. A static class on the Viewport would therefore turn the dead scroll zone
 * the component documents into a permanent one.
 *
 * So containment keys off the THUMB, which Radix mounts only when the measured
 * ratio is strictly between 0 and 1. These tests pin both halves of that: applied
 * when the region overflows, absent when it does not.
 */
describe('ScrollArea, overscroll containment', () => {
  it('contains the axis that scrolls and leaves the other one alone', async () => {
    const { container } = render(
      <ScrollArea className="h-24">
        <div>tall content</div>
      </ScrollArea>,
    );
    await settle();
    const { viewport, thumb } = parts(container);

    expect(thumb).toBeTruthy();
    expect(viewport.style.overscrollBehaviorY).toBe('contain');
    expect(
      viewport.style.overscrollBehaviorX,
      'containing x too would cost the back-swipe gesture on an axis that never scrolled',
    ).toBe('');
  });

  it('contains x instead when x is the axis that scrolls', async () => {
    const { container } = render(
      <ScrollArea axis="x">
        <div>wide content</div>
      </ScrollArea>,
    );
    await settle();
    const { viewport } = parts(container);

    expect(viewport.style.overscrollBehaviorX).toBe('contain');
    expect(viewport.style.overscrollBehaviorY).toBe('');
  });

  it('leaves a region whose content FITS uncontained, so the page still scrolls', async () => {
    content = VIEWPORT; // nothing overflows, so Radix mounts no thumb
    const { container } = render(
      <ScrollArea className="h-24">
        <div>short content</div>
      </ScrollArea>,
    );
    await settle();

    const viewport = container.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]')!;
    expect(
      container.querySelector('[data-slot="scroll-area-thumb"]'),
      'a region that does not overflow must not have a thumb',
    ).toBeNull();
    expect(
      viewport.style.overscrollBehaviorY,
      'containing a region with nothing to scroll traps the page on it',
    ).toBe('');
  });

  /**
   * The bar is a SIBLING of the viewport, so the viewport is not in the bar's
   * scroll chain and `overscroll-behavior` there cannot reach it. Radix scrolls
   * the viewport by hand on this event but calls `preventDefault` only while
   * strictly inside the bounds, so the notch that saturates the region moves the
   * region AND the page.
   */
  it('swallows a wheel over the scrollbar, which CSS containment cannot reach', async () => {
    const { container } = render(
      <ScrollArea className="h-24">
        <div>tall content</div>
      </ScrollArea>,
    );
    await settle();
    const bar = container.querySelector<HTMLElement>('[data-slot="scroll-area-scrollbar"]')!;

    const event = new Event('wheel', { bubbles: true, cancelable: true });
    bar.dispatchEvent(event);
    expect(event.defaultPrevented, 'the default action here only ever scrolls the page').toBe(true);
  });

  it('does not swallow a wheel over the scrolling content itself', async () => {
    const { container } = render(
      <ScrollArea className="h-24">
        <div>tall content</div>
      </ScrollArea>,
    );
    await settle();
    const { viewport } = parts(container);

    const event = new Event('wheel', { bubbles: true, cancelable: true });
    viewport.dispatchEvent(event);
    expect(
      event.defaultPrevented,
      'the content scrolls natively , preventing it would break wheel scrolling outright',
    ).toBe(false);
  });
});
