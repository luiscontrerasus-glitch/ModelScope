import Explore from '@/components/explore';
export const metadata = { title: 'Explore models · ModelScope' };
export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  const query = await searchParams;
  const model = (['spring', 'pendulum', 'beer-lambert', 'sensor'] as const).find(id => id === query.model) ?? 'spring';
  return <Explore key={model} initialModel={model} />;
}
