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
    const options = el.shadowRoot!.querySelectorAll('.option');
    expect(options.length).toBe(vendors.length);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('filters options by search input (label + description)', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector<HTMLButtonElement>('.trigger')!.click();
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.search input')!;
    input.value = 'seattle';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;
    const options = el.shadowRoot!.querySelectorAll('.option');
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
    const secondRow = el.shadowRoot!.querySelectorAll<HTMLElement>('.option')[1];
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
    const panel = el.shadowRoot!.querySelector('.panel') as HTMLElement;
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
    const panel = el.shadowRoot!.querySelector('.panel') as HTMLElement;
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
    const input = el.shadowRoot!.querySelector<HTMLInputElement>('.search input')!;
    input.value = 'xyzzy';
    input.dispatchEvent(new Event('input'));
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.empty')).not.toBeNull();
    expect(el.shadowRoot!.querySelectorAll('.option').length).toBe(0);
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
    const panel = el.shadowRoot!.querySelector('.panel') as HTMLElement;
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
    expect(el.shadowRoot!.querySelector('.search')).toBeNull();
  });
});
