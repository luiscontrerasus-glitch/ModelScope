import { analyze } from '../analysis';
import { smallAnglePeriod } from '../analysis/models';
import type { AnalysisResult, ModelConfig } from '../analysis/types';
import { getExperiment } from './registry';
import type { DatasetKind, ExperimentDefinition, ExperimentId } from './types';

export function experimentConfig(experiment: ExperimentDefinition, options: Partial<Pick<ModelConfig, 'intercept' | 'noiseFloor'>> = {}): ModelConfig {
  return { ...structuredClone(experiment.config), ...options };
}
export function analyzeExperiment(id: ExperimentId, input: unknown, options: Partial<Pick<ModelConfig, 'intercept' | 'noiseFloor'>> = {}): AnalysisResult {
  const experiment = getExperiment(id);
  const result = analyze(input, experimentConfig(experiment, options), id === 'spring-hooke' ? undefined : { independent: experiment.independent.name, dependent: experiment.dependent.name, independentUnit: experiment.independent.unit, dependentUnit: experiment.dependent.unit });
  result.experimentId = id;
  if (result.measurements.some(r => r.x > experiment.independent.max)) throw new Error(`${experiment.independent.name} must not exceed ${experiment.independent.max} ${experiment.independent.unit}.`);
  if (id === 'spring-hooke') return result; // Preserve audited evidence, adding identity only.
  const fixed = !!result.config.baseline;
  const unit = experiment.dependent.unit;
  result.transition.reason = result.transition.reason.replaceAll('distinct-extension', 'distinct-input').replaceAll('single-line', 'baseline');
  if (result.transition.sensitivity) result.transition.sensitivity.definition = result.transition.sensitivity.definition.replaceAll('measured extension', 'measured independent-variable value');
  result.findings = result.findings.map(finding => ({
    ...finding,
    title: fixed && finding.rule === 'model-fit' ? 'Fixed theoretical reference' : finding.title,
    summary: fixed && finding.rule === 'model-fit' ? 'The small-angle period is derived from configured length and gravity. No period or offset is fitted to these observations.' : finding.summary.replaceAll('configured line', 'configured baseline').replaceAll('single-line', 'baseline').replaceAll('distinct-extension', 'distinct-input'),
    statistics: Object.fromEntries(Object.entries(finding.statistics).map(([key, value]) => [key.replace(' / N m⁻¹', ` / ${experiment.slopeUnit}`).replace(' / N²', ` / ${experiment.sseUnit}`).replace(' / N', ` / ${unit}`).replace('Single-line', 'Baseline'), value])),
    methodology: fixed && finding.rule === 'model-fit' ? 'Fixed theoretical small-angle period T₀ = 2π√(L/g). Residual = observed − predicted; no baseline coefficients are fitted. Centered R² is descriptive and can be negative.' : finding.methodology.replaceAll('single-line', 'baseline').replaceAll('configured line', 'configured baseline'),
    caveats: [...finding.caveats, ...experiment.caveats],
  }));
  return result;
}
export function createExperimentSession(id: ExperimentId, dataset: DatasetKind = 'transition') {
  const experiment = getExperiment(id);
  const measurements = structuredClone(experiment.datasets[dataset]);
  const analysis = analyzeExperiment(id, measurements);
  return { experimentId: id, dataset, measurements, analysis, config: analysis.config, provenance: { synthetic: true as const, dataset, edited: false } };
}
export function configuredEquation(experiment: ExperimentDefinition, result: AnalysisResult): string {
  return result.config.intercept || experiment.baseline.kind !== 'linear' ? experiment.baseline.equation : experiment.baseline.originEquation!;
}
export function modelParameters(experiment: ExperimentDefinition, result: AnalysisResult, scope: 'reference' | 'complete' = 'reference') {
  const fit = scope === 'reference' ? result.referenceFit : result.globalFit;
  return experiment.baseline.parameters.map(parameter => {
    const baseline = result.config.baseline;
    const value = parameter.key === 'slope' ? fit.slope : parameter.key === 'intercept' ? fit.intercept : parameter.key === 'length' ? baseline!.length : parameter.key === 'gravity' ? baseline!.gravity : smallAnglePeriod(baseline!.length, baseline!.gravity);
    return { ...parameter, treatment: parameter.key === 'intercept' && !result.config.intercept ? 'fixed' as const : parameter.treatment, value };
  });
}
export function referenceEquation(experiment: ExperimentDefinition, result: AnalysisResult): string {
  if (result.config.baseline) return `T₀ = ${result.referenceFit.intercept.toFixed(5)} s`;
  const fit = result.referenceFit;
  return `${experiment.dependent.symbol} = ${fit.slope.toFixed(3)}${experiment.independent.symbol}${result.config.intercept ? ` ${fit.intercept >= 0 ? '+' : '−'} ${Math.abs(fit.intercept).toFixed(4)}` : ''}`;
}
