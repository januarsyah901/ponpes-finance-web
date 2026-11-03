import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f5f4] p-4">
      <div className="w-full max-w-md text-center bg-white p-8 rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fbebe9] text-[#e32d14] mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#111111] mb-2 font-heading">
          Akses Ditolak (403)
        </h1>
        <p className="text-sm text-[#757575] mb-6">
          Anda tidak memiliki izin untuk mengakses halaman atau komplek ini. Silakan kembali ke halaman utama atau hubungi administrator.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button
              variant="default"
              className="rounded-[8px] bg-[#0075de] hover:bg-[#0060b8] active:bg-[#004f94] text-white font-medium px-5 py-2.5 shadow-none transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
