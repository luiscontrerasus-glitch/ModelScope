'use client';
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox, Line } from '@react-three/drei';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Mesh } from 'three';

import { InstrumentFallback } from './instrument-fallback';
export type Instrument = 'spring' | 'pendulum' | 'beer' | 'sensor';
interface Props { kind: Instrument; value: number; onChange?: (value: number) => void; dark?: boolean }
const steel = { color: '#b8bcc1', metalness: .9, roughness: .28 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function useDrag(value: number, onChange: Props['onChange'], scale: number, min: number, max: number) {
  const start = useRef<{ x: number; value: number } | null>(null);
  return {
    onPointerDown(e: ThreeEvent<PointerEvent>) {
      if (!onChange) return;
      e.stopPropagation(); start.current = { x: e.nativeEvent.clientX, value };
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    onPointerMove(e: ThreeEvent<PointerEvent>) {
      if (!start.current || !onChange) return;
      e.stopPropagation(); onChange(clamp(start.current.value + (e.nativeEvent.clientX - start.current.x) * scale, min, max));
    },
    onPointerUp(e: ThreeEvent<PointerEvent>) {
      start.current = null; (e.target as Element).releasePointerCapture(e.pointerId);
    },
    onPointerCancel() { start.current = null; },
  };
}

function Spring({ value, onChange, dark }: Omit<Props, 'kind'>) {
  const length = 3.8 + value * 14;
  const wire = useMemo(() => {
    const points = Array.from({ length: 521 }, (_, i) => {
      const t = i / 520; const angle = t * Math.PI * 2 * 10;
      // Straight leads join the ten-turn helix to the mounting hardware.
      const radius = .68 - value * .3;
      return new Vector3(-2.8 + t * length, Math.sin(angle) * radius, Math.cos(angle) * radius);
    });
    return new TubeGeometry(new CatmullRomCurve3(points), 520, .09, 12, false);
  }, [length, value]);
  useEffect(() => () => wire.dispose(), [wire]);
  const drag = useDrag(value, onChange, .0003, .01, .14);
  return <group rotation={[.1, -.22, -.035]} position={[-.3, .08, 0]}>
    <RoundedBox args={[.35, 2.15, 1.65]} radius={.055} position={[-3.07, 0, 0]}><meshStandardMaterial {...steel} roughness={.32} /></RoundedBox>
    {[-.73, .73].flatMap(y => [-.54, .54].map(z => <mesh key={`${y}-${z}`} position={[-2.875, y, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.095, .095, .035, 20]} /><meshStandardMaterial color="#565d64" metalness={.9} roughness={.3} /></mesh>))}
    <mesh geometry={wire} castShadow><meshStandardMaterial {...steel} /></mesh>
    <mesh position={[-2.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.45, .45, .25, 48]} /><meshStandardMaterial {...steel} /></mesh>
    <group position={[-2.8 + length, 0, .68 - value * .3]} {...drag}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.2, .2, .65, 32]} /><meshStandardMaterial {...steel} /></mesh>
      <mesh position={[.32, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.31, .065, 12, 40]} /><meshStandardMaterial color={value > .08 ? '#c69b68' : dark ? '#83b9ef' : '#b8bcc1'} metalness={.88} roughness={.25} /></mesh>
      {/* Generous invisible hit surface around the free end, not over the page. */}
      <mesh><sphereGeometry args={[.52, 16, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
    </group>
  </group>;
}

function Pendulum({ value, onChange }: Omit<Props, 'kind'>) {
  const angle = value * Math.PI / 180;
  const drag = useDrag(value, onChange, .2, 0, 60);
  const arc = useMemo(() => Array.from({ length: 40 }, (_, i) => {
    const a = angle * i / 39; return new Vector3(Math.sin(a) * 3.4, 1.9 - Math.cos(a) * 3.4, 0);
  }), [angle]);
  return <group position={[-.3, .2, 0]}>
    <mesh position={[0, 2.05, 0]}><cylinderGeometry args={[.32, .32, .25, 48]} /><meshStandardMaterial {...steel} /></mesh>
    <Line points={[[0, 1.9, 0], [0, -1.4, 0]]} color="#bcc1c8" lineWidth={.6} dashed dashSize={.08} gapSize={.06} />
    {angle > .005 && <Line points={arc} color="#82909f" lineWidth={.8} />}
    <group position={[0, 1.9, 0]} rotation={[0, 0, angle]}>
      <mesh position={[0, -1.5, 0]} castShadow><cylinderGeometry args={[.028, .028, 3, 16]} /><meshStandardMaterial {...steel} /></mesh>
      <mesh position={[0, -3, 0]} castShadow {...drag}><sphereGeometry args={[.48, 56, 40]} /><meshStandardMaterial {...steel} roughness={.17} /></mesh>
    </group>
  </group>;
}

function Cuvette({ value }: Omit<Props, 'kind'>) {
  const glass = useRef<Mesh>(null);
  return <group rotation={[0, -.38, 0]}>
    <RoundedBox ref={glass} args={[1.3, 3.5, 1.25]} radius={.035} position={[0, .05, 0]}>
      <meshPhysicalMaterial color="#e3effa" transmission={.94} thickness={.12} roughness={.08} ior={1.45} transparent opacity={.42} depthWrite={false} />
    </RoundedBox>
    <mesh position={[0, -.38, 0]}><boxGeometry args={[1.17, 2.5, 1.12]} /><meshPhysicalMaterial color="#157bc5" transparent opacity={.4 + value * .25} roughness={.14} metalness={.08} /></mesh>
    <mesh position={[0, .88, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.18, 1.12]} /><meshPhysicalMaterial color="#43a7dc" transparent opacity={.8} roughness={.12} metalness={.35} /></mesh>
    {[-.65, .65].flatMap(x => [-.625, .625].map(z => <mesh key={`${x}-${z}`} position={[x, .05, z]}><boxGeometry args={[.018, 3.5, .018]} /><meshStandardMaterial color="#b4cddd" metalness={.4} roughness={.25} /></mesh>))}
    {[-1.7, 1.8].map(x => <group key={x} position={[x, -.45, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow><cylinderGeometry args={[.48, .48, .8, 48]} /><meshStandardMaterial {...steel} roughness={.3} /></mesh>
      <mesh position={[0, x < 0 ? -.405 : .405, 0]}><cylinderGeometry args={[.18, .18, .025, 32]} /><meshStandardMaterial color="#171d24" metalness={.5} roughness={.2} /></mesh>
    </group>)}
    <mesh position={[-.85, -.45, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.025, .025, 1.9, 12]} /><meshBasicMaterial color="#7ccaff" /></mesh>
    <mesh position={[.86, -.45, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.025, .025, 1.9, 12]} /><meshBasicMaterial color="#5da5ff" transparent opacity={Math.max(.25, 1 - value * .6)} /></mesh>
    <pointLight position={[0, -.45, .6]} color="#258dff" intensity={2} distance={2.5} />
  </group>;
}

function Sensor({ value }: Omit<Props, 'kind'>) {
  const gap = .5 - Math.min(value, 12) * .023;
  return <group rotation={[.06, -.35, 0]} position={[0, -.1, 0]}>
    <mesh position={[0, -1.1, 0]} castShadow><cylinderGeometry args={[.85, .85, 1.1, 64]} /><meshStandardMaterial {...steel} roughness={.26} /></mesh>
    <mesh position={[0, -.5, 0]}><cylinderGeometry args={[1, 1, .18, 64]} /><meshStandardMaterial {...steel} /></mesh>
    <mesh position={[0, -.3 + gap, 0]} castShadow><cylinderGeometry args={[.86, .86, 1.1, 64]} /><meshStandardMaterial {...steel} roughness={.25} /></mesh>
    <mesh position={[0, .35 + gap, 0]}><cylinderGeometry args={[1, 1, .18, 64]} /><meshStandardMaterial {...steel} /></mesh>
    <mesh position={[0, 1.15 + gap, 0]}><cylinderGeometry args={[.25, .25, 1.4, 40]} /><meshStandardMaterial color="#6f747a" metalness={.95} roughness={.3} /></mesh>
    {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[0, .6 + gap + i * .075, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.26, .022, 8, 32]} /><meshStandardMaterial color="#42484e" metalness={.8} roughness={.25} /></mesh>)}
    <mesh position={[0, -.38 + gap / 2, 0]}><cylinderGeometry args={[.42, .42, gap, 40]} /><meshStandardMaterial color="#5682a0" emissive="#0b57ad" emissiveIntensity={.15 + value / 35} metalness={.8} roughness={.25} /></mesh>
    <mesh position={[-1, -1.12, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.15, .15, .8, 24]} /><meshStandardMaterial color="#333b42" metalness={.65} roughness={.3} /></mesh>
    <Line points={[[-1.4, -1.12, 0], [-1.9, -1.16, 0], [-2.6, -1.55, 0]]} color="#363d44" lineWidth={7} />
  </group>;
}

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function InstrumentScene(props: Props) {
  const [lost, setLost] = useState(false);
  if (lost) return <InstrumentFallback kind={props.kind} failed />;
  return <SceneBoundary fallback={<InstrumentFallback kind={props.kind} failed />}>
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1.1, 8.8], fov: 38 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} onCreated={({ gl }) => {
      gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); setLost(true); }, { once: true });
    }} fallback={<InstrumentFallback kind={props.kind} failed />}>
      <ambientLight intensity={props.dark ? .3 : .65} />
      <directionalLight position={[-3, 6, 5]} intensity={props.dark ? 2 : 3} />
      <directionalLight position={[4, 2, -3]} intensity={props.dark ? 3 : 1.5} color={props.dark ? '#4c9bff' : '#eaf1ff'} />
      <Environment resolution={128}>
        <Lightformer intensity={4} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 3, 1]} />
        <Lightformer intensity={3} position={[-5, 1, 3]} rotation={[0, Math.PI / 3, 0]} scale={[2, 8, 1]} />
        <Lightformer intensity={props.dark ? 6 : 2} color={props.dark ? '#3185ed' : '#e2ebf6'} position={[5, 1, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[2, 7, 1]} />
        <Lightformer intensity={2} position={[0, -3, 4]} scale={[8, 1, 1]} />
      </Environment>
      {props.kind === 'spring' ? <Spring {...props} /> : props.kind === 'pendulum' ? <Pendulum {...props} /> : props.kind === 'beer' ? <Cuvette {...props} /> : <Sensor {...props} />}
      <ContactShadows key={`${props.kind}-${props.value}`} position={[0, -2.15, 0]} opacity={props.dark ? .3 : .22} scale={14} blur={2.8} far={5} resolution={256} frames={2} />
    </Canvas>
  </SceneBoundary>;
}

