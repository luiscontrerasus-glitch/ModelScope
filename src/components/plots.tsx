'use client';
import { CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts';
import type { AnalysisResult, EvidencePoint } from '@/lib/analysis/types';
import type { ExperimentDefinition } from '@/lib/experiments/types';
interface Props { result: AnalysisResult; experiment: ExperimentDefinition; selected: string[]; onSelect: (id: string) => void }
function Dot({ cx, cy, payload, selected, onSelect, experiment }: { cx?: number; cy?: number; payload?: EvidencePoint; selected: string[]; onSelect: (id: string) => void; experiment: ExperimentDefinition }) {
  if (!payload || cx === undefined || cy === undefined) return null;
  const active = selected.includes(payload.id);
  function activateFromKeyboard(e: React.KeyboardEvent<SVGGElement>) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault(); e.stopPropagation();
    const chart = e.currentTarget.ownerSVGElement;
    onSelect(payload!.id);
    // Recharts replaces scatter nodes when selection changes; retain keyboard focus.
    requestAnimationFrame(() => chart?.querySelector<SVGElement>(`[data-observation-id="${CSS.escape(payload!.id)}"]`)?.focus({ preventScroll: true }));
  }
  return <g className="observation-target" data-observation-id={payload.id} role="button" tabIndex={0} aria-pressed={active} aria-label={`${payload.id}: ${experiment.independent.name.toLowerCase()} ${payload.x} ${experiment.independent.unit}, ${experiment.dependent.name.toLowerCase()} ${payload.y} ${experiment.dependent.unit}, residual ${payload.residual.toFixed(Math.max(4, experiment.dependent.decimals))} ${experiment.dependent.unit}`} onClick={() => onSelect(payload.id)} onKeyDown={activateFromKeyboard} style={{ cursor: 'pointer' }}><circle cx={cx} cy={cy} r={12} fill="transparent" /><circle className="observation-marker" cx={cx} cy={cy} r={active ? 6 : 4} fill={active ? '#b86b24' : '#2378e8'} stroke={active ? '#5a3218' : '#ffffff'} strokeWidth={active ? 2 : 1.5} /></g>;
}
function PointTooltip({ active, payload, experiment }: { active?: boolean; payload?: readonly { payload?: EvidencePoint }[]; experiment: ExperimentDefinition }) {
  const point = payload?.find(p => p.payload?.id)?.payload;
  if (!active || !point) return null;
  const x = experiment.independent; const y = experiment.dependent;
  return <div className="plot-tooltip"><b>{point.id}</b><span>{x.symbol} = {point.x.toFixed(x.decimals)} {x.unit}</span><span>Observed = {point.y.toFixed(Math.max(4, y.decimals))} {y.unit}</span><span>Reference = {point.predicted.toFixed(Math.max(4, y.decimals))} {y.unit}</span><span>Residual = {point.residual.toFixed(Math.max(4, y.decimals))} {y.unit}</span></div>;
}
export function Plots({ result, experiment, selected, onSelect }: Props) {
  const x = experiment.independent; const y = experiment.dependent;
  const points = result.points; const range = result.transition.range;
  const maximum = Math.max(...points.map(p => p.x)); const minimum = Math.min(...points.map(p => p.x));
  const domain: [number, number] = experiment.id === 'custom' ? [minimum - (maximum - minimum) * 0.04, maximum + (maximum - minimum) * 0.04] : [0, maximum * 1.04];
  const regions = range ? <><ReferenceArea x1={range[0]} x2={range[1]} fill="#b86b24" fillOpacity={0.10} /><ReferenceLine x={result.transition.estimate!} stroke="#a77b48" strokeDasharray="4 4" /></> : null;
  const axis = { type: 'number' as const, dataKey: 'x', domain, tickFormatter: (v: number) => experiment.id === 'custom' ? Number(v.toPrecision(4)).toString() : v.toFixed(x.decimals), tick: { fontSize: 11, fill: '#737c89' }, tickLine: false, axisLine: { stroke: '#d8dde4' }, label: { value: `${x.name} ${x.symbol} (${x.unit})`, position: 'insideBottom' as const, offset: -10, fontSize: 11, fill: '#737c89' } };
  return <div className="plot-stack">
    <section className="panel plot-panel"><div className="panel-heading"><div><span className="eyebrow">01 / MODEL RESPONSE</span><h2>{y.name} vs. {x.name.toLowerCase()}</h2></div><span className="unit-badge">{y.symbol} / {y.unit}</span></div>
      <div className="chart-main" aria-label={`Measured ${y.name.toLowerCase()} and reference model plotted against ${x.name.toLowerCase()}`}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 14, right: 20, bottom: 26, left: 4 }}>
        <CartesianGrid stroke="#eef0f3" vertical={false} /><XAxis {...axis} /><YAxis type="number" width={46} tick={{ fontSize: 11, fill: '#737c89' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />{regions}
        <Tooltip content={<PointTooltip experiment={experiment} />} /><Line dataKey="predicted" name="Reference model" stroke="#2378e8" strokeWidth={1.6} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
        <Scatter dataKey="y" name={`Observed ${y.name.toLowerCase()}`} isAnimationActive={false} shape={<Dot selected={selected} onSelect={onSelect} experiment={experiment} />} />
      </ComposedChart></ResponsiveContainer></div>
      <div className="legend"><span><i className="legend-dot" />Measurements</span><span><i className="legend-line" />{result.config.baseline ? 'Fixed theoretical' : result.referenceScope === 'early-region' ? 'Early-region' : 'Complete-data'} reference</span>{range && <span><i className="legend-region" />Transition sensitivity range</span>}</div>
      {range && <p className="plot-note">The shaded sensitivity range describes candidate location and sampling. Later points are compared with the reference; they are not individually classified as wrong.</p>}
      {range && experiment.id === 'sensor-calibration' && <p className="plot-note">Early calibration reference: {x.symbol} ≤ {result.transition.estimate!.toFixed(x.decimals)} {x.unit}. The shaded range marks candidate location; beyond it inspect increasing nonlinear response.</p>}
    </section>
    <section className="panel plot-panel"><div className="panel-heading"><div><span className="eyebrow">02 / RESIDUAL STRUCTURE</span><h2>What the model leaves unexplained</h2></div><span className="unit-badge">Δ{y.symbol} / {y.unit}</span></div>
      <div className="chart-residual" aria-label={`Reference residuals plotted against ${x.name.toLowerCase()}`}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={points} margin={{ top: 8, right: 20, bottom: 26, left: 4 }}>
        <CartesianGrid stroke="#eef0f3" vertical={false} /><XAxis {...axis} /><YAxis type="number" width={46} tick={{ fontSize: 11, fill: '#737c89' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />{regions}<ReferenceLine y={0} stroke="#535c56" />
        <Tooltip content={<PointTooltip experiment={experiment} />} /><Scatter dataKey="residual" name="Reference residual" isAnimationActive={false} shape={<Dot selected={selected} onSelect={onSelect} experiment={experiment} />} />
      </ComposedChart></ResponsiveContainer></div><p className="plot-note">Residual = measured {y.name.toLowerCase()} − reference prediction. A sustained pattern matters more than a single unusual point.</p>
    </section>
  </div>;
}

