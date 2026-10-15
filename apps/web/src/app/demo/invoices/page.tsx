import { Suspense } from 'react';
import { InvoiceList } from '@/components/invoice-list';

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoiceList />
    </Suspense>
  );
}
