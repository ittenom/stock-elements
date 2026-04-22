/**
 * React wrapper for <sce-select>.
 *
 * Usage:
 *   import { SceSelectReact } from "stock-elements/select/react";
 *
 *   <SceSelectReact
 *     options={vendors.map(v => ({ value: v.id, label: v.name, description: v.city }))}
 *     value={pickedId}
 *     onChange={e => setPickedId(e.detail.value)}
 *     placeholder="Select vendor…"
 *   />
 */

import type React from 'react';
import { createReactAdapter } from '../../lib/react-adapter.js';
import './select.js';
import type { SceSelectChangeDetail, SceSelectOption } from './types.js';

export type { SceSelectOption, SceSelectChangeDetail } from './types.js';

export interface SceSelectReactProps {
  options: SceSelectOption[];
  value?: string | null;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  searchable?: boolean;
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  /** Fired when the user picks a new option. */
  onChange?: (e: CustomEvent<SceSelectChangeDetail>) => void;
  onOpen?: (e: CustomEvent<void>) => void;
  onClose?: (e: CustomEvent<void>) => void;
}

export const SceSelectReact = createReactAdapter<SceSelectReactProps>({
  tag: 'sce-select',
  properties: [
    'options',
    'value',
    'placeholder',
    'searchPlaceholder',
    'emptyText',
    'disabled',
    'searchable',
    'name',
  ],
  events: {
    onChange: 'sce-change',
    onOpen: 'sce-open',
    onClose: 'sce-close',
  },
});
