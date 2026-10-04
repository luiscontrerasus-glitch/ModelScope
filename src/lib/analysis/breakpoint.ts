import { predict } from './regression';
import { baselineParameterCount, fitBaseline, fitHinge } from './models';
import { criterion, metrics } from './statistics';
import { residuals, sustainedRuns } from './residuals';
import type { Candidate, Fit, Measurement, ModelConfig, Transition } from './types';
export const METHOD = { id: 'continuous-hinge-sustained-residuals', version: '1.1.0' } as const;
export const POLICY = { minimumN: 14, minimumSide: 6, criterionImprovement: 10, sensitivityDelta: 2, residualMultiplier: 2, minimumRun: 4, numericRatioFloor: 1e-12 } as const;
function search(rows: Measurement[], config: ModelConfig, baseline: Fit) {
  const p = baselineParameterCount(config);
  const base = criterion(baseline.sse, rows.length, p, config.noiseFloor);
  const knees = rows.slice(POLICY.minimumSide - 1, rows.length - POLICY.minimumSide).map(r => r.x);
  const candidates: Candidate[] = knees.map(knee => {
    const { slope, intercept, slopeChange } = fitHinge(rows, config, knee);
    const { sse, rmse } = metrics(rows.map(r => r.y), rows.map(r => slope * r.x + intercept + slopeChange * Math.max(0, r.x - knee)));
    return { knee, slope, intercept, slopeChange, sse, rmse, criterion: criterion(sse, rows.length, p + 2, config.noiseFloor) + 2 * Math.log(knees.length), deltaFromBest: 0 };
  });
  const best = candidates.reduce((a, b) => a.criterion <= b.criterion ? a : b);
  for (const candidate of candidates) candidate.deltaFromBest = candidate.criterion - best.criterion;
  const early = fitBaseline(rows.filter(r => r.x <= best.knee), config);
  const noiseScale = Math.max(config.noiseFloor, Math.sqrt(early.sse / (early.n - p)));
  const sustainedRowIds = sustainedRuns(residuals(rows, early, noiseScale), best.knee, POLICY.residualMultiplier, POLICY.minimumRun);
  const improvement = base - best.criterion;
  return { base, best, candidates, noiseScale, sustainedRowIds, improvement };
}
export function detectTransition(rows: Measurement[], config: ModelConfig, baseline: Fit): Transition {
  const initial: Transition = { status: 'insufficient', estimate: null, range: null, improvement: null, baselineCriterion: null, candidate: null, candidates: [], sustainedRowIds: [], noiseScale: config.noiseFloor, comparison: null, sensitivity: null, influenceCheck: null, reason: 'Insufficient evidence: at least 14 distinct-extension measurements are required. No clear transition is supported.' };
  if (rows.length < POLICY.minimumN) return initial;
  const { base, best, candidates, noiseScale, sustainedRowIds, improvement } = search(rows, config, baseline);
  const comparisonPass = improvement >= POLICY.criterionImprovement;
  const sustainedPass = sustainedRowIds.length >= POLICY.minimumRun;
  let influenceCheck: Transition['influenceCheck'] = null;
  if (comparisonPass && sustainedPass) {
    // Keep all observations in reported fits; omission is only a diagnostic refit.
    const influential = rows.reduce((a, b) => Math.abs(a.y - predict(baseline, a.x)) >= Math.abs(b.y - predict(baseline, b.x)) ? a : b);
    const retained = rows.filter(r => r.id !== influential.id);
    const checked = search(retained, config, fitBaseline(retained, config));
    const sameSlopeDirection = Math.sign(checked.best.slopeChange) === Math.sign(best.slopeChange);
    influenceCheck = { omittedRowId: influential.id, improvement: checked.improvement, sustainedRowIds: checked.sustainedRowIds, sameSlopeDirection, passed: checked.improvement >= POLICY.criterionImprovement && checked.sustainedRowIds.length >= POLICY.minimumRun && sameSlopeDirection };
  }
  const status: Transition['status'] = !comparisonPass ? 'none' : sustainedPass && influenceCheck?.passed ? 'supported' : 'ambiguous';
  const supported = status === 'supported';
  const plausible = candidates.filter(c => c.deltaFromBest <= POLICY.sensitivityDelta);
  const low = plausible[0].knee; const high = plausible.at(-1)!.knee;
  const lowIndex = rows.findIndex(r => r.x === low); const highIndex = rows.findIndex(r => r.x === high);
  const samplingRange: [number, number] = [rows[Math.max(0, lowIndex - 1)].x, rows[Math.min(rows.length - 1, highIndex + 1)].x];
  const reasons = {
    supported: 'These measurements support a candidate transition: the segmented comparison, sustained residual gate, and influential-observation check all pass. This does not identify a physical mechanism.',
    none: 'No clear transition is supported by these measurements. The segmented improvement does not exceed the configured penalty and decision margin; this does not establish model adequacy.',
    ambiguous: !sustainedPass ? 'Ambiguous evidence: the segmented comparison passes, but fewer than four consecutive same-sign residuals exceed the reference threshold. No transition range is reported.' : 'Ambiguous evidence: initial support does not survive the influential-observation check. No transition range is reported.',
  };
  return { status, estimate: supported ? best.knee : null,
    range: supported ? samplingRange : null,
    improvement, baselineCriterion: base, candidate: best, candidates, sustainedRowIds: supported ? sustainedRowIds : [], noiseScale,
    reason: reasons[status], influenceCheck,
    sensitivity: supported ? { objectiveWindow: POLICY.sensitivityDelta, nearBestKnees: plausible.map(c => c.knee), nearBestRange: [low, high], samplingRange, definition: 'Candidate knees within 2 penalized criterion units of the optimum, expanded by one neighboring measured extension on each side for sampling resolution. Not a confidence interval.' } : null,
    comparison: { singleSse: baseline.sse, singleRmse: baseline.rmse, segmentedSse: best.sse, segmentedRmse: best.rmse, sseReduction: baseline.sse - best.sse, relativeSseReduction: baseline.sse > 0 ? (baseline.sse - best.sse) / baseline.sse : 0, singleCriterion: base, segmentedCriterion: best.criterion, improvement, extraPenalty: 2 * Math.log(rows.length) + 2 * Math.log(candidates.length) },
  };
}
