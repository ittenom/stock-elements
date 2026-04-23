import './styles.css';
import '../components/loading-bar/loading-bar.js';
import '../components/loading-grid/loading-grid.js';
import '../components/select/select.js';
import type { SceLoadingBar } from '../components/loading-bar/loading-bar.js';
import type { LoadingBarMode } from '../components/loading-bar/types.js';
import type { SceLoadingGrid } from '../components/loading-grid/loading-grid.js';
import type { LoadingGridMode } from '../components/loading-grid/types.js';
import type { SceSelect } from '../components/select/select.js';
import type {
  SceSelectChangeDetail,
  SceSelectOption,
} from '../components/select/types.js';

// ===================================================================
//  Loading Bar demo
// ===================================================================

interface State {
  mode: LoadingBarMode;
  randomness: number;
  speed: number;
  heading: string;
  caption: string;
  progress: number;
  fakeMode: boolean;
}

const state: State = {
  mode: 'HORIZON',
  randomness: 0.3,
  speed: 1,
  heading: 'Loading',
  caption: 'Please wait',
  progress: 0,
  fakeMode: false,
};

let pollTimer: number | null = null;

// Re-assigned once the code-sample blocks are wired up (end of file).
// Declared here so `applyBar` / `applyGrid` can call it unconditionally
// even before the samples have been wired.
let refreshSamples: () => void = () => {};

const bar = document.getElementById('bar') as SceLoadingBar;
const modeEl = document.getElementById('mode') as HTMLSelectElement;
const randomnessEl = document.getElementById('randomness') as HTMLInputElement;
const speedEl = document.getElementById('speed') as HTMLInputElement;
const progressEl = document.getElementById('progress') as HTMLInputElement;
const headingEl = document.getElementById('heading') as HTMLInputElement;
const captionEl = document.getElementById('caption') as HTMLInputElement;
const runTestBtn = document.getElementById('runTest')!;
const toggleFakeBtn = document.getElementById('toggleFake')!;
const resetBtn = document.getElementById('reset')!;
const statusEl = document.getElementById('status')!;
const randomnessVal = document.getElementById('randomnessVal')!;
const speedVal = document.getElementById('speedVal')!;
const progressVal = document.getElementById('progressVal')!;

function applyBar(): void {
  bar.mode = state.mode;
  bar.randomness = state.randomness;
  bar.speed = state.speed;
  bar.heading = state.heading || undefined;
  bar.caption = state.caption || undefined;
  bar.progress = state.progress;
  bar.fakeMode = state.fakeMode;
  randomnessVal.textContent = state.randomness.toFixed(2);
  speedVal.textContent = state.speed.toFixed(2);
  progressVal.textContent = String(state.progress);
  progressEl.value = String(state.progress);
  toggleFakeBtn.textContent = state.fakeMode ? 'Stop fake mode' : 'Toggle fake mode';
  refreshSamples();
}

function stopPolling(): void {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
    statusEl.textContent = '';
  }
}

modeEl.addEventListener('change', () => {
  state.mode = modeEl.value as LoadingBarMode;
  applyBar();
});
randomnessEl.addEventListener('input', () => {
  state.randomness = parseFloat(randomnessEl.value);
  applyBar();
});
speedEl.addEventListener('input', () => {
  state.speed = parseFloat(speedEl.value);
  applyBar();
});
progressEl.addEventListener('input', () => {
  stopPolling();
  state.progress = parseInt(progressEl.value, 10);
  applyBar();
});
headingEl.addEventListener('input', () => {
  state.heading = headingEl.value;
  applyBar();
});
captionEl.addEventListener('input', () => {
  state.caption = captionEl.value;
  applyBar();
});

runTestBtn.addEventListener('click', () => {
  stopPolling();
  state.fakeMode = false;
  state.progress = 0;
  applyBar();
  const startedAt = Date.now();
  statusEl.textContent = 'Polling every 500ms for 20s…';
  pollTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const pct = Math.min(100, Math.round((elapsed / 20_000) * 100));
    state.progress = pct;
    applyBar();
    if (pct >= 100) {
      stopPolling();
      statusEl.textContent = 'Done.';
    }
  }, 500);
});

toggleFakeBtn.addEventListener('click', () => {
  stopPolling();
  state.fakeMode = !state.fakeMode;
  applyBar();
});

resetBtn.addEventListener('click', () => {
  stopPolling();
  state.progress = 0;
  state.fakeMode = false;
  applyBar();
});

applyBar();

// ===================================================================
//  Loading Grid demo
// ===================================================================

interface GridState {
  mode: LoadingGridMode;
  randomness: number;
  speed: number;
  progress: number;
  fakeMode: boolean;
  width: number;
  height: number;
  cellSize: number;
  cellAspect: number;
}

const gridState: GridState = {
  mode: 'HORIZON',
  randomness: 0.3,
  speed: 1,
  progress: 0,
  fakeMode: false,
  width: 288,
  height: 288,
  cellSize: 20,
  cellAspect: 0.6,
};

let gridPollTimer: number | null = null;

const gridPreview = document.getElementById('grid-preview') as SceLoadingGrid;
const gridSizer = document.getElementById('gridSizer') as HTMLElement;

const gridModeEl = document.getElementById('gridMode') as HTMLSelectElement;
const gridRandomnessEl = document.getElementById('gridRandomness') as HTMLInputElement;
const gridSpeedEl = document.getElementById('gridSpeed') as HTMLInputElement;
const gridProgressEl = document.getElementById('gridProgress') as HTMLInputElement;
const gridWidthEl = document.getElementById('gridWidth') as HTMLInputElement;
const gridHeightEl = document.getElementById('gridHeight') as HTMLInputElement;
const gridCellSizeEl = document.getElementById('gridCellSize') as HTMLInputElement;
const gridCellAspectEl = document.getElementById('gridCellAspect') as HTMLInputElement;
const gridRunTestBtn = document.getElementById('gridRunTest')!;
const gridToggleFakeBtn = document.getElementById('gridToggleFake')!;
const gridResetBtn = document.getElementById('gridReset')!;
const gridStatusEl = document.getElementById('gridStatus')!;
const gridRandomnessVal = document.getElementById('gridRandomnessVal')!;
const gridSpeedVal = document.getElementById('gridSpeedVal')!;
const gridProgressVal = document.getElementById('gridProgressVal')!;
const gridWidthVal = document.getElementById('gridWidthVal')!;
const gridHeightVal = document.getElementById('gridHeightVal')!;
const gridCellSizeVal = document.getElementById('gridCellSizeVal')!;
const gridCellAspectVal = document.getElementById('gridCellAspectVal')!;

function applyGrid(): void {
  gridPreview.mode = gridState.mode;
  gridPreview.randomness = gridState.randomness;
  gridPreview.speed = gridState.speed;
  gridPreview.progress = gridState.progress;
  gridPreview.fakeMode = gridState.fakeMode;
  gridPreview.cellSize = gridState.cellSize;
  gridPreview.cellAspect = gridState.cellAspect;

  gridSizer.style.width = `${gridState.width}px`;
  gridSizer.style.height = `${gridState.height}px`;

  gridRandomnessVal.textContent = gridState.randomness.toFixed(2);
  gridSpeedVal.textContent = gridState.speed.toFixed(2);
  gridProgressVal.textContent = String(gridState.progress);
  gridProgressEl.value = String(gridState.progress);
  gridWidthVal.textContent = `${gridState.width}px`;
  gridHeightVal.textContent = `${gridState.height}px`;
  gridCellSizeVal.textContent = `${gridState.cellSize}px`;
  gridCellAspectVal.textContent = gridState.cellAspect.toFixed(2);
  gridToggleFakeBtn.textContent = gridState.fakeMode
    ? 'Stop fake mode'
    : 'Toggle fake mode';
  refreshSamples();
}

function stopGridPolling(): void {
  if (gridPollTimer !== null) {
    clearInterval(gridPollTimer);
    gridPollTimer = null;
    gridStatusEl.textContent = '';
  }
}

gridModeEl.addEventListener('change', () => {
  gridState.mode = gridModeEl.value as LoadingGridMode;
  applyGrid();
});
gridRandomnessEl.addEventListener('input', () => {
  gridState.randomness = parseFloat(gridRandomnessEl.value);
  applyGrid();
});
gridSpeedEl.addEventListener('input', () => {
  gridState.speed = parseFloat(gridSpeedEl.value);
  applyGrid();
});
gridProgressEl.addEventListener('input', () => {
  stopGridPolling();
  gridState.progress = parseInt(gridProgressEl.value, 10);
  applyGrid();
});
gridWidthEl.addEventListener('input', () => {
  gridState.width = parseInt(gridWidthEl.value, 10);
  applyGrid();
});
gridHeightEl.addEventListener('input', () => {
  gridState.height = parseInt(gridHeightEl.value, 10);
  applyGrid();
});
gridCellSizeEl.addEventListener('input', () => {
  gridState.cellSize = parseInt(gridCellSizeEl.value, 10);
  applyGrid();
});
gridCellAspectEl.addEventListener('input', () => {
  gridState.cellAspect = parseFloat(gridCellAspectEl.value);
  applyGrid();
});

gridRunTestBtn.addEventListener('click', () => {
  stopGridPolling();
  gridState.fakeMode = false;
  gridState.progress = 0;
  applyGrid();
  const startedAt = Date.now();
  gridStatusEl.textContent = 'Polling every 500ms for 20s…';
  gridPollTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const pct = Math.min(100, Math.round((elapsed / 20_000) * 100));
    gridState.progress = pct;
    applyGrid();
    if (pct >= 100) {
      stopGridPolling();
      gridStatusEl.textContent = 'Done.';
    }
  }, 500);
});

gridToggleFakeBtn.addEventListener('click', () => {
  stopGridPolling();
  gridState.fakeMode = !gridState.fakeMode;
  applyGrid();
});

gridResetBtn.addEventListener('click', () => {
  stopGridPolling();
  gridState.progress = 0;
  gridState.fakeMode = false;
  applyGrid();
});

applyGrid();

// ===================================================================
//  Select demo
// ===================================================================

/**
 * Generate a realistic-looking vendor list so the dropdown exercises a
 * busy real-world scale (and hits the viewport-clamping path on most
 * screens).
 */
function buildVendors(count: number): SceSelectOption[] {
  const roots = [
    'Pacific',
    'Northgate',
    'Riverbend',
    'Summit',
    'Harbor',
    'Meridian',
    'Cascade',
    'Ironworks',
    'Sapling',
    'Freighthouse',
    'Blue Spruce',
    'Lantern',
    'Keystone',
    'Windward',
    'Drydock',
  ];
  const suffixes = [
    'Supply Co.',
    'Industries',
    'Trading',
    'Partners',
    'Mercantile',
    'Holdings',
    'Import / Export',
    'Works',
    'Logistics',
  ];
  const cities = [
    'Seattle, WA',
    'Portland, OR',
    'Oakland, CA',
    'Denver, CO',
    'Austin, TX',
    'Nashville, TN',
    'Pittsburgh, PA',
    'Brooklyn, NY',
    'Providence, RI',
    'Burlington, VT',
  ];
  const vendors: SceSelectOption[] = [];
  for (let i = 0; i < count; i++) {
    const root = roots[i % roots.length];
    const suffix = suffixes[(i * 3) % suffixes.length];
    const city = cities[(i * 7) % cities.length];
    vendors.push({
      value: `vendor-${i.toString().padStart(3, '0')}`,
      label: `${root} ${suffix}`,
      description: city,
      keywords: `${root} ${city}`,
    });
  }
  // Sort so the list feels alphabetical like a real address book.
  vendors.sort((a, b) => a.label.localeCompare(b.label));
  return vendors;
}

const vendorSelect = document.getElementById('vendorSelect') as SceSelect;
const vendorEcho = document.getElementById('vendorEcho')!;
const createDraftBtn = document.getElementById('createDraft') as HTMLButtonElement;

vendorSelect.options = buildVendors(75);
vendorSelect.addEventListener('sce-change', (ev) => {
  const detail = (ev as CustomEvent<SceSelectChangeDetail>).detail;
  if (detail.option) {
    vendorEcho.textContent = `Selected: ${detail.option.label} · ${detail.option.description ?? ''} (${detail.value})`;
    createDraftBtn.disabled = false;
  } else {
    vendorEcho.textContent = 'No vendor selected.';
    createDraftBtn.disabled = true;
  }
  selectedVendorLabel = detail.option?.label ?? null;
  refreshSamples();
});

const smallSelect = document.getElementById('smallSelect') as SceSelect;
smallSelect.options = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed', label: 'Closed', disabled: true },
];

const disabledSelect = document.getElementById('disabledSelect') as SceSelect;
disabledSelect.options = [{ value: 'a', label: 'Unreachable' }];

const noSearchSelect = document.getElementById('noSearchSelect') as SceSelect;
noSearchSelect.searchable = false;
noSearchSelect.options = [
  { value: 'wh-main', label: 'Main warehouse', description: 'Bldg A' },
  { value: 'wh-annex', label: 'Annex', description: 'Bldg B' },
  { value: 'wh-overflow', label: 'Overflow', description: 'Offsite' },
];

// Theme swatch: swap the CSS class on every demo select at once.
const themeButtons = document.querySelectorAll<HTMLButtonElement>('.theme-btn');
const demoSelects = document.querySelectorAll<HTMLElement>('sce-select');
const themeClassMap: Record<string, string> = {
  default: 'sce-demo-light',
  stockroom: 'sce-demo-stockroom',
  dark: 'sce-demo-dark',
};
function applyTheme(theme: string): void {
  const cls = themeClassMap[theme] ?? 'sce-demo-light';
  demoSelects.forEach((el) => {
    Object.values(themeClassMap).forEach((c) => el.classList.remove(c));
    el.classList.add(cls);
  });
  themeButtons.forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.theme === theme ? 'true' : 'false');
  });
}
// Track theme + selected vendor so the code-sample block below can
// reflect them live. Nothing in the demo needed these before.
let currentTheme = 'default';
let selectedVendorLabel: string | null = null;

themeButtons.forEach((b) => {
  b.addEventListener('click', () => {
    currentTheme = b.dataset.theme ?? 'default';
    applyTheme(currentTheme);
    refreshSamples();
  });
});
applyTheme('default');

// ===================================================================
//  Code-sample blocks
// ===================================================================
//
// Each showcase section has a <div class="code-sample"> at its bottom.
// The blocks tab between Vanilla TS and React and expose a Copy button.
// Snippet content reflects the current knob state so users can paste
// the exact config they dialed in.

type SnippetFlavor = 'vanilla' | 'react';

interface CodeSampleEls {
  root: HTMLElement;
  code: HTMLElement;
  copyBtn: HTMLButtonElement;
  tabs: NodeListOf<HTMLButtonElement>;
  build: (flavor: SnippetFlavor) => string;
}

/** Escape a string for single-quoted TS output. */
function sq(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Escape a string for JSX double-quoted attribute output. */
function dq(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '&quot;');
}

/**
 * Format a record of attrs/props for inclusion in JSX. Omits undefined
 * values. Strings use double quotes; everything else goes inside braces.
 */
function jsxProps(props: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined) continue;
    if (typeof v === 'string') {
      parts.push(`${k}="${dq(v)}"`);
    } else if (typeof v === 'boolean') {
      if (v) parts.push(k);
    } else {
      parts.push(`${k}={${v}}`);
    }
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

// ---------- Loading Bar ----------

function barSnippet(flavor: SnippetFlavor): string {
  // Only emit non-default props so the sample stays minimal.
  const props: Record<string, unknown> = {};
  if (state.mode !== 'HORIZON') props.mode = state.mode;
  if (state.randomness !== 0.3) props.randomness = state.randomness;
  if (state.speed !== 1) props.speed = state.speed;
  if (state.heading) props.heading = state.heading;
  if (state.caption) props.caption = state.caption;
  if (state.fakeMode) props.fakeMode = true;
  else if (state.progress > 0) props.progress = state.progress;

  if (flavor === 'react') {
    return [
      `import { SceLoadingBarReact } from 'stock-elements/loading-bar/react';`,
      ``,
      `export function Example() {`,
      `  return <SceLoadingBarReact${jsxProps(props)} />;`,
      `}`,
    ].join('\n');
  }

  // Vanilla TS. Emit only the props that differ from defaults.
  const assigns: string[] = [];
  if (props.mode) assigns.push(`el.mode = '${props.mode}';`);
  if (props.randomness !== undefined)
    assigns.push(`el.randomness = ${props.randomness};`);
  if (props.speed !== undefined) assigns.push(`el.speed = ${props.speed};`);
  if (props.heading)
    assigns.push(`el.heading = '${sq(String(props.heading))}';`);
  if (props.caption)
    assigns.push(`el.caption = '${sq(String(props.caption))}';`);
  if (props.fakeMode) assigns.push(`el.fakeMode = true;`);
  else if (props.progress !== undefined)
    assigns.push(`el.progress = ${props.progress};`);

  const body = assigns.length
    ? `const el = document.createElement('sce-loading-bar');\n${assigns.join('\n')}\ndocument.body.append(el);`
    : `const el = document.createElement('sce-loading-bar');\ndocument.body.append(el);`;

  return [
    `import 'stock-elements/loading-bar';`,
    ``,
    body,
  ].join('\n');
}

// ---------- Loading Grid ----------

function gridSnippet(flavor: SnippetFlavor): string {
  const props: Record<string, unknown> = {};
  if (gridState.mode !== 'HORIZON') props.mode = gridState.mode;
  if (gridState.randomness !== 0.3) props.randomness = gridState.randomness;
  if (gridState.speed !== 1) props.speed = gridState.speed;
  if (gridState.cellSize !== 20) props.cellSize = gridState.cellSize;
  if (gridState.cellAspect !== 0.6)
    props.cellAspect = Number(gridState.cellAspect.toFixed(2));
  if (gridState.fakeMode) props.fakeMode = true;
  else if (gridState.progress > 0) props.progress = gridState.progress;

  // The container dimensions aren't component props — they're layout.
  // Surface them as a wrapping div / style so the snippet actually
  // reproduces the on-screen result.
  const w = gridState.width;
  const h = gridState.height;

  if (flavor === 'react') {
    return [
      `import { SceLoadingGridReact } from 'stock-elements/loading-grid/react';`,
      ``,
      `export function Example() {`,
      `  return (`,
      `    <div style={{ width: ${w}, height: ${h} }}>`,
      `      <SceLoadingGridReact${jsxProps(props)}`,
      `        style={{ width: '100%', height: '100%' }}`,
      `      />`,
      `    </div>`,
      `  );`,
      `}`,
    ].join('\n');
  }

  const assigns: string[] = [];
  if (props.mode) assigns.push(`el.mode = '${props.mode}';`);
  if (props.randomness !== undefined)
    assigns.push(`el.randomness = ${props.randomness};`);
  if (props.speed !== undefined) assigns.push(`el.speed = ${props.speed};`);
  if (props.cellSize !== undefined)
    assigns.push(`el.cellSize = ${props.cellSize};`);
  if (props.cellAspect !== undefined)
    assigns.push(`el.cellAspect = ${props.cellAspect};`);
  if (props.fakeMode) assigns.push(`el.fakeMode = true;`);
  else if (props.progress !== undefined)
    assigns.push(`el.progress = ${props.progress};`);

  return [
    `import 'stock-elements/loading-grid';`,
    ``,
    `const wrap = document.createElement('div');`,
    `wrap.style.width = '${w}px';`,
    `wrap.style.height = '${h}px';`,
    ``,
    `const el = document.createElement('sce-loading-grid');`,
    `el.style.width = '100%';`,
    `el.style.height = '100%';`,
    ...assigns,
    ``,
    `wrap.append(el);`,
    `document.body.append(wrap);`,
  ].join('\n');
}

// ---------- Select ----------

function selectSnippet(flavor: SnippetFlavor): string {
  const themeClass = themeClassMap[currentTheme] ?? 'sce-demo-light';
  const placeholder = 'Select vendor…';
  const searchPlaceholder = 'Search vendors…';
  const emptyText = 'No vendors match';

  // Small, illustrative options list so the snippet is self-contained
  // without dumping 75 vendors into the pre. Comment hints at the
  // real-world case.
  const optionsLiteral = [
    `const vendors: SceSelectOption[] = [`,
    `  { value: 'pacific-supply', label: 'Pacific Supply Co.', description: 'Seattle, WA' },`,
    `  { value: 'summit-works',   label: 'Summit Works',       description: 'Denver, CO' },`,
    `  { value: 'harbor-trading', label: 'Harbor Trading',     description: 'Oakland, CA' },`,
    `  // …more vendors`,
    `];`,
  ].join('\n');

  if (flavor === 'react') {
    const selectedComment = selectedVendorLabel
      ? `  // Current selection: ${selectedVendorLabel}\n`
      : '';
    return [
      `import { useState } from 'react';`,
      `import {`,
      `  SceSelectReact,`,
      `  type SceSelectOption,`,
      `} from 'stock-elements/select/react';`,
      ``,
      optionsLiteral,
      ``,
      `export function VendorPicker() {`,
      `  const [value, setValue] = useState<string | null>(null);`,
      selectedComment +
        `  return (`,
      `    <SceSelectReact`,
      `      className="${themeClass}"`,
      `      options={vendors}`,
      `      value={value}`,
      `      placeholder="${placeholder}"`,
      `      searchPlaceholder="${searchPlaceholder}"`,
      `      emptyText="${emptyText}"`,
      `      onChange={(e) => setValue(e.detail.value)}`,
      `    />`,
      `  );`,
      `}`,
    ].join('\n');
  }

  const selectedComment = selectedVendorLabel
    ? `// Current selection: ${selectedVendorLabel}\n`
    : '';
  return [
    `import 'stock-elements/select';`,
    `import type {`,
    `  SceSelect,`,
    `  SceSelectOption,`,
    `  SceSelectChangeDetail,`,
    `} from 'stock-elements/select';`,
    ``,
    optionsLiteral,
    ``,
    `const el = document.createElement('sce-select') as SceSelect;`,
    `el.classList.add('${themeClass}');`,
    `el.placeholder = '${placeholder}';`,
    `el.searchPlaceholder = '${searchPlaceholder}';`,
    `el.emptyText = '${emptyText}';`,
    `el.options = vendors;`,
    ``,
    selectedComment +
      `el.addEventListener('sce-change', (ev) => {`,
    `  const { value, option } = (ev as CustomEvent<SceSelectChangeDetail>).detail;`,
    `  console.log('picked', value, option?.label);`,
    `});`,
    ``,
    `document.body.append(el);`,
  ].join('\n');
}

// ---------- Sample wiring ----------

function wireCodeSample(
  id: string,
  build: (flavor: SnippetFlavor) => string,
): CodeSampleEls | null {
  const code = document.getElementById(id);
  if (!code) return null;
  const root = code.closest('.code-sample') as HTMLElement | null;
  if (!root) return null;
  const copyBtn = root.querySelector<HTMLButtonElement>('.code-sample-copy')!;
  const tabs = root.querySelectorAll<HTMLButtonElement>('.code-sample-tab');

  const els: CodeSampleEls = { root, code, copyBtn, tabs, build };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const flavor = (tab.dataset.tab ?? 'vanilla') as SnippetFlavor;
      root.dataset.tab = flavor;
      tabs.forEach((t) => {
        t.setAttribute('aria-pressed', t === tab ? 'true' : 'false');
      });
      renderSample(els);
    });
  });

  copyBtn.addEventListener('click', async () => {
    const text = code.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.dataset.state = 'copied';
      copyBtn.textContent = 'Copied';
      window.setTimeout(() => {
        delete copyBtn.dataset.state;
        copyBtn.textContent = 'Copy';
      }, 1500);
    } catch {
      // Clipboard API may be unavailable (insecure context, etc.).
      // Fall back to a silent select-all so the user can ⌘C manually.
      const range = document.createRange();
      range.selectNodeContents(code);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  });

  return els;
}

function renderSample(els: CodeSampleEls): void {
  const flavor = (els.root.dataset.tab ?? 'vanilla') as SnippetFlavor;
  els.code.textContent = els.build(flavor);
}

const sampleEls: CodeSampleEls[] = [
  wireCodeSample('bar-code', barSnippet),
  wireCodeSample('grid-code', gridSnippet),
  wireCodeSample('select-code', selectSnippet),
].filter((x): x is CodeSampleEls => x !== null);

// Assigned below. `applyBar` / `applyGrid` call it every time state
// mutates so the snippet block tracks the knobs live.
refreshSamples = () => {
  for (const els of sampleEls) renderSample(els);
};

// Now that the hook is real, do the initial render.
refreshSamples();
