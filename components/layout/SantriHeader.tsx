'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SantriHeader() {
  let session: any = null;
  try {
    const res = useSession();
    session = res?.data;
  } catch {
    session = null;
  }
  const nis = session?.user?.username || '';

  return (
    <header className="h-16 border-b border-[#E8E8E8] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-[8px] bg-[#F4512A] text-white flex items-center justify-center font-bold text-sm shadow-none">
          PF
        </div>
        <div>
          <div className="font-semibold text-sm text-[#202119] font-heading leading-tight">
            Ponpes Finance
          </div>
          <div className="text-[11px] text-[#747474]">Portal Santri</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="text-xs hidden sm:inline-flex rounded-full px-2.5 py-0.5 font-medium shadow-none bg-[#F5F5F5] text-[#626262] border border-[#E8E8E8]"
        >
          NIS: {nis}
        </Badge>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Keluar"
          className="h-8 w-8 rounded-[8px] flex items-center justify-center text-[#C84C5A] hover:bg-[#FCEDEF] transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
