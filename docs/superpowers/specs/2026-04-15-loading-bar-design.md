# Loading Bar Component — Design Spec

**Date:** 2026-04-15
**Status:** Approved for implementation
**Component:** `<sce-loading-bar>`

## Summary

A reusable, framework-agnostic loading bar web component rendered as a terminal-emulator-style row of `█` (U+2588) block characters with three pre-baked animated themes. Ships as the first element in the `stock-elements` UI library.

## Stack

- **Lit 3** — web component base class
- **TypeScript** — strict mode
- **Vite** — dev server, build
- **Tailwind 4** — showcase page styling (component internals use Shadow DOM CSS)
- **Vitest** — minimal smoke testing

## Repo Layout

```
stock-elements/
├── src/
│   ├── components/
│   │   └── loading-bar/
│   │       ├── loading-bar.ts      # <sce-loading-bar> class
│   │       ├── modes.ts            # HORIZON / NEON / SPECTRUM logic
│   │       ├── types.ts            # Shared types
│   │       └── loading-bar.test.ts # Smoke test
│   └── showcase/
│       ├── index.html
│       └── main.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.js
```

## Component API

```ts
type LoadingBarMode = 'HORIZON' | 'NEON' | 'SPECTRUM';

interface LoadingBarProps {
  mode?: LoadingBarMode;    // default: 'HORIZON'
  randomness?: number;      // 0–1, default 0.3
  speed?: number;           // animation multiplier, default 1
  heading?: string;         // optional label above
  caption?: string;         // optional label below
  progress?: number;        // 0–100 for real polling; omitted means fake-mode candidate
  fakeMode?: boolean;       // overrides progress, runs indeterminate animation
}
```

All props exposed as Lit reactive properties and HTML attributes (kebab-case: `mode`, `fake-mode`, etc.). No events emitted — caller owns state.

## Rendering Model

- Single line of **40 `█` (U+2588) characters** in a monospace font.
- Each block is a `<span>` inside Shadow DOM for individual animation.
- Block size = element's `font-size`. Consumer scales the bar by changing font size.
- Optional `heading` renders above (smaller, dimmer), `caption` below.

## Modes

### HORIZON
- Completed blocks: solid primary color.
- Incomplete blocks: ~20% opacity, pulsing between 15%–35% opacity on a ~1.2s × `1/speed` period.
- Per-block pulse phase offset scaled by `randomness`.
- Entire element's hue drifts ±15° on slow 8s cycle.

### NEON
- All blocks share a pink (#ff3d9a) → cyan (#00e5ff) linear gradient applied across the bar.
- A brightness/scale pulse wave travels left→right continuously, ~2s × `1/speed` period.
- `randomness` warps wave spacing.
- Blocks past `progress` render dimmed (same mechanism as HORIZON's incomplete blocks, but no independent pulse).

### SPECTRUM
- Each block cycles through an 8-color rainbow palette.
- Neighbors staggered by one step (shimmer effect).
- Step interval ~250ms × `1/speed`.
- `randomness` jitters per-block step timing.
- Blocks past `progress` render dimmed.

## Progress Semantics

- **Real mode** (`fakeMode` false/unset, `progress` set): caller updates `progress` 0–100. Component visualizes filled vs unfilled region per mode.
- **Fake mode** (`fakeMode` true): component ignores `progress`, animates as if all 40 blocks were active. No progress semantics.
- **Transitions:**
  - When `fakeMode` flips `true→false`, play 400ms left-to-right solid fill flourish in primary color, then settle at current `progress` (or 100 if unset).
  - When `progress` reaches 100 in real mode, play same 400ms flourish, then hold at 100%.

## Showcase Page

Single `index.html` route mounting one `<sce-loading-bar>` at large font size. Controls panel:

- Mode dropdown (HORIZON / NEON / SPECTRUM)
- Randomness slider (0–1, step 0.05)
- Speed slider (0.25–3, step 0.05)
- Heading / caption text inputs
- **"Run 20s test"** button: starts real polling, progress +2.5 every 500ms over 40 ticks = 20s
- **"Toggle fake mode"** button
- **"Reset"** button

Showcase page styled with Tailwind. Component internals do not use Tailwind (Shadow DOM isolation).

## Testing

Single Vitest smoke test: element registers, renders 40 `█` spans, responds to `progress` attribute change. No visual regression testing — showcase is the manual harness.

## Non-Goals

- No framework wrappers (React/Vue/etc.) in v1 — consumers use the custom element directly.
- No theming beyond the three pre-baked modes.
- No ARIA progressbar role in v1 (add in follow-up).
- No SSR support.
- No npm publish pipeline in v1.
