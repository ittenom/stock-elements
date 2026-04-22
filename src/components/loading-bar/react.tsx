/**
 * React wrapper for <sce-loading-bar>.
 *
 * Usage:
 *   import { SceLoadingBarReact } from "stock-elements/loading-bar/react";
 *
 *   <SceLoadingBarReact mode="HORIZON" progress={42} heading="Loading" />
 */

import type React from 'react';
import { createReactAdapter } from '../../lib/react-adapter.js';
import './loading-bar.js';
import type { LoadingBarMode } from './types.js';

export type { LoadingBarMode } from './types.js';

export interface SceLoadingBarReactProps {
  mode?: LoadingBarMode;
  randomness?: number;
  speed?: number;
  heading?: string;
  caption?: string;
  progress?: number;
  fakeMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const SceLoadingBarReact = createReactAdapter<SceLoadingBarReactProps>({
  tag: 'sce-loading-bar',
  properties: [
    'mode',
    'randomness',
    'speed',
    'heading',
    'caption',
    'progress',
    'fakeMode',
  ],
});
