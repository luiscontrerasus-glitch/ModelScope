import { z } from 'zod';
import { linearRegression } from './regression';
import { residuals } from './residuals';
import { detectTransition } from './breakpoint';
import type { AnalysisResult, Finding, ModelConfig } from './types';
const schema = z.array(z.object({ id: z.string().min(1), x: z.number().finite().min(0).max(1000), y: z.number().finite().min(-1000000).max(1000000) })).min(2).max(500);
const configSchema = z.object({ intercept: z.boolean(), noiseFloor: z.number().finite().min(0.000001).max(1000) });
export function analyze(input: unknown, configuration: ModelConfig = { intercept: false, noiseFloor: 0.04 }): AnalysisResult {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new Error('Provide 2–500 complete measurements: extension 0–1000 m and force −1,000,000–1,000,000 N. Blank or non-finite values are invalid.');
  const parsedConfig = configSchema.safeParse(configuration);
  if (!parsedConfig.success) throw new Error('Choose a valid line configuration and a finite force noise floor between 0.000001 and 1000 N.');
  const config = parsedConfig.data;
  const measurements = [...parsed.data].sort((a, b) => a.x - b.x);
  if (new Set(measurements.map(r => r.id)).size !== measurements.length) throw new Error('Measurement IDs must be unique.');
  if (new Set(measurements.map(r => r.x)).size !== measurements.length) throw new Error('Use distinct extensions; repeated measurements are not supported in this milestone.');
  const globalFit = linearRegression(measurements, config.intercept);
  const transition = detectTransition(measurements, config, globalFit);
  const supported = transition.status === 'supported';
  const referenceFit = supported ? linearRegression(measurements.filter(r => r.x <= transition.estimate!), config.intercept) : globalFit;
  const noiseScale = supported ? transition.noiseScale : Math.max(config.noiseFloor, Math.sqrt(globalFit.sse / Math.max(1, globalFit.n - (config.intercept ? 2 : 1))));
  const points = residuals(measurements, referenceFit, noiseScale);
  const region = transition.estimate !== null && transition.range ? { estimate: transition.estimate, range: transition.range } : null;
  const caveats = ['The boundary is an estimate from these measurements and this configured model.', 'The sensitivity region is not a confidence interval.', 'Statistical evidence does not prove a physical mechanism.'];
  const common = { columns: ['x', 'y'] as ('x' | 'y')[], parameters: { slope: referenceFit.slope, intercept: referenceFit.intercept }, transition: region, caveats };
  const findings: Finding[] = [
    { ...common, id: 'fit', rule: 'model-fit', category: 'descriptive', title: supported ? 'Early-region reference fit' : 'Complete-data reference fit',
      summary: supported ? `The configured line is fitted to the ${referenceFit.n} observations at or below the candidate knee. Later observations are compared with this reference.` : 'The configured line is fitted to all observations. R² describes explained variation and is not evidence of adequacy.',
      rowIds: measurements.filter(r => !supported || r.x <= transition.estimate!).map(r => r.id), evidence: points.filter(r => !supported || r.x <= transition.estimate!),
      statistics: { 'Reference observations': referenceFit.n, 'Reference RMSE / N': referenceFit.rmse, 'Reference centered R²': referenceFit.r2, 'Reference SSE / N²': referenceFit.sse }, methodology: 'Ordinary least squares; residual = observed − predicted. R² uses centered total variation even for a through-origin fit.' },
    { ...common, id: 'transition', rule: 'transition', category: supported ? 'supported' : 'inconclusive', title: supported ? 'Candidate transition region' : 'No clear transition supported', summary: transition.reason,
      rowIds: region ? points.filter(p => p.x >= region.range[0] && p.x <= region.range[1]).map(p => p.id) : [], evidence: region ? points.filter(p => p.x >= region.range[0] && p.x <= region.range[1]) : [],
      statistics: { 'Criterion improvement': transition.improvement, 'Required improvement': 10, 'Candidate knees searched': transition.candidates.length, 'Single-line criterion': transition.baselineCriterion, 'Penalized hinge criterion': transition.candidate?.criterion ?? null, 'Hinge SSE / N²': transition.candidate?.sse ?? null, 'Hinge slope change / N m⁻¹': transition.candidate?.slopeChange ?? null },
      methodology: 'Exhaustive continuous hinge search; BIC-style parameter penalty + 2 ln(candidate count). Require ≥10 criterion improvement and ≥4 consecutive same-sign residuals beyond 2×noise scale.' }
  ];
  if (supported) findings.push({ ...common, id: 'residuals', rule: 'sustained-residuals', category: 'supported', title: 'Sustained disagreement', summary: `${transition.sustainedRowIds.length} measurements belong to runs of at least four consecutive same-sign deviations from the early reference.`, rowIds: transition.sustainedRowIds,
    evidence: points.filter(p => transition.sustainedRowIds.includes(p.id)), statistics: { 'Reference noise scale / N': noiseScale, 'Absolute residual threshold / N': 2 * noiseScale, 'Minimum consecutive run': 4 }, methodology: 'Post-knee reference residuals exceed twice max(early residual standard error, configured noise floor). This is a descriptive gate, not a significance test.' });
  return { config, measurements, globalFit, referenceFit, referenceScope: supported ? 'early-region' : 'complete-data', points, transition, findings };
}
