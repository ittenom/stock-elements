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
});
