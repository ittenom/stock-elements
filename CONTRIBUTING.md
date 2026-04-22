# Contributing to stock-elements

## Conventions that apply to every element

### 1. Data goes on properties, never attributes

HTML attributes are strings. That's fine for a placeholder or a boolean,
but the moment an element takes an array of options or a structured
object, attributes become a liability:

- React 18 stringifies every JSX attribute on an unknown tag (so a
  `disabled={false}` prop arrives as the string `"false"` — truthy).
- Large arrays round-tripped through attributes cost more than a property
  assignment.
- Structured data can't survive `JSON.stringify` without schema churn.

Rule: if a prop can't be cleanly represented as a short string, declare
it with `@property({ attribute: false })` and document it as
"property only" in the component header. The React adapter handles the
rest automatically.

### 2. Every element ships a colocated React wrapper

Alongside `foo.ts` (the custom element), ship `react.tsx` — a React
component generated from `createReactAdapter()` in `src/lib/react-adapter.tsx`.
The adapter wires property assignment via `useLayoutEffect` and event
listeners via `useEffect`, so consumers never have to write
`ref.current.foo = bar` boilerplate.

Keep the React wrapper minimal — it's just the `createReactAdapter`
call plus its prop interface and a re-export of the event types. No
business logic, ever.

### 3. Subpath exports, not a mega-barrel

Add every new element to `package.json`'s `exports` map with two entries:

- `"./foo"` → the custom-element-only import (triggers registration).
- `"./foo/react"` → the React adapter.

The root `.` barrel re-exports everything for prototyping but is marked
non-side-effect-free for the `/foo` entries so bundlers drop unused
elements from production builds.

### 4. CSS theming via documented tokens

Don't hard-code brand colors or typography inside the Shadow DOM. Every
surface color, radius, focus accent, and type choice goes behind a
`--sce-*` custom property with a sensible default. Document the token in
the component's header comment and in `THEMING.md`.

See `THEMING.md` for the full token sheet and the Stockroom shim.

### 5. Viewport-aware positioning for any floating panel

Elements that render popovers, menus, or tooltips must:

- Use `position: fixed` and compute geometry from
  `trigger.getBoundingClientRect()` + `window.innerHeight/Width`.
- Flip to the opposite side of the trigger when there isn't enough space.
- Clamp `max-height` to the available viewport minus a small margin.
- Reposition on `window.resize` and *capture-phase* scroll events.

See `src/components/select/select.ts` for the reference implementation.

### 6. Keyboard model

Every interactive element supports full keyboard operation. The
conventions that match Stockroom:

- `Tab` moves focus in and out normally.
- `Enter` / `Space` activates.
- `Esc` closes popovers and returns focus to the trigger.
- `↑` / `↓` navigate lists; `Home` / `End` jump to ends.
- `Tab` while a popover is open closes it and proceeds with normal focus
  order (don't trap focus unless the element is explicitly a modal).

## Build + test

- `npm run dev` — showcase page at `localhost:5173`.
- `npm run typecheck` — `tsc --noEmit` over everything.
- `npm run build` — library build (ESM + `.d.ts`). Output in `dist/`.
- `npm run build:showcase` — the showcase static site. Output in
  `dist-showcase/`.
- `npm run test` — Vitest smoke tests.

## When adding a new element

1. `src/components/foo/` with `foo.ts`, `types.ts`, `index.ts`, `react.tsx`.
2. Entry in `package.json` `exports` for `./foo` and `./foo/react`.
3. Entry in `sideEffects` for the element's source + dist paths.
4. Entry in `vite.lib.config.ts` `entries` map.
5. Entry in `THEMING.md` for its tokens.
6. Showcase section in `src/showcase/index.html` + `main.ts`.
7. One smoke test in `foo.test.ts`.
