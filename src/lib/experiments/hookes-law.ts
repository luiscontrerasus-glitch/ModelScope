import type { Measurement, ModelConfig } from '../analysis/types';
export const hookesLaw = {
  id: 'spring-hooke', title: "Spring — Hooke’s Law", independent: { name: 'Extension', symbol: 'x', unit: 'm' }, dependent: { name: 'Force', symbol: 'F', unit: 'N' },
  config: { intercept: false, noiseFloor: 0.04 } satisfies ModelConfig,
  description: 'Illustrative synthetic measurements of a spring under increasing extension. Force stiffens progressively at larger extensions.',
  assumptions: ['Extension is measured from the unloaded length.', 'A constant spring stiffness applies only within an approximately linear elastic regime.', 'Force-zero offset, apparatus effects, and loading history can alter the measurements.'],
};
const noise = [0.01, -0.018, 0.025, -0.012, 0.008, -0.021, 0.014, -0.006, 0.019, -0.017, 0.009, -0.013, 0.022, -0.008, 0.016, -0.019, 0.011, -0.007, 0.018, -0.015, 0.012, -0.01, 0.02, -0.006];
export function springData(kind: 'transition' | 'linear' = 'transition'): Measurement[] {
  return noise.map((e, i) => { const x = (i + 1) * 0.005; return { id: `M${String(i + 1).padStart(2, '0')}`, x: Number(x.toFixed(3)), y: Number((32 * x + e + (kind === 'transition' ? 680 * Math.max(0, x - 0.06) ** 2 : 0)).toFixed(3)) }; });
}
