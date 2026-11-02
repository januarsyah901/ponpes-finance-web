'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, PiggyBank, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Beranda', href: '/santri', icon: Home },
  { name: 'Tagihan', href: '/santri/tagihan', icon: Receipt },
  { name: 'Tabungan', href: '/santri/tabungan', icon: PiggyBank },
  { name: 'Riwayat', href: '/santri/riwayat', icon: History },
  { name: 'Profil', href: '/santri/profil', icon: User },
];

export function SantriBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E2E8F0] shadow-lg md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive ? "text-[#0F5132]" : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-[#0F5132]" : "text-[#94A3B8]")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
