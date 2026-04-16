import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  BLOCK_CHAR,
  BLOCK_GAP_PT,
  DEFAULT_BLOCK_COUNT,
  MIN_BLOCK_COUNT,
  type LoadingBarMode,
} from './types.ts';
import {
  MODE_CONFIG,
  NEON_PALETTE,
  SPECTRUM_PALETTE,
  neonCyanBars,
  neonPinkBars,
  seededRandom,
} from './modes.ts';

const FLOURISH_MS = 400;

@customElement('sce-loading-bar')
export class SceLoadingBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
      font-size: 1.25rem;
      line-height: 1;
      color: var(--sce-primary, #7dd3fc);
      --sce-speed: 1;
    }

    .wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
    }

    .heading,
    .caption {
      font-size: 0.6em;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.65;
      font-weight: 500;
    }

    .bar {
      display: flex;
      white-space: nowrap;
      user-select: none;
      gap: 2pt;
      overflow: hidden;
      max-width: 100%;
    }

    .block {
      display: inline-block;
      font-variant-ligatures: none;
      transition: opacity 120ms linear, color 120ms linear, filter 120ms linear;
    }

    /* --------- HORIZON --------- */
    :host(.mode-horizon) .block.filled {
      opacity: 1;
      color: var(--sce-primary);
    }
    :host(.mode-horizon) .block.unfilled {
      color: var(--sce-primary);
      opacity: var(--sce-dim-opacity, 0.2);
      animation: horizon-pulse calc(1200ms / var(--sce-speed)) ease-in-out infinite;
      animation-delay: var(--sce-delay, 0ms);
    }
    :host(.mode-horizon) .bar {
      animation: horizon-hue 8s linear infinite;
    }
    @keyframes horizon-pulse {
      0%, 100% { opacity: var(--sce-pulse-min, 0.15); }
      50%      { opacity: var(--sce-pulse-max, 0.35); }
    }
    @keyframes horizon-hue {
      0%, 100% { filter: hue-rotate(0deg); }
      50%      { filter: hue-rotate(15deg); }
    }

    /* --------- NEON --------- */
    :host(.mode-neon) .block {
      animation: neon-wave calc(2000ms / var(--sce-speed)) ease-in-out infinite;
      animation-delay: var(--sce-delay, 0ms);
    }
    :host(.mode-neon) .block.unfilled {
      opacity: var(--sce-dim-opacity, 0.18);
    }
    @keyframes neon-wave {
      0%, 100% { filter: brightness(0.92); }
      50%      { filter: brightness(1.08); }
    }
    :host(.mode-neon) .block.neon-fake {
      animation:
        neon-wave calc(2000ms / var(--sce-speed)) ease-in-out infinite,
        neon-fake-cycle calc(2500ms / var(--sce-speed)) steps(10, end) infinite;
      animation-delay: var(--sce-delay, 0ms), var(--sce-fake-delay, 0ms);
    }
    @keyframes neon-fake-cycle {
      0%   { color: #ff3d9a; }
      10%  { color: #e250a5; }
      20%  { color: #c662b0; }
      30%  { color: #aa75bb; }
      40%  { color: #8d88c7; }
      50%  { color: #719ad2; }
      60%  { color: #55addd; }
      70%  { color: #39bfe8; }
      80%  { color: #1cd2f3; }
      90%  { color: #00e5ff; }
      100% { color: #ff3d9a; }
    }

    /* --------- SPECTRUM --------- */
    :host(.mode-spectrum) .block {
      animation: spectrum-cycle calc(2000ms / var(--sce-speed)) steps(8, end) infinite;
      animation-delay: var(--sce-delay, 0ms);
    }
    :host(.mode-spectrum) .block.unfilled {
      opacity: var(--sce-dim-opacity, 0.18);
    }
    @keyframes spectrum-cycle {
      0%     { color: #ff4d4d; }
      12.5%  { color: #ff9f40; }
      25%    { color: #ffe74c; }
      37.5%  { color: #6dd36d; }
      50%    { color: #3dc3ff; }
      62.5%  { color: #4d7dff; }
      75%    { color: #9a5dff; }
      87.5%  { color: #ff5dd1; }
      100%   { color: #ff4d4d; }
    }

    /* --------- Flourish --------- */
    :host(.flourish) .block {
      animation: none !important;
      opacity: 1 !important;
      color: var(--sce-flourish-color, var(--sce-primary)) !important;
      filter: brightness(1.3);
      transition: opacity 40ms linear;
    }
    :host(.flourish) .block.awaiting {
      opacity: 0.2 !important;
    }
  `;

  @property({ type: String }) mode: LoadingBarMode = 'HORIZON';
  @property({ type: Number }) randomness = 0.3;
  @property({ type: Number }) speed = 1;
  @property({ type: String }) heading?: string;
  @property({ type: String }) caption?: string;
  @property({ type: Number }) progress?: number;
  @property({ type: Boolean, attribute: 'fake-mode' }) fakeMode = false;

  @state() private flourishActive = false;
  @state() private flourishIndex = 0;
  @state() private blockCount = DEFAULT_BLOCK_COUNT;

  private flourishTimer: number | null = null;
  private prevFakeMode = false;
  private prevProgress: number | undefined = undefined;
  private resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.recomputeBlockCount());
    // Observe both self and parent — parent reflects the true available
    // space when the host sizes to its own content (flex/inline contexts).
    this.resizeObserver.observe(this);
    if (this.parentElement) {
      this.resizeObserver.observe(this.parentElement);
    }
  }

  firstUpdated(): void {
    this.recomputeBlockCount();
    // Fonts may not be ready on first paint — remeasure once they are.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => this.recomputeBlockCount());
    }
  }

  private recomputeBlockCount(): void {
    const bar = this.renderRoot.querySelector('.bar') as HTMLElement | null;
    const sample = bar?.querySelector('.block') as HTMLElement | null;
    // Host may expand to content in a flex/inline context — measure the
    // parent's inner width as the actual available space.
    const parent = this.parentElement;
    const availableWidth = parent ? parent.clientWidth : this.clientWidth;
    if (!bar || !sample || availableWidth <= 0) return;

    const sampleWidth = sample.getBoundingClientRect().width;
    if (sampleWidth <= 0) return;

    const gapPx = (BLOCK_GAP_PT * 96) / 72;
    const unit = sampleWidth + gapPx;
    const fit = Math.floor((availableWidth + gapPx) / unit);
    const next = Math.max(
      MIN_BLOCK_COUNT,
      Math.min(DEFAULT_BLOCK_COUNT, fit),
    );
    if (next !== this.blockCount) {
      this.blockCount = next;
    }
  }

  updated(changed: PropertyValues<this>): void {
    const progressJustHit100 =
      changed.has('progress') &&
      (this.prevProgress ?? -1) < 100 &&
      (this.progress ?? 0) >= 100 &&
      !this.fakeMode;

    const fakeJustStopped =
      changed.has('fakeMode') && this.prevFakeMode && !this.fakeMode;

    if (progressJustHit100 || fakeJustStopped) {
      this.playFlourish();
    }

    this.prevFakeMode = this.fakeMode;
    this.prevProgress = this.progress;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.flourishTimer !== null) {
      clearInterval(this.flourishTimer);
      this.flourishTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private playFlourish(): void {
    if (this.flourishTimer !== null) return;
    this.flourishActive = true;
    this.flourishIndex = 0;
    const stepMs = FLOURISH_MS / this.blockCount;
    this.flourishTimer = window.setInterval(() => {
      this.flourishIndex += 1;
      if (this.flourishIndex >= this.blockCount) {
        if (this.flourishTimer !== null) {
          clearInterval(this.flourishTimer);
          this.flourishTimer = null;
        }
        window.setTimeout(() => {
          this.flourishActive = false;
        }, 120);
      }
    }, stepMs);
  }

  private filledCount(): number {
    if (this.fakeMode) return this.blockCount;
    const p = Math.max(0, Math.min(100, this.progress ?? 0));
    return Math.round((p / 100) * this.blockCount);
  }

  private flourishColor(): string {
    switch (this.mode) {
      case 'NEON':
        return '#ff3d9a';
      case 'SPECTRUM':
        return SPECTRUM_PALETTE[2];
      case 'HORIZON':
      default:
        return '#7dd3fc';
    }
  }

  private blockDelayMs(index: number): number {
    const config = MODE_CONFIG[this.mode];
    const base = config.pulsePeriodMs;
    const rand = seededRandom(index + 1);
    const jitter = rand * this.randomness * base;
    // Baseline per-block stagger so the effect is visible even without randomness.
    const stagger = (index / this.blockCount) * base * 0.5;
    return -(stagger + jitter);
  }

  render() {
    const config = MODE_CONFIG[this.mode];
    const hostClasses = {
      [`mode-${this.mode.toLowerCase()}`]: true,
      flourish: this.flourishActive,
    };
    this.className = Object.entries(hostClasses)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(' ');

    const hostStyle: Record<string, string> = {
      ...config.vars,
      '--sce-speed': String(this.speed),
      '--sce-flourish-color': this.flourishColor(),
    };
    Object.entries(hostStyle).forEach(([k, v]) => {
      this.style.setProperty(k, v);
    });

    const filled = this.filledCount();
    const neonRealProgress =
      this.mode === 'NEON' && !this.fakeMode ? (this.progress ?? 0) : 0;
    const cyanBars =
      this.mode === 'NEON' && !this.fakeMode
        ? neonCyanBars(neonRealProgress, this.blockCount)
        : 0;
    const pinkBars =
      this.mode === 'NEON' && !this.fakeMode
        ? neonPinkBars(neonRealProgress)
        : 0;
    const blocks = [];
    const neonFakePeriodMs = 2500 / this.speed;
    for (let i = 0; i < this.blockCount; i++) {
      const isFilled = i < filled;
      const isNeonFake = this.mode === 'NEON' && this.fakeMode;
      const classes = {
        block: true,
        filled: isFilled,
        unfilled: !isFilled,
        awaiting: this.flourishActive && i >= this.flourishIndex,
        'neon-fake': isNeonFake,
      };
      const styleProps: Record<string, string> = {
        '--sce-delay': `${this.blockDelayMs(i)}ms`,
      };
      if (this.mode === 'NEON' && !this.fakeMode) {
        let paletteIndex: number;
        if (i < pinkBars) {
          paletteIndex = 0;
        } else if (i < cyanBars) {
          paletteIndex = NEON_PALETTE.length - 1;
        } else {
          paletteIndex = Math.min(
            NEON_PALETTE.length - 1,
            Math.floor((i / this.blockCount) * NEON_PALETTE.length),
          );
        }
        styleProps.color = NEON_PALETTE[paletteIndex];
      }
      if (isNeonFake) {
        const baseOffset = ((i % 10) / 10) * neonFakePeriodMs;
        const jitter =
          seededRandom(i * 13 + 7) * this.randomness * neonFakePeriodMs;
        styleProps['--sce-fake-delay'] = `${-(baseOffset + jitter)}ms`;
      }
      const style = styleMap(styleProps);
      blocks.push(
        html`<span class=${classMap(classes)} style=${style}
          >${BLOCK_CHAR}</span
        >`,
      );
    }

    return html`
      <div class="wrapper">
        ${this.heading
          ? html`<div class="heading">${this.heading}</div>`
          : null}
        <div class="bar">${blocks}</div>
        ${this.caption
          ? html`<div class="caption">${this.caption}</div>`
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sce-loading-bar': SceLoadingBar;
  }
}
