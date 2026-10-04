import { hookesLaw, springData } from './hookes-law';
import { beerLambertData, pendulumData, sensorData } from './generators';
import type { ExperimentDefinition, ExperimentId, VariableDefinition } from './types';
const variable = (name: string, symbol: string, unit: string, spokenUnit: string, decimals: number, max: number): VariableDefinition => ({ name, symbol, unit, spokenUnit, decimals, step: String(10 ** -decimals), min: 0, max });
const linearParameters = (slope: string, slopeUnit: string, offset: string, yUnit: string) => [
  { key: 'slope' as const, name: 'Calibration slope', symbol: slope, unit: slopeUnit, treatment: 'fitted' as const },
  { key: 'intercept' as const, name: 'Response offset', symbol: offset, unit: yUnit, treatment: 'fitted' as const },
];
const sharedCaveat = 'Statistical inadequacy does not identify the physical cause; a fitted hinge approximates a gradual departure.';
export const experiments: ExperimentDefinition[] = [
  {
    ...hookesLaw, id: 'spring-hooke', shortName: 'Spring', category: 'Mechanics',
    question: 'Over what extension range does a constant-stiffness spring model adequately describe these measurements?',
    independent: variable('Extension', 'x', 'm', 'meters', 3, 1000), dependent: variable('Force', 'F', 'N', 'newtons', 3, 1000000),
    baseline: { id: 'hooke-linear', kind: 'linear', equation: 'F = kx + c', originEquation: 'F = kx', prediction: 'Force proportional to unloaded extension, with an optional empirical force offset.', parameters: linearParameters('k', 'N/m', 'c', 'N') },
    slopeUnit: 'N/m', sseUnit: 'N²', expectedDomain: 'Approximately linear elastic response; extension measured from unloaded length.',
    context: 'Hooke’s law assumes constant spring stiffness within an approximately linear elastic regime. A progressive departure may reflect geometry, material response, or measurement effects. The residual pattern alone cannot identify the cause.',
    caveats: [sharedCaveat, 'A correctly zeroed force sensor is required for the ideal fixed-zero model.'],
    datasetLabels: { transition: 'Progressive departure', linear: 'Linear control' }, datasets: { transition: springData(), linear: springData('linear') },
  },
  {
    id: 'pendulum', title: 'Pendulum — Small-Angle Approximation', shortName: 'Pendulum', category: 'Mechanics',
    description: 'Fixed-length pendulum periods across initial oscillation angles.',
    question: 'Over what range of initial angles does the small-angle pendulum approximation remain adequate for these measurements?',
    independent: variable('Initial angle', 'θ', '°', 'degrees', 1, 175), dependent: variable('Period', 'T', 's', 'seconds', 5, 1000000),
    baseline: { id: 'pendulum-small-angle', kind: 'pendulum-small-angle', equation: 'T₀ = 2π√(L/g)', prediction: 'An angle-independent period for a simple pendulum of fixed length.', parameters: [
      { key: 'length', name: 'Pendulum length', symbol: 'L', unit: 'm', treatment: 'configured' },
      { key: 'gravity', name: 'Gravity', symbol: 'g', unit: 'm/s²', treatment: 'configured' },
      { key: 'period', name: 'Theoretical period', symbol: 'T₀', unit: 's', treatment: 'derived' },
    ] },
    config: { intercept: false, noiseFloor: 0.006, baseline: { kind: 'pendulum-small-angle', length: 1, gravity: 9.80665 } }, slopeUnit: 's/°', sseUnit: 's²',
    assumptions: ['Simple pendulum: point-like bob and effectively massless rigid suspension.', 'Fixed length L = 1 m and approximately constant g = 9.80665 m/s².', 'Negligible damping and sufficiently small oscillation angle for the baseline approximation.'],
    expectedDomain: 'Small initial angles; adequacy depends on the measurement scale and coverage.',
    context: 'The small-angle approximation can become increasingly inadequate as oscillation angle grows. Its theoretical period is fixed, never fitted to disguise amplitude dependence. Measurement effects, damping, or geometry could also produce disagreement.',
    caveats: [sharedCaveat, 'Length and gravity are assumed known; their uncertainty is not propagated.'],
    datasetLabels: { transition: 'Increasing amplitude · 2.5–60°', linear: 'Small-angle control · 0.2–4.8°' }, datasets: { transition: pendulumData('transition'), linear: pendulumData('linear') },
  },
  {
    id: 'beer-lambert', title: 'Beer–Lambert — Concentration Response', shortName: 'Beer–Lambert', category: 'Spectroscopy',
    description: 'A generic fixed-path absorbance calibration at increasing concentration.',
    question: 'Across what concentration range is a linear absorbance model adequate for these measurements?',
    independent: variable('Concentration', 'c', 'mmol/L', 'millimoles per liter', 3, 1000), dependent: variable('Absorbance', 'A', '1', 'dimensionless absorbance', 4, 1000000),
    baseline: { id: 'beer-lambert-linear', kind: 'linear', equation: 'A = mc + b', originEquation: 'A = mc', prediction: 'Absorbance approximately linear in concentration for fixed path length and absorbing species.', parameters: linearParameters('m', 'L/mmol', 'b', '1') },
    config: { intercept: true, noiseFloor: 0.008 }, slopeUnit: 'L/mmol', sseUnit: '1',
    assumptions: ['Fixed optical path length and absorbing species.', 'Stable wavelength and measurement conditions.', 'Approximately dilute response; empirical intercept accommodates blank or zeroing offset.'],
    expectedDomain: 'Low/moderate concentrations with approximately linear absorbance response.',
    context: 'The linear Beer–Lambert calibration can become inadequate at higher concentration. Chemistry, optical effects, or measurement response may contribute; this demonstration cannot distinguish them or prove spectrometer saturation.',
    caveats: [sharedCaveat, 'Absorbance is dimensionless; this is a generic calibration, not a specified chemical system.'],
    datasetLabels: { transition: 'Gradual calibration departure', linear: 'Linear calibration control' }, datasets: { transition: beerLambertData('transition'), linear: beerLambertData('linear') },
  },
  {
    id: 'sensor-calibration', title: 'Sensor Calibration — Linear Range', shortName: 'Sensor', category: 'Engineering',
    description: 'Generic force-reference input and voltage-output calibration with gradual compression.',
    question: 'Where does this sensor begin departing from its calibrated linear response?',
    independent: variable('Reference force', 'Q', 'N', 'newtons', 2, 1000), dependent: variable('Sensor output', 'V', 'V', 'volts', 4, 1000000),
    baseline: { id: 'sensor-linear', kind: 'linear', equation: 'V = mQ + b', originEquation: 'V = mQ', prediction: 'Voltage output linear in applied reference force, with a fitted zero-load offset.', parameters: linearParameters('m', 'V/N', 'b', 'V') },
    config: { intercept: true, noiseFloor: 0.015 }, slopeUnit: 'V/N', sseUnit: 'V²',
    assumptions: ['Stable zero-load offset and reference-force measurement.', 'Fixed operating conditions and approximately linear early calibration.', 'A generic educational sensor; no commercial device specification is implied.'],
    expectedDomain: 'Early calibrated response before appreciable compression.',
    context: 'Sensor response can become increasingly inconsistent with the fitted linear calibration at high input. The synthetic response compresses smoothly. A residual pattern does not prove a particular electrical failure mechanism.',
    caveats: [sharedCaveat, 'A supported range is a diagnostic candidate, not a certified safe operating range.'],
    datasetLabels: { transition: 'Gradual response compression', linear: 'Linear calibration control' }, datasets: { transition: sensorData('transition'), linear: sensorData('linear') },
  },
];
export function getExperiment(id: ExperimentId): ExperimentDefinition {
  const experiment = experiments.find(e => e.id === id);
  if (!experiment) throw new Error('Unknown built-in experiment.');
  return experiment;
}
