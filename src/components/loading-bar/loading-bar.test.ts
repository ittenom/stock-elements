/**
 * Smoke test for <sce-loading-bar>. Matches the spec's acceptance
 * criteria: element registers, renders the block spans, and responds to
 * a `progress` property change.
 */

import { describe, it, expect } from 'vitest';
import './loading-bar.js';
import type { SceLoadingBar } from './loading-bar.js';
import { BLOCK_CHAR } from './types.js';

describe('<sce-loading-bar>', () => {
  it('registers the custom element', () => {
    expect(customElements.get('sce-loading-bar')).toBeTruthy();
  });

  it('renders at least one block span containing the block char', async () => {
    const el = document.createElement('sce-loading-bar') as SceLoadingBar;
    document.body.appendChild(el);
    await el.updateComplete;
    const spans = el.shadowRoot!.querySelectorAll('.block');
    // Exact count is viewport-driven, but there must be at least the
    // minimum. Exercising the block-rendering path is the real goal.
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].textContent).toBe(BLOCK_CHAR);
    document.body.removeChild(el);
  });

  it('reflects progress changes to filled/unfilled class state', async () => {
    const el = document.createElement('sce-loading-bar') as SceLoadingBar;
    document.body.appendChild(el);
    await el.updateComplete;
    el.progress = 100;
    await el.updateComplete;
    const spans = Array.from(el.shadowRoot!.querySelectorAll('.block'));
    // At 100%, all blocks should be filled.
    expect(spans.every((s) => s.classList.contains('filled'))).toBe(true);
    document.body.removeChild(el);
  });
});
