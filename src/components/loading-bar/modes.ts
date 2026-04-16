import type { LoadingBarMode } from './types.ts';

export interface ModeConfig {
  /** CSS custom property values applied to the host per-mode. */
  vars: Record<string, string>;
  /** Base animation period in ms (before `speed` multiplier). */
  pulsePeriodMs: number;
}

export const MODE_CONFIG: Record<LoadingBarMode, ModeConfig> = {
  HORIZON: {
    vars: {
      '--sce-primary': '#7dd3fc',
      '--sce-dim-opacity': '0.2',
      '--sce-pulse-min': '0.15',
      '--sce-pulse-max': '0.35',
    },
    pulsePeriodMs: 1200,
  },
  NEON: {
    vars: {
      '--sce-neon-start': '#ff3d9a',
      '--sce-neon-end': '#00e5ff',
      '--sce-dim-opacity': '0.18',
    },
    pulsePeriodMs: 2000,
  },
  SPECTRUM: {
    vars: {
      '--sce-dim-opacity': '0.18',
    },
    pulsePeriodMs: 250,
  },
};

export const NEON_PALETTE = [
  '#ff3d9a',
  '#db55a8',
  '#b66db7',
  '#9285c5',
  '#6d9dd4',
  '#49b5e2',
  '#24cdf1',
  '#00e5ff',
];

export const NEON_CYAN = '#00e5ff';

/** Progress at which cyan begins creeping in from the left. */
export const NEON_CYAN_THRESHOLD = 16;

/** Maximum leftmost blocks overridden to cyan when progress is 100. */
export const NEON_CYAN_MAX_BARS = 6;

/**
 * Number of leftmost blocks overridden to cyan for a given progress value.
 * Starts at 1 when progress hits the threshold, grows to NEON_CYAN_MAX_BARS at 100%.
 */
export function neonCyanBars(progress: number, _blockCount: number): number {
  if (progress < NEON_CYAN_THRESHOLD) return 0;
  const t = (progress - NEON_CYAN_THRESHOLD) / (100 - NEON_CYAN_THRESHOLD);
  return Math.round(1 + t * (NEON_CYAN_MAX_BARS - 1));
}

/** Progress at which leading blocks flip back to pink. */
export const NEON_PINK_THRESHOLD = 95;

/**
 * Number of leftmost blocks overridden to pink near completion.
 * 1 block at threshold, 2 blocks at 100%.
 */
export function neonPinkBars(progress: number): number {
  if (progress < NEON_PINK_THRESHOLD) return 0;
  const t = (progress - NEON_PINK_THRESHOLD) / (100 - NEON_PINK_THRESHOLD);
  return Math.round(1 + t);
}

export const NEON_FAKE_PALETTE = [
  '#ff3d9a',
  '#e250a5',
  '#c662b0',
  '#aa75bb',
  '#8d88c7',
  '#719ad2',
  '#55addd',
  '#39bfe8',
  '#1cd2f3',
  '#00e5ff',
];

export const SPECTRUM_PALETTE = [
  '#ff4d4d', // red
  '#ff9f40', // orange
  '#ffe74c', // yellow
  '#6dd36d', // green
  '#3dc3ff', // cyan
  '#4d7dff', // blue
  '#9a5dff', // indigo
  '#ff5dd1', // magenta
];

/**
 * Deterministic-ish pseudo-random in [0,1) given a seed integer.
 * Keeps randomness stable across re-renders for a given block index.
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
