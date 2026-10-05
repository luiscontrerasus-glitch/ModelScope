import { analyze } from '../analysis';
import type { AnalysisResult, Measurement, ModelConfig } from '../analysis/types';
import type { ExperimentDefinition, VariableDefinition } from '../experiments/types';
import { mapTable, numeric, type Mapping, type RawTable } from './data';

export type CustomModel = 'linear-offset' | 'linear-origin' | 'constant';
export interface CustomVariable { name: string; unitKind: 'unspecified' | 'unitless' | 'label'; unit: string }
export interface CustomSettings {
  mapping: Mapping; x: CustomVariable; y: CustomVariable;
  model: CustomModel; constant: string; noiseFloor: string;
}
export interface CustomSession { table: RawTable; settings: CustomSettings; experiment: ExperimentDefinition; analysis: AnalysisResult; edited: boolean }
export function defaultSettings(): CustomSettings {
  return { mapping: { x: '', y: '', ignoreBlankRows: false }, x: { name: 'Independent variable', unitKind: 'unspecified', unit: '' }, y: { name: 'Dependent variable', unitKind: 'unspecified', unit: '' }, model: 'linear-offset', constant: '', noiseFloor: '' };
}
export function unitLabel(variable: CustomVariable): string { return variable.unitKind === 'unitless' ? '1' : variable.unitKind === 'unspecified' ? 'unspecified' : variable.unit.trim(); }
export function settingsIssues(settings: CustomSettings): string[] {
  const issues: string[] = [];
  for (const [role, variable] of [['X', settings.x], ['Y', settings.y]] as const) {
    if (!variable.name.trim() || variable.name.length > 80) issues.push(`${role}: enter a variable name of 1–80 characters.`);
    if (variable.unitKind === 'label' && (!variable.unit.trim() || variable.unit.length > 30)) issues.push(`${role}: enter a unit label of 1–30 characters, or choose unspecified/unitless.`);
  }
  const noise = numeric(settings.noiseFloor);
  if (noise === null || noise < 1e-6 || noise > 1000) issues.push('Enter a positive assumed response reference scale from 0.000001 to 1000 in Y units. Unknown uncertainty is not silently estimated.');
  const constant = numeric(settings.constant);
  if (settings.model === 'constant' && (constant === null || Math.abs(constant) > 1e6)) issues.push('Enter a finite expected constant C with absolute value at most 1,000,000 in Y units.');
  if (!['linear-offset', 'linear-origin', 'constant'].includes(settings.model)) issues.push('Choose one of the three supported baseline models.');
  return issues;
}
export function customDefinition(settings: CustomSettings): ExperimentDefinition {
  const xu = unitLabel(settings.x); const yu = unitLabel(settings.y);
  const variable = (v: CustomVariable, symbol: string): VariableDefinition => ({ name: v.name.trim(), symbol, unit: unitLabel(v), spokenUnit: v.unitKind === 'unspecified' ? 'unspecified units' : v.unitKind === 'unitless' ? 'unitless values' : v.unit.trim(), decimals: 6, step: 'any', min: -1e6, max: 1e6 });
  const fixed = settings.model === 'constant';
  const config: ModelConfig = { intercept: settings.model === 'linear-offset', noiseFloor: Number(settings.noiseFloor), ...(fixed ? { baseline: { kind: 'constant' as const, value: Number(settings.constant) } } : {}) };
  const slopeUnit = xu === 'unspecified' || yu === 'unspecified' ? 'unspecified ratio' : `${yu}/${xu}`;
  return {
    id: 'custom', title: 'Custom dataset', shortName: 'Custom dataset', category: 'User supplied',
    description: 'User-supplied measurements processed locally.', question: 'Where do these measurements systematically disagree with the configured model?',
    independent: variable(settings.x, 'X'), dependent: variable(settings.y, 'Y'), config, slopeUnit, sseUnit: yu === 'unspecified' ? 'unspecified squared' : yu === '1' ? '1' : `(${yu})²`,
    baseline: { id: `custom-${settings.model}`, kind: fixed ? 'constant' : 'linear', equation: fixed ? 'Y = C' : 'Y = mX + b', originEquation: 'Y = mX', prediction: fixed ? 'The response equals the user-supplied constant, independent of X. C is fixed, never fitted.' : settings.model === 'linear-origin' ? 'Response proportional to X; the zero offset is a user-selected assumption.' : 'Response linear in X, with slope and offset fitted from the measurements.', parameters: fixed ? [{ key: 'constant', name: 'Expected constant', symbol: 'C', unit: yu, treatment: 'configured' }] : [{ key: 'slope', name: 'Slope', symbol: 'm', unit: slopeUnit, treatment: 'fitted' }, { key: 'intercept', name: 'Offset', symbol: 'b', unit: yu, treatment: 'fitted' }] },
    assumptions: ['The chosen baseline and unit labels are user supplied, not physically verified.', 'Independent-variable measurements are treated as accurate; response errors are assumed approximately independent and comparable in scale.', fixed ? 'C is an externally supplied expectation, not estimated from this dataset.' : settings.model === 'linear-origin' ? 'A fixed zero intercept is appropriate only with a correctly defined and zeroed reference.' : 'A linear calibration with a fitted offset is appropriate for the reference region.', 'The positive response reference scale is an explicit user assumption, not measured uncertainty.'],
    expectedDomain: 'Adequacy depends on the configured model, reference scale, sampling and coverage.',
    context: 'A supported candidate identifies statistical inadequacy of the configured model. It does not identify a physical mechanism, universal threshold or safe operating range. Unknown units remain unspecified.',
    caveats: ['Custom metadata, units, fixed values and the response scale are not independently validated.', 'The detector is a heuristic without calibrated error probabilities. Review alternative baselines and reference scales.', 'No automatic unit conversion or measurement-uncertainty propagation is performed.'],
    datasets: { linear: [], transition: [] }, datasetLabels: { linear: '', transition: '' },
  };
}
export function analyzeCustomMeasurements(measurements: Measurement[], settings: CustomSettings): AnalysisResult {
  const issues = settingsIssues(settings);
  if (issues.length) throw new Error(issues.join(' '));
  const mapped = mapTable({ headers: ['X', 'Y'], rows: measurements.map((r, i) => ({ id: r.id, record: i + 2, values: [String(r.x), String(r.y)], blank: false })), issues: [], delimiter: ',', inputMethod: 'manual', syntheticExample: false }, { x: 'X', y: 'Y', ignoreBlankRows: false });
  if (mapped.issues.length) throw new Error(mapped.issues.map(i => i.message).join(' '));
  const e = customDefinition(settings);
  const r = analyze(measurements, e.config, { independent: e.independent.name, dependent: e.dependent.name, independentUnit: e.independent.unit, dependentUnit: e.dependent.unit, signedInput: true });
  r.experimentId = 'custom';
  r.transition.reason = r.transition.reason.replaceAll('distinct-extension', 'distinct-input').replaceAll('single-line', 'baseline');
  if (r.transition.sensitivity) r.transition.sensitivity.definition = r.transition.sensitivity.definition.replaceAll('measured extension', 'measured independent-variable value');
  r.findings = r.findings.map(f => ({ ...f,
    title: e.config.baseline && f.rule === 'model-fit' ? 'Fixed theoretical reference' : f.title,
    summary: e.config.baseline && f.rule === 'model-fit' ? 'C is supplied by the user. No constant or offset is fitted to these observations.' : f.summary.replaceAll('configured line', 'configured model').replaceAll('single-line', 'baseline').replaceAll('distinct-extension', 'distinct-input'),
    statistics: Object.fromEntries(Object.entries(f.statistics).map(([k, v]) => [k.replace(' / N m⁻¹', ` / ${e.slopeUnit}`).replace(' / N²', ` / ${e.sseUnit}`).replace(' / N', ` / ${e.dependent.unit}`).replace('Single-line', 'Baseline'), v])),
    methodology: e.config.baseline && f.rule === 'model-fit' ? 'User-supplied fixed constant; no baseline parameters are fitted. Residual = observed − C. Centered R² can be negative or undefined.' : f.methodology.replaceAll('single-line', 'baseline').replaceAll('configured line', 'configured model'),
    caveats: [...f.caveats, ...e.caveats],
  }));
  return r;
}
export function createCustomSession(table: RawTable, settings: CustomSettings): CustomSession {
  const mapped = mapTable(table, settings.mapping);
  if (mapped.issues.length) throw new Error(mapped.issues.map(i => i.message).join(' '));
  return { table: structuredClone(table), settings: structuredClone(settings), experiment: customDefinition(settings), analysis: analyzeCustomMeasurements(mapped.measurements, settings), edited: false };
}
