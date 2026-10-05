'use client';
import { useRef, useState } from 'react';
import { createCustomSession, defaultSettings, settingsIssues, unitLabel, type CustomModel, type CustomSession, type CustomSettings, type CustomVariable } from '@/lib/custom/analysis';
import { emptyManualTable, mapTable, MAX_BYTES, numericColumns, parseTable, type RawTable } from '@/lib/custom/data';

function UnitFields({ role, value, onChange }: { role: 'X' | 'Y'; value: CustomVariable; onChange: (v: CustomVariable) => void }) {
  return <fieldset><legend>{role === 'X' ? 'Independent variable X' : 'Dependent variable Y'}</legend><label htmlFor={`${role}-name`}>Display name</label><input id={`${role}-name`} value={value.name} maxLength={80} aria-describedby="custom-issues" onChange={e => onChange({ ...value, name: e.target.value })} /><label htmlFor={`${role}-units`}>Unit meaning</label><select id={`${role}-units`} value={value.unitKind} onChange={e => onChange({ ...value, unitKind: e.target.value as CustomVariable['unitKind'] })}><option value="unspecified">No unit specified</option><option value="unitless">Unitless quantity (1)</option><option value="label">Known unit label</option></select>{value.unitKind === 'label' && <><label htmlFor={`${role}-unit-label`}>Unit label</label><input id={`${role}-unit-label`} value={value.unit} maxLength={30} aria-describedby="custom-issues" onChange={e => onChange({ ...value, unit: e.target.value })} /></>}</fieldset>;
}
export function CustomSetup({ onAnalyze }: { onAnalyze: (session: CustomSession) => void }) {
  const [method, setMethod] = useState<'csv' | 'paste' | 'manual'>('paste');
  const [text, setText] = useState('');
  const [table, setTable] = useState<RawTable | null>(null);
  const [settings, setSettings] = useState<CustomSettings>(defaultSettings);
  const [error, setError] = useState('');
  const nextId = useRef(1); const fileInput = useRef<HTMLInputElement>(null); const loadVersion = useRef(0);
  function loadTable(next: RawTable) { setTable(next); setError(''); nextId.current = next.rows.length + 1; setSettings({ ...defaultSettings(), ...(next.inputMethod === 'manual' ? { mapping: { x: 'X', y: 'Y', ignoreBlankRows: false } } : {}) }); }
  function chooseMethod(next: typeof method) { loadVersion.current++; setMethod(next); setText(''); setError(''); setTable(next === 'manual' ? emptyManualTable() : null); setSettings(next === 'manual' ? { ...defaultSettings(), mapping: { x: 'X', y: 'Y', ignoreBlankRows: false } } : defaultSettings()); nextId.current = 1; }
  async function readFile(file?: File) {
    if (!file) return;
    const version = ++loadVersion.current;
    if (!/\.csv$/i.test(file.name)) { setError('Choose a .csv file. XLSX and PDF are not supported.'); setTable(null); return; }
    if (file.size > MAX_BYTES) { setError('Use a CSV no larger than 1 MiB.'); setTable(null); return; }
    try { const contents = await file.text(); if (loadVersion.current === version) loadTable(parseTable(contents, 'csv', file.name)); }
    catch { if (loadVersion.current === version) { setError('The local file could not be read. Try choosing it again.'); setTable(null); } }
  }
  async function example() {
    const version = ++loadVersion.current;
    // Fetch only a static example asset; no user measurements are transmitted.
    try { const response = await fetch('/examples/temperature-response.csv'); if (!response.ok) throw new Error(); const contents = await response.text(); if (loadVersion.current === version) { setMethod('csv'); loadTable({ ...parseTable(contents, 'csv', 'temperature-response.csv'), syntheticExample: true }); } }
    catch { setError('The example could not be loaded. Use the download link or paste your data.'); }
  }
  function mapping(role: 'x' | 'y', column: string) { setSettings({ ...settings, mapping: { ...settings.mapping, [role]: column }, [role]: { ...settings[role], name: column || (role === 'x' ? 'Independent variable' : 'Dependent variable') } }); setError(''); }
  function addManualRow() {
    if (!table) return;
    const id = `M${String(nextId.current++).padStart(2, '0')}`;
    setTable({ ...table, rows: [...table.rows, { id, record: table.rows.length + 2, values: ['', ''], blank: true }] });
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[aria-label="${id} manual X"]`)?.focus());
  }
  function deleteManualRow(id: string) {
    if (!table) return;
    const index = table.rows.findIndex(r => r.id === id);
    const remaining = table.rows.filter(r => r.id !== id);
    const next = remaining[Math.min(index, remaining.length - 1)];
    setTable({ ...table, rows: remaining });
    requestAnimationFrame(() => next ? document.querySelector<HTMLInputElement>(`[aria-label="${next.id} manual X"]`)?.focus() : document.getElementById('custom-add-row')?.focus());
  }
  const mapped = table ? mapTable(table, settings.mapping) : null;
  const configurationIssues = settingsIssues(settings);
  const numeric = table ? numericColumns(table) : [];
  const issueMessages = [...(mapped?.issues.map(i => i.message) ?? []), ...configurationIssues];
  const invalid = !table || !!issueMessages.length;
  return <section className="custom-setup" aria-label="Custom dataset configuration">
    <div className="custom-heading"><span className="eyebrow">01 / DATA</span><h2>Bring your measurements.</h2><p>Choose columns, name the quantities, and review a supported model. Your data stays in this browser.</p></div>
    <div className="entry-methods" role="group" aria-label="Data input method">{(['csv', 'paste', 'manual'] as const).map(m => <button key={m} className={method === m ? 'active' : ''} aria-pressed={method === m} onClick={() => chooseMethod(m)}>{m === 'csv' ? 'Upload CSV' : m === 'paste' ? 'Paste a table' : 'Enter manually'}</button>)}</div>
    {method === 'csv' && <div className="source-entry"><label htmlFor="csv-file">CSV file · headers required · up to 1 MiB</label><input ref={fileInput} id="csv-file" type="file" accept=".csv,text/csv" aria-describedby="source-help custom-issues" onChange={e => { void readFile(e.target.files?.[0]); e.target.value = ''; }} /><p id="source-help">Comma-separated fields, decimal numbers, quoted text allowed. File contents are read locally.</p></div>}
    {method === 'paste' && <div className="source-entry"><label htmlFor="pasted-data">Paste CSV or tab-separated data, including headers</label><textarea id="pasted-data" rows={5} value={text} maxLength={MAX_BYTES} aria-describedby="custom-issues" placeholder={'Time,Response\n0,1.2\n1,1.8'} onChange={e => { loadVersion.current++; setText(e.target.value); setTable(null); setError(''); }} /><button className="secondary" onClick={() => loadTable(parseTable(text, 'paste'))}>Preview pasted data</button></div>}
    <div className="example-line"><button className="text-button" onClick={() => void example()}>Load synthetic temperature example</button><a href="/examples/temperature-response.csv" download>Download example CSV ↓</a><p>The example uses temperature in °C and response in V. Suggested assumed response scale: 0.05 V. Confirm these labels and scale yourself.</p></div>
    {table && <>
      <div className="preview-heading"><h3>{table.inputMethod === 'manual' ? 'Manual measurements' : 'Source preview'}</h3><span>{table.rows.length} records · {table.headers.length} columns{table.inputMethod !== 'manual' ? ` · ${table.delimiter === '\t' ? 'tab' : 'comma'} separated` : ''}</span></div>
      {table.syntheticExample && <p className="synthetic-label">Synthetic educational example · not laboratory data</p>}
      {table.sourceFilename && <p className="source-filename">Source: {table.sourceFilename}</p>}
      <div className="source-table-scroll" tabIndex={0} aria-label="Source data preview"><table className="source-table"><thead><tr><th>Row</th>{table.headers.slice(0, 32).map((h, i) => <th key={i}>{h || '(missing header)'}</th>)}{method === 'manual' && <th>Remove</th>}</tr></thead><tbody>{table.rows.slice(0, 500).map(r => <tr key={r.id} className={r.blank ? 'blank-record' : ''}><td>{r.id}{r.blank && <small>blank</small>}</td>{table.headers.slice(0, 32).map((h, i) => <td key={i}>{method === 'manual' ? <input type="number" step="any" aria-label={`${r.id} manual ${h}`} value={r.values[i] ?? ''} aria-describedby="custom-issues" onChange={event => { setError(''); setTable({ ...table, rows: table.rows.map(row => { if (row.id !== r.id) return row; const values = [...row.values]; values[i] = event.target.value; return { ...row, values, blank: values.every(v => !v.trim()) }; }) }); }} /> : r.values[i] ?? <span className="missing-value">missing</span>}</td>)}{method === 'manual' && <td><button className="remove-row" aria-label={`Delete manual ${r.id}`} onClick={() => deleteManualRow(r.id)}>×</button></td>}</tr>)}</tbody></table></div>
      {method === 'manual' && <div className="table-footer"><button className="text-button" disabled={table.rows.length >= 500} id="custom-add-row" onClick={addManualRow}>+ Add row</button><button className="text-button" onClick={() => { setTable(emptyManualTable()); setError(''); }}>Clear dataset</button></div>}
      {table.rows.some(r => r.blank) && <label className="blank-confirmation"><input type="checkbox" checked={settings.mapping.ignoreBlankRows} onChange={e => setSettings({ ...settings, mapping: { ...settings.mapping, ignoreBlankRows: e.target.checked } })} />Exclude completely blank records explicitly (retain them in export)</label>}
      <div className="custom-section"><span className="eyebrow">02 / VARIABLES</span><div className="mapping-grid"><div><label htmlFor="map-x">Independent X column</label><select id="map-x" value={settings.mapping.x} aria-describedby="custom-issues" onChange={e => mapping('x', e.target.value)}><option value="">Choose X column</option>{table.headers.slice(0, 32).map((h, i) => <option key={i} value={h}>{h}{numeric.includes(h) ? ' · numeric' : ''}</option>)}</select></div><div><label htmlFor="map-y">Dependent Y column</label><select id="map-y" value={settings.mapping.y} aria-describedby="custom-issues" onChange={e => mapping('y', e.target.value)}><option value="">Choose Y column</option>{table.headers.slice(0, 32).map((h, i) => <option key={i} value={h}>{h}{numeric.includes(h) ? ' · numeric' : ''}</option>)}</select></div><UnitFields role="X" value={settings.x} onChange={x => setSettings({ ...settings, x })} /><UnitFields role="Y" value={settings.y} onChange={y => setSettings({ ...settings, y })} /></div><p className="field-help">Unit labels do not convert values. No unit specified means unknown; unitless means a dimensionless quantity.</p></div>
      <div className="custom-section"><span className="eyebrow">03 / MODEL</span><div className="mapping-grid"><div><label htmlFor="custom-model">Baseline model</label><select id="custom-model" value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value as CustomModel })}><option value="linear-offset">Linear · fitted slope and intercept · Y = mX + b</option><option value="linear-origin">Linear through origin · fitted slope, fixed zero · Y = mX</option><option value="constant">Theoretical constant · user supplied · Y = C</option></select>{settings.model === 'constant' && <><label htmlFor="constant-value">Expected constant C / {unitLabel(settings.y)}</label><input id="constant-value" type="number" step="any" value={settings.constant} aria-describedby="custom-issues" onChange={e => setSettings({ ...settings, constant: e.target.value })} /></>}</div><div><label htmlFor="custom-noise">Assumed response reference scale / {unitLabel(settings.y)}</label><input id="custom-noise" type="number" min="0.000001" max="1000" step="any" value={settings.noiseFloor} aria-describedby="noise-help custom-issues" onChange={e => setSettings({ ...settings, noiseFloor: e.target.value })} /><p id="noise-help" className="field-help">Enter a positive response scale you can justify from measurement resolution, prior knowledge, or an explicit tolerance. It is an assumption, not a confidence interval or measured uncertainty. If unknown, pause and investigate; the app supplies no silent default.</p></div></div></div>
      <div className="custom-review" aria-label="Configuration review"><span className="eyebrow">04 / REVIEW</span><h3>{mapped?.measurements.length ?? 0} mapped measurements</h3><dl><div><dt>Independent X</dt><dd>{settings.mapping.x || 'Choose column'} → {settings.x.name} / {unitLabel(settings.x)}</dd></div><div><dt>Dependent Y</dt><dd>{settings.mapping.y || 'Choose column'} → {settings.y.name} / {unitLabel(settings.y)}</dd></div><div><dt>Model</dt><dd>{settings.model === 'constant' ? `Y = C · C = ${settings.constant || 'required'} (user supplied)` : settings.model === 'linear-origin' ? 'Y = mX · m fitted, intercept fixed at zero' : 'Y = mX + b · m and b fitted'}</dd></div><div><dt>Response scale</dt><dd>{settings.noiseFloor || 'Required'} / {unitLabel(settings.y)} · explicit assumption</dd></div></dl><p>Assumes accurate X, comparable response-error scales and sufficient sampling for one hinge. A candidate transition does not establish its physical cause.</p>{mapped?.warnings.map(w => <p className="validation-warning" key={w}>{w}</p>)}</div>
    </>}
    <div id="custom-issues" className="custom-issues" aria-live="polite">{error && <p role="alert">{error}</p>}{table && issueMessages.length > 0 && <><h3>Before analysis</h3><ul>{issueMessages.slice(0, 12).map((m, i) => <li key={i}>{m}</li>)}</ul>{issueMessages.length > 12 && <p>{issueMessages.length - 12} more issues; correct the source and preview again.</p>}</>}</div>
    <button className="primary custom-run" disabled={invalid} onClick={() => { if (!table) return; try { onAnalyze(createCustomSession(table, settings)); } catch (e) { setError(e instanceof Error ? e.message : 'Review the data and configuration.'); } }}>Run analysis <span aria-hidden="true">↗</span></button>
  </section>;
}
