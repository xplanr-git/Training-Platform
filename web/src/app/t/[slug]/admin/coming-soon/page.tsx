import { FeatureGate } from '@/components/feature-gate';

export default async function ComingSoon({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const { feature } = await searchParams;
  return <FeatureGate feature={feature ?? 'This feature'} />;
}
