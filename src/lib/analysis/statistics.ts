export function sum(values: number[]): number { return values.reduce((a, b) => a + b, 0); }
export function metrics(observed: number[], predicted: number[]) {
  if (!observed.length || observed.length !== predicted.length) throw new Error('Metrics require paired observations.');
  const mean = sum(observed) / observed.length;
  const sse = sum(observed.map((y, i) => (y - predicted[i]) ** 2));
  const sst = sum(observed.map(y => (y - mean) ** 2));
  return { sse, rmse: Math.sqrt(sse / observed.length), r2: sst > 0 ? 1 - sse / sst : null };
}
export function criterion(sse: number, n: number, parameters: number, floor: number): number {
  return n * Math.log(Math.max(sse / n, floor ** 2 * 1e-12)) + parameters * Math.log(n);
}
