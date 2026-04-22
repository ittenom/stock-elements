/**
 * Root barrel for stock-elements.
 *
 * Importing this file registers all catalog elements as a side effect,
 * which is handy for prototyping but unnecessary in production: prefer
 * per-component subpath imports (`stock-elements/select`, etc.) so the
 * bundler can tree-shake unused elements.
 */
export * from './components/loading-bar/index.js';
export * from './components/select/index.js';
