'use client';
import { memo, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Instrument } from './instrument-scene';
import { InstrumentFallback } from './instrument-fallback';
import { SiteNav, SiteFooter } from './site-nav';
import { InstrumentMotionControl, useInstrumentMotion } from './parameter-motion';
import type { AmbientInstrument } from './ambient-instrument';
import { finiteAmplitudePeriod } from '@/lib/experiments/generators';
import { smallAnglePeriod } from '@/lib/analysis/models';

const Scene = memo(dynamic(() => import('./instrument-scene'), { ssr: false, loading: () => <div className="scene-loading">Preparing the instrument…</div> }));
export const modelIds = ['spring', 'pendulum', 'beer-lambert', 'sensor'] as const;
export type ExploreModel = typeof modelIds[number];
const systems: { id: ExploreModel; kind: Instrument; title: string; subtitle: string; category: string; copy: string; experiment: string; min: number; max: number; initial: number; label: string; unit: string; digits: number }[] = [
  { id: 'spring', kind: 'spring', title: 'Spring', subtitle: 'Hooke’s Law', category: 'Mechanics', copy: 'A linear model that works — until it doesn’t.', experiment: 'spring-hooke', min: .01, max: .14, initial: .072, label: 'Extension', unit: 'm', digits: 3 },
  { id: 'pendulum', kind: 'pendulum', title: 'Pendulum', subtitle: 'Small-Angle Approximation', category: 'Physics', copy: 'Small angles are powerful. But “small” has limits.', experiment: 'pendulum', min: 0, max: 60, initial: 28, label: 'Starting angle', unit: '°', digits: 1 },
  { id: 'beer-lambert', kind: 'beer', title: 'Beer–Lambert', subtitle: 'Concentration Response', category: 'Chemistry', copy: 'Absorbance is approximately linear — within a range.', experiment: 'beer-lambert', min: 0, max: 1, initial: .45, label: 'Concentration', unit: 'mmol/L', digits: 2 },
  { id: 'sensor', kind: 'sensor', title: 'Sensor Calibration', subtitle: 'Linear Range', category: 'Instrumentation', copy: 'Linear response is a design goal. Not a guarantee.', experiment: 'sensor-calibration', min: 0, max: 12, initial: 6.2, label: 'Applied input', unit: 'N', digits: 1 },
];

function MotionReadouts({ system, instrument, poseTarget }: { system: typeof systems[number]; instrument: AmbientInstrument; poseTarget: RefObject<HTMLDivElement | null> }) {
  const reading = useSyncExternalStore(instrument.subscribe, instrument.snapshot, instrument.snapshot);
  useEffect(() => {
    poseTarget.current?.setAttribute('data-pose', instrument.pose.toFixed(4));
    poseTarget.current?.setAttribute('data-parameter', instrument.value.toFixed(4));
  }, [reading, instrument, poseTarget]);
  const pendulum = system.kind === 'pendulum';
  const value = instrument.value;
  const predicted = system.kind === 'spring' ? 50 * value : system.kind === 'beer' ? 1.2 * value + .018 : .25 * value + .1;
  const observed = system.kind === 'spring' ? predicted + 400 * Math.max(0, value - .08) ** 2 : system.kind === 'beer' ? predicted - .9 * Math.max(0, value - .48) ** 2 : predicted - .015 * Math.max(0, value - 5) ** 2;
  const period = smallAnglePeriod(1, 9.80665); const finite = pendulum ? finiteAmplitudePeriod(value) : period;
  const rows = pendulum ? [['Angle', `${value.toFixed(1)}°`], ['Small-angle period', `${period.toFixed(3)} s`], ['Finite-amplitude period', `${finite.toFixed(3)} s`], ['Difference', `+${((finite / period - 1) * 100).toFixed(2)}%`]]
    : [[system.label, `${value.toFixed(system.digits)} ${system.unit}`], [system.kind === 'sensor' ? 'Expected output' : 'Model prediction', `${predicted.toFixed(3)} ${system.kind === 'spring' ? 'N' : system.kind === 'sensor' ? 'V' : ''}`], [system.kind === 'sensor' ? 'Observed output' : 'Illustrative response', `${observed.toFixed(3)} ${system.kind === 'spring' ? 'N' : system.kind === 'sensor' ? 'V' : ''}`], ['Deviation', `${((observed / predicted - 1) * 100).toFixed(1)}%`]];
  return <dl>{rows.map(([label, reading]) => <div key={label}><dt>{label}</dt><dd>{reading}</dd></div>)}</dl>;
}

function Exhibit({ system, index, active }: { system: typeof systems[number]; index: number; active: boolean }) {
  const target = useRef<HTMLDivElement>(null);
  const poseTarget = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; value: number } | null>(null);
  const [controlValue, setControlValue] = useState(system.initial);
  const pendulum = system.kind === 'pendulum';
  const motion = useInstrumentMotion({ target, kind: system.kind, min: system.min, max: system.max, initial: system.initial, enabled: active });
  const { instrument } = motion;
  useEffect(() => instrument.subscribeControl(setControlValue), [instrument]);
  function changeParameter(next: number) {
    setControlValue(next);
    if (pendulum) instrument.amplitude(next, motion.running);
    else instrument.manual(next);
  }
  return <section className={`explore-system system-${system.kind}`} id={`model-${system.id}`} aria-labelledby={`heading-${system.id}`} tabIndex={-1}>
    <div className="explore-exhibit" data-model={system.kind} data-motion-running={motion.running}>
    <div className="explore-copy"><span className="home-kicker">0{index + 1} / 04 <span aria-hidden="true">—</span> {system.category}</span><h2 id={`heading-${system.id}`}>{system.title}<span>{system.subtitle}</span></h2><p>{system.copy}</p></div>
    <div className="explore-instrument" ref={target}><div ref={poseTarget} className={`scene-slot scene-${system.kind}`} aria-label={`Interactive ${system.title} illustration`}>{active && motion.visible ? <Scene kind={system.kind} instrument={instrument} dark={!pendulum} cinematic /> : <InstrumentFallback kind={system.kind} />}</div><p className="scene-instruction">{system.kind === 'spring' ? 'Drag the free end to stretch ↔' : pendulum ? 'Undamped educational oscillation · swing between ± starting angle' : system.kind === 'beer' ? 'Incoming light → solution → transmitted light' : 'Input movement illustrates a generic response'}</p></div>
    <div className="explore-readout"><MotionReadouts system={system} instrument={instrument} poseTarget={poseTarget} /><label className="instrument-control"><span>{system.label}</span><input aria-label={system.label} type="range" min={system.min} max={system.max} step={pendulum ? .1 : (system.max - system.min) / 1000} value={controlValue} onPointerDown={e => {
      e.preventDefault(); e.currentTarget.focus({ preventScroll: true });
      const start = pendulum ? controlValue : instrument.value;
      setControlValue(start); if (!pendulum) instrument.begin();
      drag.current = { x: e.clientX, value: start }; e.currentTarget.setPointerCapture(e.pointerId);
    }} onPointerMove={e => {
      if (!drag.current) return;
      const width = e.currentTarget.getBoundingClientRect().width;
      changeParameter(Math.max(system.min, Math.min(system.max, drag.current.value + (e.clientX - drag.current.x) / width * (system.max - system.min))));
    }} onPointerUp={e => { drag.current = null; if (!pendulum) instrument.end(); e.currentTarget.releasePointerCapture(e.pointerId); }} onPointerCancel={() => { drag.current = null; if (!pendulum) instrument.end(); }} onKeyDown={e => {
      if (!pendulum && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
        e.currentTarget.value = String(instrument.value); setControlValue(instrument.value); instrument.end();
      }
    }} onChange={e => changeParameter(Number(e.target.value))} /></label><InstrumentMotionControl motion={motion} /></div>
    <Link className="home-button light exhibit-analysis" href={`/workspace?experiment=${system.experiment}`}>Open {system.id === 'beer-lambert' ? 'Beer–Lambert' : system.id === 'sensor' ? 'Sensor' : system.title} Analysis <span aria-hidden="true">→</span></Link>
    <p className="explore-disclosure">{pendulum ? 'Idealized undamped pendulum · L = 1 m · g = 9.80665 m/s². Motion is illustrative; periods use the existing finite-amplitude formula.' : system.kind === 'spring' ? 'Educational response · k = 50 N/m. Departure is illustrative and does not establish yield.' : system.kind === 'beer' ? 'Synthetic fixed-path calibration · absorbance is dimensionless.' : 'Synthetic sensor response · compression does not identify a physical mechanism.'} Open Analysis for measured evidence.</p>
  </div></section>;
}
export default function Explore({ initialModel }: { initialModel?: ExploreModel }) {
  const [activeModel, setActiveModel] = useState<ExploreModel | null>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const center = window.innerHeight / 2;
      const focused = systems.find(system => {
        const rect = document.getElementById(`model-${system.id}`)?.getBoundingClientRect();
        return rect && rect.top <= center && rect.bottom > center;
      });
      setActiveModel(focused?.id ?? null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Query links retain their existing model selection, within this single page.
    if (initialModel && !window.location.hash) document.getElementById(`model-${initialModel}`)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [initialModel]);
  return <main className="home explore-page cinematic-explore"><a className="skip-link" href="#explore-content">Skip to models</a><SiteNav dark page="explore" />
    <section className="explore-intro" id="explore-content" aria-labelledby="explore-heading"><span className="home-kicker">Explore models</span><h1 id="explore-heading">Four systems.<br />One question.</h1><p>Where does the model stop matching reality?</p><a className="intro-entry" href="#model-spring">Begin with the spring <span aria-hidden="true">↓</span></a></section>
    <nav className="system-index" aria-label="Scientific systems"><span className="index-label">Explore models</span>{systems.map(system => <a key={system.id} href={`#model-${system.id}`} aria-current={activeModel === system.id ? 'location' : undefined}>{system.id === 'sensor' ? 'Sensor' : system.title}</a>)}</nav>
    {systems.map((system, index) => <Exhibit key={system.id} system={system} index={index} active={activeModel === system.id} />)}<SiteFooter /></main>;
}
