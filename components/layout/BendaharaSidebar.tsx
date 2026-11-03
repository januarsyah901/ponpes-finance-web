'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Tags,
  Users,
  Grid3X3,
  FileSpreadsheet,
  Receipt,
  CheckCircle,
  Banknote,
  PiggyBank,
  Gift,
  ArrowDownCircle,
  FileText,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/bendahara', icon: LayoutDashboard },
  {
    header: 'DATA MASTER',
    items: [
      { name: 'Data Komplek', href: '/master/komplek', icon: Building2 },
      { name: 'Kategori Santri', href: '/master/kategori', icon: Tags },
      { name: 'Data Santri', href: '/master/santri', icon: Users },
      { name: 'Matriks Tarif', href: '/master/tarif', icon: Grid3X3 },
      { name: 'Impor Excel (.xlsx)', href: '/master/santri/impor', icon: FileSpreadsheet },
    ],
  },
  {
    header: 'TRANSAKSI & LAPORAN',
    items: [
      { name: 'Tagihan Santri', href: '/bendahara/tagihan', icon: Receipt },
      { name: 'Verifikasi Transfer', href: '/bendahara/verifikasi', icon: CheckCircle },
      { name: 'Pembayaran Kas', href: '/bendahara/kas', icon: Banknote },
      { name: 'Ledger Tabungan', href: '/bendahara/tabungan', icon: PiggyBank },
      { name: 'Subsidi Otomatis', href: '/bendahara/subsidi', icon: Gift },
      { name: 'Pengeluaran', href: '/bendahara/pengeluaran', icon: ArrowDownCircle },
      { name: 'Laporan Keuangan', href: '/bendahara/laporan', icon: FileText },
      { name: 'Pengingat WA', href: '/bendahara/penunggak', icon: AlertTriangle },
    ],
  },
];

export function BendaharaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-[#E8E8E8] bg-white flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E8E8E8]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-[8px] bg-[#F4512A] text-white flex items-center justify-center font-bold text-sm shadow-none">
            PF
          </div>
          <div>
            <div className="font-semibold text-sm text-[#202119] font-heading">Ponpes Finance</div>
            <div className="text-[11px] text-[#747474]">Portal Bendahara</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <Link
            href="/bendahara"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors",
              pathname === '/bendahara'
                ? "bg-[#202119] text-white font-medium"
                : "text-[#626262] hover:bg-[#F5F5F5] hover:text-[#202119]"
            )}
          >
            <LayoutDashboard className={cn("h-4 w-4 shrink-0", pathname === '/bendahara' ? "text-white" : "text-[#747474]")} />
            <span>Dashboard</span>
          </Link>
        </div>

        {navigation.slice(1).map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#747474]">
              {section.header}
            </div>
            {section.items?.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#202119] text-white font-medium"
                      : "text-[#626262] hover:bg-[#F5F5F5] hover:text-[#202119]"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-[#747474]")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[#E8E8E8]">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium text-[#C84C5A] hover:bg-[#FCEDEF] transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-[#C84C5A]" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
