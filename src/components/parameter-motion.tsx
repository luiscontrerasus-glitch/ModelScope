'use client';
import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react';
import { AmbientInstrument, type MotionKind } from './ambient-instrument';
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', notify); return () => media.removeEventListener('change', notify);
};
const reducedSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener('visibilitychange', notify); return () => document.removeEventListener('visibilitychange', notify);
};
const visibleSnapshot = () => !document.hidden;
export function useAmbientVisibility(target: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, reducedSnapshot, () => true);
  const tabVisible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, () => false);
  useEffect(() => {
    const element = target.current; if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element); return () => observer.disconnect();
  }, [target]);
  return { visible, reduced, active: visible && tabVisible && !reduced };
}

export function useInstrumentMotion({ kind, min, max, initial, target, enabled = true }: { kind: MotionKind; min: number; max: number; initial: number; target: RefObject<HTMLElement | null>; enabled?: boolean }) {
  const [instrument] = useState(() => new AmbientInstrument(kind, min, max, initial));
  const [playing, setPlaying] = useState(true);
  const { visible, reduced, active } = useAmbientVisibility(target);
  const running = playing && active && enabled;
  useEffect(() => {
    if (!running) return;
    let frame = 0; let previous: number | undefined;
    const tick = (time: number) => {
      instrument.advance(previous === undefined ? 0 : (time - previous) / 1000);
      previous = time; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [running, instrument]);
  return { instrument, running, visible, reduced, playing: playing && !reduced, toggle: () => { instrument.flush(); setPlaying(v => !v); } };
}

export function InstrumentMotionControl({ motion }: { motion: ReturnType<typeof useInstrumentMotion> }) {
  return <div className="motion-control ambient-control"><button type="button" onClick={motion.toggle} disabled={motion.reduced} aria-label={motion.playing ? 'Pause motion' : 'Resume motion'} aria-pressed={motion.playing} title={motion.reduced ? 'Reduced motion: manual controls available' : motion.playing ? 'Pause instrument motion' : 'Resume instrument motion'}><span aria-hidden="true">{motion.playing ? 'Ⅱ' : '▶'}</span></button>{motion.reduced && <span>Reduced motion · manual control</span>}</div>;
}
