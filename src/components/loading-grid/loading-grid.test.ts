/**
 * Smoke test for <sce-loading-grid>. Matches the bar variant's
 * acceptance criteria: element registers, renders block spans, and
 * responds to progress / mode / fakeMode changes.
 */

import { describe, it, expect } from 'vitest';
import './loading-grid.js';
import type { SceLoadingGrid } from './loading-grid.js';
import { BLOCK_CHAR } from './types.js';

describe('<sce-loading-grid>', () => {
  it('registers the custom element', () => {
    expect(customElements.get('sce-loading-grid')).toBeTruthy();
  });

  it('renders block spans containing the block char', async () => {
    const el = document.createElement('sce-loading-grid') as SceLoadingGrid;
    document.body.appendChild(el);
    await el.updateComplete;
    const spans = el.shadowRoot!.querySelectorAll('.block');
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].textContent).toBe(BLOCK_CHAR);
    document.body.removeChild(el);
  });

  it('fills all cells at progress=100', async () => {
    const el = document.createElement('sce-loading-grid') as SceLoadingGrid;
    document.body.appendChild(el);
    await el.updateComplete;
    el.progress = 100;
    await el.updateComplete;
    const spans = Array.from(el.shadowRoot!.querySelectorAll('.block'));
    expect(spans.every((s) => s.classList.contains('filled'))).toBe(true);
    document.body.removeChild(el);
  });

  it('fills all cells when fakeMode is on regardless of progress', async () => {
    const el = document.createElement('sce-loading-grid') as SceLoadingGrid;
    document.body.appendChild(el);
    await el.updateComplete;
    el.fakeMode = true;
    await el.updateComplete;
    const spans = Array.from(el.shadowRoot!.querySelectorAll('.block'));
    expect(spans.every((s) => s.classList.contains('filled'))).toBe(true);
    document.body.removeChild(el);
  });

  it('applies the mode class to the host', async () => {
    const el = document.createElement('sce-loading-grid') as SceLoadingGrid;
    document.body.appendChild(el);
    el.mode = 'NEON';
    await el.updateComplete;
    expect(el.classList.contains('mode-neon')).toBe(true);
    document.body.removeChild(el);
  });
});
