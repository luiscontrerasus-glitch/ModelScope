export interface Measurement { id: string; x: number; y: number }
export interface ModelConfig { intercept: boolean; noiseFloor: number }
export interface Fit { slope: number; intercept: number; sse: number; rmse: number; r2: number | null; n: number }
export interface EvidencePoint extends Measurement { predicted: number; residual: number; normalizedResidual: number }
export interface Candidate { knee: number; slope: number; intercept: number; slopeChange: number; sse: number; criterion: number }
export interface Transition {
  status: 'supported' | 'weak' | 'insufficient';
  estimate: number | null; range: [number, number] | null;
  improvement: number | null; baselineCriterion: number | null;
  candidate: Candidate | null; candidates: Candidate[];
  sustainedRowIds: string[]; noiseScale: number; reason: string;
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
  config: ModelConfig; measurements: Measurement[]; globalFit: Fit; referenceFit: Fit;
  referenceScope: 'early-region' | 'complete-data'; points: EvidencePoint[];
  transition: Transition; findings: Finding[];
}
// Future optional explanations consume this read-only evidence; proposed configurations require UI confirmation.
export interface ExplanationProvider { explain(result: Readonly<AnalysisResult>): Promise<string> }
