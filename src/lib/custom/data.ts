import Papa from 'papaparse';
import type { Measurement } from '../analysis/types';

export type InputMethod = 'csv' | 'paste' | 'manual';
export interface RawRow { id: string; record: number; values: string[]; blank: boolean }
export interface DataIssue { message: string; rowId?: string }
export interface RawTable {
  headers: string[]; originalHeaders?: string[]; rows: RawRow[]; issues: DataIssue[]; delimiter: ',' | '\t';
  inputMethod: InputMethod; sourceFilename?: string; syntheticExample: boolean;
}
export interface Mapping { x: string; y: string; ignoreBlankRows: boolean }
export const MAX_BYTES = 1024 * 1024;
export function sourceBasename(name: string): string { return name.split(/[\\/]/).at(-1)!.slice(0, 200); }
export function numeric(value: string): number | null {
  const text = value.trim();
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
  const result = Number(text);
  return Number.isFinite(result) ? result : null;
}
export function parseTable(text: string, inputMethod: 'csv' | 'paste', filename?: string): RawTable {
  const table: RawTable = { headers: [], rows: [], issues: [], delimiter: ',', inputMethod, syntheticExample: false, ...(filename ? { sourceFilename: sourceBasename(filename) } : {}) };
  if (new TextEncoder().encode(text).length > MAX_BYTES) { table.issues.push({ message: 'Use a CSV or pasted table no larger than 1 MiB.' }); return table; }
  if (!text.trim()) { table.issues.push({ message: 'The dataset is empty. Include a header row and measurements.' }); return table; }
  const source = text.replace(/^\uFEFF/, '');
  let parsed = Papa.parse<string[]>(source, { delimiter: inputMethod === 'csv' ? ',' : '', delimitersToGuess: [',', '\t'], dynamicTyping: false, skipEmptyLines: false });
  // Blank records can make Papa's statistical delimiter guess inconclusive.
  // Fall back only to a delimiter actually separating the parsed header record.
  if (inputMethod === 'paste' && parsed.errors.some(e => e.code === 'UndetectableDelimiter')) {
    for (const delimiter of [',', '\t']) {
      const explicit = Papa.parse<string[]>(source, { delimiter, dynamicTyping: false, skipEmptyLines: false });
      if ((explicit.data[0]?.length ?? 0) >= 2) { parsed = explicit; break; }
    }
  }
  table.delimiter = parsed.meta.delimiter === '\t' ? '\t' : ',';
  table.headers = parsed.data[0] ?? [];
  table.originalHeaders = [...table.headers];
  const headers = table.headers.map(h => h.trim());
  if (headers.length < 2 || headers.some(h => !h) || headers.every(h => numeric(h) !== null)) table.issues.push({ message: 'Headers are required: provide at least two named, nonblank columns.' });
  if (new Set(headers.map(h => h.toLowerCase())).size !== headers.length) table.issues.push({ message: 'Duplicate headers are not supported. Give every column a distinct name.' });
  if (headers.length > 32) table.issues.push({ message: 'At most 32 source columns are supported. Prepare a smaller CSV before importing.' });
  table.headers = headers;
  let values = parsed.data.slice(1);
  // Papa represents the final line terminator as an extra empty record, not data.
  if (/\r?\n$/.test(text) && values.at(-1)?.length === 1 && values.at(-1)?.[0] === '') values = values.slice(0, -1);
  table.rows = values.map((cells, i) => ({ id: `M${String(i + 1).padStart(2, '0')}`, record: i + 2, values: cells, blank: cells.every(v => !v.trim()) }));
  for (const row of table.rows) if (!row.blank && row.values.length !== headers.length) table.issues.push({ rowId: row.id, message: `Record ${row.record}: expected ${headers.length} fields but found ${row.values.length}. Fix this row before importing.` });
  for (const error of parsed.errors) table.issues.push({ message: `CSV/TSV format error${error.row !== undefined ? ` near record ${error.row + 1}` : ''}: ${error.message}` });
  if (table.rows.length > 500) table.issues.push({ message: 'At most 500 data records are supported, including blank records.' });
  if (!table.rows.length) table.issues.push({ message: 'There are no data rows below the headers.' });
  return table;
}
export function numericColumns(table: RawTable): string[] {
  return table.headers.filter((_, index) => {
    const rows = table.rows.filter(r => !r.blank);
    return rows.length > 0 && rows.every(r => numeric(r.values[index] ?? '') !== null);
  });
}
export function mapTable(table: RawTable, mapping: Mapping): { measurements: Measurement[]; issues: DataIssue[]; warnings: string[] } {
  const issues = [...table.issues]; const warnings: string[] = []; const measurements: Measurement[] = [];
  const xi = table.headers.indexOf(mapping.x); const yi = table.headers.indexOf(mapping.y);
  if (xi < 0 || yi < 0) issues.push({ message: 'Select an independent X column and a dependent Y column.' });
  if (xi >= 0 && xi === yi) issues.push({ message: 'X and Y must use different columns.' });
  const blanks = table.rows.filter(r => r.blank);
  if (blanks.length && !mapping.ignoreBlankRows) issues.push({ message: `${blanks.length} blank record(s) found. Confirm their exclusion or correct the source.` });
  if (blanks.length && mapping.ignoreBlankRows) warnings.push(`${blanks.length} explicitly excluded blank record(s) remain recorded in the export.`);
  if (xi < 0 || yi < 0 || xi === yi) return { measurements, issues, warnings };
  for (const row of table.rows) {
    if (row.blank) continue;
    const x = numeric(row.values[xi] ?? ''); const y = numeric(row.values[yi] ?? '');
    if (x === null || y === null) { issues.push({ rowId: row.id, message: `${row.id} (record ${row.record}): ${x === null ? mapping.x : mapping.y} is missing or is not a finite decimal number.` }); continue; }
    if (Math.abs(x) > 1e6 || Math.abs(y) > 1e6) { issues.push({ rowId: row.id, message: `${row.id}: absolute X and Y values must be at most 1,000,000. Rescale outside ModelScope and document the units.` }); continue; }
    measurements.push({ id: row.id, x, y });
  }
  if (new Set(measurements.map(r => r.x)).size !== measurements.length) issues.push({ message: 'Repeated X values are not supported. Preserve or aggregate replicates outside ModelScope with a documented method.' });
  if (measurements.length < 2) issues.push({ message: 'Provide at least two complete, distinct measurements to calculate a baseline.' });
  if (measurements.length >= 2 && measurements.length < 14) warnings.push('Fewer than 14 observations: baseline and residuals are available, but transition evidence will be insufficient. Six observations on each side of a candidate are required.');
  if (measurements.some((r, i) => i > 0 && r.x < measurements[i - 1].x)) warnings.push('X values are unsorted. Analysis sorts internally; the table and export preserve original order.');
  if (measurements.length && measurements.every(r => r.y === measurements[0].y)) warnings.push('The observed response is constant. Centered R² is undefined; a no-transition result does not validate the model.');
  if (measurements.length >= 2 && Math.max(...measurements.map(r => r.x)) - Math.min(...measurements.map(r => r.x)) < 1e-10 * Math.max(1, ...measurements.map(r => Math.abs(r.x)))) issues.push({ message: 'X values are too close numerically. Rescale or improve the input precision before fitting.' });
  return { measurements, issues, warnings };
}
export function emptyManualTable(): RawTable { return { headers: ['X', 'Y'], rows: [], issues: [], delimiter: ',', inputMethod: 'manual', syntheticExample: false }; }
