import { expect, it } from 'vitest';
import { AmbientInstrument, loadCycle } from '../src/components/ambient-instrument';

function advance(motion: AmbientInstrument, seconds: number, hz = 60) { for (let i = 0; i < Math.round(seconds * hz); i++) motion.advance(1 / hz); }

it('uses distinct smooth load, dwell, release and rest schedules with continuous boundaries', () => {
  expect(loadCycle('spring', .48)).toBe(1); expect(loadCycle('spring', .96)).toBe(0);
  expect(loadCycle('beer', .1)).toBe(0); expect(loadCycle('beer', .7)).toBe(1);
  expect(loadCycle('sensor', .1)).toBe(0); expect(loadCycle('sensor', .57)).toBe(1); expect(loadCycle('sensor', .9)).toBe(0);
  for (const kind of ['spring', 'beer', 'sensor'] as const) {
    for (const boundary of [0, .18, .22, .28, .42, .52, .55, .63, .65, .78, .82, .9, .98, 1]) {
      expect(Math.abs(loadCycle(kind, boundary - 1e-7) - loadCycle(kind, boundary + 1e-7))).toBeLessThan(.00001);
    }
  }
});
it('takes over the current value immediately, holds for four idle seconds, and resumes without reset', () => {
  const motion = new AmbientInstrument('spring', .01, .14, .072); advance(motion, 2);
  const current = motion.value; motion.begin(); advance(motion, 10); expect(motion.value).toBe(current);
  motion.manual(.111); motion.end(); advance(motion, 3.9); expect(motion.value).toBe(.111);
  advance(motion, .2); expect(Math.abs(motion.value - .111)).toBeLessThan(.001);
  advance(motion, 1); expect(motion.value).toBeGreaterThan(.111);
});
it('keeps manual controls stationary while ambient values and readouts advance', () => {
  const motion = new AmbientInstrument('beer', 0, 1, .45); let controls = 0; let readings = 0; let visualFrames = 0;
  motion.subscribeControl(() => controls++); motion.subscribe(() => readings++); motion.subscribeFrame(() => visualFrames++);
  advance(motion, 2); expect(controls).toBe(0); expect(visualFrames).toBe(120); expect(readings).toBeGreaterThanOrEqual(20); expect(readings).toBeLessThanOrEqual(24);
  motion.manual(.6); expect(controls).toBe(1);
});
it('smooths an amplitude change without resetting pendulum phase or pose', () => {
  const motion = new AmbientInstrument('pendulum', 0, 60, 28); advance(motion, .4);
  const pose = motion.pose; motion.amplitude(60, true); expect(motion.pose).toBe(pose); expect(motion.value).toBe(28);
  motion.advance(1 / 120); expect(Math.abs(motion.pose - pose)).toBeLessThan(2);
  advance(motion, 2); expect(motion.value).toBeCloseTo(60, 2);
  let negative = false; let positive = false;
  for (let i = 0; i < 180; i++) { motion.advance(1 / 60); negative ||= motion.pose < -55; positive ||= motion.pose > 55; }
  expect(negative && positive).toBe(true);
});
it('preserves a grabbed signed bob pose until release and smoothly resumes from that endpoint', () => {
  const motion = new AmbientInstrument('pendulum', 0, 60, 28); advance(motion, .5);
  const pose = motion.pose; motion.begin(); advance(motion, 1); expect(motion.pose).toBe(pose);
  motion.dragPose(-42); motion.end(); advance(motion, 3.9); expect(motion.pose).toBe(-42);
  advance(motion, .1); motion.advance(1 / 60); expect(Math.abs(motion.pose + 42)).toBeLessThan(.1);
});
it('has comparable trajectories at 60 and 120 Hz instead of frame-count-dependent speed', () => {
  for (const kind of ['spring', 'pendulum', 'beer', 'sensor'] as const) {
    const a = new AmbientInstrument(kind, 0, 60, 28); const b = new AmbientInstrument(kind, 0, 60, 28);
    advance(a, 8, 60); advance(b, 8, 120);
    expect(Math.abs(a.value - b.value)).toBeLessThan(.12);
    expect(Math.abs(a.pose - b.pose)).toBeLessThan(.12);
  }
});
it('uses bounded values and limits suspended-frame elapsed time', () => {
  const motion = new AmbientInstrument('sensor', 0, 12, 6.2); const before = motion.value;
  motion.advance(60); expect(Math.abs(motion.value - before)).toBeLessThan(.2);
  motion.manual(100); expect(motion.value).toBe(12); motion.manual(-1); expect(motion.value).toBe(0);
});
