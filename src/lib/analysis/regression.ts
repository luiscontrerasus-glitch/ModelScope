import type { Fit, Measurement } from './types';
import { metrics, sum } from './statistics';
export function predict(fit: Pick<Fit, 'slope' | 'intercept'>, x: number): number { return fit.slope * x + fit.intercept; }
export function linearRegression(rows: Measurement[], intercept = false): Fit {
  if (rows.length < 2 || rows.some(r => !Number.isFinite(r.x) || !Number.isFinite(r.y))) throw new Error('Fit needs at least two finite measurements.');
  const mx = intercept ? sum(rows.map(r => r.x)) / rows.length : 0;
  const my = intercept ? sum(rows.map(r => r.y)) / rows.length : 0;
  const denominator = sum(rows.map(r => (r.x - mx) ** 2));
  if (denominator <= 0) throw new Error('Extension must span a nonzero range.');
  const slope = sum(rows.map(r => (r.x - mx) * (r.y - my))) / denominator;
  const offset = intercept ? my - slope * mx : 0;
  const scores = metrics(rows.map(r => r.y), rows.map(r => slope * r.x + offset));
  if (![slope, offset, scores.sse, scores.rmse].every(Number.isFinite)) throw new Error('Values exceed the numerical range.');
  return { slope, intercept: offset, ...scores, n: rows.length };
}
// Reorthogonalized modified Gram–Schmidt QR avoids squaring the condition number.
export function leastSquares(design: number[][], values: number[]): number[] {
  const p = design[0].length;
  const q: number[][] = [];
  const r = Array.from({ length: p }, () => Array<number>(p).fill(0));
  for (let j = 0; j < p; j++) {
    const v = design.map(row => row[j]);
    const originalNorm = Math.hypot(...v);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < j; i++) {
        const projection = sum(v.map((value, row) => value * q[i][row]));
        r[i][j] += projection;
        for (let row = 0; row < v.length; row++) v[row] -= projection * q[i][row];
      }
    }
    r[j][j] = Math.hypot(...v);
    if (r[j][j] <= Number.EPSILON * 64 * originalNorm || !r[j][j]) throw new Error('Candidate fit is singular.');
    q.push(v.map(value => value / r[j][j]));
  }
  const coefficients = Array<number>(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    coefficients[i] = (sum(q[i].map((value, row) => value * values[row])) - sum(r[i].map((value, j) => j > i ? value * coefficients[j] : 0))) / r[i][i];
  }
  return coefficients;
}
