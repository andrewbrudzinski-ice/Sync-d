let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

function beep(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
  startDelay = 0
): void {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.setValueAtTime(gainValue, ac.currentTime + startDelay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startDelay + duration);
    osc.start(ac.currentTime + startDelay);
    osc.stop(ac.currentTime + startDelay + duration);
  } catch {
    // audio not available
  }
}

export const sounds = {
  countdown(n: number) {
    if (n === 0) {
      // GO!
      beep(880, 0.15, 'square', 0.4);
      beep(1100, 0.25, 'square', 0.4, 0.1);
    } else {
      beep(440, 0.12, 'square', 0.25);
    }
  },

  match() {
    // Happy ascending arpeggio
    beep(523, 0.12, 'square', 0.35, 0);
    beep(659, 0.12, 'square', 0.35, 0.1);
    beep(784, 0.12, 'square', 0.35, 0.2);
    beep(1047, 0.25, 'square', 0.4, 0.3);
  },

  noMatch() {
    // Descending sad notes
    beep(330, 0.15, 'sawtooth', 0.3, 0);
    beep(262, 0.25, 'sawtooth', 0.3, 0.12);
  },

  click() {
    beep(800, 0.05, 'square', 0.15);
  },

  win() {
    // Victory fanfare
    beep(523, 0.1, 'square', 0.4, 0);
    beep(659, 0.1, 'square', 0.4, 0.1);
    beep(784, 0.1, 'square', 0.4, 0.2);
    beep(1047, 0.1, 'square', 0.4, 0.3);
    beep(784, 0.1, 'square', 0.35, 0.4);
    beep(1047, 0.3, 'square', 0.4, 0.5);
  },

  transition() {
    beep(600, 0.08, 'sine', 0.2);
  },

  streak() {
    beep(880, 0.08, 'square', 0.3, 0);
    beep(1100, 0.08, 'square', 0.3, 0.08);
    beep(1320, 0.15, 'square', 0.35, 0.16);
  },
};

export function vibrate(pattern: number | number[]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}
