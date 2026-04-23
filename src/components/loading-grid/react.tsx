/**
 * React wrapper for <sce-loading-grid>.
 *
 * Usage:
 *   import { SceLoadingGridReact } from "stock-elements/loading-grid/react";
 *
 *   <SceLoadingGridReact mode="HORIZON" fakeMode heading="Loading" />
 */

import type React from 'react';
import { createReactAdapter } from '../../lib/react-adapter.js';
import './loading-grid.js';
import type { LoadingGridMode } from './types.js';

export type { LoadingGridMode } from './types.js';

export interface SceLoadingGridReactProps {
  mode?: LoadingGridMode;
  randomness?: number;
  speed?: number;
  heading?: string;
  caption?: string;
  progress?: number;
  fakeMode?: boolean;
  /** Cell size (shorter axis) in CSS px. */
  cellSize?: number;
  /** Cell aspect ratio (width ÷ height). */
  cellAspect?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const SceLoadingGridReact = createReactAdapter<SceLoadingGridReactProps>(
  {
    tag: 'sce-loading-grid',
    properties: [
      'mode',
      'randomness',
      'speed',
      'heading',
      'caption',
      'progress',
      'fakeMode',
      'cellSize',
      'cellAspect',
    ],
  },
);
