# stock-elements

Framework-agnostic web components for the Stockroom family. Built on
Lit 3, published as ESM with TypeScript declarations, and ships a
colocated React adapter for every element.

## Elements

| Tag | Purpose |
|---|---|
| `<sce-loading-bar>` | Terminal-style animated progress indicator with three baked-in themes. |
| `<sce-loading-grid>` | 2D sibling of the loading bar for square or tall slots — same themes, same rules, auto-fits cells on both axes. Drops in where a spinner would go. |
| `<sce-select>` | Searchable single-select combobox that clamps its panel to the viewport (unlike native `<select>` and Radix Select, which overflow off-screen with long lists). |

See the showcase (`npm run dev`) for live demos of every element.

## Install

```sh
npm install stock-elements
```

`lit` is a peer dependency. `react` is an optional peer (only needed if
you import a `/react` subpath).

## Consume

**Vanilla:**

```ts
import 'stock-elements/select';

const el = document.querySelector('sce-select');
el.options = vendors.map(v => ({
  value: v.id,
  label: v.name,
  description: v.city,
}));
el.addEventListener('sce-change', (e) => {
  console.log('picked', e.detail.value);
});
```

**React:**

```tsx
import { SceSelectReact } from 'stock-elements/select/react';

<SceSelectReact
  options={vendors.map(v => ({ value: v.id, label: v.name }))}
  value={pickedId}
  onChange={e => setPickedId(e.detail.value)}
  placeholder="Select vendor…"
/>
```

## Theming

See [THEMING.md](./THEMING.md). Every element exposes a `--sce-*` CSS
custom property contract that inherits, so a single mapping at the
consumer's `:root` dresses every dropped-in element at once.

## Development

```sh
npm install
npm run dev              # showcase at localhost:5173
npm run typecheck
npm run build            # library build → dist/
npm run build:showcase   # static site → dist-showcase/
npm run test
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for per-element conventions.
