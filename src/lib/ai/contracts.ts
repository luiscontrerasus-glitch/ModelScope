import { z } from 'zod';
import type { AnalysisResult, Finding } from '../analysis/types';
import type { ExperimentDefinition } from '../experiments/types';
import type { CustomSettings } from '../custom/analysis';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => text(max).nullable();
export const setupRequestSchema = z.object({ description: text(2000), headers: z.array(text(120)).max(32) }).strict().refine(v => new Set(v.headers).size === v.headers.length, 'Headers must be unique.');
export const proposalSchema = z.object({
  status: z.enum(['supported', 'needs_review', 'unsupported']),
  xColumn: z.string().min(1).max(120).nullable(), yColumn: z.string().min(1).max(120).nullable(), xLabel: optionalText(80), yLabel: optionalText(80),
  xUnit: optionalText(30), yUnit: optionalText(30), xUnitEvidence: optionalText(200), yUnitEvidence: optionalText(200),
  modelFamily: z.enum(['linear-offset', 'linear-origin', 'constant']).nullable(),
  constantValue: z.number().finite().min(-1e6).max(1e6).nullable(), constantEvidence: optionalText(200),
  rationale: text(500), assumptions: z.array(text(240)).max(4), warnings: z.array(text(240)).max(4),
}).strict();
export type SetupRequest = z.infer<typeof setupRequestSchema>;
export type Proposal = z.infer<typeof proposalSchema>;

const ids = z.enum(['fit', 'transition', 'residuals']);
export const contextSchema = z.object({
  findingId: ids, analysisVersion: text(80), experiment: text(100), configuredModel: text(100),
  outcome: z.enum(['supported', 'ambiguous', 'none', 'insufficient']),
  category: z.enum(['supported', 'descriptive', 'inconclusive']), title: text(100), summary: text(2000),
  statistics: z.record(text(120), z.number().finite().nullable()).refine(v => Object.keys(v).length <= 20),
  caveats: z.array(text(500)).max(8),
}).strict().refine(v => v.findingId === 'fit' ? v.category === 'descriptive' : v.findingId === 'residuals' ? v.category === 'supported' && v.outcome === 'supported' : v.category === (v.outcome === 'supported' ? 'supported' : 'inconclusive'), 'Inconsistent finding identity.');
export const explainRequestSchema = z.object({ findingId: ids, analysisVersion: text(80), context: contextSchema }).strict().refine(v => v.findingId === v.context.findingId && v.analysisVersion === v.context.analysisVersion, 'Stale or unknown finding binding.');
export const explanationSchema = z.object({ findingId: ids, analysisVersion: text(80), explanation: text(700), whatToInspect: z.array(text(180)).min(1).max(3), caveat: text(300) }).strict();
export type EvidenceContext = z.infer<typeof contextSchema>;
export type Explanation = z.infer<typeof explanationSchema>;

function literal(source: string, value: string): boolean {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'u').test(source);
}
export function validateProposal(raw: unknown, request: SetupRequest): Proposal {
  const p = proposalSchema.parse(raw);
  if (/\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|half|quarter)\b|```|<script|javascript:|\b(?:noise|uncertainty|reference scale)\s*(?:=|of|is|:)\s*[-+.\d]/i.test([p.rationale, ...p.assumptions, ...p.warnings].join(' '))) throw new Error('Unusable setup prose.');
  for (const column of [p.xColumn, p.yColumn]) if (column !== null && !request.headers.includes(column)) throw new Error('Unknown column.');
  if (p.xColumn !== null && p.xColumn === p.yColumn) throw new Error('Duplicate mapping.');
  if (p.status === 'unsupported') {
    if ([p.xColumn, p.yColumn, p.xLabel, p.yLabel, p.xUnit, p.yUnit, p.xUnitEvidence, p.yUnitEvidence, p.modelFamily, p.constantValue, p.constantEvidence].some(v => v !== null)) throw new Error('Unsupported proposal must not configure a model.');
    return p;
  }
  const sources = [request.description, ...request.headers];
  for (const role of ['x', 'y'] as const) {
    const unit = p[`${role}Unit`]; const evidence = p[`${role}UnitEvidence`];
    if (unit !== null && (!evidence || !sources.some(s => s.includes(evidence)) || !literal(evidence, unit))) {
      p[`${role}Unit`] = null; p[`${role}UnitEvidence`] = null; p.status = 'needs_review';
      p.warnings = [...p.warnings.slice(0, 3), `${role.toUpperCase()} unit lacked literal source evidence and was removed.`];
    }
  }
  if (p.modelFamily === 'constant') {
    const e = p.constantEvidence;
    const explicit = e?.match(/(?:\bC\b|constant|expected value)\s*(?:=|is|of|:)\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)/i);
    if (p.constantValue === null || !e || !request.description.includes(e) || !explicit || Number(explicit[1]) !== p.constantValue) throw new Error('Constant requires explicit source value.');
  } else if (p.constantValue !== null || p.constantEvidence !== null) throw new Error('Unexpected constant.');
  if (!p.modelFamily || !p.xColumn || !p.yColumn) p.status = 'needs_review';
  return p;
}
export function applyProposal(current: CustomSettings, proposal: Proposal, headers: string[]): CustomSettings {
  if (proposal.status === 'unsupported') return current;
  for (const c of [proposal.xColumn, proposal.yColumn]) if (c && !headers.includes(c)) throw new Error('Proposal no longer matches source.');
  return { ...current, mapping: { ...current.mapping, x: proposal.xColumn ?? current.mapping.x, y: proposal.yColumn ?? current.mapping.y },
    x: { ...current.x, name: proposal.xLabel ?? current.x.name, unitKind: proposal.xUnit ? 'label' : 'unspecified', unit: proposal.xUnit ?? '' },
    y: { ...current.y, name: proposal.yLabel ?? current.y.name, unitKind: proposal.yUnit ? 'label' : 'unspecified', unit: proposal.yUnit ?? '' },
    model: proposal.modelFamily ?? current.model, constant: proposal.modelFamily === 'constant' ? String(proposal.constantValue) : current.constant,
    // Never propose, clear, estimate or overwrite the user's reference scale.
    noiseFloor: current.noiseFloor };
}
export function evidenceContext(result: AnalysisResult, finding: Finding, experiment: ExperimentDefinition, analysisVersion: string): EvidenceContext {
  if (!result.findings.includes(finding)) throw new Error('Unknown finding.');
  return contextSchema.parse({ findingId: finding.id, analysisVersion, experiment: experiment.shortName,
    configuredModel: experiment.baseline.kind === 'linear' && !result.config.intercept ? experiment.baseline.originEquation : experiment.baseline.equation,
    outcome: result.transition.status, category: finding.category, title: finding.title, summary: finding.summary,
    statistics: finding.statistics, caveats: finding.caveats.slice(0, 8) });
}
export function validateExplanation(raw: unknown, context: EvidenceContext): Explanation {
  const e = explanationSchema.parse(raw);
  if (e.findingId !== context.findingId || e.analysisVersion !== context.analysisVersion) throw new Error('Unknown or stale explanation.');
  const prose = [e.explanation, ...e.whatToInspect, e.caveat].join(' ');
  // Deliberately stricter than number matching: AI prose cannot contain numerical results at all.
  if (/\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|percent|causes|caused|proves?|proven|definitely|certainly|yield point|saturation point|elastic limit|critical concentration|physical threshold)\b/i.test(prose)) throw new Error('Unsupported numerical or causal claim.');
  if (/\b(?:supported|ambiguous|insufficient|inconclusive|severity|breakpoint|threshold)\b/i.test(prose)) throw new Error('AI cannot restate or change outcome.');
  return e;
}
export function explanationIsCurrent(e: Explanation, version: string, findingIds: string[]): boolean { return e.analysisVersion === version && findingIds.includes(e.findingId); }
