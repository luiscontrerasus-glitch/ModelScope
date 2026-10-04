import { predict } from './regression';
import type { EvidencePoint, Fit, Measurement } from './types';
export function residuals(rows: Measurement[], fit: Fit, scale: number): EvidencePoint[] {
  return rows.map(row => {
    const predicted = predict(fit, row.x);
    return { ...row, predicted, residual: row.y - predicted, normalizedResidual: (row.y - predicted) / scale };
  });
}
export function sustainedRuns(points: EvidencePoint[], knee: number, multiplier = 2, minimumRun = 4): string[] {
  const result: string[] = []; let run: string[] = []; let sign = 0;
  const flush = () => { if (run.length >= minimumRun) result.push(...run); run = []; };
  for (const point of points.filter(p => p.x > knee)) {
    const current = Math.abs(point.normalizedResidual) > multiplier ? Math.sign(point.residual) : 0;
    if (!current || current !== sign) flush();
    if (current) run.push(point.id);
    sign = current;
  }
  flush(); return result;
}
