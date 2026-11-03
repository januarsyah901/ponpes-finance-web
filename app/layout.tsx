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
  themeColor: '#F6F6F6',
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
      <body className="font-sans min-h-screen bg-[#F6F6F6] text-[#202119] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
