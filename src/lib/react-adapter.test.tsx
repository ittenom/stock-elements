/**
 * Tests for {@link createReactAdapter}.
 *
 * The adapter's job is narrow: forward known props as JS properties on
 * the underlying custom element, wire events, and pass through everything
 * else as HTML attributes. The rules that are easy to get wrong and have
 * caused real consumer bugs get pinned here.
 */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createReactAdapter } from './react-adapter.js';

// ---------------------------------------------------------------------
// A tiny custom element we can inspect from tests. We deliberately do
// NOT use `<sce-select>` here so the test doesn't care whether the main
// component has been imported; this isolates the adapter's contract.
// ---------------------------------------------------------------------
class TestEl extends HTMLElement {
  flag = true; // the `@property`-equivalent default we want to preserve
  count = 0;
  label: string | null = 'default-label';
  assignments: Array<[string, unknown]> = [];

  set testSet(value: unknown) {
    this.assignments.push(['testSet', value]);
  }
  get testSet() {
    const last = this.assignments[this.assignments.length - 1];
    return last?.[0] === 'testSet' ? last[1] : undefined;
  }
}
if (!customElements.get('test-el')) {
  customElements.define('test-el', TestEl);
}

interface TestProps {
  flag?: boolean;
  count?: number;
  label?: string | null;
  testSet?: unknown;
  onPing?: (e: CustomEvent<number>) => void;
  className?: string;
}

const TestComponent = createReactAdapter<TestProps>({
  tag: 'test-el',
  properties: ['flag', 'count', 'label', 'testSet'],
  events: { onPing: 'test-ping' },
});

// ---------------------------------------------------------------------

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function getEl(): TestEl {
  const el = container.querySelector('test-el') as TestEl | null;
  if (!el) throw new Error('element not mounted');
  return el;
}

describe('createReactAdapter', () => {
  /**
   * Regression guard for the Stockroom "no footer, no search bar" bug
   * (v0.2.2): the adapter was unconditionally assigning every declared
   * property on every render, including `undefined` for props the
   * consumer never passed. That silently replaced the custom element's
   * `@property` default with `undefined`.
   */
  it('does not clobber declared defaults when a prop is omitted', () => {
    act(() => {
      root.render(<TestComponent />);
    });
    const el = getEl();
    // Declared default MUST survive: no assignment overwrote it.
    expect(el.flag).toBe(true);
    // `testSet` setter was never invoked (no entry recorded).
    expect(el.assignments.length).toBe(0);
  });

  it('assigns defined props to JS properties (not attributes)', () => {
    act(() => {
      root.render(<TestComponent flag={false} count={42} label="x" />);
    });
    const el = getEl();
    expect(el.flag).toBe(false);
    expect(el.count).toBe(42);
    expect(el.label).toBe('x');
    // None of these should be reflected as HTML attributes by React
    // (the adapter strips them from the pass-through).
    expect(el.getAttribute('flag')).toBeNull();
    expect(el.getAttribute('count')).toBeNull();
    expect(el.getAttribute('label')).toBeNull();
  });

  /**
   * `null` is a legitimate cleared value — it must round-trip. Only
   * `undefined` (React's marker for "prop not provided") is skipped.
   */
  it('passes `null` through as a real property value', () => {
    act(() => {
      root.render(<TestComponent label={null} />);
    });
    const el = getEl();
    expect(el.label).toBeNull();
  });

  it('wires events and calls the latest handler', () => {
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    act(() => {
      root.render(<TestComponent onPing={handlerA} />);
    });
    const el = getEl();
    el.dispatchEvent(new CustomEvent('test-ping', { detail: 1 }));
    expect(handlerA).toHaveBeenCalledTimes(1);

    // Swapping handlers across re-renders should pick up the new one
    // without detaching/reattaching the native listener.
    act(() => {
      root.render(<TestComponent onPing={handlerB} />);
    });
    el.dispatchEvent(new CustomEvent('test-ping', { detail: 2 }));
    expect(handlerB).toHaveBeenCalledTimes(1);
    expect(handlerA).toHaveBeenCalledTimes(1);
  });

  it('forwards data-* attributes to the element via React', () => {
    act(() => {
      root.render(
        <TestComponent
          {...({ 'data-testid': 'foo' } as Record<string, string>)}
        />,
      );
    });
    const el = getEl();
    expect(el.getAttribute('data-testid')).toBe('foo');
  });
});
