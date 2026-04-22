# Theming stock-elements

Every element in the catalog keeps its internals in Shadow DOM, so Tailwind
classes, global CSS, and parent stylesheets cannot reach into them. To
restyle an element you set **CSS custom properties** on the host (or any
ancestor — custom properties inherit).

This means Stockroom (or any other consumer) can map its design tokens
onto the `--sce-*` contract **once** and every element that gets dropped
in inherits the right look without a per-site override.

## The one-time Stockroom shim

Add this to `client/src/index.css` (or equivalent) so every `<sce-*>`
element picks up Stockroom's tokens automatically:

```css
:root {
  /* Surfaces */
  --sce-bg: hsl(var(--background));
  --sce-fg: hsl(var(--foreground));
  --sce-muted: hsl(var(--muted-foreground));
  --sce-border: hsl(var(--border));
  --sce-border-strong: hsl(var(--input));

  /* Green focus identity (the signature interaction signal) */
  --sce-accent: theme(colors.green.500);
  --sce-accent-ring: theme(colors.green.500 / 20%);
  --sce-highlight-bg: theme(colors.green.500 / 12%);
  --sce-highlight-fg: hsl(var(--foreground));

  /* Data type */
  --sce-font: var(--font-sans);
  --sce-font-data: var(--font-data);

  /* Radii to match shadcn */
  --sce-radius: 0.375rem;        /* rounded-md */
  --sce-radius-panel: 0.5rem;    /* rounded-lg */
}
```

Dark mode is a matter of the wrapping variables already flipping —
nothing in the shim needs to change.

## Contract reference

The tokens each component supports are listed below. An element ignores
tokens it doesn't care about, so there's no cost to setting the full
sheet at `:root` and forgetting it.

### `<sce-select>`

| Token | Default | Purpose |
|---|---|---|
| `--sce-bg` | `#ffffff` | Trigger and panel surface. |
| `--sce-fg` | `#0f172a` | Primary text color. |
| `--sce-muted` | `#64748b` | Placeholder, descriptions, footer. |
| `--sce-border` | `#e2e8f0` | Panel outline, row dividers. |
| `--sce-border-strong` | `#cbd5e1` | Trigger outline, scrollbar thumb. |
| `--sce-accent` | `#10b981` | Focus ring, checkmark, active hover. |
| `--sce-accent-ring` | `rgba(16,185,129,.22)` | 3px ring around focused trigger. |
| `--sce-highlight-bg` | `rgba(16,185,129,.12)` | Active-row background. |
| `--sce-highlight-fg` | `#0f172a` | Active-row text color. |
| `--sce-disabled-fg` | `#94a3b8` | Disabled row text. |
| `--sce-radius` | `0.375rem` | Trigger + option-row radius. |
| `--sce-radius-panel` | `0.5rem` | Panel radius. |
| `--sce-font` | system sans | Labels, empty state, footer. |
| `--sce-font-data` | system mono | Trigger value + option labels. |
| `--sce-row-height` | `2.125rem` | Option row height. |
| `--sce-shadow-panel` | soft slate | Panel drop shadow. |
| `--sce-panel-z` | `9999` | Panel stacking context. |

### `<sce-loading-bar>`

| Token | Default | Purpose |
|---|---|---|
| `--sce-primary` | `#7dd3fc` | Filled-block color (HORIZON mode). |
| `--sce-dim-opacity` | `0.2` | Unfilled-block opacity. |
| `--sce-pulse-min` / `--sce-pulse-max` | `0.15` / `0.35` | Horizon pulse bounds. |
| `--sce-speed` | `1` | Multiplier reflected from `speed` prop; settable directly too. |
| `--sce-flourish-color` | mode-dependent | Completion flourish color. |

## Shadow parts

Where the default CSS surface isn't enough, every element exposes named
`::part()` hooks so consumers can reach specific internals with full CSS
(not just custom properties):

| Element | Parts |
|---|---|
| `<sce-select>` | `trigger`, `panel`, `search`, `list`, `footer` |

Example:

```css
sce-select::part(trigger) {
  font-weight: 600;
}
```

Use custom properties first; reach for `::part()` only when you need
something the token contract doesn't cover.

## When to add a new token

Don't invent tokens speculatively. The rule of thumb: if two valid
consumer themes would want different values for the same internal style,
that style belongs behind a `--sce-*` token. If every consumer would
want the same value, hard-code it.
