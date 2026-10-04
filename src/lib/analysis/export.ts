import { METHOD, POLICY } from './breakpoint';
import type { AnalysisResult } from './types';
import { hookesLaw } from '../experiments/hookes-law';
import { configuredEquation, modelParameters } from '../experiments/analysis';
import type { DataProvenance, ExperimentDefinition } from '../experiments/types';
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
  if (result.experimentId !== experiment.id || fixed !== (experiment.baseline.kind === 'pendulum-small-angle')) throw new Error('Export model and experiment do not match.');
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
