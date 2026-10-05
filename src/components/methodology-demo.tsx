'use client';
import { useRef, useState } from 'react';
import { methodologyCases } from './methodology-cases';
import { MotionControl, useParameterMotion } from './parameter-motion';

export function MethodologyDemo() {
  const [selected, setSelected] = useState('outlier');
  const target = useRef<HTMLDivElement>(null);
  const motion = useParameterMotion({ min: 0, max: 1, initial: 1, seconds: 8, target });
  const current = methodologyCases.find(c => c.id === selected)!;
  const { result } = current; const { transition } = result;
  const largest = Math.max(...result.points.map(p => Math.max(p.y, p.predicted)));
  const plotY = (y: number) => 250 - y / largest * 200;
  const plotX = (x: number) => 48 + x / .12 * 500;
  const residualMax = Math.max(.05, ...result.points.map(p => Math.abs(p.residual)));
  return <div className="method-demo" data-motion-running={motion.running}>
    <div className="method-case-selector" role="group" aria-label="Select a detector challenge">{methodologyCases.map(c => <button key={c.id} aria-pressed={selected === c.id} onClick={() => setSelected(c.id)}>{c.title}</button>)}</div>
    <div className="method-demo-grid"><div className="method-example-copy"><span className="home-kicker">Production detector · synthetic data</span><h3>{transition.status === 'supported' ? 'Supported transition' : 'No supported transition'}</h3><p>{current.description}</p><dl className="method-gates"><div><dt>Engine outcome</dt><dd>{transition.status}</dd></div><div><dt>Penalized improvement</dt><dd>{transition.improvement?.toFixed(2) ?? '—'} / required 10</dd></div><div><dt>Sustained measurements</dt><dd>{transition.sustainedRowIds.length}</dd></div><div><dt>Influence safeguard</dt><dd>{transition.influenceCheck ? transition.influenceCheck.passed ? 'Passed' : 'Not retained' : 'Not reached'}</dd></div></dl><p className="method-case-caveat">{transition.status === 'ambiguous' ? 'Ambiguous means a promising comparison failed a safeguard; no location is reported.' : 'No supported transition does not prove model adequacy.'}</p></div>
      <div className="method-example-plot" ref={target}><svg viewBox="0 0 600 395" role="img" aria-label={`${current.title}: actual measurements, reference prediction, and residuals from the production detector. Engine status ${transition.status}.`}><path d="M48 265H560M48 330H560" stroke="#bfc8d3" strokeWidth=".8" />{transition.range && <rect x={plotX(transition.range[0])} y="35" width={plotX(transition.range[1]) - plotX(transition.range[0])} height="327" fill="#c18d5420" />}<polyline points={result.points.map(p => `${plotX(p.x)},${plotY(p.predicted)}`).join(' ')} fill="none" stroke="#2378e8" strokeWidth="1.4" strokeDasharray="5 4" />{result.points.map((p, i) => <g key={p.id} opacity={motion.reduced ? 1 : Math.max(0, Math.min(1, motion.value * 26 - i + 1))}><circle cx={plotX(p.x)} cy={plotY(p.y)} r="4" fill={Math.abs(p.residual) > 2 * transition.noiseScale ? '#b57d41' : '#2378e8'} /><line x1={plotX(p.x)} x2={plotX(p.x)} y1="330" y2={330 - p.residual / residualMax * 44} stroke="#bc864f" strokeWidth="1" /><circle cx={plotX(p.x)} cy={330 - p.residual / residualMax * 44} r="3" fill="#9d713e" /></g>)}<text x="48" y="25" fontSize="12" fill="#677585">Force (N)</text><text x="460" y="286" fontSize="11" fill="#677585">Extension (m)</text><text x="48" y="303" fontSize="11" fill="#677585">Reference residuals</text><text x="567" y="334" fontSize="11" fill="#677585">0</text></svg><div className="reality-legend"><span><i className="blue-rule" />Reference</span><span><i className="amber-dot" />Measurements / residuals</span></div><MotionControl motion={motion} /><p className="visual-disclosure">Animated reveal only. Decisions use all 24 observations · assumed scale 0.040 N.</p></div></div>
  </div>;
}
