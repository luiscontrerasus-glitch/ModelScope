'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Instrument } from './instrument-scene';

const Scene = dynamic(() => import('./instrument-scene'), { ssr: false, loading: () => <div className="scene-loading">Preparing the instrument…</div> });
const workspace = (experiment = 'spring-hooke') => `/workspace?experiment=${experiment}`;

function Nav() {
  return <header className="home-nav"><Link href="/" className="home-brand">ModelScope</Link><nav aria-label="Main navigation"><a href="#explore">Explore</a><Link href={workspace('custom')}>Analyze</Link><Link href="/methodology">Methodology</Link><a href="https://github.com/luiscontrerasus-glitch/ModelScope" target="_blank" rel="noreferrer">GitHub</a></nav><Link className="home-button nav-action" href={workspace()}>Open ModelScope <span aria-hidden="true">→</span></Link></header>;
}
function Readout({ items, children }: { items: [string, string][]; children?: React.ReactNode }) {
  return <div className="instrument-readout"><dl>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{children}</div>;
}
function Control({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return <label className="instrument-control"><span>{label}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
export default function Home() {
  const [extension, setExtension] = useState(.072);
  const [active, setActive] = useState('hero');
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const slots = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-scene]') ?? []);
    const pick = () => {
      const center = window.innerHeight / 2;
      const visible = slots.filter(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; });
      const closest = visible.sort((a, b) => Math.abs(a.getBoundingClientRect().top + a.offsetHeight / 2 - center) - Math.abs(b.getBoundingClientRect().top + b.offsetHeight / 2 - center))[0];
      setActive(closest?.dataset.scene ?? '');
    };
    const observer = new IntersectionObserver(pick, { threshold: [0, .2, .4, .6, .8, 1] });
    slots.forEach(el => observer.observe(el)); pick();
    const visibility = () => document.hidden ? setActive('') : pick();
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  function scene(id: string, kind: Instrument, value: number, onChange?: (n: number) => void, dark = false) {
    return <div className={`scene-slot scene-${kind}`} data-scene={id} aria-label={`Interactive ${kind} illustration`}>
      {active === id ? <Scene kind={kind} value={value} onChange={onChange} dark={dark} /> : <div className="scene-loading" aria-hidden="true">{kind === 'spring' ? 'Spring' : kind === 'beer' ? 'Beer–Lambert' : kind === 'sensor' ? 'Sensor' : 'Pendulum'}</div>}
    </div>;
  }
  return <main className="home" ref={root}>
    <a className="skip-link" href="#home-content">Skip to content</a>
    <Nav />
    <section className="home-hero" id="home-content" aria-labelledby="hero-heading">
      <div className="hero-copy"><h1 id="hero-heading">Equations<br />have limits.<br /><span>Find them.</span></h1><p>ModelScope reveals where experimental measurements begin systematically disagreeing with a scientific model.</p><div className="home-actions"><a className="home-button" href="#explore">Explore a model <span aria-hidden="true">→</span></a><Link className="home-button light" href={workspace('custom')}>Analyze your data</Link></div></div>
      <div className="hero-instrument">{scene('hero', 'spring', extension, setExtension)}<span className="drag-hint">Drag the free end to stretch <span aria-hidden="true">↔</span></span></div>
      <Readout items={[[ 'Extension', `${extension.toFixed(3)} m` ],[ 'Model prediction', `${(50 * extension).toFixed(2)} N` ],[ 'Regime', extension <= .08 ? 'Near-linear' : 'Growing departure' ]]}><Control label="Spring extension" min={.01} max={.14} step={.001} value={extension} onChange={setExtension} /><small>Illustrative visualization · k = 50 N/m.<br />Open the workspace for measured evidence.</small></Readout>
      <div className="hero-footnote"><span />Four scientific systems. One question.<br />Where do models stop working?</div>
    </section>
  </main>;
}
