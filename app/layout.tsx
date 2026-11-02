import type { Metadata, Viewport } from 'next';
import { fontHeading, fontSans, fontMono } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ponpes Finance - Sistem Manajemen Keuangan Pesantren',
  description: 'Aplikasi manajemen keuangan modern untuk bendahara pesantren dan santri',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F5132',
};

import { Providers } from '@/components/providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${fontHeading.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body className="font-sans min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
