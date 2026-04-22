/**
 * Public types for <sce-select>.
 *
 * The component is framework-agnostic and accepts its option list as a
 * JS property (never as an attribute) so it can handle thousands of items
 * without attribute-serialization cost. See THEMING.md for the CSS custom
 * property surface this element exposes.
 */

export interface SceSelectOption {
  /** Stable identifier used as the selected value. */
  value: string;
  /** Primary display label. */
  label: string;
  /** Optional subtitle rendered dimmer to the right of the label. */
  description?: string;
  /** Optional extra searchable text (not rendered). */
  keywords?: string;
  /** Whether this option is disabled / non-selectable. */
  disabled?: boolean;
}

/**
 * Emitted on `sce-change` when the selection changes. The payload is the
 * new `value` (or `null` if the selection was cleared).
 */
export interface SceSelectChangeDetail {
  value: string | null;
  option: SceSelectOption | null;
}

/** Minimum panel height in px — below this we flip or scroll rather than shrink. */
export const MIN_PANEL_HEIGHT = 160;
/** Bottom/top viewport breathing room before the panel hits the edge. */
export const VIEWPORT_MARGIN = 8;
/** Gap between trigger and panel. */
export const PANEL_OFFSET = 6;
