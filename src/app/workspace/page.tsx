import { Workspace } from '@/components/workspace';
import { experiments } from '@/lib/experiments/registry';
export default async function Page({ searchParams }: { searchParams: Promise<{ experiment?: string }> }) {
  const { experiment } = await searchParams;
  const initialExperiment = experiment === 'custom' ? 'custom' : experiments.find(e => e.id === experiment)?.id;
  return <Workspace initialExperiment={initialExperiment} />;
}
