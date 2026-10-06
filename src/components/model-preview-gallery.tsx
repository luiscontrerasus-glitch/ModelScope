'use client';
import { createRef, useRef, useState, type RefObject } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AmbientInstrument } from './ambient-instrument';
import { InstrumentFallback } from './instrument-fallback';
import { useAmbientVisibility } from './parameter-motion';
import type { Instrument } from './instrument-scene';

const PreviewScene = dynamic(() => import('./model-preview-scene'), { ssr: false });
const previews: { id: string; kind: Instrument; title: string; category: string; initial: number; hover: number }[] = [
  { id: 'spring', kind: 'spring', title: 'Spring', category: 'Mechanics', initial: .045, hover: .064 },
  { id: 'pendulum', kind: 'pendulum', title: 'Pendulum', category: 'Physics', initial: 10, hover: 16 },
  { id: 'beer-lambert', kind: 'beer', title: 'Beer–Lambert', category: 'Chemistry', initial: .35, hover: .65 },
  { id: 'sensor', kind: 'sensor', title: 'Sensor', category: 'Instrumentation', initial: 2, hover: 6 },
];
export interface PreviewInstrument {
  kind: Instrument;
  instrument: AmbientInstrument;
  track: RefObject<HTMLSpanElement | null>;
  initial: number;
  hover: number;
}

export function ModelPreviewGallery() {
  const gallery = useRef<HTMLDivElement>(null);
  const { visible, active } = useAmbientVisibility(gallery);
  const [instruments] = useState<PreviewInstrument[]>(() => previews.map(preview => ({
    ...preview, instrument: new AmbientInstrument(preview.kind, 0, 60, preview.initial), track: createRef<HTMLSpanElement>(),
  })));
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  return <div ref={gallery} className="preview-gallery" data-ready={visible && ready}>
    {previews.map((preview, index) => <Link key={preview.id} className="model-preview" href={`/explore?model=${preview.id}`}
      onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(index); }} onPointerLeave={() => setHovered(null)}
      onFocus={() => setFocused(index)} onBlur={() => setFocused(null)}>
      <span ref={instruments[index].track} className="preview-render" aria-hidden="true"><InstrumentFallback kind={preview.kind} /></span>
      <span className="preview-caption"><span><strong>{preview.title}</strong><small>{preview.category}</small></span><span className="preview-arrow" aria-hidden="true">↗</span></span>
    </Link>)}
    {visible && <PreviewScene previews={instruments} selected={active ? focused ?? hovered : null} active={active} onReady={setReady} />}
  </div>;
}
