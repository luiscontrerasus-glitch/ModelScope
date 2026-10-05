import type { Measurement, ModelConfig } from '../analysis/types';
export type ExperimentId = 'spring-hooke' | 'pendulum' | 'beer-lambert' | 'sensor-calibration';
export type DatasetKind = 'transition' | 'linear';
export interface VariableDefinition {
  name: string; symbol: string; unit: string; spokenUnit: string;
  decimals: number; step: string; min: number; max: number;
}
export interface ParameterDefinition {
  key: 'slope' | 'intercept' | 'length' | 'gravity' | 'period' | 'constant';
  name: string; symbol: string; unit: string; treatment: 'fitted' | 'configured' | 'derived';
}
export interface ExperimentDefinition {
  id: ExperimentId | 'custom'; title: string; shortName: string; category: string;
  description: string; question: string;
  independent: VariableDefinition; dependent: VariableDefinition;
  baseline: { id: string; kind: 'linear' | 'pendulum-small-angle' | 'constant'; equation: string; originEquation?: string; prediction: string; parameters: ParameterDefinition[] };
  config: ModelConfig; slopeUnit: string; sseUnit: string;
  assumptions: string[]; expectedDomain: string; context: string; caveats: string[];
  datasetLabels: Record<DatasetKind, string>; datasets: Record<DatasetKind, Measurement[]>;
}
export interface DataProvenance { synthetic: true; dataset: DatasetKind; edited: boolean }
