// @vitest-environment jsdom
import { useRef } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionControl, useParameterMotion } from '../src/components/parameter-motion';

let reduced = false; let hidden = false; let nextFrame = 0; let time = 1000;
const frames = new Map<number, FrameRequestCallback>();
const mediaListeners = new Set<() => void>();
let intersect: IntersectionObserverCallback;
const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
function Harness() {
  const target = useRef<HTMLDivElement>(null);
  const motion = useParameterMotion({ target, min: 10, max: 20, initial: 14, seconds: 2 });
  return <div ref={target}><output aria-label="Parameter">{motion.value}</output><input aria-label="Manual parameter" type="range" min="10" max="20" value={motion.value} onChange={e => motion.scrub(Number(e.target.value))} /><MotionControl motion={motion} /></div>;
}
function visibility(visible: boolean) { act(() => intersect([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver)); }
function advance(count: number) {
  act(() => { for (let i = 0; i < count; i++) { time += 1000 / 60; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(f => f(time)); } });
}
beforeEach(() => {
  reduced = hidden = false; nextFrame = 0; time = 1000; frames.clear(); mediaListeners.clear();
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
  // A 30-fps display can trail the 60-Hz phase by one frame, never by hidden time.
  expect(Math.abs(Number(screen.getByLabelText('Parameter').textContent) - Number(visibleValue))).toBeLessThan(.3);
  expect(frames.size).toBe(1);
});
it('reduced motion cancels autoplay while keeping manual exploration available', () => {
  render(<Harness />); visibility(true); advance(10);
  act(() => { reduced = true; mediaListeners.forEach(f => f()); }); expect(frames.size).toBe(0);
  expect(screen.getByRole('button', { name: 'Play autoplay' }).hasAttribute('disabled')).toBe(true);
  fireEvent.change(screen.getByLabelText('Manual parameter'), { target: { value: '18' } }); expect(screen.getByLabelText('Parameter').textContent).toBe('18');
});
it('keeps the parameter bounded and preserves its selected value while paused', () => {
  render(<Harness />); visibility(true); advance(120);
  expect(Number(screen.getByLabelText('Parameter').textContent)).toBeGreaterThanOrEqual(10);
  expect(Number(screen.getByLabelText('Parameter').textContent)).toBeLessThanOrEqual(20);
  fireEvent.change(screen.getByLabelText('Manual parameter'), { target: { value: '16' } }); expect(frames.size).toBe(0);
  advance(120); expect(screen.getByLabelText('Parameter').textContent).toBe('16');
  fireEvent.click(screen.getByRole('button', { name: 'Play autoplay' })); advance(20);
  expect(screen.getByLabelText('Parameter').textContent).not.toBe('16');
});
