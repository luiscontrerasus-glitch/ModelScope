export interface Measurement { id: string; x: number; y: number }
export interface ModelConfig {
  intercept: boolean; noiseFloor: number;
  baseline?: { kind: 'pendulum-small-angle'; length: number; gravity: number } | { kind: 'constant'; value: number };
}
export interface Fit { slope: number; intercept: number; sse: number; rmse: number; r2: number | null; n: number }
export interface EvidencePoint extends Measurement { predicted: number; residual: number; normalizedResidual: number }
export interface Candidate { knee: number; slope: number; intercept: number; slopeChange: number; sse: number; rmse: number; criterion: number; deltaFromBest: number }
export interface ModelComparison {
  singleSse: number; singleRmse: number; segmentedSse: number; segmentedRmse: number;
  sseReduction: number; relativeSseReduction: number; singleCriterion: number;
  segmentedCriterion: number; improvement: number; extraPenalty: number;
}
export interface Sensitivity {
  objectiveWindow: number; nearBestKnees: number[]; nearBestRange: [number, number];
  samplingRange: [number, number]; definition: string;
}
export interface InfluenceCheck {
  omittedRowId: string; improvement: number; sustainedRowIds: string[];
  sameSlopeDirection: boolean; passed: boolean;
}
export interface Transition {
  status: 'supported' | 'none' | 'ambiguous' | 'insufficient';
  estimate: number | null; range: [number, number] | null;
  improvement: number | null; baselineCriterion: number | null;
  candidate: Candidate | null; candidates: Candidate[];
  sustainedRowIds: string[]; noiseScale: number; reason: string;
  comparison: ModelComparison | null; sensitivity: Sensitivity | null;
  influenceCheck: InfluenceCheck | null;
}
export interface Finding {
  id: string; rule: 'model-fit' | 'transition' | 'sustained-residuals';
  category: 'supported' | 'descriptive' | 'inconclusive';
  title: string; summary: string; rowIds: string[]; columns: ('x' | 'y')[];
  evidence: EvidencePoint[]; parameters: { slope: number; intercept: number };
  statistics: Record<string, number | null>;
  transition: { estimate: number; range: [number, number] } | null;
  methodology: string; caveats: string[];
}
export interface AnalysisResult {
  experimentId?: string;
  config: ModelConfig; originalObservations: Measurement[]; measurements: Measurement[]; globalFit: Fit; referenceFit: Fit;
  referenceScope: 'early-region' | 'complete-data'; points: EvidencePoint[];
  transition: Transition; findings: Finding[];
}
// Future optional explanations consume this read-only evidence; proposed configurations require UI confirmation.
export interface ExplanationProvider { explain(result: Readonly<AnalysisResult>): Promise<string> }
