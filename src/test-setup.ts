/**
 * Global Vitest setup. jsdom is missing a couple of APIs the elements
 * rely on (ResizeObserver, scrollIntoView); we stub them with no-ops
 * rather than polyfilling because the unit tests don't measure either.
 */

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
    ResizeObserverStub;
}

if (
  typeof Element !== 'undefined' &&
  typeof Element.prototype.scrollIntoView !== 'function'
) {
  Element.prototype.scrollIntoView = function () {};
}
