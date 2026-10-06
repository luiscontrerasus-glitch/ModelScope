'use client';
import { Component, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox, Line } from '@react-three/drei';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Mesh, type Group, type MeshStandardMaterial, type MeshBasicMaterial, type MeshPhysicalMaterial } from 'three';
import type { AmbientInstrument } from './ambient-instrument';
import type { Line2 } from 'three/examples/jsm/lines/Line2.js';

import { InstrumentFallback } from './instrument-fallback';
export type Instrument = 'spring' | 'pendulum' | 'beer' | 'sensor';
interface Props { kind: Instrument; instrument: AmbientInstrument; dark?: boolean; cinematic?: boolean; onReady?: (frame: string) => void; onSnapshot?: (frame: string) => void; onUnavailable?: () => void }
const steel = { color: '#b8bcc1', metalness: .9, roughness: .28 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function useDrag(instrument: AmbientInstrument, scale: number, min: number, max: number) {
  const start = useRef<{ x: number; value: number } | null>(null);
  return {
    onPointerDown(e: ThreeEvent<PointerEvent>) {
      e.stopPropagation(); instrument.begin();
      start.current = { x: e.nativeEvent.clientX, value: instrument.kind === 'pendulum' ? instrument.pose : instrument.value };
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    onPointerMove(e: ThreeEvent<PointerEvent>) {
      if (!start.current) return;
      e.stopPropagation(); const next = clamp(start.current.value + (e.nativeEvent.clientX - start.current.x) * scale, min, max);
      if (instrument.kind === 'pendulum') instrument.dragPose(next); else instrument.manual(next);
    },
    onPointerUp(e: ThreeEvent<PointerEvent>) {
      start.current = null; instrument.end(); (e.target as Element).releasePointerCapture(e.pointerId);
    },
    onPointerCancel() { start.current = null; instrument.end(); },
  };
}

function Spring({ instrument, dark }: Omit<Props, 'kind'>) {
  const coil = useRef<Mesh>(null); const handle = useRef<Group>(null); const ring = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    const value = instrument.value; const length = 3.8 + value * 14;
    coil.current?.scale.set(length / 4.8, (.68 - value * .3) / .68, (.68 - value * .3) / .68);
    handle.current?.position.set(-2.8 + length, 0, .68 - value * .3);
    if (ring.current) {
      const t = clamp((value - .075) / .025, 0, 1);
      ring.current.color.setRGB(.23 + .33 * t, .48 - .15 * t, .83 - .68 * t);
    }
  });
  const wire = useMemo(() => {
    const points = Array.from({ length: 521 }, (_, i) => {
      const t = i / 520; const angle = t * Math.PI * 2 * 10;
      // Straight leads join the ten-turn helix to the mounting hardware.
      return new Vector3(t * 4.8, Math.sin(angle) * .68, Math.cos(angle) * .68);
    });
    return new TubeGeometry(new CatmullRomCurve3(points), 520, .09, 12, false);
  }, []);
  useEffect(() => () => wire.dispose(), [wire]);
  const drag = useDrag(instrument, .0003, .01, .14);
  return <group rotation={[.1, -.22, -.035]} position={[-.3, .08, 0]}>
    <RoundedBox args={[.35, 2.15, 1.65]} radius={.055} position={[-3.07, 0, 0]}><meshStandardMaterial {...steel} roughness={.32} /></RoundedBox>
    {[-.73, .73].flatMap(y => [-.54, .54].map(z => <mesh key={`${y}-${z}`} position={[-2.875, y, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.095, .095, .035, 20]} /><meshStandardMaterial color="#565d64" metalness={.9} roughness={.3} /></mesh>))}
    <mesh ref={coil} geometry={wire} position={[-2.8, 0, 0]} castShadow><meshStandardMaterial {...steel} /></mesh>
    <mesh position={[-2.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.45, .45, .25, 48]} /><meshStandardMaterial {...steel} /></mesh>
    <group ref={handle} {...drag}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.2, .2, .65, 32]} /><meshStandardMaterial {...steel} /></mesh>
      <mesh position={[.32, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.31, .065, 12, 40]} /><meshStandardMaterial ref={ring} color={dark ? '#83b9ef' : '#b8bcc1'} metalness={.88} roughness={.25} /></mesh>
      {/* Generous invisible hit surface around the free end, not over the page. */}
      <mesh><sphereGeometry args={[.52, 16, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
    </group>
  </group>;
}

function Pendulum({ instrument }: Omit<Props, 'kind'>) {
  const swing = useRef<Group>(null);
  const arcLine = useRef<Line2>(null); const lastArcAngle = useRef(-1);
  useFrame(() => {
    swing.current?.rotation.set(0, 0, instrument.pose * Math.PI / 180);
    const angle = instrument.value * Math.PI / 180; const line = arcLine.current;
    if (line && Math.abs(lastArcAngle.current - angle) > .00001) {
      line.visible = angle > .005;
      const start = line.geometry.getAttribute('instanceStart'); const end = line.geometry.getAttribute('instanceEnd');
      for (let i = 0; i < 39; i++) {
        const a = -angle + 2 * angle * i / 39; const b = -angle + 2 * angle * (i + 1) / 39;
        start.setXYZ(i, Math.sin(a) * 3.4, 1.9 - Math.cos(a) * 3.4, 0);
        end.setXYZ(i, Math.sin(b) * 3.4, 1.9 - Math.cos(b) * 3.4, 0);
      }
      start.needsUpdate = end.needsUpdate = true; lastArcAngle.current = angle;
    }
  });
  const drag = useDrag(instrument, .2, -60, 60);
  // Reuse the arc's buffers. Only amplitude changes edit them; swinging rotates the pivot.
  const arc = useMemo(() => Array.from({ length: 40 }, (_, i) => {
    const a = -Math.PI / 3 + 2 * Math.PI / 3 * i / 39; return new Vector3(Math.sin(a) * 3.4, 1.9 - Math.cos(a) * 3.4, 0);
  }), []);
  return <group position={[-.3, .2, 0]}>
    <mesh position={[0, 2.05, 0]}><cylinderGeometry args={[.32, .32, .25, 48]} /><meshStandardMaterial {...steel} /></mesh>
    <Line points={[[0, 1.9, 0], [0, -1.4, 0]]} color="#bcc1c8" lineWidth={.6} dashed dashSize={.08} gapSize={.06} />
    <Line ref={arcLine} points={arc} color="#82909f" lineWidth={.8} />
    <group ref={swing} position={[0, 1.9, 0]}>
      <mesh position={[0, -1.5, 0]} castShadow><cylinderGeometry args={[.028, .028, 3, 16]} /><meshStandardMaterial {...steel} /></mesh>
      <mesh position={[0, -3, 0]} castShadow {...drag}><sphereGeometry args={[.48, 56, 40]} /><meshStandardMaterial {...steel} roughness={.17} /></mesh>
    </group>
  </group>;
}

function Cuvette({ instrument }: Omit<Props, 'kind'>) {
  const glass = useRef<Mesh>(null);
  const liquid = useRef<MeshPhysicalMaterial>(null); const outgoing = useRef<MeshBasicMaterial>(null);
  useFrame(() => {
    if (liquid.current) liquid.current.opacity = .65 + instrument.value * .15;
    if (outgoing.current) outgoing.current.opacity = Math.max(.25, 1 - instrument.value * .6);
  });
  return <group rotation={[0, -.38, 0]}>
    <RoundedBox ref={glass} args={[1.3, 3.5, 1.25]} radius={.035} position={[0, .05, 0]}>
      <meshPhysicalMaterial color="#e3effa" transmission={.94} thickness={.12} roughness={.08} ior={1.45} transparent opacity={.42} depthWrite={false} />
    </RoundedBox>
    <mesh position={[0, -.38, 0]}><boxGeometry args={[1.17, 2.5, 1.12]} /><meshPhysicalMaterial ref={liquid} color="#086cb5" transparent opacity={.72} roughness={.14} metalness={.08} /></mesh>
    <mesh position={[0, .88, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.18, 1.12]} /><meshPhysicalMaterial color="#43a7dc" transparent opacity={.8} roughness={.12} metalness={.35} /></mesh>
    {[-.65, .65].flatMap(x => [-.625, .625].map(z => <mesh key={`${x}-${z}`} position={[x, .05, z]}><boxGeometry args={[.018, 3.5, .018]} /><meshStandardMaterial color="#b4cddd" metalness={.4} roughness={.25} /></mesh>))}
    {[-1.7, 1.8].map(x => <group key={x} position={[x, -.45, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow><cylinderGeometry args={[.48, .48, .8, 48]} /><meshStandardMaterial {...steel} roughness={.3} /></mesh>
      <mesh position={[0, x < 0 ? -.405 : .405, 0]}><cylinderGeometry args={[.18, .18, .025, 32]} /><meshStandardMaterial color="#171d24" metalness={.5} roughness={.2} /></mesh>
    </group>)}
    <mesh renderOrder={3} position={[-.675, -.45, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.025, .025, 1.35, 12]} /><meshBasicMaterial color="#56baff" toneMapped={false} transparent opacity={.95} depthWrite={false} depthTest={false} /></mesh>
    <mesh renderOrder={3} position={[.7, -.45, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.025, .025, 1.4, 12]} /><meshBasicMaterial ref={outgoing} color="#4597ff" toneMapped={false} transparent opacity={.73} depthWrite={false} depthTest={false} /></mesh>
    <pointLight position={[0, -.45, .6]} color="#258dff" intensity={2} distance={2.5} />
  </group>;
}

function Sensor({ instrument }: Omit<Props, 'kind'>) {
  const actuator = useRef<Group>(null); const bridge = useRef<Mesh>(null); const response = useRef<MeshStandardMaterial>(null);
  useFrame(() => {
    const gap = .5 - Math.min(instrument.value, 12) * .023;
    actuator.current?.position.setY(gap);
    bridge.current?.position.setY(-.41 + gap / 2); bridge.current?.scale.setY(gap);
    if (response.current) response.current.emissiveIntensity = .2 + instrument.value / 25;
  });
  return <group rotation={[.06, -.35, 0]} position={[0, -.1, 0]}>
    <mesh position={[0, -1.1, 0]} castShadow><cylinderGeometry args={[.85, .85, 1.1, 64]} /><meshStandardMaterial {...steel} roughness={.26} /></mesh>
    <mesh position={[0, -.5, 0]}><cylinderGeometry args={[1, 1, .18, 64]} /><meshStandardMaterial {...steel} /></mesh>
    <group ref={actuator}>
      <mesh position={[0, .14, 0]} castShadow><cylinderGeometry args={[.86, .86, 1.1, 64]} /><meshStandardMaterial {...steel} roughness={.25} /></mesh>
      <mesh position={[0, .79, 0]}><cylinderGeometry args={[1, 1, .18, 64]} /><meshStandardMaterial {...steel} /></mesh>
      <mesh position={[0, 1.58, 0]}><cylinderGeometry args={[.25, .25, 1.4, 40]} /><meshStandardMaterial color="#6f747a" metalness={.95} roughness={.3} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[0, .93 + i * .075, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.26, .022, 8, 32]} /><meshStandardMaterial color="#42484e" metalness={.8} roughness={.25} /></mesh>)}
    </group>
    <mesh ref={bridge}><cylinderGeometry args={[.42, .42, 1, 40]} /><meshStandardMaterial ref={response} color="#5682a0" emissive="#0b57ad" emissiveIntensity={.4} metalness={.8} roughness={.25} /></mesh>
    <mesh position={[-1, -1.12, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.15, .15, .8, 24]} /><meshStandardMaterial color="#333b42" metalness={.65} roughness={.3} /></mesh>
    <Line points={[[-1.4, -1.12, 0], [-1.9, -1.16, 0], [-2.6, -1.55, 0]]} color="#363d44" lineWidth={7} />
  </group>;
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onUnavailable?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
const StudioShadow = memo(function StudioShadow({ dark }: { dark?: boolean }) {
  return <ContactShadows position={[0, -2.15, 0]} opacity={dark ? .3 : .22} scale={14} blur={2.8} far={5} resolution={256} frames={1} />;
});
export const StudioEnvironment = memo(function StudioEnvironment({ dark }: { dark?: boolean }) {
  return <Environment resolution={128}>
    <Lightformer intensity={4} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 3, 1]} />
    <Lightformer intensity={3} position={[-5, 1, 3]} rotation={[0, Math.PI / 3, 0]} scale={[2, 8, 1]} />
    <Lightformer intensity={dark ? 6 : 2} color={dark ? '#3185ed' : '#e2ebf6'} position={[5, 1, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[2, 7, 1]} />
    <Lightformer intensity={2} position={[0, -3, 4]} scale={[8, 1, 1]} />
  </Environment>;
});
function FitCamera({ kind, cinematic }: { kind: Instrument; cinematic?: boolean }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    // Reserve the full oscillation/extension envelope within the canvas, away from text.
    const width = kind === 'spring' || kind === 'pendulum' ? 7.4 : 6;
    camera.position.setY(cinematic ? .25 : 1.1);
    camera.position.setZ(Math.max(cinematic ? 7.8 : 8.8, width / (2 * Math.tan(19 * Math.PI / 180) * (size.width / size.height))));
    if (cinematic) camera.lookAt(0, .25, 0);
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, kind, cinematic, invalidate]);
  return null;
}
function InstrumentFrames({ instrument, onReady, onSnapshot }: { instrument: AmbientInstrument; onReady?: (frame: string) => void; onSnapshot?: (frame: string) => void }) {
  const { gl, scene, camera, invalidate } = useThree();
  const frames = useRef(0);
  useFrame(({ gl, scene, camera, invalidate }) => {
    // Positive priority takes over the final render. Readiness is published AFTER
    // a complete frame with the studio environment, not during scene preparation.
    gl.render(scene, camera);
    if (gl.domElement.dataset.sceneReady) return;
    frames.current++;
    if (frames.current >= 3 && scene.environment && gl.info.render.calls > 0) {
      gl.domElement.dataset.sceneReady = 'true';
      if (onReady) onReady(gl.domElement.toDataURL('image/png'));
    } else invalidate();
  }, 1);
  useEffect(() => { invalidate(); return instrument.subscribeFrame(invalidate); }, [instrument, invalidate]);
  useLayoutEffect(() => () => {
    // Keep the last pose as the poster when this demand-rendered scene unmounts.
    // Capture immediately after rendering; no preserveDrawingBuffer overhead.
    if (onSnapshot && gl.domElement.dataset.sceneReady && !gl.getContext().isContextLost()) {
      gl.render(scene, camera);
      if (gl.info.render.calls > 0) onSnapshot(gl.domElement.toDataURL('image/png'));
    }
  }, [gl, scene, camera, onSnapshot]);
  return null;
}
/** Reusable geometry for the focused scientific instrument scenes. */
export function InstrumentModel(props: Props) {
  return props.kind === 'spring' ? <Spring {...props} /> : props.kind === 'pendulum' ? <Pendulum {...props} /> : props.kind === 'beer' ? <Cuvette {...props} /> : <Sensor {...props} />;
}
export default function InstrumentScene(props: Props) {
  const [lost, setLost] = useState(false);
  const fallback = props.cinematic ? null : <InstrumentFallback kind={props.kind} failed />;
  if (lost) return fallback;
  return <SceneBoundary fallback={fallback} onUnavailable={props.onUnavailable}>
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1.1, 8.8], fov: 38 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} onCreated={({ gl }) => {
      gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setLost(true); props.onUnavailable?.(); }, { once: true });
    }} fallback={fallback}>
      <InstrumentFrames instrument={props.instrument} onReady={props.onReady} onSnapshot={props.onSnapshot} /><FitCamera kind={props.kind} cinematic={props.cinematic} /><ambientLight intensity={props.dark ? .3 : .65} />
      <directionalLight position={[-3, 6, 5]} intensity={props.dark ? 2 : 3} />
      <directionalLight position={[4, 2, -3]} intensity={props.dark ? 3 : 1.5} color={props.dark ? '#4c9bff' : '#eaf1ff'} />
      <StudioEnvironment dark={props.dark} />
      <InstrumentModel {...props} />
      <StudioShadow key={props.kind} dark={props.dark} />
    </Canvas>
  </SceneBoundary>;
}

