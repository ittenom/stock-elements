export type LoadingBarMode = 'HORIZON' | 'NEON' | 'SPECTRUM';

export const BLOCK_CHAR = '\u2588';
export const DEFAULT_BLOCK_COUNT = 40;
export const MIN_BLOCK_COUNT = 8;
export const BLOCK_GAP_PT = 2;

export interface LoadingBarProps {
  mode?: LoadingBarMode;
  randomness?: number;
  speed?: number;
  heading?: string;
  caption?: string;
  progress?: number;
  fakeMode?: boolean;
}
