/**
 * <sce-select> — searchable, viewport-aware single-select combobox.
 *
 * Drop-in replacement for native <select> / Radix Select when the option
 * list may exceed the viewport. Unlike Radix/Radix-derived selects, the
 * panel clamps to the visible viewport and scrolls internally; it never
 * overflows off-screen.
 *
 * API
 *   Properties (set via JS, not attributes, because `options` is an array):
 *     options:      SceSelectOption[]
 *     value:        string | null
 *     placeholder:  string
 *     searchPlaceholder: string
 *     emptyText:    string
 *     disabled:     boolean
 *     searchable:   boolean          default true
 *     name:         string           forwarded to form submit, if any
 *   Attributes (scalar props are also reflected as HTML attrs):
 *     value, placeholder, disabled, searchable, name
 *   Events:
 *     'sce-change'  CustomEvent<SceSelectChangeDetail>
 *     'sce-open'    CustomEvent<void>
 *     'sce-close'   CustomEvent<void>
 *
 * Theming
 *   See THEMING.md. Every surface color, radius, and focus accent is
 *   read through `var(--sce-*, <default>)` with the default inlined at
 *   each usage site — never set on `:host`. That way Stockroom can map
 *   its design tokens once at `:root` and the inherited value wins over
 *   the in-shadow fallback. (A custom property declared on `:host`
 *   applies directly to the host element and would otherwise beat the
 *   inherited value regardless of selector specificity.)
 *
 * Keyboard model
 *   Trigger:        Space / Enter / ↓ opens, types character = open + seed search
 *   Panel open:     ↑ / ↓ moves active, Enter selects, Esc closes,
 *                   Home / End jumps to first / last, Tab closes + moves focus
 *   Typing in the search input filters the list in real time; ↑/↓/Enter/Esc
 *   still work without leaving the input (focus stays on the input).
 *
 * Containing-block escape (why the panel portals)
 *   The open panel is rendered into a document-level shadow root hosted
 *   on a `<div>` appended to `document.body` — not inside the element's
 *   own shadow DOM. This is the only reliable way to avoid ancestor
 *   containing-block traps: any ancestor with `transform`, `filter`,
 *   `backdrop-filter`, `perspective`, `will-change`, or `contain`
 *   becomes the containing block for `position: fixed` descendants,
 *   which breaks viewport-anchored popups inside modals (shadcn's
 *   `DialogContent` uses `translate-x-[-50%] translate-y-[-50%]` to
 *   center itself — a transform — so inline popups would be clipped
 *   by the dialog). Because the portal host is a direct child of
 *   `<body>`, every `--sce-*` theme token set on `:root` still
 *   inherits into the panel's shadow root via the DOM tree, so the
 *   theming contract in THEMING.md is unaffected.
 */

import { LitElement, html, css, render, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  MIN_PANEL_HEIGHT,
  PANEL_OFFSET,
  VIEWPORT_MARGIN,
  type SceSelectChangeDetail,
  type SceSelectOption,
} from './types.js';

/** Case-insensitive substring match across label, description, keywords, value. */
function matches(opt: SceSelectOption, needle: string): boolean {
  if (!needle) return true;
  const haystack = `${opt.label}\n${opt.description ?? ''}\n${opt.keywords ?? ''}\n${opt.value}`.toLowerCase();
  return haystack.includes(needle);
}

interface PanelGeometry {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
  placement: 'below' | 'above';
}

@customElement('sce-select')
export class SceSelect extends LitElement {
  static styles = css`
    /* ------------------------------------------------------------
     * Theming surface
     * ------------------------------------------------------------
     * Every color, radius, and type choice is read through
     * \`var(--sce-*, <default>)\`. The default lives inline at each
     * usage site — NOT as a \`:host { --sce-*: ... }\` declaration —
     * because a custom property set on \`:host\` applies directly to
     * the host element and thereby beats any value the consumer
     * inherits down from \`:root\` (or any ancestor). Inlining the
     * fallback gives us the same out-of-the-box look while keeping
     * the inherited value winnable. See THEMING.md.
     * ------------------------------------------------------------ */

    :host {
      display: inline-block;
      width: 100%;
      font-family: var(--sce-font, ui-sans-serif, system-ui, -apple-system, sans-serif);
      color: var(--sce-fg, #0f172a);
      font-size: 0.875rem;
      line-height: 1.25rem;
      position: relative;
    }

    :host([hidden]) {
      display: none;
    }

    /* --------- Trigger --------- */
    .trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 0.5rem;
      background: var(--sce-bg, #ffffff);
      color: var(--sce-fg, #0f172a);
      border: 1px solid var(--sce-border-strong, #cbd5e1);
      border-radius: var(--sce-radius, 0.375rem);
      padding: 0 0.75rem;
      height: 2.25rem;
      font: inherit;
      font-family: var(--sce-font-data, ui-monospace, 'SF Mono', Menlo, Consolas, monospace);
      text-align: left;
      cursor: pointer;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .trigger:hover:not(:disabled) {
      border-color: var(--sce-accent, #10b981);
    }
    .trigger:focus-visible {
      outline: none;
      border-color: var(--sce-accent, #10b981);
      box-shadow: 0 0 0 3px var(--sce-accent-ring, rgba(16, 185, 129, 0.22));
    }
    .trigger[aria-expanded='true'] {
      border-color: var(--sce-accent, #10b981);
      box-shadow: 0 0 0 3px var(--sce-accent-ring, rgba(16, 185, 129, 0.22));
    }
    .trigger:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .trigger .value {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .trigger .placeholder {
      color: var(--sce-muted, #64748b);
    }
    .chevron {
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      color: var(--sce-muted, #64748b);
      transition: transform 150ms ease;
    }
    .trigger[aria-expanded='true'] .chevron {
      transform: rotate(180deg);
    }

    /* --------- Panel --------- */
    .panel {
      position: fixed;
      z-index: var(--sce-panel-z, 9999);
      background: var(--sce-bg, #ffffff);
      border: 1px solid var(--sce-border, #e2e8f0);
      border-radius: var(--sce-radius-panel, 0.5rem);
      box-shadow: var(
        --sce-shadow-panel,
        0 10px 30px rgba(15, 23, 42, 0.12),
        0 2px 6px rgba(15, 23, 42, 0.06)
      );
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 12rem;
      /* Entrance */
      opacity: 0;
      transform: translateY(-2px) scale(0.985);
      transition: opacity 120ms ease, transform 120ms ease;
      pointer-events: none;
    }
    .panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .panel.placement-above {
      transform-origin: bottom left;
    }

    /* --------- Search --------- */
    .search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.625rem;
      border-bottom: 1px solid var(--sce-border, #e2e8f0);
    }
    .search svg {
      flex-shrink: 0;
      width: 0.875rem;
      height: 0.875rem;
      color: var(--sce-muted, #64748b);
    }
    .search input {
      flex: 1;
      min-width: 0;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--sce-fg, #0f172a);
      font: inherit;
      font-family: var(--sce-font-data, ui-monospace, 'SF Mono', Menlo, Consolas, monospace);
      padding: 0.125rem 0;
    }
    .search input::placeholder {
      color: var(--sce-muted, #64748b);
    }

    /* --------- List --------- */
    .list {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 0.25rem;
      /* Thin, themeable scrollbar. */
      scrollbar-width: thin;
      scrollbar-color: var(--sce-border-strong, #cbd5e1) transparent;
    }
    .list::-webkit-scrollbar {
      width: 10px;
    }
    .list::-webkit-scrollbar-thumb {
      background: var(--sce-border-strong, #cbd5e1);
      border-radius: 8px;
      border: 2px solid var(--sce-bg, #ffffff);
    }

    .option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.625rem;
      height: var(--sce-row-height, 2.125rem);
      border-radius: calc(var(--sce-radius, 0.375rem) - 0.0625rem);
      font-family: var(--sce-font-data, ui-monospace, 'SF Mono', Menlo, Consolas, monospace);
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    }
    .option .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .option .description {
      color: var(--sce-muted, #64748b);
      font-size: 0.8125rem;
      flex-shrink: 0;
      max-width: 50%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .option .check {
      flex-shrink: 0;
      width: 0.875rem;
      height: 0.875rem;
      color: var(--sce-accent, #10b981);
      opacity: 0;
    }
    .option[aria-selected='true'] .check {
      opacity: 1;
    }
    .option.active {
      background: var(--sce-highlight-bg, rgba(16, 185, 129, 0.12));
      color: var(--sce-highlight-fg, #0f172a);
    }
    .option[aria-disabled='true'] {
      color: var(--sce-disabled-fg, #94a3b8);
      cursor: not-allowed;
    }
    .option[aria-disabled='true']:hover {
      background: transparent;
    }

    .empty {
      padding: 1rem 0.75rem;
      text-align: center;
      color: var(--sce-muted, #64748b);
      font-size: 0.8125rem;
    }

    .footer {
      flex-shrink: 0;
      padding: 0.375rem 0.625rem;
      border-top: 1px solid var(--sce-border, #e2e8f0);
      font-size: 0.6875rem;
      color: var(--sce-muted, #64748b);
      font-family: var(--sce-font-data, ui-monospace, 'SF Mono', Menlo, Consolas, monospace);
      letter-spacing: 0.02em;
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .footer kbd {
      font-family: inherit;
      background: var(--sce-border, #e2e8f0);
      border-radius: 3px;
      padding: 0 0.25rem;
      color: var(--sce-fg, #0f172a);
    }

    @media (prefers-reduced-motion: reduce) {
      .panel,
      .chevron {
        transition: none;
      }
    }
  `;

  // ----- Public API -----------------------------------------------------
  /** Option list. Passed as a JS property (never an attribute). */
  @property({ attribute: false }) options: SceSelectOption[] = [];
  /** Currently selected value, or null. */
  @property({ type: String, reflect: true }) value: string | null = null;
  @property({ type: String }) placeholder = 'Select…';
  @property({ attribute: 'search-placeholder', type: String }) searchPlaceholder = 'Search…';
  @property({ attribute: 'empty-text', type: String }) emptyText = 'No matches';
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property({ type: Boolean, reflect: true }) searchable = true;
  /** Optional name, reflected so a host form can discover the field. */
  @property({ type: String, reflect: true }) name: string | null = null;

  // ----- Internal state -------------------------------------------------
  @state() private open = false;
  @state() private query = '';
  @state() private activeIndex = 0;
  @state() private geometry: PanelGeometry = {
    left: 0,
    top: 0,
    width: 0,
    maxHeight: MIN_PANEL_HEIGHT,
    placement: 'below',
  };

  @query('.trigger') private triggerEl!: HTMLButtonElement;

  /**
   * The portal host — a `<div>` we append to `document.body` when the
   * element connects. Its shadow root receives the floating panel so
   * ancestor transforms/filters/backdrop-filters can't form a
   * containing block around it. See the header comment for the full
   * rationale.
   */
  private panelHost: HTMLDivElement | null = null;
  /** Shadow root on {@link panelHost}; null until connected. */
  private panelRoot: ShadowRoot | null = null;
  /** Queried within {@link panelRoot}, not the main shadow. */
  private get listEl(): HTMLDivElement | null {
    return this.panelRoot?.querySelector<HTMLDivElement>('.list') ?? null;
  }
  /** Queried within {@link panelRoot}, not the main shadow. */
  private get searchInput(): HTMLInputElement | null {
    return this.panelRoot?.querySelector<HTMLInputElement>('.search input') ?? null;
  }

  /** Bound so add/remove pair matches on global listeners. */
  private readonly onDocPointerDown = (e: PointerEvent) => {
    if (!this.open) return;
    const path = e.composedPath();
    // Clicks on the trigger OR anywhere inside the portaled panel are
    // "inside" the component for close-on-outside-click purposes.
    if (path.includes(this)) return;
    if (this.panelHost && path.includes(this.panelHost)) return;
    // Scrollbar edge case: when the user clicks a native scrollbar,
    // most browsers fire `pointerdown` with `event.target` retargeted
    // to `<html>` or the document rather than the scrollable element,
    // so `composedPath()` doesn't include our portal. Fall back to a
    // rect hit-test against the panel — its bounding rect DOES include
    // the scrollbar gutter. If the pointer is inside that rect, treat
    // it as an inside click.
    if (this.panelRoot && this.isPointerInsidePanel(e)) return;
    this.closePanel();
  };

  private isPointerInsidePanel(e: PointerEvent): boolean {
    const panel = this.panelRoot?.querySelector('.panel') as HTMLElement | null;
    if (!panel) return false;
    const r = panel.getBoundingClientRect();
    return (
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    );
  }
  private readonly onWindowResize = () => {
    if (this.open) this.reposition();
  };
  private readonly onWindowScroll = (e: Event) => {
    if (!this.open) return;
    // Ignore scrolls inside our own list — those should not reposition.
    if (e.target instanceof Node && this.listEl?.contains(e.target)) return;
    this.reposition();
  };

  /**
   * Scroll the list programmatically from wheel events.
   *
   * Why this is necessary even though `.list { overflow-y: auto }` would
   * normally be enough: when `<sce-select>` is opened inside a Radix
   * Dialog (or anything using `react-remove-scroll`), a document-level
   * capturing non-passive wheel listener lives upstream of us and
   * `preventDefault()`s every wheel event whose target isn't inside the
   * dialog's whitelisted "shards" ref. Our portal is a sibling of the
   * dialog, not a descendant, so native scroll inside our panel is
   * suppressed before the browser can act on it.
   *
   * The fix is to scroll the list ourselves in JavaScript. Radix can
   * still cancel the default — we've already moved `scrollTop`, so the
   * user sees the list scroll. We also `preventDefault()` + `stopPropagation()`
   * for good measure: if we're NOT inside a RemoveScroll container,
   * this keeps the outer page from bonus-scrolling, matching native
   * overflow behavior. Passive must be `false` or `preventDefault()`
   * is a no-op; that's why this can't be wired via Lit's `@wheel=`
   * template attribute.
   */
  private readonly onPanelWheel = (e: WheelEvent): void => {
    if (!this.open) return;
    const list = this.listEl;
    if (!list) return;
    // The listener is attached on the portal SHADOW ROOT, so
    // `event.target` is the element inside the shadow where the event
    // originated (no retargeting across the boundary yet). If it had
    // been attached on the host we'd receive `host` as the retargeted
    // target and this check would always fail.
    if (!list.contains(e.target as Node)) return;
    // Normalize deltaMode to pixels. 0 = pixel, 1 = line, 2 = page.
    const lineHeight = 16;
    const factor =
      e.deltaMode === 1 ? lineHeight : e.deltaMode === 2 ? list.clientHeight : 1;
    list.scrollTop += e.deltaY * factor;
    list.scrollLeft += e.deltaX * factor;
    e.preventDefault();
    e.stopPropagation();
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.ensurePanelHost();
    document.addEventListener('pointerdown', this.onDocPointerDown, true);
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('scroll', this.onWindowScroll, true);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('scroll', this.onWindowScroll, true);
    // Tear the portal host back down so we don't leak a <div> per
    // mount/unmount cycle. `render(null, root)` disposes Lit parts.
    if (this.panelRoot) {
      this.panelRoot.removeEventListener(
        'wheel',
        this.onPanelWheel as EventListener,
        { capture: true },
      );
      render(null, this.panelRoot);
    }
    this.panelHost?.remove();
    this.panelHost = null;
    this.panelRoot = null;
  }

  /**
   * Lazily create the portal host on first connect. Idempotent so that
   * disconnecting + reconnecting (e.g. when the element is moved across
   * the DOM) still works without leaking hosts.
   */
  private ensurePanelHost(): void {
    if (this.panelHost) return;
    const host = document.createElement('div');
    host.setAttribute('data-sce-select-portal', '');
    // `display: contents` keeps the host out of the layout — it exists
    // only as a DOM anchor for the shadow root. `position: fixed` on
    // its descendants remains viewport-fixed because no containing
    // block is formed here.
    host.style.display = 'contents';
    const root = host.attachShadow({ mode: 'open' });
    // Reuse the element's compiled stylesheet so both roots stay in
    // lockstep automatically: any future CSS edit ships to both.
    const styles = (this.constructor as typeof SceSelect).styles as CSSResult;
    const sheet = styles.styleSheet;
    if (sheet) {
      root.adoptedStyleSheets = [sheet];
    } else {
      // Fallback for environments without constructable stylesheets.
      const style = document.createElement('style');
      style.textContent = styles.cssText;
      root.appendChild(style);
    }
    document.body.appendChild(host);
    // Non-passive wheel listener so we can call preventDefault() inside
    // Radix's RemoveScroll. Attached to the SHADOW ROOT (not the host)
    // so `event.target` inside the handler still points at the
    // shadow-internal originator — retargeting only happens on
    // crossings between the shadow tree and the light tree. Capture
    // phase so we run before any listener a content author might add
    // inside the panel template.
    root.addEventListener(
      'wheel',
      this.onPanelWheel as EventListener,
      { passive: false, capture: true },
    );
    this.panelHost = host;
    this.panelRoot = root;
  }

  // ----- Derived --------------------------------------------------------
  private get filtered(): SceSelectOption[] {
    const needle = this.query.trim().toLowerCase();
    if (!needle) return this.options;
    return this.options.filter((o) => matches(o, needle));
  }

  private get selectedOption(): SceSelectOption | null {
    if (this.value == null) return null;
    return this.options.find((o) => o.value === this.value) ?? null;
  }

  // ----- Open / close ---------------------------------------------------
  private openPanel(seedChar?: string): void {
    if (this.disabled || this.open) return;
    // Compute geometry synchronously using the trigger's *current* layout
    // rect — the panel has never been visible, so the trigger's rect is
    // already final. Doing this before flipping `open` means the single
    // re-render sees both the open state and the correct geometry and
    // Lit doesn't warn about a post-update state change.
    this.reposition();
    this.open = true;
    this.query = seedChar ?? '';
    // Preselect the currently-selected option, else first non-disabled.
    const filtered = this.filtered;
    const selectedIdx = filtered.findIndex((o) => o.value === this.value);
    this.activeIndex = selectedIdx >= 0 ? selectedIdx : this.firstEnabledIndex(filtered);
    this.dispatchEvent(new CustomEvent('sce-open'));
    // Focus management still has to wait for the panel to be in the DOM.
    this.updateComplete.then(() => {
      if (this.searchable) {
        this.searchInput?.focus();
      }
      this.scrollActiveIntoView();
    });
  }

  private closePanel(returnFocus = false): void {
    if (!this.open) return;
    this.open = false;
    this.query = '';
    this.dispatchEvent(new CustomEvent('sce-close'));
    if (returnFocus) {
      this.updateComplete.then(() => this.triggerEl?.focus());
    }
  }

  private firstEnabledIndex(list: SceSelectOption[]): number {
    const i = list.findIndex((o) => !o.disabled);
    return i >= 0 ? i : 0;
  }

  // ----- Viewport-aware positioning -------------------------------------
  /**
   * Compute panel geometry relative to the viewport. The panel pins to
   * the trigger's left edge, matches its width (or a minimum), and sizes
   * its max-height to whichever side has more room — always leaving a
   * small margin. If both sides are tiny we pick the bigger one and
   * accept internal scrolling; the panel never exceeds the viewport.
   */
  private reposition(): void {
    const trigger = this.triggerEl;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceBelow = vh - rect.bottom - PANEL_OFFSET - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - PANEL_OFFSET - VIEWPORT_MARGIN;

    const preferBelow = spaceBelow >= MIN_PANEL_HEIGHT || spaceBelow >= spaceAbove;
    const placement: 'below' | 'above' = preferBelow ? 'below' : 'above';
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, preferBelow ? spaceBelow : spaceAbove);

    const width = Math.max(rect.width, 192 /* 12rem */);
    // Keep panel inside viewport horizontally.
    let left = rect.left;
    if (left + width > vw - VIEWPORT_MARGIN) {
      left = Math.max(VIEWPORT_MARGIN, vw - width - VIEWPORT_MARGIN);
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

    const top =
      placement === 'below'
        ? rect.bottom + PANEL_OFFSET
        : rect.top - PANEL_OFFSET - maxHeight;

    this.geometry = { left, top, width, maxHeight, placement };
  }

  // ----- Selection ------------------------------------------------------
  private selectIndex(i: number): void {
    const list = this.filtered;
    const opt = list[i];
    if (!opt || opt.disabled) return;
    const previous = this.value;
    this.value = opt.value;
    if (previous !== this.value) {
      const detail: SceSelectChangeDetail = { value: opt.value, option: opt };
      this.dispatchEvent(
        new CustomEvent<SceSelectChangeDetail>('sce-change', {
          detail,
          bubbles: true,
          composed: true,
        }),
      );
    }
    this.closePanel(true);
  }

  // ----- Keyboard -------------------------------------------------------
  private onTriggerKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.openPanel();
        return;
    }
    // Type-ahead: printable char opens + seeds the search.
    if (
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      e.key.length === 1 &&
      /\S/.test(e.key)
    ) {
      e.preventDefault();
      this.openPanel(e.key);
    }
  }

  private onPanelKeydown(e: KeyboardEvent): void {
    const list = this.filtered;
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.closePanel(true);
        return;
      case 'ArrowDown':
        e.preventDefault();
        this.moveActive(1, list);
        return;
      case 'ArrowUp':
        e.preventDefault();
        this.moveActive(-1, list);
        return;
      case 'Home':
        e.preventDefault();
        this.activeIndex = this.firstEnabledIndex(list);
        this.scrollActiveIntoView();
        return;
      case 'End':
        e.preventDefault();
        this.activeIndex = this.lastEnabledIndex(list);
        this.scrollActiveIntoView();
        return;
      case 'Enter':
        e.preventDefault();
        this.selectIndex(this.activeIndex);
        return;
      case 'Tab':
        // Focus is currently inside the portaled panel (a detached
        // subtree at the end of <body>). If we just close, focus goes
        // to <body> and Tab moves past every element on the page. We
        // synchronously return focus to the trigger *without*
        // preventing the default, so the browser then advances from
        // the trigger's DOM position — the natural tab order the user
        // expects.
        this.triggerEl?.focus();
        this.closePanel();
        return;
    }
  }

  private lastEnabledIndex(list: SceSelectOption[]): number {
    for (let i = list.length - 1; i >= 0; i--) {
      if (!list[i].disabled) return i;
    }
    return 0;
  }

  private moveActive(delta: number, list: SceSelectOption[]): void {
    if (list.length === 0) return;
    let next = this.activeIndex;
    for (let step = 0; step < list.length; step++) {
      next = (next + delta + list.length) % list.length;
      if (!list[next].disabled) break;
    }
    this.activeIndex = next;
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    // Ensure DOM is updated before measuring. `scrollIntoView` is missing
    // in jsdom (and older webviews); guard defensively rather than polyfill
    // because a missed scroll on a hidden option is harmless. Option rows
    // live in the portal root, not the main shadow.
    this.updateComplete.then(() => {
      const el = this.panelRoot?.querySelector(
        `.option[data-index="${this.activeIndex}"]`,
      ) as HTMLElement | null;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  private onSearchInput(e: Event): void {
    const value = (e.target as HTMLInputElement).value;
    this.query = value;
    // Reset active to first match when the filter changes.
    this.activeIndex = this.firstEnabledIndex(this.filtered);
  }

  // ----- Lifecycle hooks ------------------------------------------------
  updated(changed: Map<string, unknown>): void {
    // Repositioning on open happens eagerly in `openPanel()` so the first
    // render has the right geometry — no duplicate here. We only need to
    // guard against `options` changing mid-flight (e.g. async vendor fetch
    // resolves after the panel was opened).
    if (changed.has('options') && this.open) {
      const list = this.filtered;
      if (this.activeIndex >= list.length) {
        this.activeIndex = this.firstEnabledIndex(list);
      }
    }
    // Always refresh the portal. Lit's imperative `render()` is a
    // diff against the previous template, so re-rendering on every
    // update is as cheap as the main shadow root update. `host: this`
    // binds `this` in every inline event handler back to the element —
    // LitElement's own `render()` does this automatically, but the
    // imperative helper needs it spelled out.
    if (this.panelRoot) {
      render(this.renderPanel(), this.panelRoot, { host: this });
    }
  }

  // ----- Render ---------------------------------------------------------
  render() {
    const selected = this.selectedOption;
    return html`
      <button
        type="button"
        class="trigger"
        part="trigger"
        ?disabled=${this.disabled}
        aria-haspopup="listbox"
        aria-expanded=${this.open ? 'true' : 'false'}
        @click=${() => (this.open ? this.closePanel() : this.openPanel())}
        @keydown=${this.onTriggerKeydown}
      >
        <span class=${classMap({ value: true, placeholder: !selected })}>
          ${selected ? selected.label : this.placeholder}
        </span>
        <svg
          class="chevron"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    `;
  }

  /**
   * The floating panel template. Rendered into {@link panelRoot} — NOT
   * into the main shadow root — so ancestor transforms/filters can't
   * trap our `position: fixed` coordinates. All event handlers are bound
   * to `this`, so they still reach back into the element's state.
   */
  private renderPanel(): TemplateResult {
    const list = this.filtered;
    const panelStyle = styleMap({
      left: `${this.geometry.left}px`,
      top: `${this.geometry.top}px`,
      width: `${this.geometry.width}px`,
      maxHeight: `${this.geometry.maxHeight}px`,
    });

    return html`
      <div
        class=${classMap({
          panel: true,
          open: this.open,
          [`placement-${this.geometry.placement}`]: true,
        })}
        part="panel"
        role="listbox"
        aria-hidden=${this.open ? 'false' : 'true'}
        style=${panelStyle}
        @keydown=${this.onPanelKeydown}
      >
        ${this.searchable
          ? html`
              <div class="search" part="search">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="M13.5 13.5L17 17" stroke-linecap="round" />
                </svg>
                <input
                  type="text"
                  .value=${this.query}
                  placeholder=${this.searchPlaceholder}
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  aria-autocomplete="list"
                  aria-controls="sce-select-list"
                  @input=${this.onSearchInput}
                />
              </div>
            `
          : null}
        <div id="sce-select-list" class="list" part="list" tabindex="-1">
          ${list.length === 0
            ? html`<div class="empty">${this.emptyText}</div>`
            : list.map(
                (opt, i) => html`
                  <div
                    class=${classMap({ option: true, active: i === this.activeIndex })}
                    data-index=${i}
                    role="option"
                    aria-selected=${opt.value === this.value ? 'true' : 'false'}
                    aria-disabled=${opt.disabled ? 'true' : 'false'}
                    @pointerenter=${() => (this.activeIndex = i)}
                    @click=${() => this.selectIndex(i)}
                  >
                    <svg
                      class="check"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.25"
                      aria-hidden="true"
                    >
                      <path
                        d="M4.5 10.5l3.5 3.5 7.5-7.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <span class="label">${opt.label}</span>
                    ${opt.description
                      ? html`<span class="description">${opt.description}</span>`
                      : null}
                  </div>
                `,
              )}
        </div>
        ${this.searchable && list.length > 0
          ? html`
              <div class="footer" part="footer">
                <span>${list.length} ${list.length === 1 ? 'match' : 'matches'}</span>
                <span>
                  <kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> select · <kbd>esc</kbd> close
                </span>
              </div>
            `
          : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sce-select': SceSelect;
  }
}
