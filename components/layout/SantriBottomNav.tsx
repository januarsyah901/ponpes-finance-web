'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, PiggyBank, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Beranda', href: '/santri', icon: Home },
  { name: 'Tagihan', href: '/santri/bayar', icon: Receipt },
  { name: 'Tabungan', href: '/santri/tabungan', icon: PiggyBank },
  { name: 'Riwayat', href: '/santri/riwayat', icon: History },
  { name: 'Profil', href: '/santri/profil', icon: User },
];

export function SantriBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[rgba(0,0,0,0.08)] shadow-none md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/santri'
              ? pathname === '/santri'
              : pathname.startsWith(item.href) ||
                (item.href === '/santri/bayar' &&
                  (pathname.startsWith('/santri/bayar') ||
                    pathname.startsWith('/santri/tagihan') ||
                    pathname.startsWith('/bayar')));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-[#0075de] font-semibold"
                  : "text-[#757575] hover:text-[#111111]"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive ? "text-[#0075de] scale-105" : "text-[#757575]"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
