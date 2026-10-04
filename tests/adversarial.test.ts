import { describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/analysis';
import { createAnalysisExport } from '../src/lib/analysis/export';
import { criterion } from '../src/lib/analysis/statistics';
import { sustainedRuns } from '../src/lib/analysis/residuals';
import { springData } from '../src/lib/experiments/hookes-law';

const perfect = () => springData().map(r => ({ ...r, y: 32 * r.x }));
function gaussian(seed: number) {
  let state = seed;
  const uniform = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return (state + 0.5) / 4294967296; };
  return () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
}

describe('adversarial detector audit', () => {
  it.each([false, true])('A: perfect line, intercept=%s', intercept => {
    const result = analyze(perfect(), { intercept, noiseFloor: 0.04 });
    expect(result.transition.status).toBe('none'); expect(result.transition.sensitivity).toBeNull();
  });
  it.each([false, true])('B: 50 fixed-seed Gaussian noise fixtures, intercept=%s', intercept => {
    for (let seed = 1; seed <= 50; seed++) {
      const normal = gaussian(seed);
      const data = perfect().map(r => ({ ...r, y: r.y + 0.02 * normal() }));
      expect(analyze(data, { intercept, noiseFloor: 0.04 }).transition.status, `seed ${seed}`).toBe('none');
    }
  });
  it.each([false, true])('C: isolated outliers at every position, both signs and three magnitudes, intercept=%s', intercept => {
    for (const magnitude of [-10, -3, -1, 1, 3, 10]) for (let i = 0; i < 24; i++) {
      const data = perfect(); data[i].y += magnitude;
      const result = analyze(data, { intercept, noiseFloor: 0.04 });
      expect(result.transition.status, `row ${i}, magnitude ${magnitude}`).not.toBe('supported');
      expect(result.transition.estimate).toBeNull(); expect(result.transition.range).toBeNull();
    }
  });
  it.each([false, true])('D: adjacent disturbance returning to the line, intercept=%s', intercept => {
    for (const signs of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) for (let i = 0; i < 23; i++) {
      const data = perfect(); data[i].y += 3 * signs[0]; data[i + 1].y += 3 * signs[1];
      expect(analyze(data, { intercept, noiseFloor: 0.04 }).transition.status, `rows ${i}–${i + 1}`).not.toBe('supported');
    }
  });
  it('E: gradual departure survives influential-observation omission', () => {
    const result = analyze(springData());
    expect(result.transition.status).toBe('supported'); expect(result.transition.influenceCheck?.passed).toBe(true);
    expect(result.measurements).toHaveLength(24); // Diagnostic omission never removes original measurements.
  });
  it.each([25, -20])('F: sharp sustained slope change %s', change => {
    const data = perfect().map(r => ({ ...r, y: r.y + change * Math.max(0, r.x - 0.06) }));
    const result = analyze(data);
    expect(result.transition.status).toBe('supported'); expect(result.transition.estimate).toBeCloseTo(0.06, 10);
    expect(result.transition.candidate?.slopeChange).toBeCloseTo(change, 9);
  });
  it.each([2, 5, 11, 13])('G: %s points cannot support a knee', n => {
    const transition = analyze(springData().slice(0, n)).transition;
    expect(transition.status).toBe('insufficient'); expect(transition.candidate).toBeNull();
  });
  it.each([false, true])('H: equivalent m/cm and N/mN representations, intercept=%s', intercept => {
    for (const kind of ['linear', 'transition'] as const) {
      const data = springData(kind);
      const canonical = analyze(data, { intercept, noiseFloor: 0.04 });
      for (const [xScale, yScale] of [[100, 1], [0.001, 1], [100, 1000], [1, 0.001]]) {
        const converted = analyze(data.map(r => ({ ...r, x: r.x * xScale, y: r.y * yScale })), { intercept, noiseFloor: 0.04 * yScale });
        expect(converted.transition.status).toBe(canonical.transition.status);
        expect(converted.transition.improvement).toBeCloseTo(canonical.transition.improvement!, 7);
        expect(converted.transition.sustainedRowIds).toEqual(canonical.transition.sustainedRowIds);
        expect(converted.globalFit.slope * xScale / yScale).toBeCloseTo(canonical.globalFit.slope, 8);
        if (canonical.transition.range) {
          expect(converted.transition.estimate! / xScale).toBeCloseTo(canonical.transition.estimate!, 10);
          expect(converted.transition.range!.map(x => x / xScale)).toEqual(canonical.transition.range);
        }
      }
    }
  });
  it('keeps free-intercept fitting stable after an extension-coordinate shift', () => {
    const original = analyze(springData(), { intercept: true, noiseFloor: 0.04 });
    const shifted = analyze(springData().map(r => ({ ...r, x: r.x + 100 })), { intercept: true, noiseFloor: 0.04 });
    expect(shifted.transition.status).toBe(original.transition.status);
    expect(shifted.transition.improvement).toBeCloseTo(original.transition.improvement!, 6);
    expect(shifted.transition.estimate! - 100).toBeCloseTo(original.transition.estimate!, 8);
  });
  it('reports ambiguous evidence when a large assumed noise floor defeats persistence', () => {
    const result = analyze(springData(), { intercept: false, noiseFloor: 10 });
    expect(result.transition.improvement).toBeGreaterThan(10);
    expect(result.transition.status).toBe('ambiguous'); expect(result.transition.range).toBeNull();
  });
  it('withholds support when four-point persistence disappears on influential-observation omission', () => {
    const data = perfect().slice(0, 14).map(r => ({ ...r, y: r.y + 25 * Math.max(0, r.x - 0.05) }));
    const result = analyze(data);
    expect(result.transition.status).toBe('ambiguous');
    expect(result.transition.influenceCheck?.passed).toBe(false);
    expect(result.transition.estimate).toBeNull();
  });
  it('defines sensitivity as near-best objective values plus sampling neighbors', () => {
    const result = analyze(springData()); const t = result.transition;
    const expected = t.candidates.filter(c => c.criterion - t.candidate!.criterion <= 2).map(c => c.knee);
    expect(t.sensitivity?.nearBestKnees).toEqual(expected);
    expect(t.sensitivity?.nearBestRange).toEqual([expected[0], expected.at(-1)]);
    const low = result.measurements.findIndex(r => r.x === expected[0]);
    const high = result.measurements.findIndex(r => r.x === expected.at(-1));
    expect(t.range).toEqual([result.measurements[low - 1].x, result.measurements[high + 1].x]);
    expect(t.sensitivity?.definition).toContain('Not a confidence interval');
  });
  it('computes model comparison on all the same observations', () => {
    const result = analyze(springData()); const c = result.transition.comparison!;
    const alternative = result.transition.candidate!;
    const independentSse = result.measurements.reduce((s, r) => s + (r.y - (alternative.slope * r.x + alternative.intercept + alternative.slopeChange * Math.max(0, r.x - alternative.knee))) ** 2, 0);
    expect(c.segmentedSse).toBeCloseTo(independentSse, 12);
    expect(c.segmentedRmse).toBeCloseTo(Math.sqrt(independentSse / 24), 12);
    expect(c.improvement).toBeCloseTo(c.singleCriterion - c.segmentedCriterion, 12);
    expect(c.extraPenalty).toBeCloseTo(2 * Math.log(24) + 2 * Math.log(13), 12);
  });
  it('uses a dimensionless criterion under force-unit conversion', () => {
    expect(criterion(0.123, 24, 1, 0.04)).toBeCloseTo(criterion(0.123 * 1e6, 24, 1, 40), 12);
  });
  it('requires four strict consecutive same-sign residuals; resets on return or sign change', () => {
    const points = [3, 3, 0, 3, 3, -3, -3, -3, -3, 2].map((v, i) => ({ id: `r${i}`, x: i + 1, y: v, predicted: 0, residual: v, normalizedResidual: v }));
    expect(sustainedRuns(points, 0)).toEqual(['r5', 'r6', 'r7', 'r8']);
  });
});

describe('reproducible export', () => {
  it.each([false, true])('round-trips the observed order, units, configuration and numeric evidence, intercept=%s', intercept => {
    const input = [...springData()].reverse(); const result = analyze(input, { intercept, noiseFloor: 0.04 });
    const output = createAnalysisExport(result);
    const roundtrip = JSON.parse(JSON.stringify(output));
    expect(roundtrip.schemaVersion).toBe('1.0.0'); expect(roundtrip.methodology.version).toBe('1.1.0');
    expect(roundtrip.experiment.id).toBe('spring-hooke'); expect(roundtrip.units).toEqual({ extension: 'm', force: 'N', stiffness: 'N/m', sse: 'N²' });
    expect(roundtrip.originalObservations).toEqual(input);
    expect(analyze(roundtrip.originalObservations, roundtrip.analysis.config)).toEqual(result);
    expect(roundtrip.analysis.points).toEqual(result.points);
    expect(roundtrip.configuredModel.interceptTreatment).toBe(intercept ? 'fitted' : 'fixed-zero');
    output.analysis.measurements[0].y = -999;
    expect(result.measurements[0].y).not.toBe(-999);
  });
  it('does not fabricate a range or decision from insufficient data', () => {
    const exported = createAnalysisExport(analyze(perfect().slice(0, 5)));
    expect(exported.analysis.transition.sensitivity).toBeNull(); expect(exported.analysis.transition.comparison).toBeNull();
  });
});
