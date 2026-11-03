import { BendaharaSidebar } from '@/components/layout/BendaharaSidebar';
import { BendaharaHeader } from '@/components/layout/BendaharaHeader';

export default function BendaharaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f6f5f4]">
      <BendaharaSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <BendaharaHeader />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
