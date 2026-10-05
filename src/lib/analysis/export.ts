import { METHOD, POLICY } from './breakpoint';
import type { AnalysisResult } from './types';
import { hookesLaw } from '../experiments/hookes-law';
import { configuredEquation, modelParameters } from '../experiments/analysis';
import type { DataProvenance, ExperimentDefinition } from '../experiments/types';
import type { CustomSession } from '../custom/analysis';
import { sourceBasename } from '../custom/data';
export interface AnalysisExport {
  schemaVersion: '1.0.0';
  experiment: { id: string; title: string; independent: typeof hookesLaw.independent; dependent: typeof hookesLaw.dependent };
  units: { extension: 'm'; force: 'N'; stiffness: 'N/m'; sse: 'N²' };
  configuredModel: { equation: 'F = kx' | 'F = kx + c'; interceptTreatment: 'fixed-zero' | 'fitted'; noiseFloor: number; noiseFloorUnit: 'N' };
  methodology: { id: typeof METHOD.id; version: typeof METHOD.version; policy: typeof POLICY };
  originalObservations: AnalysisResult['originalObservations'];
  analysis: AnalysisResult;
}
export function createAnalysisExport(result: AnalysisResult): AnalysisExport {
  if (result.config.baseline || result.experimentId && result.experimentId !== 'spring-hooke') throw new Error('Use the experiment-aware export for other baselines.');
  return structuredClone({
    schemaVersion: '1.0.0',
    experiment: { id: hookesLaw.id, title: hookesLaw.title, independent: hookesLaw.independent, dependent: hookesLaw.dependent },
    units: { extension: 'm', force: 'N', stiffness: 'N/m', sse: 'N²' },
    configuredModel: { equation: result.config.intercept ? 'F = kx + c' : 'F = kx', interceptTreatment: result.config.intercept ? 'fitted' : 'fixed-zero', noiseFloor: result.config.noiseFloor, noiseFloorUnit: 'N' },
    methodology: { ...METHOD, policy: POLICY },
    originalObservations: result.originalObservations,
    analysis: result,
  });
}
// One additive schema for all four experiments; the 1.0 spring API remains intact.
export function createExperimentExport(result: AnalysisResult, experiment: ExperimentDefinition, provenance: DataProvenance) {
  const fixed = !!result.config.baseline;
  if (experiment.id === 'custom' || result.experimentId !== experiment.id || fixed !== (experiment.baseline.kind === 'pendulum-small-angle')) throw new Error('Export model and experiment do not match.');
  return structuredClone({
    schemaVersion: '1.1.0',
    experiment: { id: experiment.id, title: experiment.title, scientificQuestion: experiment.question, independent: experiment.independent, dependent: experiment.dependent },
    units: { independent: experiment.independent.unit, dependent: experiment.dependent.unit, slope: experiment.slopeUnit, sse: experiment.sseUnit },
    configuredModel: {
      id: experiment.baseline.id, equation: configuredEquation(experiment, result),
      fitMode: fixed ? 'fixed-theoretical' : 'empirical-ols',
      interceptTreatment: fixed ? 'theoretical-constant' : result.config.intercept ? 'fitted' : 'fixed-zero',
      noiseFloor: result.config.noiseFloor, noiseFloorUnit: experiment.dependent.unit,
      parameters: modelParameters(experiment, result), completeDataParameters: modelParameters(experiment, result, 'complete'),
    },
    methodology: { id: METHOD.id, version: '1.2.0', policy: POLICY, baselineFittedParameters: fixed ? 0 : result.config.intercept ? 2 : 1 },
    assumptions: experiment.assumptions, caveats: experiment.caveats,
    dataProvenance: { ...provenance, label: 'Synthetic educational dataset' },
    originalObservations: result.originalObservations,
    analysis: result,
  });
}
export function createCustomExport(result: AnalysisResult, session: CustomSession, edited: boolean) {
  if (result.experimentId !== 'custom' || session.experiment.id !== 'custom') throw new Error('Custom export requires a matching custom analysis.');
  const e = session.experiment;
  if (result.config.intercept !== e.config.intercept || result.config.noiseFloor !== e.config.noiseFloor || result.config.baseline?.kind !== e.config.baseline?.kind || result.config.baseline?.kind === 'constant' && (e.config.baseline?.kind !== 'constant' || result.config.baseline.value !== e.config.baseline.value)) throw new Error('Custom configuration must match the analyzed snapshot before exporting.');
  return structuredClone({
    schemaVersion: '1.2.0',
    experiment: { id: e.id, title: e.title, scientificQuestion: e.question, independent: e.independent, dependent: e.dependent },
    units: { independent: e.independent.unit, dependent: e.dependent.unit, slope: e.slopeUnit, sse: e.sseUnit, independentKind: session.settings.x.unitKind, dependentKind: session.settings.y.unitKind, conversion: 'none-labels-only' },
    configuredModel: { id: e.baseline.id, equation: configuredEquation(e, result), fitMode: result.config.baseline ? 'fixed-theoretical' : 'empirical-ols', interceptTreatment: result.config.baseline ? 'user-supplied-constant' : result.config.intercept ? 'fitted' : 'fixed-zero', noiseFloor: result.config.noiseFloor, noiseFloorUnit: e.dependent.unit, referenceScaleSource: 'explicit-user-assumption', parameters: modelParameters(e, result), completeDataParameters: modelParameters(e, result, 'complete'), settings: session.settings },
    methodology: { id: METHOD.id, version: '1.3.0', policy: POLICY, baselineFittedParameters: result.config.baseline ? 0 : result.config.intercept ? 2 : 1 },
    dataProvenance: { source: 'user-supplied', inputMethod: session.table.inputMethod, ...(session.table.sourceFilename ? { sourceFilename: sourceBasename(session.table.sourceFilename) } : {}), synthetic: session.table.syntheticExample, edited, excludedBlankRowIds: session.settings.mapping.ignoreBlankRows ? session.table.rows.filter(r => r.blank).map(r => r.id) : [] },
    columnMapping: { x: session.settings.mapping.x, y: session.settings.mapping.y },
    originalRows: { headers: session.table.originalHeaders ?? session.table.headers, mappedHeaderNames: session.table.headers, records: session.table.rows },
    originalObservations: result.originalObservations,
    assumptions: e.assumptions, caveats: e.caveats, analysis: result,
  });
}
