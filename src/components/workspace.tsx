'use client';
import { useRef, useState } from 'react';
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
  function startCustom() { advanceAnalysis(); setExperimentId('custom'); setCustomSession(null); setResult(null); setRows([]); setSelected([]); setFindingId(''); setError(''); setEdited(false); setDirty(false); setNoiseFloor(''); setIntercept(false); setNextId(1); }
  function acceptCustom(session: CustomSession) {
    advanceAnalysis();
    setCustomSession(session); setResult(session.analysis); setRows(session.analysis.originalObservations.map(r => ({ id: r.id, x: String(r.x), y: String(r.y) })));
    setIntercept(session.analysis.config.intercept); setNoiseFloor(session.settings.noiseFloor); setSelected(session.analysis.findings.find(f => f.id === 'transition')!.rowIds); setFindingId('transition'); setDirty(false); setEdited(false); setError('');
    setNextId(Math.max(0, ...session.table.rows.map(r => Number(r.id.slice(1)) || 0)) + 1);
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
  }
  function switchExperiment(id: ExperimentId | 'custom') {
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
  return <main className="scientific-workspace">
    <a className="skip-link" href="#analysis-content">Skip to analysis</a>
    <header className="topbar"><Link href="/" className="brand" aria-label="ModelScope home">ModelScope</Link><span className="top-divider" /><span className="workspace-label">ANALYSIS WORKSPACE</span><a className="workspace-method" href="https://github.com/luiscontrerasus-glitch/ModelScope/blob/main/docs/methodology.md" target="_blank" rel="noreferrer">Methodology ↗</a><span className="local-label"><i />Local · deterministic</span></header>
    <div className="workspace-intro" id="analysis-content"><div><div className="breadcrumb">{experiment.category.toUpperCase()} <span>/</span> {isCustom ? 'CUSTOM DATASET' : `EXPERIMENT ${String(experiments.findIndex(e => e.id === experimentId) + 1).padStart(2, '0')}`}</div><h1>{isCustom ? 'Analyze your data' : experiment.title}</h1></div><div className="intro-actions"><button className="secondary" onClick={startCustom}>Import data</button><button className="secondary" disabled={!result || dirty} onClick={exportEvidence}>Export evidence ↓</button>{(!isCustom || customSession) && <button className="primary" onClick={run}>Run analysis <span aria-hidden="true">↗</span></button>}</div></div>
    <section className="configuration" aria-label="Experiment configuration">
      <div className="experiment-picker"><label htmlFor="experiment">EXPERIMENT</label><select id="experiment" value={experimentId} onChange={e => switchExperiment(e.target.value as ExperimentId | 'custom')}>{experiments.map(e => <optgroup key={e.id} label={{ 'spring-hooke': 'Mechanics', pendulum: 'Physics approximation', 'beer-lambert': 'Chemistry', 'sensor-calibration': 'Engineering instrumentation' }[e.id]}><option value={e.id}>{e.title}</option></optgroup>)}<option value="custom">Analyze your data</option></select></div>
      {isCustom ? <><div><label htmlFor="model">CONFIGURED RELATIONSHIP</label><output id="model" className="fixed-model">{customSession ? experiment.baseline.kind === 'constant' ? `Y = C · C = ${customSession.settings.constant}` : intercept ? 'Y = mX + b · fitted slope and offset' : 'Y = mX · fitted slope, fixed zero' : 'Choose data, variables and model below'}</output></div>{customSession && <div className="noise-setting"><label htmlFor="custom-workspace-noise">ASSUMED RESPONSE SCALE / {y.unit}</label><input id="custom-workspace-noise" type="number" min="0.000001" max="1000" step="any" aria-describedby="workspace-error" value={noiseFloor} onChange={e => { setNoiseFloor(e.target.value); invalidate(); }} /></div>}<div className="config-note">Deterministic calculations stay local. Optional AI sends requested context.{customSession && <button className="text-button" onClick={startCustom}>New custom dataset</button>}</div></> : <div><label htmlFor="model">CONFIGURED RELATIONSHIP</label>{experiment.config.baseline?.kind === 'pendulum-small-angle' ? <output id="model" className="fixed-model">{experiment.baseline.equation}<small>L = {experiment.config.baseline.length} m · g = {experiment.config.baseline.gravity} m/s² · fixed theory</small></output> : <><select id="model" value={intercept ? 'offset' : 'origin'} onChange={e => { setIntercept(e.target.value === 'offset'); invalidate(); }}><option value="origin">{experiment.baseline.originEquation} · fixed zero</option><option value="offset">{experiment.baseline.equation} · fitted offset</option></select><small className="model-assumption">{intercept ? 'Fits an empirical response offset.' : 'Assumes a correctly zeroed reference and response.'}</small></> }</div>}
      {!isCustom && <div className="noise-setting"><label htmlFor="noise">RESPONSE NOISE FLOOR / {y.unit}</label><input id="noise" aria-describedby="noise-assumption workspace-error" type="number" min="0.000001" step={experiment.config.noiseFloor / 2} value={noiseFloor} onChange={e => { setNoiseFloor(e.target.value); invalidate(); }} /></div>}
      {!isCustom && <div id="noise-assumption" className="config-note">Noise floor is an assumed response scale.<br />It is not measured uncertainty.</div>}
    </section>
    {isCustom && !customSession ? <CustomSetup onAnalyze={acceptCustom} /> : <>
    <section className="model-information" aria-label="Experiment and model information"><div><span className="eyebrow">{experiment.shortName.toUpperCase()} · {experiment.baseline.kind === 'linear' ? 'FITTED LINEAR MODEL' : 'FIXED THEORETICAL MODEL'}</span><h2>{experiment.question}</h2><p>{experiment.baseline.prediction}</p></div><details key={experimentId}><summary>Variables & assumptions</summary><p>{x.name}: {x.symbol} / {x.unit} · {y.name}: {y.symbol} / {y.unit}{y.unit === '1' ? ' (dimensionless)' : ''}</p><ul>{experiment.assumptions.map(a => <li key={a}>{a}</li>)}</ul><p>{experiment.expectedDomain}</p></details><span className="synthetic-label">{isCustom ? `User-supplied dataset · ${customSession!.table.inputMethod}${customSession!.table.syntheticExample ? ' · synthetic educational example' : ''}` : 'Synthetic educational dataset'}{edited ? ' · edited' : ''}</span></section>
    <div className="status-strip" role="status"><span className={`status-dot ${dirty ? 'pending' : ''}`} /><span>{dirty ? 'Measurements or configuration changed. Run analysis to refresh all evidence.' : result ? `${result.measurements.length} measurements analyzed · ${result.transition.status === 'supported' ? 'Candidate transition supported by the prototype rule' : result.transition.status === 'ambiguous' ? 'Ambiguous transition evidence · inspect the unmet safeguards' : result.transition.status === 'insufficient' ? 'Insufficient transition evidence' : 'No clear transition supported'}` : 'Synthetic educational dataset ready. Run analysis to calculate fits, residuals, and transition evidence.'}</span></div>
    <div id="workspace-error" aria-live="polite">{error && <div className="error-message" role="alert">{error}</div>}</div>
    <nav className="mobile-analysis-nav" aria-label="Jump to analysis"><a href="#model-plots">Plots</a><a href="#analysis-evidence">Evidence</a><a href="#measurements">Measurements</a></nav>
    <div className="workspace-grid">
      <section className="panel data-panel" id="measurements"><div className="panel-heading"><div><span className="eyebrow">INPUT</span><h2>Measurements</h2></div><span className="count-badge">{rows.length} rows</span></div>
        {!isCustom && <div className="data-controls"><label htmlFor="dataset">Example dataset</label><select id="dataset" value={sample} onChange={e => changeSample(e.target.value as DatasetKind)}><option value="transition">{experiment.datasetLabels.transition}</option><option value="linear">{experiment.datasetLabels.linear}</option></select></div>}
        <p className="data-caption">{isCustom ? 'Original input order retained. Analysis sorts internally.' : sample === 'linear' ? 'Model-consistent synthetic control for comparison.' : experiment.description}<br />{x.name} / {x.unit} · {y.name} / {y.unit}</p>
        <div className="table-scroll" ref={tableScrollRef}><table className="measurement-table"><thead><tr><th>Row</th><th>{x.symbol} / {x.unit}</th><th>{y.symbol} / {y.unit}</th><th><span className="sr-only">Remove</span></th></tr></thead><tbody>{rows.map(row => <tr id={`row-${row.id}`} key={row.id} className={!dirty && selected.includes(row.id) ? 'selected-row' : ''}><td><button className="row-button" disabled={dirty || !result} onClick={() => selectRow(row.id)} aria-label={`Select measurement ${row.id}`} aria-pressed={!dirty && selected.includes(row.id)}>{row.id}</button></td><td><input aria-describedby="workspace-error" type="number" step={x.step} min={x.min} max={x.max} aria-label={`${row.id} ${x.name.toLowerCase()} in ${x.spokenUnit}`} value={row.x} onChange={e => { setRows(rows.map(r => r.id === row.id ? { ...r, x: e.target.value } : r)); invalidate(true); }} /></td><td><input aria-describedby="workspace-error" type="number" step={y.step} aria-label={`${row.id} ${y.name.toLowerCase()} in ${y.spokenUnit}`} value={row.y} onChange={e => { setRows(rows.map(r => r.id === row.id ? { ...r, y: e.target.value } : r)); invalidate(true); }} /></td><td><button className="remove-row" aria-label={`Remove ${row.id}`} onClick={() => { setRows(rows.filter(r => r.id !== row.id)); invalidate(true); }}>×</button></td></tr>)}</tbody></table></div>
        <div className="table-footer"><button className="text-button" disabled={rows.length >= 500} onClick={() => { setRows([...rows, { id: `M${String(nextId).padStart(2, '0')}`, x: '', y: '' }]); setNextId(nextId + 1); invalidate(true); }}>+ Add measurement</button><button className="text-button" onClick={() => { if (isCustom) { setRows([]); invalidate(true); } else changeSample(sample); }}>{isCustom ? 'Clear dataset' : 'Reset'}</button></div>
        <div className="assumptions"><span className="eyebrow">BEFORE YOU INTERPRET</span><p>{experiment.expectedDomain}</p><p>{isCustom ? 'Metadata and the response scale are user assumptions. No physical mechanism is inferred.' : 'These measurements illustrate a method. They are not laboratory validation.'}</p></div>
      </section>
      <div className="visualization-column" id="model-plots">
        {result && !(isCustom && dirty) ? <><section className="fit-summary" aria-label="Fitted model summary"><div className="equation"><span className="eyebrow">{result.config.baseline ? 'FIXED THEORETICAL REFERENCE' : result.referenceScope === 'early-region' ? 'EARLY-REGION REFERENCE' : 'COMPLETE-DATA REFERENCE'}</span><strong>{referenceEquation(experiment, result)}</strong><small>{!result.config.baseline && `${experiment.baseline.parameters[0].symbol} in ${experiment.slopeUnit} · `}{x.symbol} in {x.unit} · {y.symbol} in {y.unit} · reference n = {result.referenceFit.n}</small></div><div><span className="eyebrow">REF. RMSE / {y.unit}</span><strong>{result.referenceFit.rmse.toFixed(4)}</strong></div><div><span className="eyebrow">REF. R²</span><strong>{number(result.referenceFit.r2, 4)}</strong></div></section>
          {dirty && <p className="stale-label">Plots below show the last analyzed snapshot.</p>}
          <div className="selected-readout" role="status">{selectedPoint ? <><b>{selectedPoint.id}</b> · {x.symbol} = {selectedPoint.x.toFixed(Math.max(4, x.decimals))} {x.unit} · {y.symbol} = {selectedPoint.y.toFixed(Math.max(4, y.decimals))} {y.unit} · predicted = {selectedPoint.predicted.toFixed(Math.max(4, y.decimals))} {y.unit} · residual = {selectedPoint.residual.toFixed(Math.max(4, y.decimals))} {y.unit}</> : dirty ? 'Selection paused. Run analysis to refresh the evidence.' : selected.length ? `${selected.length} linked measurements selected. Choose one point or row to inspect its exact values.` : 'Choose a measurement or finding to inspect linked evidence.'}</div>
          <Plots experiment={experiment} result={result} selected={dirty ? [] : selected} onSelect={id => !dirty && selectRow(id)} />
          <div className="global-fit-note">Complete-data {result.config.baseline ? 'theoretical baseline' : 'fit'}: {modelParameters(experiment, result, 'complete').filter(p => p.key === 'slope' || p.key === 'intercept' || p.key === 'period' || p.key === 'constant').map(p => `${p.symbol} = ${p.value.toFixed(4)} ${p.unit}`).join(' · ')} · RMSE = {result.globalFit.rmse.toFixed(4)} {y.unit} · centered R² = {number(result.globalFit.r2, 4)}. R² alone does not establish model adequacy.</div></> : <section className="panel empty-plot"><span className="eyebrow">YOUR ANALYSIS STARTS HERE</span><div className="empty-axis" aria-hidden="true"><span>{y.symbol}</span><div className="empty-line" /><span>{x.symbol}</span></div><h2>One model. Every measurement.</h2><p>{isCustom && dirty ? 'Data or settings changed. Previous plots are hidden. Correct validation issues and rerun to replace evidence.' : 'Run analysis to compare the measured response with the configured baseline and inspect the residual pattern.'}</p><button className="primary" onClick={run}>Run analysis ↗</button><small>All calculations run locally in your browser.</small></section>}
        <section className="interpretation-note"><span className="eyebrow">SCIENTIFIC CONTEXT</span><p>{experiment.context}</p></section>
      </div>
      <aside className="panel diagnostics" id="analysis-evidence"><div className="panel-heading"><div><span className="eyebrow">OUTPUT / TRACEABILITY</span><h2>Evidence</h2></div><span className="count-badge">{result?.findings.length ?? '—'}</span></div>
        {result && !dirty && <div className="transition-summary"><span className={`outcome-label ${result.transition.status}`}>{result.transition.status === 'supported' ? 'Supported transition' : result.transition.status === 'ambiguous' ? 'Ambiguous evidence' : result.transition.status === 'insufficient' ? 'Insufficient evidence' : 'No clear transition'}</span>{result.transition.estimate !== null && <strong>{result.transition.estimate.toFixed(x.decimals)} <small>{x.unit}</small></strong>}{result.transition.range && <p>Transition sensitivity range<br /><b>{result.transition.range.map(v => v.toFixed(x.decimals)).join(' – ')} {x.unit}</b></p>}<p className="summary-caveat">Prototype rule · candidate location,<br />not a physical limit or confidence interval.</p></div>}
        {result ? <><details className="finding-navigation"><summary>All findings</summary><div className="finding-list">{result.findings.map(f => <button key={f.id} disabled={dirty} className={`finding-button ${findingId === f.id ? 'active' : ''}`} onClick={() => { setFindingId(f.id); setSelected(f.rowIds); const first = f.rowIds[0]; if (first) { const container = tableScrollRef.current; const row = document.getElementById(`row-${first}`); if (container && row) container.scrollTop += row.getBoundingClientRect().top - container.getBoundingClientRect().top - 42; } }} aria-pressed={findingId === f.id}><span className={`finding-category ${f.category}`}>{f.category === 'supported' ? 'SUPPORTED BY RULE' : f.category.toUpperCase()}</span><strong>{f.title}</strong><span>{f.rowIds.length ? `${f.rowIds.length} linked measurements` : 'Inspect method and comparison'}</span><span className="finding-arrow" aria-hidden="true">↗</span></button>)}</div></details>{dirty ? <p className="stale-evidence">Evidence is paused while measurements are edited. Run analysis to replace the previous findings.</p> : finding && <Evidence key={`${experimentId}-${analysisRevision}-${finding.id}`} analysisVersion={`analysis-${analysisRevision}`} finding={finding} result={result} experiment={experiment} disabled={dirty} onSelect={selectRow} />}</> : <div className="empty-evidence"><span className="empty-number">∑</span><h3>Evidence, before explanation.</h3><p>Every finding links to calculated values and the exact measurements behind it.</p><p>Choose a finding after analysis to highlight its rows in both plots and the table.</p></div>}
      </aside>
    </div>
    </>}
    <footer className="workspace-footer"><span>ModelScope <span className="footer-separator">/</span> Equations have limits. Find them.</span><span>Prototype · one possible transition · no causal inference</span></footer>
  </main>;
}

