/**
 * Dev / showcase Vite config.
 *
 * For the library build (ESM + .d.ts emission for npm consumers) see
 * `vite.lib.config.ts`. These are deliberately split so showcase dev can
 * stay fast and unopinionated while the lib build can pull in heavier
 * plugins (dts generation) without slowing iteration.
 */
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: 'src/showcase',
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: '../../dist-showcase',
    emptyOutDir: true,
  },
});
