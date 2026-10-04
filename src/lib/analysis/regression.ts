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
// Small least-squares system with pivoted Gaussian elimination. Normalize extensions before calling.
export function leastSquares(design: number[][], values: number[]): number[] {
  const p = design[0].length;
  const matrix = Array.from({ length: p }, (_, i) => [
    ...Array.from({ length: p }, (_, j) => sum(design.map(row => row[i] * row[j]))),
    sum(design.map((row, r) => row[i] * values[r]))
  ]);
  for (let i = 0; i < p; i++) {
    let pivot = i;
    for (let r = i + 1; r < p; r++) if (Math.abs(matrix[r][i]) > Math.abs(matrix[pivot][i])) pivot = r;
    [matrix[i], matrix[pivot]] = [matrix[pivot], matrix[i]];
    if (Math.abs(matrix[i][i]) < 1e-12) throw new Error('Candidate fit is singular.');
    const scale = matrix[i][i];
    for (let j = i; j <= p; j++) matrix[i][j] /= scale;
    for (let r = 0; r < p; r++) if (r !== i) {
      const factor = matrix[r][i];
      for (let j = i; j <= p; j++) matrix[r][j] -= factor * matrix[i][j];
    }
  }
  return matrix.map(row => row[p]);
}
