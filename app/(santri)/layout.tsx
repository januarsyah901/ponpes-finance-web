import { SantriHeader } from '@/components/layout/SantriHeader';
import { SantriBottomNav } from '@/components/layout/SantriBottomNav';

export default function SantriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f5f4]">
      <SantriHeader />
      <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6 max-w-4xl w-full mx-auto">
        {children}
      </main>
      <SantriBottomNav />
    </div>
  );
}
