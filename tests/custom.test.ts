import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createCustomExport } from '../src/lib/analysis/export';
import { analyzeCustomMeasurements, createCustomSession, customDefinition, defaultSettings, settingsIssues, unitLabel, type CustomModel, type CustomSettings } from '../src/lib/custom/analysis';
import { emptyManualTable, mapTable, numeric, numericColumns, parseTable, sourceBasename } from '../src/lib/custom/data';
import { createExperimentSession } from '../src/lib/experiments/analysis';

function settings(model: CustomModel = 'linear-offset'): CustomSettings { return { ...defaultSettings(), mapping: { x: 'Input', y: 'Output', ignoreBlankRows: false }, model, constant: '3', noiseFloor: '0.1' }; }
function rows(model: CustomModel, departure = false) {
  return Array.from({ length: 24 }, (_, i) => { const x = i + 1; return { id: `M${String(i + 1).padStart(2, '0')}`, x, y: (model === 'constant' ? 3 : 2 * x + (model === 'linear-offset' ? 3 : 0)) + (i % 2 ? -0.02 : 0.02) + (departure ? 0.5 * Math.max(0, x - 10) : 0) }; });
}
const mapping = { x: 'Input', y: 'Output', ignoreBlankRows: false };
describe('local tabular parsing and mapping', () => {
  it('preserves CSV values, quoted extra columns, source name and original headers', () => {
    const table = parseTable(' Input ,Output,Label\r\n 01.00 ,2.000,"trial, one"\r\n2,3,"a ""quoted"" label"\r\n', 'csv', 'C:\\private\\study.csv');
    expect(table.issues).toEqual([]); expect(table.headers).toEqual(['Input', 'Output', 'Label']);
    expect(table.originalHeaders![0]).toBe(' Input '); expect(table.rows[0].values).toEqual([' 01.00 ', '2.000', 'trial, one']);
    expect(table.sourceFilename).toBe('study.csv'); expect(table.rows).toHaveLength(2);
    expect(numericColumns(table)).toEqual(['Input', 'Output']); expect(mapTable(table, mapping).measurements[0]).toEqual({ id: 'M01', x: 1, y: 2 });
  });
  it.each(['', ' \n ', 'Input,Output', '1,2\n3,4', ',Output\n1,2', 'Input,input\n1,2', 'Input,Output\n1', 'Input,Output\n1,2,3', 'Input,Output\n1,"unterminated'])('reports malformed/empty/header input %j', text => { expect(parseTable(text, 'csv').issues.length).toBeGreaterThan(0); });
  it('recognizes BOM and quoted multiline fields without corrupting records', () => {
    const t = parseTable('\uFEFFInput,Output,Note\n1,2,"first\nsecond"\n2,3,ok\n', 'csv');
    expect(t.issues).toEqual([]); expect(t.rows).toHaveLength(2); expect(t.rows[0].values[2]).toBe('first\nsecond'); expect(t.rows[1].record).toBe(3);
  });
  it('requires explicit blank-record exclusion and preserves blank identity', () => {
    const t = parseTable('Input,Output\n1,2\n\n2,3\n', 'csv');
    expect(t.rows).toHaveLength(3); expect(mapTable(t, mapping).issues.some(i => i.message.includes('blank'))).toBe(true);
    const mapped = mapTable(t, { ...mapping, ignoreBlankRows: true }); expect(mapped.issues).toEqual([]); expect(mapped.measurements.map(r => r.id)).toEqual(['M01', 'M03']); expect(mapped.warnings[0]).toContain('excluded');
  });
  it.each(['Input\tOutput\n1\t2\n2\t3', 'Input,Output\n1,2\n2,3'])('detects pasted delimiter %j', text => { const t = parseTable(text, 'paste'); expect(t.issues).toEqual([]); expect(mapTable(t, mapping).measurements).toHaveLength(2); });
  it('rejects malformed TSV paste', () => { expect(parseTable('Input\tOutput\n1\t2\t3\n2\t3', 'paste').issues.length).toBeGreaterThan(0); });
  it.each(['', 'abc', 'NaN', 'Infinity', '0x10', '1,200', 'true', '1e999'])('does not convert incompatible numeric text %j', value => { expect(numeric(value)).toBeNull(); });
  it.each(['-1.2', '+.5', '2e-3', '01.00', ' 12 '])('accepts decimal text %j without changing raw cells', value => { expect(numeric(value)).toBe(Number(value)); });
  it.each([{ x: '', y: 'Output' }, { x: 'Input', y: '' }, { x: 'Input', y: 'Input' }, { x: 'Unknown', y: 'Output' }])('requires distinct mapped columns $x / $y', m => { expect(mapTable(parseTable('Input,Output\n1,2\n2,3', 'csv'), { ...m, ignoreBlankRows: false }).issues.length).toBeGreaterThan(0); });
  it('reports missing/nonnumeric mapped values with stable row identity', () => {
    const t = parseTable('Input,Output,Note\n1,2,ok\n2,,missing\n3,bad,text', 'csv'); const result = mapTable(t, mapping);
    expect(result.issues.filter(i => i.rowId).map(i => i.rowId)).toEqual(['M02', 'M03']); expect(t.rows[2].values[1]).toBe('bad');
  });
  it('keeps meaningful partially blank rows and rejects repeated X', () => { const r = mapTable(parseTable('Input,Output\n1,2\n1,3\n,4', 'csv'), { ...mapping, ignoreBlankRows: true }); expect(r.issues.some(i => i.rowId === 'M03')).toBe(true); expect(r.issues.some(i => i.message.includes('Repeated'))).toBe(true); });
  it('warns on unsorted and insufficient rows without changing their order', () => { const r = mapTable(parseTable('Input,Output\n3,8\n-1,0\n1,4', 'csv'), mapping); expect(r.issues).toEqual([]); expect(r.measurements.map(p => p.x)).toEqual([3, -1, 1]); expect(r.warnings.join(' ')).toContain('unsorted'); expect(r.warnings.join(' ')).toContain('14'); });
  it.each(['Input,Output\n1e7,2\n2,3', 'Input,Output\n1,2\n1.000000000001,3'])('rejects extreme or nearly degenerate values', text => { expect(mapTable(parseTable(text, 'csv'), mapping).issues.length).toBeGreaterThan(0); });
  it('bounds bytes, rows and columns without accepting truncated data', () => {
    expect(parseTable('x'.repeat(1024 * 1024 + 1), 'csv').issues[0].message).toContain('MiB');
    expect(parseTable('Input,Output\n' + Array.from({ length: 501 }, (_, i) => `${i},${i}`).join('\n'), 'csv').issues.some(i => i.message.includes('500'))).toBe(true);
    expect(parseTable(Array.from({ length: 33 }, (_, i) => `col${i}`).join(',') + '\n' + Array(33).fill('1').join(','), 'csv').issues.some(i => i.message.includes('32'))).toBe(true);
  });
  it('starts manual data empty and maintains surviving IDs after deletion', () => {
    const t = emptyManualTable(); expect(t.rows).toEqual([]); expect(mapTable(t, { x: 'X', y: 'Y', ignoreBlankRows: false }).issues.length).toBeGreaterThan(0);
    t.rows = [{ id: 'M01', record: 2, values: ['1', '2'], blank: false }, { id: 'M03', record: 4, values: ['2', '4'], blank: false }];
    expect(mapTable(t, { x: 'X', y: 'Y', ignoreBlankRows: false }).measurements.map(r => r.id)).toEqual(['M01', 'M03']);
  });
});
describe('custom models reuse audited evidence', () => {
  for (const model of ['linear-offset', 'linear-origin', 'constant'] as const) {
    it(`${model}: known prediction and model-consistent none`, () => { const r = analyzeCustomMeasurements(rows(model), settings(model)); expect(r.transition.status).toBe('none'); if (model === 'constant') expect(r.points.every(p => p.predicted === 3)).toBe(true); else { expect(r.globalFit.slope).toBeCloseTo(2, 3); expect(r.globalFit.intercept).toBeCloseTo(model === 'linear-origin' ? 0 : 3, 2); } });
    it(`${model}: supported departure and exact sensitivity propagation`, () => { const r = analyzeCustomMeasurements(rows(model, true), settings(model)); expect(r.transition.status).toBe('supported'); expect(r.transition.influenceCheck?.passed).toBe(true); expect(r.transition.sensitivity?.nearBestKnees).toEqual(r.transition.candidates.filter(c => c.deltaFromBest <= 2).map(c => c.knee)); });
    it(`${model}: ambiguous at high assumed scale`, () => { const r = analyzeCustomMeasurements(rows(model, true), { ...settings(model), noiseFloor: '20' }); expect(r.transition.status).toBe('ambiguous'); expect(r.transition.range).toBeNull(); expect(r.findings.every(f => f.transition === null)).toBe(true); });
    it(`${model}: insufficient with fewer than 14 rows`, () => { const r = analyzeCustomMeasurements(rows(model).slice(0, 8), settings(model)); expect(r.transition.status).toBe('insufficient'); expect(r.points).toHaveLength(8); expect(r.transition.candidates).toEqual([]); });
    it(`${model}: isolated outliers never create supported regimes`, () => { for (let index = 0; index < 24; index++) for (const sign of [-1, 1]) { const data = rows(model).map((p, i) => ({ ...p, y: p.y + (i === index ? sign * 100 : 0) })); expect(analyzeCustomMeasurements(data, settings(model)).transition.status).not.toBe('supported'); } });
  }
  it.each(['', '0', '-1', 'NaN', 'Infinity', '1e-7', '1001'])('requires an explicit usable reference scale %j', noiseFloor => { expect(settingsIssues({ ...settings(), noiseFloor }).length).toBeGreaterThan(0); expect(() => analyzeCustomMeasurements(rows('linear-offset'), { ...settings(), noiseFloor })).toThrow(); });
  it.each(['', 'NaN', 'Infinity', '1e7'])('rejects invalid fixed constant %j', constant => { expect(() => analyzeCustomMeasurements(rows('constant'), { ...settings('constant'), constant })).toThrow(); });
  it.each(['0', '-3', '3.25'])('uses finite signed supplied C %j without fitting', constant => { const r = analyzeCustomMeasurements(rows('constant'), { ...settings('constant'), constant }); expect(r.globalFit.intercept).toBe(Number(constant)); expect(r.config.baseline).toEqual({ kind: 'constant', value: Number(constant) }); });
  it('preserves signed, unsorted inputs and original identities', () => { const data = rows('linear-offset').map(p => ({ ...p, x: p.x - 15 })).reverse(); const r = analyzeCustomMeasurements(data, settings()); expect(r.originalObservations).toEqual(data); expect(r.measurements[0].x).toBe(-14); expect(r.measurements.at(-1)?.id).toBe('M24'); });
  it('distinguishes unknown units, dimensionless units and labels without converting', () => { expect(unitLabel({ name: 'x', unitKind: 'unspecified', unit: 'm' })).toBe('unspecified'); expect(unitLabel({ name: 'x', unitKind: 'unitless', unit: '' })).toBe('1'); expect(unitLabel({ name: 'x', unitKind: 'label', unit: 'mm' })).toBe('mm'); const e = customDefinition(settings()); expect(e.independent.unit).toBe('unspecified'); });
  it('unit label changes alone preserve decisions and scaled numbers preserve scores', () => { const s = settings(); const r = analyzeCustomMeasurements(rows('linear-offset', true), s); const labelled = analyzeCustomMeasurements(rows('linear-offset', true), { ...s, x: { name: 'Length', unitKind: 'label', unit: 'mm' } }); expect(labelled.transition).toEqual(r.transition); const scaled = analyzeCustomMeasurements(rows('linear-offset', true).map(p => ({ ...p, x: p.x * 10, y: p.y * 100 })), { ...s, noiseFloor: '10' }); expect(scaled.transition.status).toBe(r.transition.status); expect(scaled.transition.improvement).toBeCloseTo(r.transition.improvement!, 9); });
  it('has generic findings without invented physical mechanisms or Spring units', () => { const r = analyzeCustomMeasurements(rows('linear-offset', true), settings()); const text = JSON.stringify(r.findings); expect(text).not.toMatch(/yield point|saturation point|critical concentration|\/ N²|\/ N m/); });
  it('the independent synthetic temperature example supports a calculated departure', () => { const t = parseTable(readFileSync(new URL('../public/examples/temperature-response.csv', import.meta.url), 'utf8'), 'csv'); const s = { ...settings(), mapping: { x: 'Temperature', y: 'Response', ignoreBlankRows: false }, noiseFloor: '0.05' }; expect(createCustomSession(t, s).analysis.transition.status).toBe('supported'); });
});
describe('custom provenance, exports and fresh contexts', () => {
  function session() { return createCustomSession(parseTable('Input,Output,Note\n2,7,first\n1,5,second\n3,9,third\n', 'csv', 'C:\\private\\measurements.csv'), settings()); }
  it('exports raw cells/order, mapping, unknown units and fixed/fitted settings without paths', () => { const s = session(); const e = createCustomExport(s.analysis, s, false); expect(e.schemaVersion).toBe('1.2.0'); expect(e.methodology.version).toBe('1.3.0'); expect(e.dataProvenance).toMatchObject({ source: 'user-supplied', inputMethod: 'csv', sourceFilename: 'measurements.csv', synthetic: false, edited: false }); expect(e.columnMapping).toEqual({ x: 'Input', y: 'Output' }); expect(e.units.independentKind).toBe('unspecified'); expect(e.originalRows.records[0].values[2]).toBe('first'); expect(e.originalObservations.map(p => p.x)).toEqual([2, 1, 3]); expect(JSON.stringify(e)).not.toContain('C:\\'); expect(e.configuredModel.parameters[0].treatment).toBe('fitted'); });
  it.each(['csv', 'paste', 'manual'] as const)('records %s input provenance', inputMethod => { const s = session(); s.table.inputMethod = inputMethod; expect(createCustomExport(s.analysis, s, false).dataProvenance.inputMethod).toBe(inputMethod); });
  it('exports excluded blank records explicitly', () => { const s = createCustomSession(parseTable('Input,Output\n1,2\n\n2,3\n', 'paste'), { ...settings(), mapping: { ...mapping, ignoreBlankRows: true } }); const e = createCustomExport(s.analysis, s, false); expect(e.originalRows.records).toHaveLength(3); expect(e.dataProvenance.excludedBlankRowIds).toEqual(['M02']); });
  it('edited rerun exports current observations separately from immutable source records', () => { const s = session(); const data = s.analysis.originalObservations.map((p, i) => ({ ...p, y: p.y + (i === 0 ? 0.1 : 0) })); const r = analyzeCustomMeasurements(data, s.settings); const e = JSON.parse(JSON.stringify(createCustomExport(r, s, true))); expect(e.dataProvenance.edited).toBe(true); expect(e.originalRows.records[0].values[1]).toBe('7'); expect(e.originalObservations[0].y).toBe(7.1); expect(e.analysis.points).toEqual(r.points); });
  it('constant export distinguishes supplied parameters from fitted ones', () => { const s = session(); s.settings.model = 'constant'; s.experiment = customDefinition(s.settings); const r = analyzeCustomMeasurements(s.analysis.originalObservations, s.settings); const e = createCustomExport(r, s, false); expect(e.configuredModel.parameters).toEqual([{ key: 'constant', name: 'Expected constant', symbol: 'C', unit: 'unspecified', treatment: 'configured', value: 3 }]); expect(e.methodology.baselineFittedParameters).toBe(0); });
  it('fresh built-in → custom → built-in → new custom contexts do not share state', () => { const spring = createExperimentSession('spring-hooke'); const a = session(); a.settings.x.unit = 'secret-old-unit'; a.table.rows[0].values[0] = '999'; const pendulum = createExperimentSession('pendulum'); const b = session(); expect(spring.analysis.experimentId).toBe('spring-hooke'); expect(pendulum.analysis.experimentId).toBe('pendulum'); expect(b.settings.x.unit).toBe(''); expect(b.table.rows[0].values[0]).toBe('2'); expect(b.analysis.transition.status).toBe('insufficient'); expect(pendulum.provenance.synthetic).toBe(true); });
  it('sanitizes Windows and POSIX filenames, including deliberately supplied paths', () => { expect(sourceBasename('C:\\private\\data.csv')).toBe('data.csv'); expect(sourceBasename('/private/data.csv')).toBe('data.csv'); const s = session(); s.table.sourceFilename = '/private/another.csv'; expect(createCustomExport(s.analysis, s, false).dataProvenance.sourceFilename).toBe('another.csv'); });
  it('rejects invalid settings and mismatch rather than mislabelling exports', () => { expect(() => createCustomSession(parseTable('Input,Output\n1,bad\n2,3', 'csv'), settings())).toThrow(); expect(settingsIssues({ ...settings(), x: { name: '', unitKind: 'label', unit: '' } }).length).toBeGreaterThan(0); expect(() => createCustomExport(createExperimentSession('spring-hooke').analysis, session(), false)).toThrow(); });
});
