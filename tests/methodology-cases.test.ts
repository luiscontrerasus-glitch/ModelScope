import { describe, expect, it } from 'vitest';
import { methodologyCases } from '../src/components/methodology-cases';
describe('methodology demonstration uses production evidence', () => {
  it('does not promise supported transitions for an outlier or ordinary linear noise', () => {
    for (const example of methodologyCases.slice(0, 2)) {
      expect(example.result.transition.status).not.toBe('supported');
      expect(example.result.transition.estimate).toBeNull();
      expect(example.result.transition.range).toBeNull();
      expect(example.result.measurements).toHaveLength(24);
    }
  });
  it('shows real support for the existing sustained-deviation fixture', () => {
    const result = methodologyCases[2].result;
    expect(result.transition.status).toBe('supported');
    expect(result.transition.influenceCheck?.passed).toBe(true);
    expect(result.transition.sustainedRowIds.length).toBeGreaterThanOrEqual(4);
  });
});
