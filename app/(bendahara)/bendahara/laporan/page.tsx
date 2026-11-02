import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { komplek } from '@ponpes-finance/db/schema';
import { getFinancialSummaryReport, getSantriSavingsBalancesReport } from '@ponpes-finance/db';
import { BendaharaReportsClient } from '@/components/features/bendahara/BendaharaReportsClient';

export default async function BendaharaLaporanPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Rentang bulan berjalan default
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const defaultStartDate = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const defaultEndDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

  const [complexList, initialReport, initialSavingsList] = await Promise.all([
    db.select({ id: komplek.id, nama: komplek.nama }).from(komplek),
    getFinancialSummaryReport(db, {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    }),
    getSantriSavingsBalancesReport(db),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <BendaharaReportsClient
        complexList={complexList}
        initialReport={initialReport}
        initialSavingsList={initialSavingsList}
        defaultStartDate={defaultStartDate}
        defaultEndDate={defaultEndDate}
      />
    </div>
  );
}
