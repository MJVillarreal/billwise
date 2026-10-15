import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { InvoiceReview } from '@/components/invoice-review';
import { findSample, keysLoadedBefore, samples } from '@/lib/samples';

export function generateStaticParams() {
  return samples.map((sample) => ({ id: sample.id }));
}

export default function SamplePage({ params }: PageProps<'/demo/[id]'>) {
  return (
    <Suspense>
      <Sample params={params} />
    </Suspense>
  );
}

async function Sample({ params }: { params: PageProps<'/demo/[id]'>['params'] }) {
  const { id } = await params;
  const sample = findSample(id);
  if (!sample) notFound();

  const index = samples.indexOf(sample);
  const nextId = samples[index + 1]?.id ?? null;

  return (
    <InvoiceReview
      key={sample.id}
      sample={sample}
      existingKeys={keysLoadedBefore(id)}
      nextId={nextId}
    />
  );
}
