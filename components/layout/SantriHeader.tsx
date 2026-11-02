'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SantriHeader() {
  let session: any = null;
  try {
    const res = useSession();
    session = res?.data;
  } catch {
    session = null;
  }
  const nama = session?.user?.nama || 'Santri';
  const nis = session?.user?.username || '';

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[#0F5132] text-white flex items-center justify-center font-bold text-sm shadow-sm">
          PF
        </div>
        <div>
          <div className="font-bold text-sm text-[#0F172A] font-heading leading-tight">
            Ponpes Finance
          </div>
          <div className="text-[11px] text-[#64748B]">Portal Santri</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
          NIS: {nis}
        </Badge>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title="Keluar"
          className="h-8 w-8 rounded-lg flex items-center justify-center text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
