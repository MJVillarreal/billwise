import { SampleGallery } from '@/components/sample-gallery';
import { samples } from '@/lib/samples';

export default function DemoPage() {
  return <SampleGallery samples={samples} />;
}
