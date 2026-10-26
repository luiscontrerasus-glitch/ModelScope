import { describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/analysis';
import { fitHinge } from '../src/lib/analysis/models';
import { criterion } from '../src/lib/analysis/statistics';

// Exact analytical fixtures, not experimental measurements or new demo datasets.
const hinge = Array.from({ length: 24 }, (_, i) => {
  const x = i + 1;
  return { id: `audit-${x}`, x, y: 2 + 3 * x + 5 * Math.max(0, x - 8) };
});
describe('independent CAC numerical expectations', () => {
  it('recovers an analytically known continuous hinge and its slopes', () => {
    const fit = fitHinge(hinge, { intercept: true, noiseFloor: 0.1 }, 8);
    expect(fit.slope).toBeCloseTo(3, 11);
    expect(fit.intercept).toBeCloseTo(2, 11);
    expect(fit.slopeChange).toBeCloseTo(5, 11);
    // Left and right expressions meet at (8, 26); right slope is 8.
    expect(fit.slope * 8 + fit.intercept).toBeCloseTo(26, 11);
    expect(fit.slope + fit.slopeChange).toBeCloseTo(8, 11);
    const result = analyze(hinge, { intercept: true, noiseFloor: 0.1 });
    expect(result.transition.status).toBe('supported');
    expect(result.transition.estimate).toBe(8);
    expect(result.transition.candidate?.sse).toBeLessThan(1e-20);
    expect(result.measurements).toHaveLength(24);
  });
  it('matches the hand-derived dimensionless criterion and complexity/search penalty', () => {
    // SSE=4, n=4, scale=0.5 gives ratio 4; two fitted parameters.
    expect(criterion(4, 4, 2, 0.5)).toBeCloseTo(6 * Math.log(4), 12);
    const result = analyze(hinge, { intercept: true, noiseFloor: 0.1 });
    expect(result.transition.candidates).toHaveLength(13);
    expect(result.transition.comparison?.extraPenalty).toBeCloseTo(2 * Math.log(24) + 2 * Math.log(13), 12);
  });
  it('retains an irregular measured grid and is invariant to a documented joint unit change', () => {
    const irregular = hinge.map((row, i) => {
      const x = row.x + (i % 3) * 0.1;
      return { ...row, x, y: 2 + 3 * x + 5 * Math.max(0, x - 8.1) };
    }).reverse();
    const before = structuredClone(irregular);
    const original = analyze(irregular, { intercept: true, noiseFloor: 0.1 });
    const converted = analyze(irregular.map(row => ({ ...row, x: row.x * 10, y: row.y * 1000 })), { intercept: true, noiseFloor: 100 });
    expect(irregular).toEqual(before);
    expect(original.originalObservations).toEqual(before);
    expect(converted.transition.status).toBe(original.transition.status);
    expect(converted.transition.estimate! / 10).toBeCloseTo(original.transition.estimate!, 10);
    expect(converted.transition.improvement).toBeCloseTo(original.transition.improvement!, 8);
    expect(converted.transition.sustainedRowIds).toEqual(original.transition.sustainedRowIds);
  });
});
