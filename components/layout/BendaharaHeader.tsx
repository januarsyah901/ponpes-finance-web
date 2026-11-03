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
    <header className="h-16 border-b border-[#E8E8E8] bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-semibold text-[#202119] font-heading">
          Sistem Keuangan Pesantren
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Badge
          variant={role === 'super_admin' ? 'default' : 'secondary'}
          className="text-xs rounded-full px-2.5 py-0.5 font-medium shadow-none"
        >
          <Shield className="h-3 w-3 mr-1" />
          {role === 'super_admin' ? 'Super Admin' : 'Bendahara Komplek'}
        </Badge>

        <div className="flex items-center gap-2 pl-3 border-l border-[#E8E8E8]">
          <div className="h-8 w-8 rounded-full bg-[#F5F5F5] text-[#202119] border border-[#E8E8E8] flex items-center justify-center font-semibold text-xs">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-[#202119]">{nama}</div>
            <div className="text-[10px] text-[#747474]">{session?.user?.username}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
