/**
 * <sce-loading-grid> — 2D sibling of <sce-loading-bar>.
 *
 * Renders the same block-char cell in a CSS grid that auto-fits the
 * container on both axes, with the same three theme modes (HORIZON,
 * NEON, SPECTRUM) and the same randomness / speed / fakeMode / progress
 * / flourish rules as the bar variant. Use it where a long horizontal
 * bar doesn't fit: square cards, empty list slots, spinner replacements.
 *
 * Theming: see THEMING.md. Shares `--sce-primary`, `--sce-dim-opacity`,
 * `--sce-pulse-min/max`, `--sce-speed`, `--sce-flourish-color` with the
 * bar variant so a single token map dresses both elements at once.
 */
import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  BLOCK_CHAR,
  GRID_GAP_PT,
  DEFAULT_GRID_MAX,
  MIN_GRID_SIDE,
  DEFAULT_CELL_SIZE_PX,
  DEFAULT_CELL_ASPECT,
  type LoadingGridMode,
} from './types.js';
import {
  MODE_CONFIG,
  NEON_PALETTE,
  SPECTRUM_PALETTE,
  neonCyanBars,
  neonPinkBars,
  seededRandom,
} from '../loading-bar/modes.js';

const FLOURISH_MS = 450;

@customElement('sce-loading-grid')
export class SceLoadingGrid extends LitElement {
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
      /* The wrapper must not force width past the host — otherwise the
         grid would grow to its own content rather than auto-fitting to
         the available space. */
      min-width: 0;
    }

    .heading,
    .caption {
      font-size: 0.6em;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      opacity: 0.65;
      font-weight: 500;
    }

    .grid {
      display: grid;
      /* Matches the bar variant's 2pt gap. Cells are painted as solid
         rects (see .block), so the gap is the only visual separator. */
      gap: 2pt;
      user-select: none;
      overflow: hidden;
      justify-content: start;
      align-content: start;
    }

    .block {
      /* Cell size is fully driven by the cellSize + cellAspect
         properties via --sce-cell-w / --sce-cell-h. We paint the cell
         as a solid rect rather than rendering the FULL BLOCK glyph:
         in most monospace fonts the glyph is ~0.6 of its font-size
         wide, which left empty horizontal padding inside each cell and
         made the visual column gap much wider than the row gap. Using
         background: currentColor keeps all the existing color/opacity/
         filter animation surfaces working unchanged while guaranteeing
         the visual gap equals the CSS gap on both axes. */
      width: var(--sce-cell-w, 1ch);
      height: var(--sce-cell-h, 1ch);
      background: currentColor;
      /* Hide the block-char glyph that's still in the DOM for
         semantics / backwards compat. text-indent is safer than
         font-size: 0 because some browsers still reserve a baseline
         slot at zero font-size. */
      font-size: 0;
      text-indent: -9999px;
      overflow: hidden;
      transition: opacity 120ms linear, background-color 120ms linear,
        filter 120ms linear;
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
    :host(.mode-horizon) .grid {
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

  @property({ type: String }) mode: LoadingGridMode = 'HORIZON';
  @property({ type: Number }) randomness = 0.3;
  @property({ type: Number }) speed = 1;
  @property({ type: String }) heading?: string;
  @property({ type: String }) caption?: string;
  @property({ type: Number }) progress?: number;
  @property({ type: Boolean, attribute: 'fake-mode' }) fakeMode = false;

  /**
   * Shorter-axis cell size in CSS px. The wider axis is derived from
   * `cellAspect`. Default roughly matches a 1em glyph at the host's
   * default font-size.
   */
  @property({ type: Number, attribute: 'cell-size' })
  cellSize = DEFAULT_CELL_SIZE_PX;

  /**
   * Cell aspect ratio (width ÷ height). `< 1` is tall (default, matches
   * the FULL BLOCK glyph silhouette), `1` is square, `> 1` is wide.
   */
  @property({ type: Number, attribute: 'cell-aspect' })
  cellAspect = DEFAULT_CELL_ASPECT;

  @state() private flourishActive = false;
  @state() private flourishIndex = 0;
  @state() private cols = MIN_GRID_SIDE;
  @state() private rows = MIN_GRID_SIDE;

  private flourishTimer: number | null = null;
  private prevFakeMode = false;
  private prevProgress: number | undefined = undefined;
  private resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.recomputeGrid());
    // Observe both self and parent — parent reflects the true available
    // space when the host sizes to its own content (flex/inline contexts).
    this.resizeObserver.observe(this);
    if (this.parentElement) {
      this.resizeObserver.observe(this.parentElement);
    }
  }

  firstUpdated(): void {
    this.recomputeGrid();
  }

  /**
   * Resolve `cellSize` + `cellAspect` to concrete pixel width / height.
   * `cellSize` is defined as the shorter axis, so the longer axis is
   * multiplied by aspect (or its inverse) depending on orientation.
   */
  private cellDimensions(): { w: number; h: number } {
    const short = Math.max(1, this.cellSize);
    const aspect = Math.max(0.01, this.cellAspect);
    if (aspect >= 1) {
      return { w: short * aspect, h: short };
    }
    return { w: short, h: short / aspect };
  }

  private recomputeGrid(): void {
    const parent = this.parentElement;
    const availableWidth = parent ? parent.clientWidth : this.clientWidth;
    const availableHeight = parent ? parent.clientHeight : this.clientHeight;
    if (availableWidth <= 0 || availableHeight <= 0) return;

    const { w: cellW, h: cellH } = this.cellDimensions();
    const gapPx = (GRID_GAP_PT * 96) / 72;
    const cols = Math.max(
      MIN_GRID_SIDE,
      Math.min(
        DEFAULT_GRID_MAX,
        Math.floor((availableWidth + gapPx) / (cellW + gapPx)),
      ),
    );
    const rows = Math.max(
      MIN_GRID_SIDE,
      Math.min(
        DEFAULT_GRID_MAX,
        Math.floor((availableHeight + gapPx) / (cellH + gapPx)),
      ),
    );
    if (cols !== this.cols || rows !== this.rows) {
      this.cols = cols;
      this.rows = rows;
    }
  }

  updated(changed: PropertyValues<this>): void {
    // Cell geometry changed — refit rows/cols to the new cell size.
    if (changed.has('cellSize') || changed.has('cellAspect')) {
      this.recomputeGrid();
    }

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

  private get cellCount(): number {
    return this.cols * this.rows;
  }

  private playFlourish(): void {
    if (this.flourishTimer !== null) return;
    this.flourishActive = true;
    this.flourishIndex = 0;
    const total = this.cellCount;
    const stepMs = FLOURISH_MS / Math.max(1, total);
    this.flourishTimer = window.setInterval(() => {
      this.flourishIndex += 1;
      if (this.flourishIndex >= total) {
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
    if (this.fakeMode) return this.cellCount;
    const p = Math.max(0, Math.min(100, this.progress ?? 0));
    return Math.round((p / 100) * this.cellCount);
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

  /**
   * Per-cell animation delay. Staggers by diagonal so the pulse reads
   * as a wave across the grid rather than a single row or column.
   */
  private blockDelayMs(index: number): number {
    const config = MODE_CONFIG[this.mode];
    const base = config.pulsePeriodMs;
    const rand = seededRandom(index + 1);
    const jitter = rand * this.randomness * base;
    const col = index % this.cols;
    const row = Math.floor(index / this.cols);
    const diag = col + row;
    const maxDiag = Math.max(1, this.cols + this.rows - 2);
    const stagger = (diag / maxDiag) * base * 0.5;
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

    const { w: cellW, h: cellH } = this.cellDimensions();
    const hostStyle: Record<string, string> = {
      ...config.vars,
      '--sce-speed': String(this.speed),
      '--sce-flourish-color': this.flourishColor(),
      '--sce-cell-w': `${cellW}px`,
      '--sce-cell-h': `${cellH}px`,
    };
    Object.entries(hostStyle).forEach(([k, v]) => {
      this.style.setProperty(k, v);
    });

    const total = this.cellCount;
    const filled = this.filledCount();
    // NEON palette mapping treats the grid's row-major order like the bar's
    // linear order, so the same pink-→-cyan progression is visible on each row.
    const neonRealProgress =
      this.mode === 'NEON' && !this.fakeMode ? (this.progress ?? 0) : 0;
    const cyanBars =
      this.mode === 'NEON' && !this.fakeMode
        ? neonCyanBars(neonRealProgress, this.cols)
        : 0;
    const pinkBars =
      this.mode === 'NEON' && !this.fakeMode
        ? neonPinkBars(neonRealProgress)
        : 0;

    const neonFakePeriodMs = 2500 / this.speed;
    const blocks = [];
    for (let i = 0; i < total; i++) {
      const col = i % this.cols;
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
        // Map color by column so each row reads as a gradient.
        let paletteIndex: number;
        if (col < pinkBars) {
          paletteIndex = 0;
        } else if (col < cyanBars) {
          paletteIndex = NEON_PALETTE.length - 1;
        } else {
          paletteIndex = Math.min(
            NEON_PALETTE.length - 1,
            Math.floor((col / this.cols) * NEON_PALETTE.length),
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

    // Cell dimensions come straight from `cellSize` + `cellAspect`, so
    // the 2pt gap is symmetric by construction.
    const gridStyle = styleMap({
      'grid-template-columns': `repeat(${this.cols}, ${cellW}px)`,
      'grid-template-rows': `repeat(${this.rows}, ${cellH}px)`,
    });

    return html`
      <div class="wrapper">
        ${this.heading
          ? html`<div class="heading">${this.heading}</div>`
          : null}
        <div class="grid" style=${gridStyle}>${blocks}</div>
        ${this.caption
          ? html`<div class="caption">${this.caption}</div>`
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sce-loading-grid': SceLoadingGrid;
  }
}
