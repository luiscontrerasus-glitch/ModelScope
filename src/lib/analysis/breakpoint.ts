import { leastSquares, linearRegression } from './regression';
import { criterion, metrics } from './statistics';
import { residuals, sustainedRuns } from './residuals';
import type { Candidate, Fit, Measurement, ModelConfig, Transition } from './types';
export const POLICY = { minimumN: 14, minimumSide: 6, criterionImprovement: 10, sensitivityDelta: 2 } as const;
export function detectTransition(rows: Measurement[], config: ModelConfig, baseline: Fit): Transition {
  const initial: Transition = { status: 'insufficient', estimate: null, range: null, improvement: null, baselineCriterion: null, candidate: null, candidates: [], sustainedRowIds: [], noiseScale: config.noiseFloor, reason: 'No clear transition is supported: at least 14 measurements are required.' };
  if (rows.length < POLICY.minimumN) return initial;
  const p = config.intercept ? 2 : 1;
  const base = criterion(baseline.sse, rows.length, p, config.noiseFloor);
  const scale = Math.max(...rows.map(r => Math.abs(r.x)));
  const knees = rows.slice(POLICY.minimumSide - 1, rows.length - POLICY.minimumSide).map(r => r.x);
  const candidates: Candidate[] = knees.map(knee => {
    const design = rows.map(r => config.intercept ? [r.x / scale, 1, Math.max(0, r.x - knee) / scale] : [r.x / scale, Math.max(0, r.x - knee) / scale]);
    const coefficients = leastSquares(design, rows.map(r => r.y));
    const slope = coefficients[0] / scale;
    const intercept = config.intercept ? coefficients[1] : 0;
    const slopeChange = coefficients[config.intercept ? 2 : 1] / scale;
    const { sse } = metrics(rows.map(r => r.y), rows.map(r => slope * r.x + intercept + slopeChange * Math.max(0, r.x - knee)));
    return { knee, slope, intercept, slopeChange, sse, criterion: criterion(sse, rows.length, p + 2, config.noiseFloor) + 2 * Math.log(knees.length) };
  });
  const best = candidates.reduce((a, b) => a.criterion <= b.criterion ? a : b);
  const early = linearRegression(rows.filter(r => r.x <= best.knee), config.intercept);
  const noiseScale = Math.max(config.noiseFloor, Math.sqrt(early.sse / (early.n - p)));
  const sustainedRowIds = sustainedRuns(residuals(rows, early, noiseScale), best.knee);
  const improvement = base - best.criterion;
  const supported = improvement >= POLICY.criterionImprovement && sustainedRowIds.length >= 4;
  const plausible = candidates.filter(c => c.criterion <= best.criterion + POLICY.sensitivityDelta);
  const low = Math.min(...plausible.map(c => c.knee)); const high = Math.max(...plausible.map(c => c.knee));
  const lowIndex = rows.findIndex(r => r.x === low); const highIndex = rows.findIndex(r => r.x === high);
  return { status: supported ? 'supported' : 'weak', estimate: supported ? best.knee : null,
    range: supported ? [rows[Math.max(0, lowIndex - 1)].x, rows[Math.min(rows.length - 1, highIndex + 1)].x] : null,
    improvement, baselineCriterion: base, candidate: best, candidates, sustainedRowIds: supported ? sustainedRowIds : [], noiseScale,
    reason: supported ? 'A penalized slope-change comparison and sustained reference residuals support a candidate transition region.' : 'No clear transition is supported by this dataset. A weak comparison or absent sustained deviation does not establish model validity.' };
}
