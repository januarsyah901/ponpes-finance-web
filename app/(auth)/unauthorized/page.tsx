import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F6F6] p-4">
      <div className="w-full max-w-md text-center bg-white p-8 rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FCEDEF] text-[#C84C5A] mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#202119] mb-2 font-heading">
          Akses Ditolak (403)
        </h1>
        <p className="text-sm text-[#747474] mb-6">
          Anda tidak memiliki izin untuk mengakses halaman atau komplek ini. Silakan kembali ke halaman utama atau hubungi administrator.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button
              variant="default"
              className="rounded-[8px] bg-[#202119] hover:bg-[#2e2f26] active:bg-[#181913] text-white font-medium px-5 py-2.5 shadow-none transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
