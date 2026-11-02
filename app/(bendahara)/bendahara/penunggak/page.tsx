import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { komplek } from '@ponpes-finance/db/schema';
import { getArrearsDashboard } from '@ponpes-finance/db';
import { BendaharaArrearsClient } from '@/components/features/bendahara/BendaharaArrearsClient';

export default async function BendaharaPenunggakPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const [complexList, initialArrears] = await Promise.all([
    db.select({ id: komplek.id, nama: komplek.nama }).from(komplek),
    getArrearsDashboard(db, { minMonths: 2 }),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <BendaharaArrearsClient
        complexList={complexList}
        initialArrears={initialArrears as any}
      />
    </div>
  );
}
