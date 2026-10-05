'use client';
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Instrument } from './instrument-scene';
import { InstrumentFallback } from './instrument-fallback';
import { SiteNav, SiteFooter } from './site-nav';
import { MotionControl, useParameterMotion } from './parameter-motion';
import { finiteAmplitudePeriod } from '@/lib/experiments/generators';
import { smallAnglePeriod } from '@/lib/analysis/models';

const Scene = dynamic(() => import('./instrument-scene'), { ssr: false, loading: () => <div className="scene-loading">Preparing the instrument…</div> });
export const modelIds = ['spring', 'pendulum', 'beer-lambert', 'sensor'] as const;
export type ExploreModel = typeof modelIds[number];
const systems: { id: ExploreModel; kind: Instrument; title: string; subtitle: string; category: string; copy: string; experiment: string; min: number; max: number; initial: number; label: string; unit: string; digits: number; seconds: number }[] = [
  { id: 'spring', kind: 'spring', title: 'Spring', subtitle: 'Hooke’s Law', category: 'Mechanics', copy: 'Stretch the spring. See where a constant-stiffness model begins to deviate.', experiment: 'spring-hooke', min: .01, max: .14, initial: .072, label: 'Extension', unit: 'm', digits: 3, seconds: 10 },
  { id: 'pendulum', kind: 'pendulum', title: 'Pendulum', subtitle: 'Small-Angle Approximation', category: 'Physics', copy: 'A larger starting angle changes the period. The small-angle model stays constant.', experiment: 'pendulum', min: 0, max: 60, initial: 28, label: 'Starting angle', unit: '°', digits: 1, seconds: 2 },
  { id: 'beer-lambert', kind: 'beer', title: 'Beer–Lambert', subtitle: 'Concentration Response', category: 'Chemistry', copy: 'Increase concentration. Watch transmitted light fade as the response departs from a line.', experiment: 'beer-lambert', min: 0, max: 1, initial: .45, label: 'Concentration', unit: 'mmol/L', digits: 2, seconds: 12 },
  { id: 'sensor', kind: 'sensor', title: 'Sensor', subtitle: 'Linear Range', category: 'Instrumentation', copy: 'Raise the applied input. Compare a linear prediction with a compressing response.', experiment: 'sensor-calibration', min: 0, max: 12, initial: 6.2, label: 'Applied input', unit: 'N', digits: 1, seconds: 10 },
];

function Exhibit({ system, index }: { system: typeof systems[number]; index: number }) {
  const target = useRef<HTMLDivElement>(null);
  const [amplitude, setAmplitude] = useState(system.initial);
  const pendulum = system.kind === 'pendulum';
  const motion = useParameterMotion({ target, min: pendulum ? -1 : system.min, max: pendulum ? 1 : system.max, initial: pendulum ? 1 : system.initial, seconds: pendulum ? finiteAmplitudePeriod(amplitude) : system.seconds });
  const value = pendulum ? amplitude : motion.value;
  const predicted = system.kind === 'spring' ? 50 * value : system.kind === 'beer' ? 1.2 * value + .018 : .25 * value + .1;
  const observed = system.kind === 'spring' ? predicted + 400 * Math.max(0, value - .08) ** 2 : system.kind === 'beer' ? predicted - .9 * Math.max(0, value - .48) ** 2 : predicted - .015 * Math.max(0, value - 5) ** 2;
  const period = smallAnglePeriod(1, 9.80665); const finite = pendulum ? finiteAmplitudePeriod(amplitude) : period;
  const rows = pendulum ? [['Angle', `${value.toFixed(1)}°`], ['Small-angle period', `${period.toFixed(3)} s`], ['Finite-amplitude period', `${finite.toFixed(3)} s`], ['Difference', `+${((finite / period - 1) * 100).toFixed(2)}%`]]
    : [[system.label, `${value.toFixed(system.digits)} ${system.unit}`], [system.kind === 'sensor' ? 'Expected output' : 'Model prediction', `${predicted.toFixed(3)} ${system.kind === 'spring' ? 'N' : system.kind === 'sensor' ? 'V' : ''}`], [system.kind === 'sensor' ? 'Observed output' : 'Illustrative response', `${observed.toFixed(3)} ${system.kind === 'spring' ? 'N' : system.kind === 'sensor' ? 'V' : ''}`], ['Deviation', `${((observed / predicted - 1) * 100).toFixed(1)}%`]];
  function manual(next: number) { if (pendulum) { setAmplitude(Math.abs(next)); motion.scrub(1); } else motion.scrub(next); }
  return <div className="explore-exhibit" data-model={system.kind} data-motion-running={motion.running}>
    <div className="explore-copy"><span className="home-kicker">0{index + 1} / 04</span><h1>{system.title}<span>{system.subtitle}</span></h1><p>{system.copy}</p><Link className="home-button light" href={`/workspace?experiment=${system.experiment}`}>Open Analysis <span aria-hidden="true">→</span></Link></div>
    <div className="explore-instrument" ref={target}><div className={`scene-slot scene-${system.kind}`} aria-label={`Interactive ${system.title} illustration`} data-pose={pendulum ? (amplitude * motion.value).toFixed(2) : value.toFixed(4)}>{motion.visible ? <Scene kind={system.kind} value={value} pose={pendulum ? amplitude * motion.value : undefined} onChange={system.kind === 'spring' || pendulum ? manual : undefined} dark /> : <InstrumentFallback kind={system.kind} />}</div><p className="scene-instruction">{system.kind === 'spring' ? 'Drag the free end to stretch ↔' : pendulum ? 'Undamped educational oscillation · swing between ± starting angle' : system.kind === 'beer' ? 'Incoming light → solution → transmitted light' : 'Input movement illustrates a generic response'}</p></div>
    <div className="explore-readout"><dl>{rows.map(([label, reading]) => <div key={label}><dt>{label}</dt><dd>{reading}</dd></div>)}</dl><label className="instrument-control"><span>{system.label}</span><input aria-label={system.label} type="range" min={system.min} max={system.max} step={10 ** -system.digits} value={value} onChange={e => pendulum ? setAmplitude(Number(e.target.value)) : manual(Number(e.target.value))} /></label><MotionControl motion={motion} /></div>
    <p className="explore-disclosure">{pendulum ? 'Idealized undamped pendulum · L = 1 m · g = 9.80665 m/s². Motion is illustrative; periods use the existing finite-amplitude formula.' : system.kind === 'spring' ? 'Educational response · k = 50 N/m. Departure is illustrative and does not establish yield.' : system.kind === 'beer' ? 'Synthetic fixed-path calibration · absorbance is dimensionless.' : 'Synthetic sensor response · compression does not identify a physical mechanism.'} Open Analysis for measured evidence.</p>
  </div>;
}
export default function Explore({ initialModel = 'spring' }: { initialModel?: ExploreModel }) {
  const [selected, setSelected] = useState(initialModel);
  const index = systems.findIndex(s => s.id === selected); const system = systems[index];
  return <main className="home explore-page"><a className="skip-link" href="#explore-content">Skip to model</a><SiteNav dark page="explore" /><section className="explore-stage" id="explore-content" aria-label="Explore scientific models"><Exhibit key={selected} system={system} index={index} /><div className="unified-selector" role="group" aria-label="Select a scientific model">{systems.map((s, i) => <button key={s.id} type="button" aria-pressed={selected === s.id} onClick={() => setSelected(s.id)}><span className="model-mark" aria-hidden="true">{['〰', '◯', '▯', '⊥'][i]}</span><span>{s.title}<small>{s.category}</small></span><span aria-hidden="true">↗</span></button>)}</div></section><SiteFooter /></main>;
}
