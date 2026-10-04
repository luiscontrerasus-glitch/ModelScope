import { smallAnglePeriod } from '../analysis/models';
import type { Measurement } from '../analysis/types';
import type { DatasetKind } from './types';

const noise = [0.4, -0.7, 0.9, -0.5, 0.3, -0.8, 0.6, -0.2, 0.7, -0.6, 0.3, -0.5, 0.8, -0.3, 0.6, -0.7, 0.4, -0.3, 0.7, -0.6, 0.5, -0.4, 0.8, -0.2];
function observations(generate: (i: number, noise: number) => [number, number], digits: number): Measurement[] {
  return noise.map((e, i) => { const [x, y] = generate(i, e); return { id: `M${String(i + 1).padStart(2, '0')}`, x: Number(x.toFixed(4)), y: Number(y.toFixed(digits)) }; });
}
// Generation only: T = T0 / AGM(1, cos(theta/2)), equivalent to the
// complete elliptic-integral period. NIST DLMF 19.8.5 and 22.19(i).
export function finiteAmplitudePeriod(angleDegrees: number, length = 1, gravity = 9.80665): number {
  if (!Number.isFinite(angleDegrees) || angleDegrees < 0 || angleDegrees >= 180) throw new Error('Pendulum amplitude must be in [0, 180) degrees.');
  let a = 1; let b = Math.cos(angleDegrees * Math.PI / 360);
  for (let iteration = 0; iteration < 32; iteration++) {
    const nextA = (a + b) / 2; const nextB = Math.sqrt(a * b);
    a = nextA; b = nextB;
    if (Math.abs(a - b) <= 4 * Number.EPSILON * a) return smallAnglePeriod(length, gravity) / a;
  }
  throw new Error('Pendulum period iteration did not converge.');
}
export function pendulumData(kind: DatasetKind): Measurement[] {
  return observations((i, e) => { const x = (i + 1) * (kind === 'transition' ? 2.5 : 0.2); return [x, finiteAmplitudePeriod(x) + 0.002 * e]; }, 5);
}
export function beerLambertData(kind: DatasetKind): Measurement[] {
  // A generic fixed-path calibration; high-concentration compression is illustrative.
  return observations((i, e) => { const x = (i + 1) * 0.04; return [x, 1.2 * x + 0.018 - (kind === 'transition' ? 0.9 * Math.max(0, x - 0.48) ** 2 : 0) + 0.003 * e]; }, 4);
}
export function sensorData(kind: DatasetKind): Measurement[] {
  // Generic load-cell-style response: N input, V output. The high-input slope
  // smoothly compresses, remaining monotone over the demonstration range.
  return observations((i, e) => { const x = (i + 1) * 0.5; return [x, 0.25 * x + 0.1 - (kind === 'transition' ? 0.015 * Math.max(0, x - 5) ** 2 : 0) + 0.006 * e]; }, 4);
}
