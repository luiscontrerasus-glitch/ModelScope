'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createCustomExport, createExperimentExport } from '@/lib/analysis/export';
import type { AnalysisResult, Finding } from '@/lib/analysis/types';
import { analyzeExperiment, createExperimentSession, modelParameters, referenceEquation } from '@/lib/experiments/analysis';
import { experiments, getExperiment } from '@/lib/experiments/registry';
import type { DatasetKind, ExperimentDefinition, ExperimentId } from '@/lib/experiments/types';
import { EvidenceExplanation } from './ai-assistance';
import { evidenceContext } from '@/lib/ai/contracts';
import { Plots } from './plots';
import { CustomSetup } from './custom-setup';
import { analyzeCustomMeasurements, customDefinition, defaultSettings, type CustomSession } from '@/lib/custom/analysis';
type EditableRow = { id: string; x: string; y: string };
const editable = (experiment: ExperimentDefinition, kind: DatasetKind): EditableRow[] => experiment.datasets[kind].map(r => ({ id: r.id, x: r.x.toFixed(experiment.independent.decimals), y: r.y.toFixed(experiment.dependent.decimals) }));
const number = (value: number | null, digits = 4) => value === null ? 'Undefined' : value.toFixed(digits);
function Evidence({ finding, result, experiment, onSelect, disabled, analysisVersion }: { analysisVersion: string; finding: Finding; result: AnalysisResult; experiment: ExperimentDefinition; onSelect: (id: string) => void; disabled: boolean }) {
  const x = experiment.independent; const y = experiment.dependent;
  const transitionFinding = finding.rule === 'transition';
  const comparison = transitionFinding ? result.transition.comparison : null;
  const sensitivity = transitionFinding ? result.transition.sensitivity : null;
  return <div className="evidence-detail"><span className="eyebrow">DETECTED BY MODELSCOPE</span><h3>{finding.title}</h3><p>{finding.summary}</p>
    {comparison && <div className="comparison-summary"><span className="eyebrow">SAME {result.measurements.length} OBSERVATIONS</span><table><thead><tr><th>Model</th><th>SSE / {experiment.sseUnit}</th><th>RMSE / {y.unit}</th></tr></thead><tbody><tr><td>Baseline</td><td>{number(comparison.singleSse)}</td><td>{number(comparison.singleRmse)}</td></tr><tr><td>With hinge</td><td>{number(comparison.segmentedSse)}</td><td>{number(comparison.segmentedRmse)}</td></tr></tbody></table><p>Penalty-adjusted improvement: <b>{number(comparison.improvement, 2)}</b> / required 10.</p></div>}
    {finding.transition && <p className="evidence-range">Best candidate: <b>{number(finding.transition.estimate, x.decimals)} {x.unit}</b><br />Transition sensitivity range: <b>{finding.transition.range.map(v => number(v, x.decimals)).join('–')} {x.unit}</b></p>}
    {sensitivity && <p className="sensitivity-explainer">Near-best tested knees: {sensitivity.nearBestKnees.map(v => number(v, x.decimals)).join(', ')} {x.unit}. Range includes neighboring measurements for sampling resolution, not a confidence interval.</p>}
    <details><summary>Evidence · statistics & method</summary><dl className="stat-list">{modelParameters(experiment, result).map(p => <div key={p.key}><dt>{p.name} · {p.symbol} / {p.unit} ({p.treatment})</dt><dd>{number(p.value, p.key === 'period' ? 5 : 4)}</dd></div>)}
      {Object.entries(finding.statistics).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{number(value)}</dd></div>)}</dl>
    <p>{finding.methodology}</p><ul>{finding.caveats.map(c => <li key={c}>{c}</li>)}</ul>
    {transitionFinding && result.transition.influenceCheck && <p className="influence-note">Influential-observation check: diagnostic omission of <b>{result.transition.influenceCheck.omittedRowId}</b> {result.transition.influenceCheck.passed ? 'retains support' : 'does not retain support'}. All observations remain in the reported fits.</p>}
    {transitionFinding && result.transition.candidates.length > 0 && <><h4>Candidate search profile</h4><p>Δ criterion is relative to the best candidate. Near-best means Δ ≤ 2.</p><div className="candidate-table-wrap"><table className="candidate-table"><thead><tr><th>Knee / {x.unit}</th><th>Criterion</th><th>Δ criterion</th></tr></thead><tbody>{result.transition.candidates.map(c => <tr key={c.knee} className={c.deltaFromBest <= 2 ? 'near-best' : ''}><td><button disabled={disabled} onClick={() => onSelect(result.measurements.find(r => r.x === c.knee)!.id)}>{number(c.knee, x.decimals)}</button></td><td>{number(c.criterion, 3)}</td><td>{number(c.deltaFromBest, 3)}</td></tr>)}</tbody></table></div></>}
    </details>
    {finding.evidence.length > 0 && <details open><summary>Supporting measurements ({finding.evidence.length})</summary><div className="evidence-table-wrap"><table className="evidence-table"><thead><tr><th>Row / {x.symbol} ({x.unit})</th><th>{y.symbol} ({y.unit})</th><th>Pred. ({y.unit})</th><th>Δ{y.symbol} ({y.unit})</th><th>Δ / scale</th></tr></thead><tbody>{finding.evidence.map(p => <tr key={p.id}><td><button disabled={disabled} onClick={() => onSelect(p.id)}>{p.id} / {p.x.toFixed(x.decimals)}</button></td><td>{p.y.toFixed(Math.max(4, y.decimals))}</td><td>{p.predicted.toFixed(Math.max(4, y.decimals))}</td><td>{p.residual.toFixed(Math.max(4, y.decimals))}</td><td>{p.normalizedResidual.toFixed(3)}</td></tr>)}</tbody></table></div></details>}
    <EvidenceExplanation key={`${analysisVersion}-${finding.id}`} context={evidenceContext(result, finding, experiment, analysisVersion)} />
  </div>;
}
export function Workspace({ initialExperiment }: { initialExperiment?: ExperimentId | 'custom' } = {}) {
  // Direct exhibition links use the same session factory as the experiment picker.
  const [initialSession] = useState(() => initialExperiment && initialExperiment !== 'custom' ? createExperimentSession(initialExperiment) : null);
  const initialDefinition = getExperiment(initialExperiment && initialExperiment !== 'custom' ? initialExperiment : 'spring-hooke');
  const [analysisRevision, setAnalysisRevision] = useState(0);
  const advanceAnalysis = () => setAnalysisRevision(v => v + 1);
  const [experimentId, setExperimentId] = useState<ExperimentId | 'custom'>(initialExperiment ?? 'spring-hooke');
  const [customSession, setCustomSession] = useState<CustomSession | null>(null);
  const isCustom = experimentId === 'custom';
  const experiment = isCustom ? customSession?.experiment ?? customDefinition(defaultSettings()) : getExperiment(experimentId);
  const x = experiment.independent; const y = experiment.dependent;
  const [rows, setRows] = useState<EditableRow[]>(() => initialExperiment === 'custom' ? [] : editable(initialDefinition, 'transition'));
  const [result, setResult] = useState<AnalysisResult | null>(initialSession?.analysis ?? null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>(initialSession?.analysis.findings.find(f => f.id === 'transition')?.rowIds ?? []);
  const [findingId, setFindingId] = useState('transition');
  const [intercept, setIntercept] = useState<boolean>(initialDefinition.config.intercept);
  const [noiseFloor, setNoiseFloor] = useState(initialExperiment === 'custom' ? '' : String(initialDefinition.config.noiseFloor));
  const [sample, setSample] = useState<DatasetKind>('transition');
  const [edited, setEdited] = useState(false);
  const [nextId, setNextId] = useState(25);
  const [dataOpen, setDataOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [secondary, setSecondary] = useState<'residuals' | 'comparison' | 'evidence'>('residuals');
  const evidenceDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = evidenceDialog.current;
    if (evidenceOpen && dialog && !dialog.open) dialog.showModal();
    else if (!evidenceOpen && dialog?.open) dialog.close();
  }, [evidenceOpen]);
  useEffect(() => {
    if (!dataOpen || selected.length !== 1) return;
    const row = document.getElementById(`row-${selected[0]}`);
    const container = document.querySelector<HTMLDivElement>('#measurement-editor .table-scroll');
    if (container && row) container.scrollTop += row.getBoundingClientRect().top - container.getBoundingClientRect().top - 42;
  }, [dataOpen, selected]);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  function invalidate(dataEdited = false) { advanceAnalysis(); if (dataEdited) setEdited(true); setDirty(true); setError(''); setSelected([]); setFindingId(''); }
  function run() {
    advanceAnalysis();
    try {
      if (rows.some(r => !r.x.trim() || !r.y.trim())) throw new Error(`Complete every ${x.name.toLowerCase()} and ${y.name.toLowerCase()} field before running analysis.`);
      if (!noiseFloor.trim()) throw new Error('Enter a positive response noise floor.');
      const measurements = rows.map(r => ({ id: r.id, x: Number(r.x), y: Number(r.y) }));
      const settings = customSession ? { ...customSession.settings, noiseFloor } : null;
      const computed = isCustom && settings ? analyzeCustomMeasurements(measurements, settings) : analyzeExperiment(experimentId as ExperimentId, measurements, { intercept, noiseFloor: Number(noiseFloor) });
      if (isCustom && settings && customSession) setCustomSession({ ...customSession, settings, experiment: customDefinition(settings), analysis: computed, edited });
      setResult(computed); setDirty(false); setError(''); setFindingId('transition'); setSelected(computed.findings.find(f => f.id === 'transition')!.rowIds);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to analyze these measurements.'); }
  }
  function changeSample(kind: DatasetKind) { advanceAnalysis(); setSample(kind); setRows(editable(experiment, kind)); setNextId(25); setResult(null); setDirty(false); setError(''); setSelected([]); setEdited(false); setFindingId('transition'); }
  function startCustom() { setEvidenceOpen(false); setDataOpen(false); advanceAnalysis(); setExperimentId('custom'); setCustomSession(null); setResult(null); setRows([]); setSelected([]); setFindingId(''); setError(''); setEdited(false); setDirty(false); setNoiseFloor(''); setIntercept(false); setNextId(1); }
  function acceptCustom(session: CustomSession) {
    advanceAnalysis();
    setCustomSession(session); setResult(session.analysis); setRows(session.analysis.originalObservations.map(r => ({ id: r.id, x: String(r.x), y: String(r.y) })));
    setIntercept(session.analysis.config.intercept); setNoiseFloor(session.settings.noiseFloor); setSelected(session.analysis.findings.find(f => f.id === 'transition')!.rowIds); setFindingId('transition'); setDirty(false); setEdited(false); setError('');
    setNextId(Math.max(0, ...session.table.rows.map(r => Number(r.id.slice(1)) || 0)) + 1);
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
  }
  function switchExperiment(id: ExperimentId | 'custom') {
    setEvidenceOpen(false); setDataOpen(false); setSecondary('residuals');
    if (id === 'custom') { startCustom(); return; }
    advanceAnalysis();
    const session = createExperimentSession(id);
    setExperimentId(id); setRows(editable(getExperiment(id), session.dataset)); setSample(session.dataset);
    setIntercept(session.config.intercept); setNoiseFloor(String(session.config.noiseFloor)); setNextId(25);
    setResult(session.analysis); setSelected(session.analysis.findings.find(f => f.id === 'transition')!.rowIds);
    setCustomSession(null);
    setDirty(false); setError(''); setEdited(false); setFindingId('transition');
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
  }
  function selectRow(id: string) {
    setSelected([id]);
    // Scroll only the data pane: selecting a plot point must not move the workspace.
    const container = tableScrollRef.current;
    const row = document.getElementById(`row-${id}`);
    if (container && row) container.scrollTop += row.getBoundingClientRect().top - container.getBoundingClientRect().top - 42;
  }
  function exportEvidence() {
    if (!result || dirty) return;
    const output = isCustom && customSession ? createCustomExport(result, customSession, edited) : createExperimentExport(result, experiment, { synthetic: true, dataset: sample, edited });
    const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'modelscope-analysis.json'; link.click(); URL.revokeObjectURL(url);
  }
  const finding = result?.findings.find(f => f.id === findingId);
  const selectedPoint = !dirty && selected.length === 1 ? result?.points.find(p => p.id === selected[0]) : null;
  const experimentPicker = <label className="experiment-picker">EXPERIMENT<select aria-label="EXPERIMENT" value={experimentId} onChange={e => switchExperiment(e.target.value as ExperimentId | 'custom')}>{experiments.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}<option value="custom">Analyze your data</option></select></label>;
  const currentResult = result && !dirty;
  const comparison = result?.transition.comparison;
  const transition = result?.transition;
  const checks = result ? <dl className="result-checks"><div><dt>Model improvement</dt><dd>{number(comparison?.improvement ?? null, 2)}</dd></div><div><dt>Persistence</dt><dd>{transition?.sustainedRowIds.length ? 'Passed' : transition?.status === 'insufficient' ? 'Not available' : 'Not established'}</dd></div><div><dt>Influence safeguard</dt><dd>{transition?.influenceCheck?.passed ? 'Passed' : transition?.influenceCheck ? 'Not passed' : 'Not available'}</dd></div></dl> : null;
  return <main className="scientific-workspace graph-workspace">
    <a className="skip-link" href="#analysis-content">Skip to analysis</a>
    <header className="workspace-header"><Link href="/" className="brand" aria-label="ModelScope home">ModelScope</Link><span className="header-slash">/</span><h1>{isCustom ? 'Custom data analysis' : experiment.title}</h1><div className="intro-actions"><button className="secondary" onClick={startCustom}>Import</button><button className="secondary" disabled={!result || dirty} onClick={exportEvidence}>Export</button>{(!isCustom || customSession) && <button className="primary" onClick={run}>Run analysis <span aria-hidden="true">→</span></button>}</div></header>
    <div className="workspace-body" id="analysis-content">
    <section className="configuration compact-configuration" aria-label="Experiment configuration">
      <div><label htmlFor="model">Model</label>{isCustom ? <output id="model" className="fixed-model">{customSession ? experiment.baseline.kind === 'constant' ? `Y = C · C = ${customSession.settings.constant}` : intercept ? 'Y = mX + b' : 'Y = mX' : 'Choose a model below'}</output> : experiment.config.baseline?.kind === 'pendulum-small-angle' ? <output id="model" className="fixed-model">{experiment.baseline.equation}</output> : <select id="model" value={intercept ? 'offset' : 'origin'} onChange={e => { setIntercept(e.target.value === 'offset'); invalidate(); }}><option value="origin">{experiment.baseline.originEquation} · fixed zero</option><option value="offset">{experiment.baseline.equation} · fitted offset</option></select>}</div>
      {(!isCustom || customSession) && <div className="noise-setting"><label htmlFor="noise">Reference scale / {y.unit}</label><input id="noise" aria-describedby="noise-assumption workspace-error" type="number" min="0.000001" step={isCustom ? 'any' : experiment.config.noiseFloor / 2} value={noiseFloor} onChange={e => { setNoiseFloor(e.target.value); invalidate(); }} /></div>}
      <details className="workspace-assumptions"><summary>Assumptions <span aria-hidden="true">⌄</span></summary><div><h2>{experiment.question}</h2><p>{experiment.baseline.prediction}</p><p>{x.name}: {x.symbol} / {x.unit} · {y.name}: {y.symbol} / {y.unit}</p><p id="noise-assumption">Reference scale is an assumed response noise floor, not measured uncertainty.</p><ul>{experiment.assumptions.map(a => <li key={a}>{a}</li>)}</ul><p>{experiment.expectedDomain}</p><p>{experiment.context}</p><Link href="/methodology">Read the methodology →</Link></div></details>
      <span className="dataset-origin">{isCustom ? 'User-supplied data' : 'Synthetic educational data'}{edited ? ' · edited' : ''}</span>
    </section>
    {isCustom && !customSession ? <>{experimentPicker}<CustomSetup onAnalyze={acceptCustom} /></> : <>
    <div className="workspace-status" role="status">{dirty ? 'Data or configuration changed. Run analysis to refresh evidence.' : !result ? 'Ready to analyze. Run analysis to calculate the model and evidence.' : null}</div><div id="workspace-error" aria-live="polite">{error && <div className="error-message" role="alert">{error}</div>}</div>
    <div className="analysis-primary">
      <section className="primary-graph" id="model-plots" aria-label="Model fit">
        <div className="graph-heading"><div><h2>Model fit</h2><p>{y.name} ({y.unit}) vs. {x.name.toLowerCase()} ({x.unit})</p></div>{result && !(isCustom && dirty) && <output className="reference-equation">{referenceEquation(experiment, result)}</output>}</div>
        {result && !(isCustom && dirty) ? <><Plots view="model" experiment={experiment} result={result} selected={dirty ? [] : selected} onSelect={id => !dirty && selectRow(id)} />          <div className="selected-readout" role="status">{selectedPoint ? <><b>{selectedPoint.id}</b> · {x.symbol} = {selectedPoint.x.toFixed(Math.max(4, x.decimals))} {x.unit} · {y.symbol} = {selectedPoint.y.toFixed(Math.max(4, y.decimals))} {y.unit} · predicted = {selectedPoint.predicted.toFixed(Math.max(4, y.decimals))} {y.unit} · residual = {selectedPoint.residual.toFixed(Math.max(4, y.decimals))} {y.unit}</> : dirty ? 'Selection paused. Run analysis to refresh the evidence.' : selected.length ? `${selected.length} linked measurements selected. Choose one point or row to inspect its exact values.` : 'Choose a measurement or finding to inspect linked evidence.'}</div>
</> : <div className="workspace-empty"><p>{isCustom && dirty ? 'Previous plots are hidden until the edited data is analyzed.' : 'Compare measurements with the configured model.'}</p><button className="primary" onClick={run}>Run analysis</button></div>}
      </section>
      <aside className="primary-result" aria-label="Analysis result"><h2>Result</h2>{currentResult && transition ? <><span className={`outcome-label ${transition.status}`}>{transition.status === 'supported' ? 'Supported transition' : transition.status === 'ambiguous' ? 'Ambiguous evidence' : transition.status === 'insufficient' ? 'Insufficient evidence' : 'No clear transition'}</span>{transition.estimate !== null && <strong className="result-location">~{transition.estimate.toFixed(x.decimals)} <small>{x.unit}</small></strong>}{transition.range && <p className="result-range">Sensitivity range<br /><b>{transition.range.map(v => v.toFixed(x.decimals)).join('–')} {x.unit}</b></p>}{checks}<button className="evidence-entry" onClick={() => setEvidenceOpen(true)}>View full evidence <span aria-hidden="true">→</span></button></> : <><p>{dirty ? 'Evidence needs a refresh.' : 'Run analysis to inspect the result.'}</p><button className="evidence-entry" disabled onClick={() => setEvidenceOpen(true)}>View full evidence</button></>}</aside>
    </div>
    <section className="analysis-secondary" aria-label="Secondary analysis"><div className="analysis-tabs" role="tablist" aria-label="Analysis views">{(['residuals','comparison','evidence'] as const).map(tab => <button key={tab} id={`tab-${tab}`} role="tab" aria-selected={secondary === tab} aria-controls={`panel-${tab}`} tabIndex={secondary === tab ? 0 : -1} onClick={() => setSecondary(tab)} onKeyDown={e => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); const tabs = ['residuals','comparison','evidence'] as const; const i = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (tabs.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3; setSecondary(tabs[i]); document.getElementById(`tab-${tabs[i]}`)?.focus(); } }}>{tab === 'residuals' ? 'Residuals' : tab === 'comparison' ? 'Model comparison' : 'Evidence'}</button>)}</div>
      <div role="tabpanel" id={`panel-${secondary}`} aria-labelledby={`tab-${secondary}`} tabIndex={0}>
      {result && !(isCustom && dirty) ? secondary === 'residuals' ? <Plots view="residual" experiment={experiment} result={result} selected={dirty ? [] : selected} onSelect={id => !dirty && selectRow(id)} /> : secondary === 'comparison' ? <div className="comparison-view"><h3>Same {result.measurements.length} observations</h3><table><thead><tr><th>Model</th><th>SSE / {experiment.sseUnit}</th><th>RMSE / {y.unit}</th><th>R²</th></tr></thead><tbody><tr><th>Complete-data baseline</th><td>{number(result.globalFit.sse)}</td><td>{number(result.globalFit.rmse)}</td><td>{number(result.globalFit.r2)}</td></tr>{comparison && <tr><th>Segmented alternative</th><td>{number(comparison.segmentedSse)}</td><td>{number(comparison.segmentedRmse)}</td><td>—</td></tr>}<tr><th>Plotted reference ({result.referenceFit.n} points)</th><td>{number(result.referenceFit.sse)}</td><td>{number(result.referenceFit.rmse)}</td><td>{number(result.referenceFit.r2)}</td></tr></tbody></table><p>Complete-data parameters: {modelParameters(experiment, result, 'complete').map(p => `${p.symbol} = ${number(p.value)} ${p.unit}`).join(' · ')}. R² alone does not establish adequacy.</p></div> : <div className="checks-view"><h3>Deterministic supporting checks</h3>{dirty ? <p>Run analysis to refresh evidence.</p> : <>{checks}<p>Candidate location and sampling sensitivity describe model disagreement; they do not establish a physical cause or a confidence interval.</p><button className="evidence-entry" onClick={() => setEvidenceOpen(true)}>View full evidence →</button></>}</div> : <p className="secondary-empty">Run analysis to inspect {secondary === 'comparison' ? 'model comparison' : secondary}.</p>}
      </div>
    </section>
    <section className="measurements-panel" id="measurements"><div className="measurements-heading"><h2>Measurements <span>{rows.length} rows</span></h2><button className="secondary" aria-expanded={dataOpen} aria-controls="measurement-editor" onClick={() => setDataOpen(v => !v)}>{dataOpen ? 'Close data' : 'Open data'} <span aria-hidden="true">{dataOpen ? '−' : '+'}</span></button></div>
      {dataOpen && <div id="measurement-editor">{experimentPicker}        {!isCustom && <div className="data-controls"><label htmlFor="dataset">Example dataset</label><select id="dataset" value={sample} onChange={e => changeSample(e.target.value as DatasetKind)}><option value="transition">{experiment.datasetLabels.transition}</option><option value="linear">{experiment.datasetLabels.linear}</option></select></div>}
        <p className="data-caption">{isCustom ? 'Original input order retained. Analysis sorts internally.' : sample === 'linear' ? 'Model-consistent synthetic control for comparison.' : experiment.description}<br />{x.name} / {x.unit} · {y.name} / {y.unit}</p>
        <div className="table-scroll" ref={tableScrollRef}><table className="measurement-table"><thead><tr><th>Row</th><th>{x.symbol} / {x.unit}</th><th>{y.symbol} / {y.unit}</th><th><span className="sr-only">Remove</span></th></tr></thead><tbody>{rows.map(row => <tr id={`row-${row.id}`} key={row.id} className={!dirty && selected.includes(row.id) ? 'selected-row' : ''}><td><button className="row-button" disabled={dirty || !result} onClick={() => selectRow(row.id)} aria-label={`Select measurement ${row.id}`} aria-pressed={!dirty && selected.includes(row.id)}>{row.id}</button></td><td><input aria-describedby="workspace-error" type="number" step={x.step} min={x.min} max={x.max} aria-label={`${row.id} ${x.name.toLowerCase()} in ${x.spokenUnit}`} value={row.x} onChange={e => { setRows(rows.map(r => r.id === row.id ? { ...r, x: e.target.value } : r)); invalidate(true); }} /></td><td><input aria-describedby="workspace-error" type="number" step={y.step} aria-label={`${row.id} ${y.name.toLowerCase()} in ${y.spokenUnit}`} value={row.y} onChange={e => { setRows(rows.map(r => r.id === row.id ? { ...r, y: e.target.value } : r)); invalidate(true); }} /></td><td><button className="remove-row" aria-label={`Remove ${row.id}`} onClick={() => { setRows(rows.filter(r => r.id !== row.id)); invalidate(true); }}>×</button></td></tr>)}</tbody></table></div>
        <div className="table-footer"><button className="text-button" disabled={rows.length >= 500} onClick={() => { setRows([...rows, { id: `M${String(nextId).padStart(2, '0')}`, x: '', y: '' }]); setNextId(nextId + 1); invalidate(true); }}>+ Add measurement</button><button className="text-button" onClick={() => { if (isCustom) { setRows([]); invalidate(true); } else changeSample(sample); }}>{isCustom ? 'Clear dataset' : 'Reset'}</button></div>
</div>}
    </section>
    <dialog ref={evidenceDialog} className="full-evidence" aria-labelledby="full-evidence-heading" onCancel={() => setEvidenceOpen(false)} onClose={() => setEvidenceOpen(false)}><div className="evidence-dialog-heading"><h2 id="full-evidence-heading">Full evidence</h2><button className="secondary" onClick={() => setEvidenceOpen(false)} autoFocus>Close evidence</button></div>{evidenceOpen && result && <>{dirty ? <p className="stale-evidence">Evidence is paused while measurements are edited. Run analysis to replace the previous findings.</p> : <><details className="finding-navigation"><summary>All findings</summary><div className="finding-list">{result.findings.map(f => <button key={f.id} disabled={dirty} className={`finding-button ${findingId === f.id ? 'active' : ''}`} onClick={() => { setFindingId(f.id); setSelected(f.rowIds); const first = f.rowIds[0]; if (first) { const container = tableScrollRef.current; const row = document.getElementById(`row-${first}`); if (container && row) container.scrollTop += row.getBoundingClientRect().top - container.getBoundingClientRect().top - 42; } }} aria-pressed={findingId === f.id}><span className={`finding-category ${f.category}`}>{f.category === 'supported' ? 'SUPPORTED BY RULE' : f.category.toUpperCase()}</span><strong>{f.title}</strong><span>{f.rowIds.length ? `${f.rowIds.length} linked measurements` : 'Inspect method and comparison'}</span><span className="finding-arrow" aria-hidden="true">↗</span></button>)}</div></details>{finding && <Evidence key={`${experimentId}-${analysisRevision}-${finding.id}`} analysisVersion={`analysis-${analysisRevision}`} finding={finding} result={result} experiment={experiment} disabled={dirty} onSelect={selectRow} />}</>}</>}</dialog>
    </>}
    </div><footer className="workspace-footer"><span>Calculations stay in your browser</span><div><Link href="/explore">Explore</Link><Link href="/methodology">Methodology</Link></div></footer>
  </main>;
}
