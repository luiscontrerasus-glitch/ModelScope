'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { explanationIsCurrent, validateExplanation, proposalSchema, validateProposal, type EvidenceContext, type Explanation, type Proposal } from '@/lib/ai/contracts';

export const AI_PRIVACY = 'Your full dataset stays in the browser. Optional AI setup sends your description and column headers; explanation sends the selected finding, summary statistics and caveats to Google Gemini. Free-tier inputs may be used to improve Google products. Avoid sensitive descriptions and labels.';
async function requestAI(kind: 'setup' | 'explain', data: unknown, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`/api/ai/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]) });
  const body: unknown = await response.json();
  if (!response.ok) throw new Error('Optional AI is unavailable. Your manual configuration and deterministic analysis are unaffected.');
  if (!body || typeof body !== 'object' || !('result' in body)) throw new Error('Unusable AI response. Continue with deterministic analysis.');
  return body.result;
}
export function SetupAssistant({ headers, onConfirm }: { headers: string[]; onConfirm: (p: Proposal) => void }) {
  const [description, setDescription] = useState(''); const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [proposalSource, setProposalSource] = useState('');
  const version = JSON.stringify(headers); const latest = useRef(version); useLayoutEffect(() => { latest.current = version; }, [version]);
  const generation = useRef(0); const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  function clear() { generation.current++; request.current?.abort(); setProposal(null); setBusy(false); setError(''); }
  async function suggest() {
    clear(); const token = generation.current; const source = version; const input = { description, headers };
    const controller = new AbortController(); request.current = controller; setBusy(true);
    try { const p = validateProposal(proposalSchema.parse(await requestAI('setup', input, controller.signal)), input); if (token === generation.current && latest.current === source) { setProposal(p); setProposalSource(source); } }
    catch { if (!controller.signal.aborted && token === generation.current) setError('Optional AI setup is unavailable or returned an unusable proposal. Configure the experiment manually.'); }
    finally { if (token === generation.current) setBusy(false); }
  }
  return <details className="ai-assistant"><summary>Optional AI · describe your experiment</summary><p>AI explains. ModelScope&apos;s analysis engine decides.</p><p className="field-help">{AI_PRIVACY}</p>
    <label htmlFor="ai-description">What did you measure, and what relationship do you expect?</label><textarea id="ai-description" rows={3} maxLength={2000} value={description} onChange={e => { clear(); setDescription(e.target.value); }} placeholder="I measured force in N against extension in m and expect proportionality." />
    <button className="secondary" disabled={busy || !description.trim()} onClick={() => void suggest()}>{busy ? 'Suggesting…' : 'Suggest setup'}</button>
    <div aria-live="polite">{error && <p role="status">{error}</p>}</div>
    {proposal && proposalSource === version && <div className="ai-proposal"><span className="eyebrow">AI PROPOSED SETUP · {proposal.status.replace('_', ' ').toUpperCase()}</span><p>{proposal.rationale}</p>
      {proposal.status !== 'unsupported' && <dl><div><dt>X</dt><dd>{proposal.xColumn ?? 'Column not identified'} → {proposal.xLabel ?? 'Review label'} / {proposal.xUnit ?? 'unspecified'}</dd></div><div><dt>Y</dt><dd>{proposal.yColumn ?? 'Column not identified'} → {proposal.yLabel ?? 'Review label'} / {proposal.yUnit ?? 'unspecified'}</dd></div><div><dt>Model</dt><dd>{proposal.modelFamily ?? 'Choose manually'}{proposal.modelFamily === 'constant' ? ` · C = ${proposal.constantValue} user supplied` : proposal.modelFamily === 'linear-origin' ? ' · slope fitted, intercept fixed zero' : proposal.modelFamily === 'linear-offset' ? ' · slope and offset fitted' : ''}</dd></div></dl>}
      <ul>{[...proposal.assumptions, ...proposal.warnings].map((s, i) => <li key={i}>{s}</li>)}</ul><p>Reference scale remains your responsibility. Confirming fills the normal form; review and edit it before running analysis.</p>
      {proposal.status !== 'unsupported' && <button className="secondary" onClick={() => { onConfirm(proposal); clear(); }}>Confirm proposal into form</button>} <button className="text-button" onClick={clear}>Reject proposal</button>
    </div>}
  </details>;
}
export function EvidenceExplanation({ context }: { context: EvidenceContext }) {
  const [answer, setAnswer] = useState<Explanation | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [answerSource, setAnswerSource] = useState('');
  const current = JSON.stringify(context); const latest = useRef(current); useLayoutEffect(() => { latest.current = current; }, [current]);
  const generation = useRef(0); const request = useRef<AbortController | null>(null);
  useEffect(() => () => { request.current?.abort(); }, []);
  function dismiss() { generation.current++; request.current?.abort(); setAnswer(null); setError(''); setBusy(false); }
  async function explain() {
    dismiss(); const token = generation.current; const snapshot = current; const controller = new AbortController(); request.current = controller; setBusy(true);
    try { const e = validateExplanation(await requestAI('explain', { findingId: context.findingId, analysisVersion: context.analysisVersion, context }, controller.signal), context);
      if (token === generation.current && latest.current === snapshot && explanationIsCurrent(e, context.analysisVersion, [context.findingId])) { setAnswer(e); setAnswerSource(snapshot); }
    } catch { if (!controller.signal.aborted && token === generation.current && latest.current === snapshot) setError('AI explanation is temporarily unavailable. Your deterministic analysis is unaffected.'); }
    finally { if (token === generation.current) setBusy(false); }
  }
  return <div className="ai-explanation"><p className="field-help">{AI_PRIVACY}</p><button className="secondary" disabled={busy} onClick={() => void explain()}>{busy ? 'Explaining…' : error ? 'Retry explanation' : 'Explain evidence'}</button>
    <div aria-live="polite">{error && <p role="status">{error}</p>}{answer && answerSource === current && explanationIsCurrent(answer, context.analysisVersion, [context.findingId]) && <div><span className="eyebrow">AI EXPLANATION · OPTIONAL PROSE</span><p>{answer.explanation}</p><ul>{answer.whatToInspect.map(s => <li key={s}>{s}</li>)}</ul><p>{answer.caveat}</p></div>}</div>
    {(answer || error || busy) && <button className="text-button" onClick={dismiss}>Dismiss</button>}
  </div>;
}
