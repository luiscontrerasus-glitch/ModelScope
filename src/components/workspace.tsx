'use client';
import { useState } from 'react';
import Link from 'next/link';
import { analyze } from '@/lib/analysis';
import type { AnalysisResult, Finding } from '@/lib/analysis/types';
import { hookesLaw, springData } from '@/lib/experiments/hookes-law';
import { Plots } from './plots';
type EditableRow = { id: string; x: string; y: string };
const editable = (kind: 'linear' | 'transition'): EditableRow[] => springData(kind).map(r => ({ id: r.id, x: r.x.toFixed(3), y: r.y.toFixed(3) }));
const number = (value: number | null, digits = 4) => value === null ? 'Undefined' : value.toFixed(digits);
function equation(result: AnalysisResult) { const fit = result.referenceFit; return `F = ${fit.slope.toFixed(3)}x${result.config.intercept ? ` ${fit.intercept >= 0 ? '+' : '−'} ${Math.abs(fit.intercept).toFixed(4)}` : ''}`; }
function Evidence({ finding, onSelect }: { finding: Finding; onSelect: (id: string) => void }) {
  return <div className="evidence-detail"><span className="eyebrow">INSPECTABLE EVIDENCE</span><h3>{finding.title}</h3><p>{finding.summary}</p>
    <dl className="stat-list"><div><dt>Reference k / N m⁻¹</dt><dd>{number(finding.parameters.slope)}</dd></div><div><dt>Reference offset / N</dt><dd>{number(finding.parameters.intercept)}</dd></div>
      {Object.entries(finding.statistics).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{number(value)}</dd></div>)}</dl>
    {finding.transition && <p className="evidence-range">Candidate knee: <b>{number(finding.transition.estimate, 3)} m</b><br />Sensitivity region: <b>{finding.transition.range.map(v => number(v, 3)).join('–')} m</b></p>}
    <details open><summary>Method & caveats</summary><p>{finding.methodology}</p><ul>{finding.caveats.map(c => <li key={c}>{c}</li>)}</ul></details>
    {finding.evidence.length > 0 && <details open><summary>Measurements ({finding.evidence.length})</summary><div className="evidence-table-wrap"><table className="evidence-table"><thead><tr><th>Row / x (m)</th><th>F (N)</th><th>Pred. (N)</th><th>ΔF (N)</th><th>ΔF / scale</th></tr></thead><tbody>{finding.evidence.map(p => <tr key={p.id}><td><button onClick={() => onSelect(p.id)}>{p.id} / {p.x.toFixed(3)}</button></td><td>{p.y.toFixed(4)}</td><td>{p.predicted.toFixed(4)}</td><td>{p.residual.toFixed(4)}</td><td>{p.normalizedResidual.toFixed(3)}</td></tr>)}</tbody></table></div></details>}
  </div>;
}
export function Workspace() {
  const [rows, setRows] = useState<EditableRow[]>(() => editable('transition'));
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [findingId, setFindingId] = useState('transition');
  const [intercept, setIntercept] = useState(false);
  const [noiseFloor, setNoiseFloor] = useState('0.04');
  const [sample, setSample] = useState<'transition' | 'linear'>('transition');
  const [nextId, setNextId] = useState(25);
  function invalidate() { setDirty(true); setError(''); setSelected([]); }
  function run() {
    try {
      if (rows.some(r => !r.x.trim() || !r.y.trim())) throw new Error('Complete every extension and force field before running analysis.');
      if (!noiseFloor.trim()) throw new Error('Enter a positive force noise floor.');
      const computed = analyze(rows.map(r => ({ id: r.id, x: Number(r.x), y: Number(r.y) })), { intercept, noiseFloor: Number(noiseFloor) });
      setResult(computed); setDirty(false); setError(''); setFindingId('transition'); setSelected(computed.findings.find(f => f.id === 'transition')!.rowIds);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to analyze these measurements.'); }
  }
  function changeSample(kind: 'transition' | 'linear') { setSample(kind); setRows(editable(kind)); setNextId(25); setResult(null); setDirty(false); setError(''); setSelected([]); }
  function selectRow(id: string) {
    setSelected([id]);
    document.getElementById(`row-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function exportEvidence() {
    if (!result || dirty) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'modelscope-analysis.json'; link.click(); URL.revokeObjectURL(url);
  }
  const finding = result?.findings.find(f => f.id === findingId);
  const selectedPoint = !dirty && selected.length === 1 ? result?.points.find(p => p.id === selected[0]) : null;
  return <main>
    <header className="topbar"><Link href="/" className="brand" aria-label="ModelScope home"><span className="brand-symbol" aria-hidden="true">M<span>∕</span></span>ModelScope</Link><span className="top-divider" /><span className="workspace-label">EXPERIMENT WORKSPACE</span><span className="local-label"><i />Local · deterministic</span></header>
    <div className="workspace-intro"><div><div className="breadcrumb">MECHANICS <span>/</span> EXPERIMENT 01</div><h1>Where does the model break?</h1><p>Fit the relationship. Inspect the disagreement. Find the limits.</p></div><div className="intro-actions"><button className="secondary" disabled={!result || dirty} onClick={exportEvidence}>Export evidence ↓</button><button className="primary" onClick={run}>Run analysis <span aria-hidden="true">↗</span></button></div></div>
    <section className="configuration" aria-label="Experiment configuration"><div className="experiment-picker"><label htmlFor="experiment">EXPERIMENT</label><select id="experiment" defaultValue="spring"><option value="spring">Spring — Hooke’s Law</option></select></div><div><label htmlFor="model">CONFIGURED RELATIONSHIP</label><select id="model" value={intercept ? 'offset' : 'origin'} onChange={e => { setIntercept(e.target.value === 'offset'); invalidate(); }}><option value="origin">F = kx · zero offset</option><option value="offset">F = kx + c · fitted offset</option></select></div><div className="noise-setting"><label htmlFor="noise">FORCE NOISE FLOOR / N</label><input id="noise" type="number" min="0.000001" step="0.01" value={noiseFloor} onChange={e => { setNoiseFloor(e.target.value); invalidate(); }} /></div><div className="config-note">Noise floor is an assumed force scale.<br />It is not measured uncertainty.</div></section>
    <div className="status-strip" role="status"><span className={`status-dot ${dirty ? 'pending' : ''}`} /><span>{dirty ? 'Measurements or configuration changed. Run analysis to refresh all evidence.' : result ? `${result.measurements.length} measurements analyzed · ${result.transition.status === 'supported' ? 'Candidate transition supported by the prototype rule' : 'No clear transition supported'}` : 'Synthetic spring dataset ready. Run analysis to calculate fits, residuals, and transition evidence.'}</span></div>
    {error && <div className="error-message" role="alert">{error}</div>}
    <div className="workspace-grid">
      <section className="panel data-panel"><div className="panel-heading"><div><span className="eyebrow">INPUT / MEASUREMENTS</span><h2>Experimental data</h2></div><span className="count-badge">{rows.length} rows</span></div>
        <div className="data-controls"><label htmlFor="dataset">Example dataset</label><select id="dataset" value={sample} onChange={e => changeSample(e.target.value as 'linear' | 'transition')}><option value="transition">Progressive departure</option><option value="linear">Linear control</option></select></div>
        <p className="data-caption">Synthetic educational data · editable<br />Extension from unloaded length; force in newtons.</p>
        <div className="table-scroll"><table className="measurement-table"><thead><tr><th>Row</th><th>x / m</th><th>F / N</th><th><span className="sr-only">Remove</span></th></tr></thead><tbody>{rows.map(row => <tr id={`row-${row.id}`} key={row.id} className={!dirty && selected.includes(row.id) ? 'selected-row' : ''}><td><button className="row-button" onClick={() => !dirty && selectRow(row.id)} aria-label={`Select measurement ${row.id}`} aria-pressed={!dirty && selected.includes(row.id)}>{row.id}</button></td><td><input type="number" step="0.001" min="0" aria-label={`${row.id} extension in meters`} value={row.x} onChange={e => { setRows(rows.map(r => r.id === row.id ? { ...r, x: e.target.value } : r)); invalidate(); }} /></td><td><input type="number" step="0.001" aria-label={`${row.id} force in newtons`} value={row.y} onChange={e => { setRows(rows.map(r => r.id === row.id ? { ...r, y: e.target.value } : r)); invalidate(); }} /></td><td><button className="remove-row" aria-label={`Remove ${row.id}`} onClick={() => { setRows(rows.filter(r => r.id !== row.id)); invalidate(); }}>×</button></td></tr>)}</tbody></table></div>
        <div className="table-footer"><button className="text-button" onClick={() => { setRows([...rows, { id: `M${String(nextId).padStart(2, '0')}`, x: '', y: '' }]); setNextId(nextId + 1); invalidate(); }}>+ Add measurement</button><button className="text-button" onClick={() => changeSample(sample)}>Reset</button></div>
        <div className="assumptions"><span className="eyebrow">BEFORE YOU INTERPRET</span><p>{hookesLaw.assumptions[1]}</p><p>These measurements illustrate a method. They are not laboratory validation.</p></div>
      </section>
      <div className="visualization-column">
        {result ? <><section className="fit-summary" aria-label="Fitted model summary"><div className="equation"><span className="eyebrow">{result.referenceScope === 'early-region' ? 'EARLY-REGION REFERENCE' : 'COMPLETE-DATA REFERENCE'}</span><strong>{equation(result)}</strong><small>k in N m⁻¹ · x in m · F in N · n = {result.referenceFit.n}</small></div><div><span className="eyebrow">REF. RMSE / N</span><strong>{result.referenceFit.rmse.toFixed(4)}</strong></div><div><span className="eyebrow">REF. R²</span><strong>{number(result.referenceFit.r2, 4)}</strong></div></section>
          {dirty && <p className="stale-label">Plots below show the last analyzed snapshot.</p>}
          {selectedPoint && <div className="selected-readout" role="status"><b>{selectedPoint.id}</b> · x = {selectedPoint.x.toFixed(4)} m · F = {selectedPoint.y.toFixed(4)} N · predicted = {selectedPoint.predicted.toFixed(4)} N · residual = {selectedPoint.residual.toFixed(4)} N</div>}
          <Plots result={result} selected={dirty ? [] : selected} onSelect={id => !dirty && selectRow(id)} />
          <div className="global-fit-note">Complete-data fit: k = {result.globalFit.slope.toFixed(4)} N m⁻¹{result.config.intercept ? `, c = ${result.globalFit.intercept.toFixed(4)} N` : ''} · RMSE = {result.globalFit.rmse.toFixed(4)} N · centered R² = {number(result.globalFit.r2, 4)}. R² alone does not establish model adequacy.</div></> : <section className="panel empty-plot"><span className="eyebrow">YOUR ANALYSIS STARTS HERE</span><div className="empty-axis" aria-hidden="true"><span>F</span><div className="empty-line" /><span>x</span></div><h2>One model. Every measurement.</h2><p>Run analysis to compare the spring response with the configured line and inspect the residual pattern.</p><button className="primary" onClick={run}>Run analysis ↗</button><small>All calculations run locally in your browser.</small></section>}
        <section className="interpretation-note"><span className="eyebrow">SCIENTIFIC CONTEXT</span><p>Hooke’s law assumes constant spring stiffness within an approximately linear elastic regime. A progressive departure may reflect geometry, material response, or measurement effects. The residual pattern alone cannot identify the cause.</p></section>
      </div>
      <aside className="panel diagnostics"><div className="panel-heading"><div><span className="eyebrow">OUTPUT / TRACEABILITY</span><h2>Findings & evidence</h2></div><span className="count-badge">{result?.findings.length ?? '—'}</span></div>
        {result ? <><div className="finding-list">{result.findings.map(f => <button key={f.id} disabled={dirty} className={`finding-button ${findingId === f.id ? 'active' : ''}`} onClick={() => { setFindingId(f.id); setSelected(f.rowIds); }} aria-pressed={findingId === f.id}><span className={`finding-category ${f.category}`}>{f.category === 'supported' ? 'SUPPORTED BY RULE' : f.category.toUpperCase()}</span><strong>{f.title}</strong><span>{f.rowIds.length ? `${f.rowIds.length} linked measurements` : 'Inspect method and comparison'}</span><span className="finding-arrow" aria-hidden="true">↗</span></button>)}</div>{finding && <Evidence finding={finding} onSelect={id => !dirty && selectRow(id)} />}</> : <div className="empty-evidence"><span className="empty-number">∑</span><h3>Evidence, before explanation.</h3><p>Every finding links to calculated values and the exact measurements behind it.</p><p>Choose a finding after analysis to highlight its rows in both plots and the table.</p></div>}
      </aside>
    </div>
    <footer className="workspace-footer"><span>ModelScope <span className="footer-separator">/</span> Equations have limits. Find them.</span><span>Prototype · one possible transition · no causal inference</span></footer>
  </main>;
}
