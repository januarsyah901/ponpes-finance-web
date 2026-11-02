'use client';

import { useSession } from 'next-auth/react';
import { User, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function BendaharaHeader() {
  let session: any = null;
  try {
    const res = useSession();
    session = res?.data;
  } catch {
    session = null;
  }
  const role = session?.user?.role;
  const nama = session?.user?.nama || 'Bendahara';

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-semibold text-[#0F172A] font-heading">
          Sistem Keuangan Pesantren
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant={role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          {role === 'super_admin' ? 'Super Admin' : 'Bendahara Komplek'}
        </Badge>

        <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
          <div className="h-8 w-8 rounded-full bg-[#EBF5F0] text-[#0F5132] flex items-center justify-center font-bold text-xs">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-[#0F172A]">{nama}</div>
            <div className="text-[10px] text-[#64748B]">{session?.user?.username}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
