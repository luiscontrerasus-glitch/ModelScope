import { describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/analysis';
import { linearRegression, predict } from '../src/lib/analysis/regression';
import { metrics } from '../src/lib/analysis/statistics';
import { residuals } from '../src/lib/analysis/residuals';
import { springData } from '../src/lib/experiments/hookes-law';
import type { Measurement } from '../src/lib/analysis/types';
const rows = (ys: number[]): Measurement[] => ys.map((y, i) => ({ id: `r${i}`, x: i + 1, y }));
describe('regression and diagnostics', () => {
  it('recovers the analytic slope and intercept', () => {
    const fit = linearRegression(rows([5, 8, 11, 14]), true);
    expect(fit.slope).toBeCloseTo(3, 12); expect(fit.intercept).toBeCloseTo(2, 12);
    expect(predict(fit, 5)).toBeCloseTo(17, 12); expect(fit.rmse).toBe(0); expect(fit.r2).toBe(1);
  });
  it('computes a through-origin fit without silently adding an intercept', () => {
    const fit = linearRegression(rows([3, 5, 7]));
    expect(fit.slope).toBeCloseTo(34 / 14, 12); expect(fit.intercept).toBe(0);
  });
  it('has independently calculated SSE, RMSE, centered R² and residual signs', () => {
    const scores = metrics([1, 2, 3], [1, 2, 4]);
    expect(scores.sse).toBe(1); expect(scores.rmse).toBeCloseTo(Math.sqrt(1 / 3)); expect(scores.r2).toBe(0.5);
    const fit = { slope: 1, intercept: 0, n: 3, ...scores };
    expect(residuals([{ id: 'a', x: 4, y: 3 }], fit, 0.5)[0]).toEqual({ id: 'a', x: 4, y: 3, predicted: 4, residual: -1, normalizedResidual: -2 });
  });
  it('does not define R² for constant responses and permits negative R²', () => {
    expect(metrics([2, 2], [1, 3]).r2).toBeNull(); expect(metrics([1, 2], [8, 8]).r2).toBeLessThan(0);
  });
});
describe('transition evidence', () => {
  it('does not trigger on a perfect line', () => {
    const data = springData().map(r => ({ ...r, y: 32 * r.x }));
    expect(analyze(data).transition.status).toBe('none');
  });
  it('supports sustained spring departure with a sampled candidate region', () => {
    const result = analyze(springData());
    expect(result.transition.status).toBe('supported');
    expect(result.transition.estimate).toBeGreaterThanOrEqual(0.055);
    expect(result.transition.estimate).toBeLessThanOrEqual(0.09);
    expect(result.transition.improvement).toBeGreaterThan(10);
    expect(result.transition.sustainedRowIds.length).toBeGreaterThanOrEqual(4);
    expect(result.referenceFit.slope).toBeGreaterThan(30); expect(result.referenceFit.slope).toBeLessThan(36);
    const evidence = result.findings.find(f => f.id === 'residuals')!;
    expect(evidence.evidence.map(p => p.id)).toEqual(evidence.rowIds);
    for (const point of evidence.evidence) expect(Math.abs(point.normalizedResidual)).toBeGreaterThan(2);
  });
  it('does not mistake fixed noisy linear data for a transition', () => { expect(analyze(springData('linear')).transition.status).toBe('none'); });
  it('resists a deterministic ensemble of noisy lines', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let state = seed;
      const data = springData('linear').map(r => {
        state = (Math.imul(1664525, state) + 1013904223) >>> 0;
        return { ...r, y: 32 * r.x + (state / 4294967296 - 0.5) * 0.14 };
      });
      expect(analyze(data).transition.status, `seed ${seed}`).toBe('none');
    }
  });
  it('does not support a transition caused by one isolated outlier', () => {
    const data = springData('linear'); data[18].y += 2;
    expect(analyze(data).transition.status).toBe('none');
  });
  it('recalculates when the later force measurements are edited', () => {
    const original = springData(); const edited = original.map(r => ({ ...r, y: 32 * r.x }));
    expect(analyze(original).transition.status).toBe('supported'); expect(analyze(edited).transition.status).toBe('none');
    expect(analyze(edited).globalFit.slope).toBeCloseTo(32, 10);
  });
  it('detects a known hinge and is stable to input order', () => {
    const fixture = springData('linear').map(r => ({ ...r, y: 32 * r.x + 25 * Math.max(0, r.x - 0.06) }));
    const result = analyze(fixture);
    expect(result.transition.estimate).toBeCloseTo(0.06, 12);
    expect(result.transition.candidate!.slopeChange).toBeCloseTo(25, 8);
    const reversed = analyze([...fixture].reverse());
    expect(reversed.originalObservations).toEqual([...fixture].reverse());
    expect({ ...reversed, originalObservations: result.originalObservations }).toEqual(result);
  });
  it('supports an optional intercept and a softening response', () => {
    const data = springData('linear').map(r => ({ ...r, y: 0.4 + 32 * r.x - 20 * Math.max(0, r.x - 0.06) }));
    const result = analyze(data, { intercept: true, noiseFloor: 0.04 });
    expect(result.transition.status).toBe('supported'); expect(result.referenceFit.intercept).toBeCloseTo(0.4, 10);
    expect(result.referenceFit.slope).toBeCloseTo(32, 10);
  });
  it('reports insufficient sample size without claiming adequacy', () => {
    const result = analyze(springData().slice(0, 5));
    expect(result.transition.status).toBe('insufficient'); expect(result.transition.range).toBeNull();
  });
  it('does not mutate caller data or hard-code row identifiers', () => {
    const data = springData().map((r, i) => ({ ...r, id: `custom-${i}` })); const before = structuredClone(data);
    const result = analyze(data); expect(data).toEqual(before);
    expect(result.findings.flatMap(f => f.rowIds).every(id => id.startsWith('custom-'))).toBe(true);
  });
});
describe('input validation', () => {
  it.each([[], [{ id: 'a', x: 0.1 }], rows([1, NaN]), rows([1, Infinity]), [{ id: 'a', x: '', y: 2 }, { id: 'b', x: 1, y: 3 }], [{ id: 'a', x: -1, y: 2 }, { id: 'b', x: 1, y: 3 }]].map(data => ({ data })))('rejects incomplete or malformed data %#', ({ data }) => { expect(() => analyze(data)).toThrow(); });
  it('rejects duplicate IDs and extensions', () => {
    expect(() => analyze([{ id: 'a', x: 1, y: 1 }, { id: 'a', x: 2, y: 2 }])).toThrow('IDs');
    expect(() => analyze([{ id: 'a', x: 1, y: 1 }, { id: 'b', x: 1, y: 2 }])).toThrow('distinct');
  });
  it('rejects invalid noise configuration', () => { expect(() => analyze(rows([1, 2]), { intercept: false, noiseFloor: 0 })).toThrow(); });
});

