import { CertificateDetail } from '@/components/certificates/certificate-detail';

export default function CertificateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <CertificateDetail certificateId={params.id} />
      </div>
    </div>
  );
}