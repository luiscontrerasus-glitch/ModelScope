import { analyzeExperiment } from '@/lib/experiments/analysis';
import { springData } from '@/lib/experiments/hookes-law';

// Educational inputs only. Every decision comes from the unchanged production engine.
const outlier = springData('linear').map((row, i) => ({ ...row, y: 32 * row.x + (i === 19 ? 1 : 0) }));
export const methodologyCases = [
  { id: 'outlier', title: 'One outlier', description: 'One large residual is not a sustained departure. A single point cannot establish a supported transition.', result: analyzeExperiment('spring-hooke', outlier) },
  { id: 'linear', title: 'Noisy but linear', description: 'Small alternating residuals remain consistent with the configured line at this assumed response scale.', result: analyzeExperiment('spring-hooke', springData('linear')) },
  { id: 'sustained', title: 'Sustained deviation', description: 'A persistent departure passes comparison, residual persistence and the influence safeguard in this synthetic example.', result: analyzeExperiment('spring-hooke', springData()) },
];
