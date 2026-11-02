import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md text-center bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-[#EF4444] mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2 font-heading">
          Akses Ditolak (403)
        </h1>
        <p className="text-sm text-[#64748B] mb-6">
          Anda tidak memiliki izin untuk mengakses halaman atau komplek ini. Silakan kembali ke halaman utama atau hubungi administrator.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button variant="default">Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
