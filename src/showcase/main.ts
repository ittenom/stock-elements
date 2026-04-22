import './styles.css';
import '../components/loading-bar/loading-bar.js';
import '../components/select/select.js';
import type { SceLoadingBar } from '../components/loading-bar/loading-bar.js';
import type { LoadingBarMode } from '../components/loading-bar/types.js';
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
themeButtons.forEach((b) => {
  b.addEventListener('click', () => applyTheme(b.dataset.theme ?? 'default'));
});
applyTheme('default');
