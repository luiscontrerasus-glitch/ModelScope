// @vitest-environment jsdom
import { useRef, useSyncExternalStore } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InstrumentMotionControl, useInstrumentMotion } from '../src/components/parameter-motion';
import type { AmbientInstrument } from '../src/components/ambient-instrument';

let reduced = false; let hidden = false; let nextFrame = 0; let time = 1000;
const frames = new Map<number, FrameRequestCallback>();
const mediaListeners = new Set<() => void>();
let intersect: IntersectionObserverCallback;
const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
let parentRenders = 0;
function Reading({ instrument }: { instrument: AmbientInstrument }) {
  useSyncExternalStore(instrument.subscribe, instrument.snapshot, instrument.snapshot);
  return <output aria-label="Parameter">{instrument.value}</output>;
}
function Harness({ enabled = true }: { enabled?: boolean }) {
  parentRenders++;
  const target = useRef<HTMLDivElement>(null);
  const motion = useInstrumentMotion({ kind: 'spring', target, min: 10, max: 20, initial: 14, enabled });
  return <div ref={target}><Reading instrument={motion.instrument} /><input aria-label="Manual parameter" type="range" min="10" max="20" defaultValue="14" onChange={e => motion.instrument.manual(Number(e.target.value))} /><InstrumentMotionControl motion={motion} /></div>;
}
function visibility(visible: boolean) { act(() => intersect([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)); }
function advance(count: number) {
  act(() => { for (let i = 0; i < count; i++) { time += 1000 / 60; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(f => f(time)); } });
}
beforeEach(() => {
  reduced = hidden = false; nextFrame = parentRenders = 0; time = 1000; frames.clear(); mediaListeners.clear();
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced; }, addEventListener: (_: string, f: () => void) => mediaListeners.add(f), removeEventListener: (_: string, f: () => void) => mediaListeners.delete(f) }));
  vi.stubGlobal('IntersectionObserver', class { constructor(f: IntersectionObserverCallback) { intersect = f; } observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { frames.set(++nextFrame, f); return nextFrame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); if (hiddenDescriptor) Object.defineProperty(document, 'hidden', hiddenDescriptor); });
it('stops scheduling offscreen and in a hidden tab, then resumes without a hidden-time jump', () => {
  render(<Harness />); expect(frames.size).toBe(0);
  visibility(true); advance(20); const visibleValue = screen.getByLabelText('Parameter').textContent;
  visibility(false); expect(frames.size).toBe(0); advance(120); expect(screen.getByLabelText('Parameter').textContent).toBe(visibleValue);
  visibility(true); act(() => { hidden = true; document.dispatchEvent(new Event('visibilitychange')); }); expect(frames.size).toBe(0);
  advance(120); act(() => { hidden = false; document.dispatchEvent(new Event('visibilitychange')); }); advance(1);
  // A sampled readout can trail the frame state slightly, never by suspended elapsed time.
  expect(Math.abs(Number(screen.getByLabelText('Parameter').textContent) - Number(visibleValue))).toBeLessThan(.3);
  expect(frames.size).toBe(1);
});
it('reduced motion cancels autoplay while keeping manual exploration available', () => {
  render(<Harness />); visibility(true); advance(10);
  act(() => { reduced = true; mediaListeners.forEach(f => f()); }); expect(frames.size).toBe(0);
  expect(screen.getByRole('button', { name: 'Resume motion' }).hasAttribute('disabled')).toBe(true);
  fireEvent.change(screen.getByLabelText('Manual parameter'), { target: { value: '18' } }); expect(screen.getByLabelText('Parameter').textContent).toBe('18');
});
it('keeps the parameter bounded and preserves its selected value during explicit pause', () => {
  render(<Harness />); visibility(true); advance(120);
  expect(Number(screen.getByLabelText('Parameter').textContent)).toBeGreaterThanOrEqual(10);
  expect(Number(screen.getByLabelText('Parameter').textContent)).toBeLessThanOrEqual(20);
  fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }));
  fireEvent.change(screen.getByLabelText('Manual parameter'), { target: { value: '16' } }); expect(frames.size).toBe(0);
  advance(120); expect(screen.getByLabelText('Parameter').textContent).toBe('16');
  fireEvent.click(screen.getByRole('button', { name: 'Resume motion' })); advance(270);
  expect(screen.getByLabelText('Parameter').textContent).not.toBe('16');
});
it('does not rerender the scene-owning parent for continuous motion', () => {
  render(<Harness />); visibility(true); const before = parentRenders;
  advance(180); expect(parentRenders).toBe(before);
  expect(Number(screen.getByLabelText('Parameter').textContent)).not.toBe(14);
});
it('suspends a visible secondary exhibit without losing its pose or motion preference', () => {
  const view = render(<Harness />); visibility(true); advance(60);
  view.rerender(<Harness enabled={false} />);
  const held = Number(screen.getByLabelText('Parameter').textContent);
  expect(frames.size).toBe(0);
  expect(screen.getByRole('button', { name: 'Pause motion' }).getAttribute('aria-pressed')).toBe('true');
  advance(240); expect(Number(screen.getByLabelText('Parameter').textContent)).toBe(held);
  view.rerender(<Harness />); advance(1);
  expect(Math.abs(Number(screen.getByLabelText('Parameter').textContent) - held)).toBeLessThan(.3);
  expect(frames.size).toBe(1);
});
