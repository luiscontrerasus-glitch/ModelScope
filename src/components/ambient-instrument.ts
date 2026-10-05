import { finiteAmplitudePeriod } from '@/lib/experiments/generators';

export type MotionKind = 'spring' | 'pendulum' | 'beer' | 'sensor';
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const ease = (x: number) => { const t = clamp(x, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

/** Presentation schedules only; these curves do not calculate scientific evidence. */
export function loadCycle(kind: Exclude<MotionKind, 'pendulum'>, phase: number) {
  const t = ((phase % 1) + 1) % 1;
  if (kind === 'spring') {
    if (t < .42) return ease(t / .42);
    if (t < .55) return 1;
    if (t < .90) return 1 - ease((t - .55) / .35);
    return 0;
  }
  if (kind === 'beer') {
    if (t < .22) return 0;
    if (t < .65) return ease((t - .22) / .43);
    if (t < .78) return 1;
    if (t < .98) return 1 - ease((t - .78) / .20);
    return 0;
  }
  if (t < .18) return 0;
  if (t < .28) return .12 * ease((t - .18) / .10);
  if (t < .52) return .12 + .88 * ease((t - .28) / .24);
  if (t < .63) return 1;
  if (t < .82) return 1 - ease((t - .63) / .19);
  return 0;
}
function loadingPhase(kind: Exclude<MotionKind, 'pendulum'>, value: number) {
  let lo = kind === 'beer' ? .22 : kind === 'sensor' ? .18 : 0;
  let hi = kind === 'beer' ? .65 : kind === 'sensor' ? .52 : .42;
  for (let i = 0; i < 32; i++) { const mid = (lo + hi) / 2; if (loadCycle(kind, mid) < value) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/** Mutable display state: the frame path allocates no geometry, vectors or React state. */
export class AmbientInstrument {
  value: number;
  pose: number;
  private phase: number;
  private amplitudeTarget: number;
  private held = false;
  private idle = 4;
  private sampleTime = 0;
  private version = 0;
  private readonly frames = new Set<() => void>();
  private readonly readings = new Set<() => void>();
  private readonly controls = new Set<(value: number) => void>();
  constructor(readonly kind: MotionKind, readonly min: number, readonly max: number, initial: number) {
    this.value = this.pose = this.amplitudeTarget = initial;
    this.phase = kind === 'pendulum' ? 0 : loadingPhase(kind, (initial - min) / (max - min));
  }
  subscribeFrame = (notify: () => void) => { this.frames.add(notify); return () => { this.frames.delete(notify); }; };
  subscribe = (notify: () => void) => { this.readings.add(notify); return () => { this.readings.delete(notify); }; };
  snapshot = () => this.version;
  flush = () => this.publish(true);
  subscribeControl = (notify: (value: number) => void) => { this.controls.add(notify); return () => { this.controls.delete(notify); }; };
  private publish(immediate = false) {
    this.frames.forEach(f => f());
    if (immediate || this.sampleTime >= 1 / 12) {
      this.sampleTime = 0; this.version++; this.readings.forEach(f => f());
    }
  }
  begin = () => { this.held = true; this.idle = 0; };
  end = () => { this.held = false; this.idle = 0; };
  manual = (next: number) => {
    this.value = clamp(next, this.min, this.max); this.pose = this.value; this.idle = 0;
    if (this.kind !== 'pendulum') this.phase = loadingPhase(this.kind, (this.value - this.min) / (this.max - this.min));
    this.controls.forEach(f => f(this.value));
    this.publish(true);
  };
  amplitude = (next: number, animate: boolean) => {
    this.amplitudeTarget = clamp(next, this.min, this.max);
    this.controls.forEach(f => f(this.amplitudeTarget));
    if (!animate) { this.value = this.amplitudeTarget; this.pose = this.value * Math.cos(this.phase); }
    this.publish(true);
  };
  dragPose = (next: number) => {
    this.pose = clamp(next, -this.max, this.max);
    this.value = this.amplitudeTarget = Math.abs(this.pose);
    this.controls.forEach(f => f(this.value));
    this.phase = this.pose < 0 ? Math.PI : 0; this.idle = 0; this.publish(true);
  };
  advance(seconds: number) {
    // Discard suspended-frame elapsed time. Lifecycle resume also starts with a zero delta.
    const dt = clamp(seconds, 0, .05); this.sampleTime += dt;
    if (this.kind === 'pendulum') {
      this.value += (this.amplitudeTarget - this.value) * -Math.expm1(-5 * dt);
      if (!this.held && this.idle >= 4) {
        this.phase = (this.phase + dt * Math.PI * 2 / finiteAmplitudePeriod(this.value)) % (Math.PI * 2);
        this.pose = this.value * Math.cos(this.phase);
      }
    } else if (!this.held && this.idle >= 4) {
      const duration = this.kind === 'spring' ? 14 : this.kind === 'beer' ? 22 : 16;
      this.phase = (this.phase + dt / duration) % 1;
      const target = this.min + (this.max - this.min) * loadCycle(this.kind, this.phase);
      this.value += (target - this.value) * -Math.expm1(-9 * dt); this.pose = this.value;
    }
    if (!this.held) this.idle = Math.min(4, this.idle + dt);
    this.publish();
  }
}
