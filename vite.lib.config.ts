/**
 * Library build for stock-elements.
 *
 * Emits ESM entry points and .d.ts files for every consumer-facing
 * subpath in `package.json` → "exports". Consumers who want only one
 * component (tree-shaking friendly) import via subpath:
 *
 *     import "stock-elements/select";                    // registers element
 *     import { SceSelectReact } from "stock-elements/select/react";
 *
 * The root `.` entry re-exports everything for prototyping / demos.
 *
 * Notes
 *   - `lit` is externalised so Stockroom (which already bundles lit ^3.3)
 *     doesn't ship two copies. `react` / `react/jsx-runtime` are external
 *     too, and are `peerDependencies` — only needed if a consumer imports
 *     a `/react` subpath.
 *   - We target ES2022 to match the existing tsconfig; Stockroom bundles
 *     for modern browsers via its own Vite config.
 */
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

const entries = {
  index: 'src/index.ts',
  'components/loading-bar/index': 'src/components/loading-bar/index.ts',
  'components/loading-bar/react': 'src/components/loading-bar/react.tsx',
  'components/select/index': 'src/components/select/index.ts',
  'components/select/react': 'src/components/select/react.tsx',
};

export default defineConfig({
  plugins: [
    dts({
      tsconfigPath: './tsconfig.lib.json',
      // Keep source-level paths (./select/select.ts → ./select/select.d.ts)
      // so the "exports" map resolves types without re-mapping.
      entryRoot: 'src',
      outDir: 'dist',
      // The `index.ts` re-exports from subpaths; rolling up the full API
      // into one .d.ts would double-declare the types. Skip rollup.
      rollupTypes: false,
    }),
  ],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: Object.fromEntries(
        Object.entries(entries).map(([k, v]) => [k, resolve(__dirname, v)]),
      ),
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'lit',
        /^lit\//,
        'react',
        'react/jsx-runtime',
        'react-dom',
      ],
      output: {
        // Preserve directory structure so subpath imports match source layout.
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
});
