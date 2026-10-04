import { leastSquares, linearRegression } from './regression';
import { metrics } from './statistics';
import type { Fit, Measurement, ModelConfig } from './types';

export function smallAnglePeriod(length: number, gravity: number): number {
  if (![length, gravity].every(v => Number.isFinite(v) && v > 0)) throw new Error('Pendulum length and gravity must be positive finite values.');
  const period = 2 * Math.PI * Math.sqrt(length / gravity);
  if (!Number.isFinite(period) || period <= 0) throw new Error('Pendulum parameters exceed the numerical range.');
  return period;
}
export function baselineParameterCount(config: ModelConfig): number {
  return config.baseline ? 0 : config.intercept ? 2 : 1;
}
export function fitBaseline(rows: Measurement[], config: ModelConfig): Fit {
  if (!config.baseline) return linearRegression(rows, config.intercept);
  const value = smallAnglePeriod(config.baseline.length, config.baseline.gravity);
  return { slope: 0, intercept: value, n: rows.length, ...metrics(rows.map(r => r.y), rows.map(() => value)) };
}
// This milestone supports empirical lines and a fixed theoretical constant only.
// Linear candidates deliberately preserve the audited 1.5 arithmetic path.
export function fitHinge(rows: Measurement[], config: ModelConfig, knee: number) {
  const scale = config.intercept && !config.baseline ? rows.at(-1)!.x - rows[0].x : Math.max(...rows.map(r => Math.abs(r.x)));
  const origin = config.intercept && !config.baseline ? rows[0].x : 0;
  if (config.baseline) {
    const intercept = smallAnglePeriod(config.baseline.length, config.baseline.gravity);
    const coefficients = leastSquares(rows.map(r => [Math.max(0, r.x - knee) / scale]), rows.map(r => r.y - intercept));
    return { slope: 0, intercept, slopeChange: coefficients[0] / scale };
  }
  const design = rows.map(r => config.intercept ? [(r.x - origin) / scale, 1, Math.max(0, r.x - knee) / scale] : [r.x / scale, Math.max(0, r.x - knee) / scale]);
  const coefficients = leastSquares(design, rows.map(r => r.y));
  const slope = coefficients[0] / scale;
  return { slope, intercept: config.intercept ? coefficients[1] - slope * origin : 0, slopeChange: coefficients[config.intercept ? 2 : 1] / scale };
}
