'use client';
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalysisResult, EvidencePoint } from '@/lib/analysis/types';
interface Props { result: AnalysisResult; selected: string[]; onSelect: (id: string) => void }
function Dot({ cx, cy, payload, selected, onSelect }: { cx?: number; cy?: number; payload?: EvidencePoint; selected: string[]; onSelect: (id: string) => void }) {
  if (!payload || cx === undefined || cy === undefined) return null;
  const active = selected.includes(payload.id);
  return <circle cx={cx} cy={cy} r={active ? 6 : 4} fill={active ? '#b86b24' : '#19716b'} stroke={active ? '#5a3218' : '#ffffff'} strokeWidth={active ? 2 : 1.5} role="button" tabIndex={0} aria-label={`${payload.id}: extension ${payload.x} m, force ${payload.y} N, residual ${payload.residual.toFixed(4)} N`} onClick={() => onSelect(payload.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(payload.id); } }} style={{ cursor: 'pointer' }} />;
}
function PointTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: EvidencePoint }[] }) {
  const point = payload?.find(p => p.payload?.id)?.payload;
  if (!active || !point) return null;
  return <div className="plot-tooltip"><b>{point.id}</b><span>x = {point.x.toFixed(4)} m</span><span>Observed = {point.y.toFixed(4)} N</span><span>Reference = {point.predicted.toFixed(4)} N</span><span>Residual = {point.residual.toFixed(4)} N</span></div>;
}
export function Plots({ result, selected, onSelect }: Props) {
  const points = result.points; const range = result.transition.range;
  const domain: [number, number] = [0, Math.max(...points.map(p => p.x)) * 1.04];
  const regions = range ? <><ReferenceArea x1={0} x2={range[0]} fill="#19716b" fillOpacity={0.045} /><ReferenceArea x1={range[0]} x2={range[1]} fill="#b86b24" fillOpacity={0.13} /><ReferenceArea x1={range[1]} x2={domain[1]} fill="#b86b24" fillOpacity={0.045} /><ReferenceLine x={result.transition.estimate!} stroke="#b86b24" strokeDasharray="4 4" /></> : null;
  const axis = { type: 'number' as const, dataKey: 'x', domain, tickFormatter: (v: number) => v.toFixed(3), tick: { fontSize: 11, fill: '#6c756f' }, tickLine: false, axisLine: { stroke: '#cdd3cc' }, label: { value: 'Extension x (m)', position: 'insideBottom' as const, offset: -10, fontSize: 11, fill: '#6c756f' } };
  return <div className="plot-stack">
    <section className="panel plot-panel"><div className="panel-heading"><div><span className="eyebrow">01 / MODEL RESPONSE</span><h2>Force vs. extension</h2></div><span className="unit-badge">F / N</span></div>
      <div className="chart-main" aria-label="Measured force and reference model plotted against extension"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 14, right: 20, bottom: 26, left: 4 }}>
        <CartesianGrid stroke="#e6e9e3" vertical={false} /><XAxis {...axis} /><YAxis type="number" width={46} tick={{ fontSize: 11, fill: '#6c756f' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />{regions}
        <Tooltip content={<PointTooltip />} /><Line dataKey="predicted" name="Reference model" stroke="#454d49" strokeWidth={1.6} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
        <Scatter dataKey="y" name="Observed force" isAnimationActive={false} shape={<Dot selected={selected} onSelect={onSelect} />} />
      </ComposedChart></ResponsiveContainer></div>
      <div className="legend"><span><i className="legend-dot" />Measurements</span><span><i className="legend-line" />{result.referenceScope === 'early-region' ? 'Early-region' : 'Complete-data'} reference</span>{range && <span><i className="legend-region" />Candidate region</span>}</div>
      {range && <div className="region-key"><span>Estimated model-consistent</span><span>Candidate transition</span><span>Increasingly inconsistent</span></div>}
    </section>
    <section className="panel plot-panel"><div className="panel-heading"><div><span className="eyebrow">02 / RESIDUAL STRUCTURE</span><h2>What the line leaves unexplained</h2></div><span className="unit-badge">ΔF / N</span></div>
      <div className="chart-residual" aria-label="Reference residuals plotted against extension"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 8, right: 20, bottom: 26, left: 4 }}>
        <CartesianGrid stroke="#e6e9e3" vertical={false} /><XAxis {...axis} /><YAxis type="number" width={46} tick={{ fontSize: 11, fill: '#6c756f' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />{regions}<ReferenceLine y={0} stroke="#535c56" />
        <Tooltip content={<PointTooltip />} /><Scatter dataKey="residual" name="Reference residual" isAnimationActive={false} shape={<Dot selected={selected} onSelect={onSelect} />} />
      </ComposedChart></ResponsiveContainer></div><p className="plot-note">Residual = measured force − reference prediction. A sustained pattern matters more than a single unusual point.</p>
    </section>
  </div>;
}
