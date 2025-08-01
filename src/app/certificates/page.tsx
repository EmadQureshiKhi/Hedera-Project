import { CertificateList } from '@/components/certificates/certificate-list';

export default function CertificatesPage() {
  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <CertificateList />
      </div>
    </div>
  );
}