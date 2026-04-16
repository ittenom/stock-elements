import './styles.css';
import '../components/loading-bar/loading-bar.ts';
import type { SceLoadingBar } from '../components/loading-bar/loading-bar.ts';
import type { LoadingBarMode } from '../components/loading-bar/types.ts';

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

function apply(): void {
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
  apply();
});
randomnessEl.addEventListener('input', () => {
  state.randomness = parseFloat(randomnessEl.value);
  apply();
});
speedEl.addEventListener('input', () => {
  state.speed = parseFloat(speedEl.value);
  apply();
});
progressEl.addEventListener('input', () => {
  stopPolling();
  state.progress = parseInt(progressEl.value, 10);
  apply();
});
headingEl.addEventListener('input', () => {
  state.heading = headingEl.value;
  apply();
});
captionEl.addEventListener('input', () => {
  state.caption = captionEl.value;
  apply();
});

runTestBtn.addEventListener('click', () => {
  stopPolling();
  state.fakeMode = false;
  state.progress = 0;
  apply();
  const startedAt = Date.now();
  statusEl.textContent = 'Polling every 500ms for 20s…';
  pollTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const pct = Math.min(100, Math.round((elapsed / 20_000) * 100));
    state.progress = pct;
    apply();
    if (pct >= 100) {
      stopPolling();
      statusEl.textContent = 'Done.';
    }
  }, 500);
});

toggleFakeBtn.addEventListener('click', () => {
  stopPolling();
  state.fakeMode = !state.fakeMode;
  apply();
});

resetBtn.addEventListener('click', () => {
  stopPolling();
  state.progress = 0;
  state.fakeMode = false;
  apply();
});

apply();
