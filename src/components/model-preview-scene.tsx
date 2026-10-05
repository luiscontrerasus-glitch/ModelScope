'use client';
import { Component, useEffect, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, View } from '@react-three/drei';
import { InstrumentModel, StudioEnvironment } from './instrument-scene';
import type { PreviewInstrument } from './model-preview-gallery';

interface Props { previews: PreviewInstrument[]; selected: number | null; active: boolean; onReady: (ready: boolean) => void }
class PreviewBoundary extends Component<{ children: ReactNode; onReady: Props['onReady'] }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onReady(false); }
  render() { return this.state.failed ? null : this.props.children; }
}

function PreviewFrames({ previews, selected, active }: Omit<Props, 'onReady'>) {
  const invalidate = useThree(state => state.invalidate);
  // View owns rendering, so clear the shared surface before its four scissored passes.
  // This also removes the previous pose/position during hover and document scrolling.
  useFrame(({ gl }) => { gl.setScissorTest(false); gl.clear(); }, .5);
  useEffect(() => {
    // Scissored views follow their HTML slots when the document moves. No idle loop.
    const redraw = () => invalidate();
    window.addEventListener('scroll', redraw, { passive: true });
    window.addEventListener('resize', redraw);
    invalidate();
    return () => { window.removeEventListener('scroll', redraw); window.removeEventListener('resize', redraw); };
  }, [invalidate]);
  useEffect(() => {
    if (!active) {
      previews.forEach(preview => { preview.instrument.value = preview.instrument.pose = preview.initial; });
      invalidate(); return;
    }
    let frame = 0; let previous: number | undefined; let elapsed = 0;
    const tick = (time: number) => {
      const dt = previous === undefined ? 1 / 60 : Math.min((time - previous) / 1000, .05);
      previous = time; elapsed += dt;
      let moving = false;
      previews.forEach((preview, index) => {
        const { instrument, initial, hover, kind } = preview;
        const target = index !== selected ? initial : kind === 'pendulum' ? initial + Math.sin(elapsed * 2.2) * (hover - initial) : hover;
        const difference = target - instrument.pose;
        if (Math.abs(difference) > .00001) {
          instrument.pose += difference * -Math.expm1(-4 * dt);
          instrument.value = kind === 'pendulum' ? initial : instrument.pose;
          moving = true;
        }
      });
      if (moving) invalidate();
      // A held spring/load/beam settles; only the focused pendulum continues its tiny sway.
      if (moving || (selected !== null && previews[selected].kind === 'pendulum')) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [previews, selected, active, invalidate]);
  return null;
}

export default function ModelPreviewScene({ onReady, ...props }: Props) {
  return <div className="preview-canvas" aria-hidden="true"><PreviewBoundary onReady={onReady}>
    <Canvas frameloop="demand" dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      onCreated={({ gl, setEvents }) => {
        setEvents({ enabled: false });
        onReady(true);
        gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onReady(false); }, { once: true });
      }}>
      <PreviewFrames {...props} />
      {props.previews.map((preview, index) => <View key={preview.kind} index={index + 1} track={preview.track as RefObject<HTMLElement>}>
        <PerspectiveCamera makeDefault position={[0, .35, 8.1]} fov={34} />
        <ambientLight intensity={.65} />
        <directionalLight position={[-3, 6, 5]} intensity={3} />
        <directionalLight position={[4, 2, -3]} intensity={1.5} color="#eaf1ff" />
        <StudioEnvironment />
        <InstrumentModel kind={preview.kind} instrument={preview.instrument} />
      </View>)}
    </Canvas>
  </PreviewBoundary></div>;
}
