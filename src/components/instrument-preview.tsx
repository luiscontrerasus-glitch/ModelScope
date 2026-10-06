'use client';
import { memo, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AmbientInstrument } from './ambient-instrument';
import type { Instrument } from './instrument-scene';

// Every instrument uses the same local module. Warming one adjacent scene also
// builds its geometry, studio environment and shaders, then demand rendering stops.
const Scene = memo(dynamic(() => import('./instrument-scene'), { ssr: false, loading: () => null }));
function LiveInstrument({ kind, instrument, active, dark, onSnapshot, onVisibleChange }: { kind: Instrument; instrument: AmbientInstrument; active: boolean; dark: boolean; onSnapshot: (frame: string) => void; onVisibleChange: (visible: boolean) => void }) {
  const [ready, setReady] = useState(false);
  const reveal = useCallback((frame: string) => { onSnapshot(frame); setReady(true); }, [onSnapshot]);
  const conceal = useCallback(() => { setReady(false); onVisibleChange(false); }, [onVisibleChange]);
  useEffect(() => {
    if (!active) onVisibleChange(false);
    else if (ready && window.matchMedia('(prefers-reduced-motion: reduce)').matches) onVisibleChange(true);
    return () => onVisibleChange(false);
  }, [active, ready, onVisibleChange]);
  return <div className="instrument-live" data-ready={ready} data-active={active} aria-hidden={!active || !ready} onTransitionEnd={event => {
    if (event.target === event.currentTarget && event.propertyName === 'opacity' && active && ready) onVisibleChange(true);
  }}>
    <Scene kind={kind} instrument={instrument} dark={dark} cinematic onReady={reveal} onSnapshot={onSnapshot} onUnavailable={conceal} />
  </div>;
}
export function InstrumentPreview({ id, kind, instrument, active, warm, onVisibleChange }: { id: string; kind: Instrument; instrument: AmbientInstrument; active: boolean; warm: boolean; onVisibleChange: (visible: boolean) => void }) {
  const [frame, setFrame] = useState<string | null>(null);
  return <div className="instrument-preview">
    <picture className="instrument-poster">
      {!frame && <source media="(max-width:600px)" srcSet={`/instruments/${id}-mobile.jpg`} />}
      {!frame && <source media="(max-width:900px)" srcSet={`/instruments/${id}-tablet.jpg`} />}
      {/* Local poster images are real frames from this exact instrument and camera. */}
      <img src={frame ?? `/instruments/${id}-desktop.jpg`} alt="" width={870} height={618} decoding="sync" />
    </picture>
    {(active || warm) && <LiveInstrument kind={kind} instrument={instrument} active={active} dark={kind !== 'pendulum'} onSnapshot={setFrame} onVisibleChange={onVisibleChange} />}
  </div>;
}
