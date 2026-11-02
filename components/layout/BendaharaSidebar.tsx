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
    <aside className="w-64 border-r border-[#E2E8F0] bg-white flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#0F5132] text-white flex items-center justify-center font-bold shadow-sm">
            PF
          </div>
          <div>
            <div className="font-bold text-sm text-[#0F172A] font-heading">Ponpes Finance</div>
            <div className="text-[11px] text-[#64748B]">Portal Bendahara</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          <Link
            href="/bendahara"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === '/bendahara'
                ? "bg-[#EBF5F0] text-[#0F5132]"
                : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {navigation.slice(1).map((section, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
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
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#EBF5F0] text-[#0F5132] font-semibold"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-[#0F5132]" : "text-[#94A3B8]")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
