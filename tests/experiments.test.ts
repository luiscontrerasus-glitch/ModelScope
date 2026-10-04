import { describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/analysis';
import { createExperimentExport } from '../src/lib/analysis/export';
import { smallAnglePeriod } from '../src/lib/analysis/models';
import { analyzeExperiment, configuredEquation, createExperimentSession, modelParameters } from '../src/lib/experiments/analysis';
import { finiteAmplitudePeriod } from '../src/lib/experiments/generators';
import { experiments, getExperiment } from '../src/lib/experiments/registry';
import { springData } from '../src/lib/experiments/hookes-law';
import type { ExperimentId } from '../src/lib/experiments/types';
import baseline from './hooke-baseline.json';

describe('exact Milestone 1.5 numerical regression', () => {
  it.each(baseline)('preserves $kind, intercept=$intercept', expected => {
    const r = analyzeExperiment('spring-hooke', springData(expected.kind as 'linear' | 'transition'), { intercept: expected.intercept });
    expect({ globalFit: r.globalFit, referenceFit: r.referenceFit, points: r.points, transition: r.transition }).toEqual({ globalFit: expected.globalFit, referenceFit: expected.referenceFit, points: expected.points, transition: expected.transition });
  });
});
describe('four experiment families', () => {
  for (const experiment of experiments) {
    const id = experiment.id;
    it(`${id}: model-consistent control does not support a transition`, () => {
      expect(analyzeExperiment(id, experiment.datasets.linear).transition.status).toBe('none');
    });
    it(`${id}: sustained demonstration passes all safeguards`, () => {
      const r = analyzeExperiment(id, experiment.datasets.transition);
      expect(r.transition.status).toBe('supported'); expect(r.transition.influenceCheck?.passed).toBe(true);
      expect(r.transition.sustainedRowIds.length).toBeGreaterThanOrEqual(4);
    });
    it(`${id}: isolated outliers at every position cannot create support`, () => {
      const control = experiment.datasets.linear;
      for (const sign of [-1, 1]) for (let index = 0; index < control.length; index++) {
        const rows = control.map((r, i) => ({ ...r, y: r.y + (i === index ? sign * 100 * experiment.config.noiseFloor : 0) }));
        expect(analyzeExperiment(id, rows).transition.status, `position ${index}, sign ${sign}`).not.toBe('supported');
      }
    });
    it(`${id}: high assumed noise withholds confident support`, () => {
      const r = analyzeExperiment(id, experiment.datasets.transition, { noiseFloor: experiment.config.noiseFloor * 100 });
      expect(r.transition.status).toBe('ambiguous'); expect(r.transition.range).toBeNull(); expect(r.transition.estimate).toBeNull();
    });
    it(`${id}: insufficient sample and sensitivity semantics propagate`, () => {
      expect(analyzeExperiment(id, experiment.datasets.transition.slice(0, 5)).transition.status).toBe('insufficient');
      const r = analyzeExperiment(id, experiment.datasets.transition); const t = r.transition;
      expect(t.sensitivity?.nearBestKnees).toEqual(t.candidates.filter(c => c.deltaFromBest <= 2).map(c => c.knee));
      expect(t.sensitivity?.definition).toContain('Not a confidence interval');
      expect(t.range).toEqual(t.sensitivity?.samplingRange);
    });
    it(`${id}: export identity, variables, units, equation, predictions and states round-trip`, () => {
      for (const dataset of ['linear', 'transition'] as const) {
        const session = createExperimentSession(id, dataset);
        const output = JSON.parse(JSON.stringify(createExperimentExport(session.analysis, experiment, session.provenance)));
        expect(output.schemaVersion).toBe('1.1.0'); expect(output.methodology.version).toBe('1.2.0');
        expect(output.experiment.id).toBe(id); expect(output.experiment.scientificQuestion).toBe(experiment.question);
        expect(output.experiment.independent).toEqual(experiment.independent);
        expect(output.units).toEqual({ independent: experiment.independent.unit, dependent: experiment.dependent.unit, slope: experiment.slopeUnit, sse: experiment.sseUnit });
        expect(output.configuredModel.id).toBe(experiment.baseline.id);
        expect(output.configuredModel.equation).toBe(configuredEquation(experiment, session.analysis));
        expect(output.dataProvenance.synthetic).toBe(true); expect(output.dataProvenance.edited).toBe(false);
        expect(analyzeExperiment(id, output.originalObservations)).toEqual(session.analysis);
        expect(output.analysis.points).toEqual(session.analysis.points);
        expect(output.analysis.transition.status).toBe(dataset === 'linear' ? 'none' : 'supported');
      }
    });
    it(`${id}: export propagates ambiguous and insufficient states without a range`, () => {
      for (const state of ['ambiguous', 'insufficient'] as const) {
        const r = state === 'ambiguous' ? analyzeExperiment(id, experiment.datasets.transition, { noiseFloor: experiment.config.noiseFloor * 100 }) : analyzeExperiment(id, experiment.datasets.linear.slice(0, 5));
        const exported = createExperimentExport(r, experiment, { synthetic: true, dataset: 'transition', edited: true });
        expect(exported.analysis.transition.status).toBe(state);
        expect(exported.analysis.transition.range).toBeNull(); expect(exported.analysis.transition.sensitivity).toBeNull();
        expect(exported.dataProvenance.edited).toBe(true);
      }
    });
  }
  it('experiment sessions reset configuration, dataset, provenance and measurements', () => {
    const spring = createExperimentSession('spring-hooke');
    spring.measurements[0].y = 999; spring.config.noiseFloor = 50;
    for (const id of ['pendulum', 'beer-lambert', 'sensor-calibration', 'spring-hooke'] as ExperimentId[]) {
      const session = createExperimentSession(id); const e = getExperiment(id);
      expect(session.config).toEqual(e.config); expect(session.measurements).toEqual(e.datasets.transition);
      expect(session.experimentId).toBe(id); expect(session.provenance.edited).toBe(false);
      expect(session.analysis.originalObservations).toEqual(session.measurements);
    }
  });
  it('pendulum keeps the theoretical period fixed at every angle', () => {
    const r = createExperimentSession('pendulum').analysis;
    expect(smallAnglePeriod(1, 9.80665)).toBeCloseTo(2.00640929258904, 12);
    expect(smallAnglePeriod(9.80665, 9.80665)).toBeCloseTo(2 * Math.PI, 14);
    expect(r.points.every(p => p.predicted === smallAnglePeriod(1, 9.80665))).toBe(true);
    expect(r.globalFit.slope).toBe(0); expect(r.config.intercept).toBe(false);
    expect(modelParameters(getExperiment('pendulum'), r).map(p => p.symbol)).toEqual(['L', 'g', 'T₀']);
    expect(r.transition.comparison!.extraPenalty).toBeCloseTo(2 * Math.log(24) + 2 * Math.log(13), 12);
    const exported = createExperimentExport(r, getExperiment('pendulum'), { synthetic: true, dataset: 'transition', edited: false });
    expect(exported.methodology.baselineFittedParameters).toBe(0);
  });
  it('finite-amplitude AGM agrees with independently known values and small-angle limit', () => {
    expect(finiteAmplitudePeriod(0)).toBe(smallAnglePeriod(1, 9.80665));
    expect(finiteAmplitudePeriod(60) / smallAnglePeriod(1, 9.80665)).toBeCloseTo(1.073182007149364, 12);
    const radians = 10 * Math.PI / 180;
    const series = 1 + radians ** 2 / 16 + 11 * radians ** 4 / 3072;
    expect(finiteAmplitudePeriod(10) / smallAnglePeriod(1, 9.80665)).toBeCloseTo(series, 7);
    expect(() => finiteAmplitudePeriod(180)).toThrow(); expect(() => smallAnglePeriod(-1, 9.8)).toThrow();
    expect(() => smallAnglePeriod(1000, Number.MIN_VALUE)).toThrow();
  });
  it.each(['beer-lambert', 'sensor-calibration'] as const)('%s recovers an empirical line with offset', id => {
    const e = getExperiment(id); const rows = e.datasets.linear.map(r => ({ ...r, y: 0.8 * r.x + 0.04 }));
    const r = analyzeExperiment(id, rows);
    expect(r.globalFit.slope).toBeCloseTo(0.8, 12); expect(r.globalFit.intercept).toBeCloseTo(0.04, 12);
    expect(r.points[4].predicted).toBeCloseTo(rows[4].y, 12);
  });
  it.each(['beer-lambert', 'sensor-calibration'] as const)('%s retains the audited numerical unit-scaling behavior', id => {
    const e = getExperiment(id); const r = analyze(e.datasets.transition, e.config);
    const scaled = analyze(e.datasets.transition.map(p => ({ ...p, x: p.x * 10, y: p.y * 1000 })), { ...e.config, noiseFloor: e.config.noiseFloor * 1000 });
    expect(scaled.transition.status).toBe(r.transition.status); expect(scaled.transition.improvement).toBeCloseTo(r.transition.improvement!, 8);
    expect(scaled.transition.estimate).toBeCloseTo(r.transition.estimate! * 10, 9);
  });
  it('fixed-period baseline resists 50 fixed-seed noisy theoretical controls', () => {
    const e = getExperiment('pendulum'); const value = smallAnglePeriod(1, 9.80665);
    for (let seed = 1; seed <= 50; seed++) {
      let state = seed;
      const uniform = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return (state + 0.5) / 4294967296; };
      const rows = e.datasets.transition.map(r => ({ ...r, y: value + e.config.noiseFloor / 2 * Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform()) }));
      expect(analyzeExperiment(e.id, rows).transition.status, `seed ${seed}`).not.toBe('supported');
    }
  });
  it('rejects theoretical intercept fitting, invalid pendulum amplitude and mismatched export', () => {
    const e = getExperiment('pendulum');
    expect(() => analyzeExperiment(e.id, e.datasets.linear, { intercept: true })).toThrow();
    expect(() => analyzeExperiment(e.id, e.datasets.linear.map((r, i) => ({ ...r, x: i === 23 ? 176 : r.x })))).toThrow();
    expect(() => createExperimentExport(analyze(springData()), e, { synthetic: true, dataset: 'transition', edited: false })).toThrow();
  });
});
