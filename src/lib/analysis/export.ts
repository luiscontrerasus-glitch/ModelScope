import { METHOD, POLICY } from './breakpoint';
import type { AnalysisResult } from './types';
import { hookesLaw } from '../experiments/hookes-law';
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
