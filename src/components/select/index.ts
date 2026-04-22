/**
 * Barrel for <sce-select>. Importing this file registers the custom
 * element as a side effect. Consumers who want the React adapter should
 * import from `stock-elements/select/react` instead.
 */
export { SceSelect } from './select.js';
export type {
  SceSelectOption,
  SceSelectChangeDetail,
} from './types.js';
