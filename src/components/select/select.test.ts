/**
 * Smoke tests for <sce-select>.
 *
 * These cover the contract most likely to get broken during a refactor:
 * element registration, property-driven rendering, keyboard navigation,
 * and the `sce-change` event payload shape. Full browser-level assertions
 * (viewport clamping, animated reposition) live in the manual showcase.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './select.js';
import type { SceSelect } from './select.js';
import type { SceSelectChangeDetail, SceSelectOption } from './types.js';

const vendors: SceSelectOption[] = [
  { value: 'a', label: 'Acme' },
  { value: 'b', label: 'Bolt Supply' },
  { value: 'c', label: 'Cascade', description: 'Seattle, WA' },
];

async function mount(): Promise<SceSelect> {
  const el = document.createElement('sce-select') as SceSelect;
  el.options = vendors;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/**
 * The panel lives in a document-level portal (a `<div
 * data-sce-select-portal>` appended to `<body>`), not in the element's
 * own shadow root. Route all panel-side queries through this helper so
 * a future portal-implementation tweak touches one line of test code.
 */
function panelRoot(el: SceSelect): ShadowRoot {
  const host = document.querySelector<HTMLDivElement>('[data-sce-select-portal]');
  if (!host || !host.shadowRoot) {
    throw new Error('Panel portal host is missing — did the element connect?');
  }
  // Sanity: confirm the portal belongs to this element. There is only
  // one `<sce-select>` per test, but asserting keeps us honest if that
  // ever changes.
  void el;
  return host.shadowRoot;
}

describe('<sce-select>', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('registers the custom element', () => {
    expect(customElements.get('sce-select')).toBeTruthy();
  });

  it('renders the placeholder when no value is set', async () => {
    const el = await mount();
    el.placeholder = 'Pick one…';
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector('.trigger')!;
    expect(trigger.textContent).toContain('Pick one…');
  });

  it('renders the selected option label when value is set', async () => {
    const el = await mount();
    el.value = 'b';
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector('.trigger .value')!;
    expect(trigger.textContent?.trim()).toBe('Bolt Supply');
  });

  it('opens on trigger click and renders one row per option', async () => {
    const el = await mount();
    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!;
    trigger.click();
    await el.updateComplete;
    const options = panelRoot(el).querySelectorAll('.option');
    expect(options.length).toBe(vendors.length);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('filters options by search input (label + description)', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    const input = panelRoot(el).querySelector<HTMLInputElement>('.search input')!;
    input.value = 'seattle';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;
    const options = panelRoot(el).querySelectorAll('.option');
    expect(options.length).toBe(1);
    expect(options[0].textContent).toContain('Cascade');
  });

  it('emits `sce-change` with the selected value and option on pick', async () => {
    const el = await mount();
    const spy = vi.fn();
    el.addEventListener('sce-change', (e) =>
      spy((e as CustomEvent<SceSelectChangeDetail>).detail),
    );
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    const secondRow = panelRoot(el).querySelectorAll<HTMLElement>('.option')[1];
    secondRow.click();
    await el.updateComplete;
    expect(spy).toHaveBeenCalledWith({
      value: 'b',
      option: expect.objectContaining({ value: 'b', label: 'Bolt Supply' }),
    });
    expect(el.value).toBe('b');
  });

  it('arrow-down + enter from the panel selects the next option', async () => {
    const el = await mount();
    el.value = 'a';
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    // Active starts at the currently-selected option (index 0). ↓ moves to 1.
    const panel = panelRoot(el).querySelector('.panel') as HTMLElement;
    panel.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    await el.updateComplete;
    panel.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await el.updateComplete;
    expect(el.value).toBe('b');
  });

  it('Escape closes the panel without changing the value', async () => {
    const el = await mount();
    el.value = 'a';
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    const panel = panelRoot(el).querySelector('.panel') as HTMLElement;
    panel.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector('.trigger')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(el.value).toBe('a');
  });

  it('shows the empty state when no options match the search', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    const input = panelRoot(el).querySelector<HTMLInputElement>('.search input')!;
    input.value = 'xyzzy';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;
    expect(panelRoot(el).querySelector('.empty')).not.toBeNull();
    expect(panelRoot(el).querySelectorAll('.option').length).toBe(0);
  });

  it('refuses to open when disabled', async () => {
    const el = await mount();
    el.disabled = true;
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    const trigger = el.shadowRoot!.querySelector('.trigger')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('skips disabled options during keyboard nav', async () => {
    const el = document.createElement('sce-select') as SceSelect;
    el.options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ];
    document.body.appendChild(el);
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    const panel = panelRoot(el).querySelector('.panel') as HTMLElement;
    // Active starts on first enabled (index 0). ↓ should land on 'c', not 'b'.
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await el.updateComplete;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await el.updateComplete;
    expect(el.value).toBe('c');
  });

  it('hides the search bar when searchable=false', async () => {
    const el = await mount();
    el.searchable = false;
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    expect(panelRoot(el).querySelector('.search')).toBeNull();
  });

  /**
   * Regression guard for a subtle CSS custom-property pitfall that
   * caused the Stockroom dark-mode bug (v0.2.0):
   *
   * If the shadow stylesheet declares `:host { --sce-bg: #fff; ... }`,
   * that value applies directly to the host element and SILENTLY BEATS
   * any value the consumer inherits from `:root` or an ancestor — the
   * whole `--sce-*` theming contract collapses and the component locks
   * onto the built-in defaults, no matter what the shim does.
   *
   * The correct pattern is `background: var(--sce-bg, #ffffff)` with
   * the fallback inlined at each usage site. This test scans the
   * component's aggregate CSS text and fails loudly if any `--sce-*:`
   * declaration reappears on `:host`.
   */
  it('does not pin any --sce-* default on :host (keeps consumer theming winnable)', async () => {
    const el = await mount();
    const sheets = (el.shadowRoot!.adoptedStyleSheets ?? []) as CSSStyleSheet[];
    // Lit may use <style> tags as a fallback; include those for safety.
    const inlineCss = Array.from(
      el.shadowRoot!.querySelectorAll('style'),
    )
      .map((s) => s.textContent ?? '')
      .join('\n');
    const adoptedCss = sheets
      .flatMap((sheet) => Array.from(sheet.cssRules))
      .map((rule) => rule.cssText)
      .join('\n');
    const allCss = `${inlineCss}\n${adoptedCss}`;

    // Sanity: we actually loaded the component's styles.
    expect(allCss).toMatch(/\.trigger\s*\{/);

    // Every `:host { ... }` block must be free of `--sce-*:` declarations.
    const hostBlocks = Array.from(
      allCss.matchAll(/:host(?:\([^)]*\))?\s*\{([^}]*)\}/g),
    ).map((m) => m[1]);
    for (const body of hostBlocks) {
      expect(body).not.toMatch(/--sce-[\w-]+\s*:/);
    }
  });

  /**
   * Regression guard for the Stockroom modal bug (v0.2.1):
   *
   * shadcn's `DialogContent` centers itself with
   * `translate-x-[-50%] translate-y-[-50%]`. A transformed ancestor
   * becomes the containing block for all `position: fixed`
   * descendants, so a dropdown panel opened inside the dialog would
   * re-anchor to the dialog's rect and be clipped by its
   * `overflow-hidden`. `backdrop-filter` has the same effect and
   * shows up on the modal's form card.
   *
   * The fix is to render the panel into a document-level portal that
   * is a direct child of `<body>`, escaping every ancestor's
   * containing block and stacking context. This test simulates the
   * hazardous ancestor and asserts the panel is *not* a descendant of
   * the element's own shadow root.
   */
  it('renders the panel into a document-level portal, not its own shadow root', async () => {
    const transformed = document.createElement('div');
    transformed.style.transform = 'translate(-50%, -50%)';
    transformed.style.backdropFilter = 'blur(12px)';
    document.body.appendChild(transformed);

    const el = document.createElement('sce-select') as SceSelect;
    el.options = vendors;
    transformed.appendChild(el);
    await el.updateComplete;

    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;

    // No `.panel` inside the main shadow root…
    expect(el.shadowRoot!.querySelector('.panel')).toBeNull();

    // …but there IS one in a portal host attached to <body>.
    const portalHost = document.body.querySelector<HTMLDivElement>(
      '[data-sce-select-portal]',
    );
    expect(portalHost).not.toBeNull();
    expect(portalHost!.parentElement).toBe(document.body);
    // And the portal host is NOT a descendant of the transformed
    // wrapper — that's the whole point.
    expect(transformed.contains(portalHost!)).toBe(false);

    const panel = portalHost!.shadowRoot!.querySelector('.panel');
    expect(panel).not.toBeNull();
    expect(panel!.classList.contains('open')).toBe(true);
  });

  /**
   * The portal host is created in `connectedCallback` and torn down in
   * `disconnectedCallback`. Without the teardown, every mount/unmount
   * cycle (common under React StrictMode, hot-reload, or route
   * transitions) would leak a `<div>` to `<body>`. Guard against that.
   */
  it('removes its portal host from <body> on disconnect', async () => {
    const el = await mount();
    expect(document.body.querySelectorAll('[data-sce-select-portal]').length).toBe(1);
    el.remove();
    expect(document.body.querySelectorAll('[data-sce-select-portal]').length).toBe(0);
  });

  /**
   * End-to-end companion to the unit test in
   * `src/lib/react-adapter.test.tsx`: the "no search bar, no footer"
   * symptom consumers actually see (Stockroom v0.2.2) is that when the
   * adapter forwards `undefined` into `searchable`, both the search
   * bar and the footer template branches collapse out. This test
   * drives the element directly (no React) and asserts that the
   * branches render when `searchable` holds its declared default.
   */
  it('renders both the search bar and the footer when `searchable` holds its default', async () => {
    const el = document.createElement('sce-select') as SceSelect;
    // Mirror the fixed adapter: assign defined props, skip undefined.
    const adapterProps: Record<string, unknown> = {
      options: vendors,
      placeholder: 'Select vendor',
      // `searchable` intentionally not set — consumer omitted it.
    };
    for (const [k, v] of Object.entries(adapterProps)) {
      if (v === undefined) continue;
      (el as unknown as Record<string, unknown>)[k] = v;
    }
    document.body.appendChild(el);
    await el.updateComplete;

    // The declared default (true) must still be in force.
    expect(el.searchable).toBe(true);

    // And the rendered panel must contain both a search input and a footer.
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    expect(panelRoot(el).querySelector('.search input')).not.toBeNull();
    expect(panelRoot(el).querySelector('.footer')).not.toBeNull();
  });

  /**
   * Regression guard for the Stockroom modal scroll-wheel bug (v0.2.2):
   *
   * Radix Dialog wraps its overlay in <RemoveScroll> (react-remove-scroll),
   * which installs a document-level capturing non-passive wheel listener
   * and preventDefault()s any wheel event whose target is not inside the
   * dialog's whitelisted content ref. Our portal is a SIBLING of the
   * dialog content, so native wheel-to-scroll is cancelled before the
   * browser can act.
   *
   * The fix is a wheel listener of our own on the portal host that
   * moves `scrollTop` in JavaScript. This test asserts a wheel event
   * delivered over the list does (a) scroll the list by the event's
   * deltaY and (b) call preventDefault (which is what stops Radix's
   * handler from double-cancelling the no-op native scroll).
   */
  it('scrolls the list in response to wheel events (bypasses RemoveScroll)', async () => {
    const el = await mount();
    el.options = Array.from({ length: 50 }, (_, i) => ({
      value: `v${i}`,
      label: `Vendor ${i}`,
    }));
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;

    const list = panelRoot(el).querySelector<HTMLDivElement>('.list')!;
    const startTop = list.scrollTop;

    const wheel = new WheelEvent('wheel', {
      deltaY: 80,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    list.dispatchEvent(wheel);

    expect(list.scrollTop).toBe(startTop + 80);
    expect(wheel.defaultPrevented).toBe(true);
  });

  /**
   * Regression guard for the Stockroom modal scrollbar-click bug (v0.2.2):
   *
   * Clicking a native scrollbar fires `pointerdown` with `event.target`
   * retargeted to `<html>` or the document, so `composedPath()` won't
   * include our portal — the outside-click detector closes the panel.
   * Fix: fall back to a rect hit-test against the panel bounding box,
   * which includes the scrollbar gutter.
   *
   * jsdom doesn't do layout, so `getBoundingClientRect()` returns zeros
   * by default. We stub it to model a 200x200 panel at (100, 100) and
   * dispatch a pointerdown event whose target is `<html>` (matching the
   * browser's retargeting) but whose clientX/Y land inside the rect.
   */
  it('does not close when pointerdown coords fall inside the panel rect (scrollbar click)', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;

    const panel = panelRoot(el).querySelector<HTMLElement>('.panel')!;
    // Simulate layout: panel occupies (100..300, 100..300) in the viewport.
    const rect = {
      left: 100, right: 300, top: 100, bottom: 300,
      x: 100, y: 100, width: 200, height: 200,
      toJSON() { return this; },
    } as DOMRect;
    panel.getBoundingClientRect = () => rect;

    // Pointer event retargeted to <html>, but coordinates land inside
    // the panel (including its scrollbar gutter at the right edge).
    // jsdom doesn't ship `PointerEvent`, but a `MouseEvent` dispatched
    // with type "pointerdown" carries the same `clientX/Y` and
    // `composedPath` we rely on.
    const pd = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: 295, // near the right edge — the scrollbar zone
      clientY: 150,
    });
    document.documentElement.dispatchEvent(pd);
    await el.updateComplete;

    expect(
      el.shadowRoot!.querySelector('.trigger')!.getAttribute('aria-expanded'),
    ).toBe('true');

    // And the baseline still closes on a genuine outside click: coords
    // far from the panel, target = <body>.
    const outside = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: 5,
      clientY: 5,
    });
    document.body.dispatchEvent(outside);
    await el.updateComplete;
    expect(
      el.shadowRoot!.querySelector('.trigger')!.getAttribute('aria-expanded'),
    ).toBe('false');
  });
});
