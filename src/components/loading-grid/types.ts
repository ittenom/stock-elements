/**
 * Public types for <sce-loading-grid>.
 *
 * The grid variant shares its mode palette and semantics with
 * <sce-loading-bar> — same HORIZON / NEON / SPECTRUM themes, same
 * randomness / speed knobs, same fakeMode / progress / flourish rules —
 * but lays its blocks out as a 2D grid that auto-fits the container on
 * both axes. Use it anywhere a square or vertically-shaped slot needs a
 * progress indicator (spinner replacement, card placeholder, etc.).
 */
import type { LoadingBarMode } from '../loading-bar/types.js';

export type LoadingGridMode = LoadingBarMode;

export { BLOCK_CHAR } from '../loading-bar/types.js';

/**
 * Gap between grid cells, in pt. Matches the bar variant's 2pt gap so
 * the two elements read as visually consistent. Cells are painted as
 * solid rects (not the FULL BLOCK glyph), so the CSS gap is the only
 * space between cells — no glyph-padding artifact to compensate for.
 */
export const GRID_GAP_PT = 2;

/** Default cap on each axis. Keeps cell count sane on huge containers. */
export const DEFAULT_GRID_MAX = 64;
/** Minimum cells per axis so the grid is still legible in tiny slots. */
export const MIN_GRID_SIDE = 2;

/**
 * Default cell size on the shorter axis, in CSS px. Roughly matches
 * the 1em glyph box at the showcase's 1.25rem font size so the default
 * appearance is unchanged from the font-driven sizing it replaced.
 */
export const DEFAULT_CELL_SIZE_PX = 20;
export const MIN_CELL_SIZE_PX = 4;
export const MAX_CELL_SIZE_PX = 64;

/**
 * Default cell aspect ratio (width ÷ height). The FULL BLOCK glyph
 * (U+2588) renders roughly 0.6 wide-over-tall in typical monospace
 * fonts, so `0.6` keeps the "tall block" silhouette users had before
 * we moved to explicit cell sizing. Set to `1` for a square grid.
 */
export const DEFAULT_CELL_ASPECT = 0.6;
export const MIN_CELL_ASPECT = 0.5;
export const MAX_CELL_ASPECT = 2.0;

export interface LoadingGridProps {
  mode?: LoadingGridMode;
  randomness?: number;
  speed?: number;
  heading?: string;
  caption?: string;
  progress?: number;
  fakeMode?: boolean;
  /** Cell size (shorter axis), in CSS px. See DEFAULT_CELL_SIZE_PX. */
  cellSize?: number;
  /** Cell aspect ratio (width ÷ height). See DEFAULT_CELL_ASPECT. */
  cellAspect?: number;
}
