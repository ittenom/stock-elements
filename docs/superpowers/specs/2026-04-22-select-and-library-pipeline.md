# Select Component + Library Pipeline — Design & Implementation

**Date:** 2026-04-22
**Status:** Shipped
**Components:** `<sce-select>`, shared React adapter
**Related:** Stockroom's NewPoVendorPicker (`client/src/pages/purchase-order-builder.tsx`)

## Motivation

Stockroom's New Purchase Order flow — and every other page using the
shadcn `Select` primitive — fails when the option list exceeds the
viewport. The Radix popover underneath caps its scroll to its own
max-height, so a user with 50+ vendors on a laptop (~20 option-heights
of screen) gets a list that extends below the fold with no way to reach
the tail. Same for warehouse dropdowns on mobile, tax-code pickers, etc.

The goal: a drop-in web component that solves this correctly (viewport
clamping + internal scrolling + type-to-filter) and does so framework-
agnostically so it can also serve future non-React surfaces.

## Shape of the work

Two concurrent streams in one pass:

1. **`<sce-select>` component** — searchable single-select with a
   viewport-aware panel. Keyboard-first. Themed by CSS custom properties.
2. **Library build pipeline** — convert the repo from "showcase-only"
   into a publishable package so Stockroom can `npm install
   stock-elements` instead of hand-copying source files into
   `client/src/vendor/`.

## `<sce-select>` design

### API

```ts
interface SceSelectOption {
  value: string;
  label: string;
  description?: string;  // rendered dim-right in the row
  keywords?: string;     // extra searchable text, not rendered
  disabled?: boolean;
}

// Properties:
options:            SceSelectOption[]       // JS property only (no attr)
value:              string | null
placeholder:        string
searchPlaceholder:  string
emptyText:          string
disabled:           boolean
searchable:         boolean                 // default true
name:               string | null

// Events:
'sce-change'  CustomEvent<{ value: string | null; option: SceSelectOption | null }>
'sce-open'    CustomEvent<void>
'sce-close'   CustomEvent<void>
```

### Positioning

The panel uses `position: fixed`, calculates geometry from
`trigger.getBoundingClientRect()` against `window.innerWidth/Height`,
and:

- Flips above the trigger when there's more room there.
- Clamps `max-height` to `Math.max(MIN_PANEL_HEIGHT, availableSpace)`.
- Keeps the panel horizontally inside the viewport with a small margin.
- Repositions on `window.resize` and capture-phase `scroll` events.
- Repositioning runs *synchronously before* flipping `open`, so the
  first render sees the final geometry (avoids Lit's
  "scheduled-an-update-after-update" warning).

Known limitation: ancestors with `transform`, `filter`, or
`will-change: transform` become containing blocks for fixed descendants.
Documented in the component header; the NewPoVendorPicker layout has
none of these.

### Keyboard model

| Context | Keys | Behavior |
|---|---|---|
| Trigger focused | `Space`, `Enter`, `↓` | Open panel |
| Trigger focused | Printable char | Open + seed search with that char |
| Panel open | `↑` / `↓` | Move active (skips disabled) |
| Panel open | `Home` / `End` | Jump to first/last enabled |
| Panel open | `Enter` | Select active |
| Panel open | `Esc` | Close, return focus to trigger |
| Panel open | `Tab` | Close, natural focus flow continues |

Matches the conventions in Stockroom's currency-picker so muscle memory
transfers.

### Theming

Every surface color, radius, focus accent, and font-family is driven by
a documented `--sce-*` custom property with a sensible default. See
`THEMING.md` for the full token sheet and a one-liner shim that maps
Stockroom tokens onto ours.

Exposes `::part(trigger|panel|search|list|footer)` for consumers who
need to go deeper than the tokens allow.

## Library pipeline

### `package.json` changes

- Dropped `"private": true`.
- Version bumped to `0.2.0`.
- Added `"exports"` map with typed subpath entries for each element:
  - `.` (root barrel)
  - `./loading-bar` + `./loading-bar/react`
  - `./select` + `./select/react`
- Added `"sideEffects"` listing both the source and dist entry-point
  files that perform `customElements.define()` — without this, Vite's
  tree-shaker drops the element registrations from consumer bundles.
- Added `"peerDependencies"`: `lit ^3.2.0`, `react ^18 || ^19` (optional).
- Added `"files": ["dist", "*.md"]`.
- Added `build`, `build:showcase`, `typecheck` scripts.

### Build config

Split into two Vite configs:

- `vite.config.ts` — dev & showcase build (unchanged, just retargeted
  output to `dist-showcase/`).
- `vite.lib.config.ts` — library build. Uses Vite's `build.lib` mode
  with multi-entry input to preserve the source tree in `dist/`. Uses
  `vite-plugin-dts` for `.d.ts` emission. Externalises `lit`, `react`,
  and `react/jsx-runtime` so consumers don't get duplicate copies.

TS source uses `.js` extensions in relative imports (the modern TS
convention) so emitted `.d.ts` files have valid ESM paths without a
rewrite step.

### React adapter

`src/lib/react-adapter.tsx` exports `createReactAdapter<Props>()` — a
tiny forwardRef'd component that:

- Assigns every declared prop as a *property* on the element (not an
  attribute), via `useLayoutEffect` so the first paint has correct state.
- Wires `sce-*` events to `onFoo` React props via a stable listener
  that reads from a ref, so handler identity can change without
  listener churn.
- Strips handled keys from the passthrough so React doesn't reflect
  them as attributes.

Every component ships a `react.tsx` that's just a `createReactAdapter`
call + the prop interface. No business logic lives in wrappers.

## Tests

Vitest + jsdom, 15 smoke tests covering registration, rendering,
filtering, keyboard navigation, events, empty state, disabled state,
and disabled-option skip. Setup file stubs `ResizeObserver` and
`scrollIntoView` which jsdom lacks.

## Follow-up in Stockroom (not in this repo's scope)

1. Add `"stock-elements": "..."` to `package.json` dependencies.
2. Delete `client/src/vendor/sce-loading-bar/`; switch the two import
   sites to `stock-elements/loading-bar/react`.
3. Add the `:root` theming shim from `THEMING.md` to
   `client/src/index.css`.
4. Replace the shadcn `Select` in `NewPoVendorPicker` with
   `<SceSelectReact options={vendors.map(...)} onChange={...} />`.
5. Sweep for other long-list selects (warehouse pickers, tax-code
   pickers, HTS dropdowns) and migrate opportunistically.
