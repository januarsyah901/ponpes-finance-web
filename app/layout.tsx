import type { Metadata, Viewport } from 'next';
import { fontHeading, fontSans, fontSerif, fontMono } from './fonts';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Ponpes Finance - Sistem Manajemen Keuangan Pesantren',
  description: 'Aplikasi manajemen keuangan modern untuk bendahara pesantren dan santri',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ponpes Finance',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f6f5f4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${fontHeading.variable} ${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <body className="font-sans min-h-screen bg-[#f6f5f4] text-[#111111] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
