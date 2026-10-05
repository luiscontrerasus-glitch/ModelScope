'use client';
import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', notify); return () => media.removeEventListener('change', notify);
};
const reducedSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener('visibilitychange', notify); return () => document.removeEventListener('visibilitychange', notify);
};
const visibleSnapshot = () => !document.hidden;
const phaseAt = (value: number, min: number, max: number) => Math.acos(1 - 2 * Math.max(0, Math.min(1, (value - min) / (max - min))));

/** Presentation only: one cosine loop sampled at 30 fps; never runs the detector. */
export function useParameterMotion({ min, max, initial, seconds, target }: { min: number; max: number; initial: number; seconds: number; target: RefObject<HTMLElement | null> }) {
  const [value, setValue] = useState(initial);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const phase = useRef(phaseAt(initial, min, max));
  const reduced = useSyncExternalStore(subscribeMotion, reducedSnapshot, () => true);
  const tabVisible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, () => false);
  useEffect(() => {
    const element = target.current; if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(element); return () => observer.disconnect();
  }, [target]);
  const running = playing && visible && tabVisible && !reduced;
  useEffect(() => {
    if (!running) return;
    let frame = 0; let previous = 0; let sampled = 0;
    const tick = (time: number) => {
      if (previous) phase.current = (phase.current + Math.min(time - previous, 100) / (seconds * 1000) * Math.PI * 2) % (Math.PI * 2);
      previous = time;
      if (time - sampled >= 1000 / 30) { setValue(min + (max - min) * (1 - Math.cos(phase.current)) / 2); sampled = time; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [running, min, max, seconds]);
  function scrub(next: number) {
    const bounded = Math.max(min, Math.min(max, next));
    phase.current = phaseAt(bounded, min, max); setValue(bounded); setPlaying(false);
  }
  return { value, scrub, running, visible, reduced, playing: playing && !reduced, toggle: () => setPlaying(v => !v) };
}
export function MotionControl({ motion }: { motion: ReturnType<typeof useParameterMotion> }) {
  return <div className="motion-control"><button type="button" onClick={motion.toggle} disabled={motion.reduced} aria-label={motion.playing ? 'Pause autoplay' : 'Play autoplay'} aria-pressed={motion.playing}><span aria-hidden="true">{motion.playing ? 'Ⅱ' : '▶'}</span></button><span>{motion.reduced ? 'Reduced motion · manual control' : motion.playing ? 'Autoplay ∞' : 'Paused'}</span></div>;
}
